"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Step = "choose" | "camera" | "preview" | "uploading" | "done";

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export function PhotoUploader() {
  const [step, setStep] = useState<Step>("choose");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [cameraHint, setCameraHint] = useState("");
  const [queued, setQueued] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sending = useRef(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview, stopCamera]);

  async function openCamera() {
    setError("");
    setCameraHint("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("unsupported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setStep("camera");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      stopCamera();
      setCameraHint(
        "Não conseguimos acessar sua câmera. Você pode escolher uma foto que já está no celular.",
      );
      setStep("choose");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    const targetWidth = Math.min(video.videoWidth, 2000);
    const scale = targetWidth / video.videoWidth;
    canvas.width = targetWidth;
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        const extension = blob.type === "image/png" ? "png" : "jpg";
        const captured = new File([blob], `foto.${extension}`, { type: blob.type });
        setFile(captured);
        setPreview(URL.createObjectURL(blob));
        setStep("preview");
      },
      "image/jpeg",
      0.9,
    );
  }

  function pickFromLibrary(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (!picked) return;
    setError("");
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    setStep("preview");
    event.target.value = "";
  }

  function reset() {
    stopCamera();
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setProgress(0);
    setError("");
    setQueued(false);
    setStep("choose");
    sending.current = false;
  }

  function upload() {
    if (!file || sending.current) return;
    sending.current = true;
    setStep("uploading");
    setError("");

    const form = new FormData();
    form.append("photo", file, file.name || "foto.jpg");

    const request = new XMLHttpRequest();
    request.open("POST", "/api/photos");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    });
    request.addEventListener("load", () => {
      sending.current = false;
      if (request.status >= 200 && request.status < 300) {
        let body: { status?: string } = {};
        try {
          body = JSON.parse(request.responseText) as { status?: string };
        } catch {
          /* resposta sem JSON: trata como sucesso */
        }
        setProgress(100);
        // 202 = a foto foi registrada, mas o armazenamento falhou.
        // Ela fica em fila para retry no painel — nao dizer que ja
        // foi para o Drive.
        setQueued(body.status === "failed");
        setStep("done");
        return;
      }
      try {
        const body = JSON.parse(request.responseText) as { error?: string };
        setError(body.error ?? "Não conseguimos enviar sua foto.");
      } catch {
        setError("Não conseguimos enviar sua foto.");
      }
      setStep("preview");
    });
    request.addEventListener("error", () => {
      sending.current = false;
      setError("A conexão caiu. Sua foto continua aqui: tente enviar de novo.");
      setStep("preview");
    });
    request.addEventListener("abort", () => {
      sending.current = false;
      setError("Envio interrompido. Tente de novo.");
      setStep("preview");
    });
    request.send(form);
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={pickFromLibrary}
      />

      {step === "choose" ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={openCamera}
            className="w-full rounded-full bg-navy-900 px-8 py-5 text-sm uppercase tracking-[0.2em] text-ivory shadow-soft transition hover:bg-navy-800 active:scale-[0.98]"
          >
            Abrir câmera
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-full border border-navy-900/25 px-8 py-5 text-sm uppercase tracking-[0.2em] text-navy-900 transition hover:border-gold-500 hover:text-gold-700 active:scale-[0.98]"
          >
            Escolher uma foto
          </button>
          {cameraHint ? (
            <p role="status" className="rounded-lg bg-gold-100/70 p-3 text-center text-xs leading-relaxed text-navy-800/80">
              {cameraHint}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === "camera" ? (
        <div>
          <div className="overflow-hidden rounded-media bg-navy-950">
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-[3/4] w-full object-cover"
              aria-label="Prévia da câmera"
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-full border border-navy-900/20 px-5 py-4 text-xs uppercase tracking-[0.18em] text-navy-800/70"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={capture}
              className="flex-[2] rounded-full bg-navy-900 px-5 py-4 text-sm uppercase tracking-[0.2em] text-ivory transition active:scale-[0.98]"
            >
              Tirar foto
            </button>
          </div>
        </div>
      ) : null}

      {step === "preview" || step === "uploading" ? (
        <div>
          {preview ? (
            <img
              src={preview}
              alt="Prévia da foto que você vai enviar"
              className="aspect-[4/5] w-full rounded-media border border-navy-900/10 object-cover"
            />
          ) : null}
          {step === "uploading" ? (
            <div className="mt-4" aria-live="polite">
              <p className="text-center text-sm text-navy-800/70">
                Enviando sua foto… {progress}%
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-navy-900/10">
                <div
                  className="h-full rounded-full bg-gold-500 transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-full border border-navy-900/20 px-5 py-4 text-xs uppercase tracking-[0.18em] text-navy-800/70"
              >
                Refazer
              </button>
              <button
                type="button"
                onClick={upload}
                className="flex-[2] rounded-full bg-navy-900 px-5 py-4 text-sm uppercase tracking-[0.2em] text-ivory transition active:scale-[0.98]"
              >
                Enviar foto
              </button>
            </div>
          )}
          {error ? (
            <p role="alert" className="mt-4 rounded-lg bg-gold-100/70 p-3 text-center text-xs leading-relaxed text-navy-900">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === "done" ? (
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-gold-700">
            {queued ? "Foto recebida" : "Foto enviada"}
          </p>
          <h2 className="mt-3 font-display text-2xl text-navy-900">
            {queued ? "Guardaremos em instantes" : "Agora ela é nossa memória"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-navy-800/75">
            {queued
              ? "Recebemos sua foto, mas o armazenamento oscilou agora. Ela está segura com a gente e será guardada no Drive automaticamente — não precisa enviar de novo."
              : "Obrigada. Ela foi direto para o nosso Drive, sem passar por rede social."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-7 w-full rounded-full border border-navy-900/25 px-8 py-4 text-sm uppercase tracking-[0.2em] text-navy-900 transition hover:border-gold-500 hover:text-gold-700 active:scale-[0.98]"
          >
            Enviar outra
          </button>
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs leading-relaxed text-navy-800/55">
        Ao enviar, você permite que a foto seja guardada pelas noivas como parte das memórias do
        casamento. Não coletamos seu nome nem seus dados.
      </p>
    </div>
  );
}