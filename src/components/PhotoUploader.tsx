"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Step = "choose" | "camera" | "preview" | "uploading" | "done";
type FacingMode = "user" | "environment";

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export function PhotoUploader() {
  const [step, setStep] = useState<Step>("choose");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [cameraHint, setCameraHint] = useState("");
  const [queued, setQueued] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  
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
      
      // Qualidade máxima: Solicitando a maior resolução disponível
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 4096 }, 
          height: { ideal: 2160 } 
        },
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
        "Não foi possível abrir a câmera. Você ainda pode escolher uma foto do celular.",
      );
      setStep("choose");
    }
  }

  async function toggleCamera() {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    
    // Reinicia a câmera com o novo modo
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: nextMode,
          width: { ideal: 4096 }, 
          height: { ideal: 2160 } 
        },
        audio: false,
      });
      streamRef.current = stream;
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch (err) {
      console.error("Failed to switch camera", err);
      setError("Não foi possível trocar a câmera. Tente novamente ou escolha uma foto do celular.");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    
    const canvas = document.createElement("canvas");
    // Mantém a resolução nativa do vídeo para qualidade máxima
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
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
      0.95, // Aumentado para quase 1.0 para qualidade máxima
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
      setError("A conexão foi interrompida. Sua foto continua no aparelho; tente enviar novamente.");
      setStep("preview");
    });
    request.addEventListener("abort", () => {
      sending.current = false;
      setError("O envio foi interrompido. Sua foto continua no aparelho; você pode tentar novamente.");
      setStep("preview");
    });
    request.send(form);
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
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
        <div className="flex flex-col">
          <div className="relative overflow-hidden rounded-media bg-navy-950 shadow-lift">
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-[3/4] w-full object-cover"
              aria-label="Prévia da câmera"
            />
            
            {/* Botão de trocar câmera - Posicionado discretamente no topo da prévia */}
            <button
              type="button"
              onClick={toggleCamera}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-ivory backdrop-blur-md transition hover:bg-black/60 active:scale-90"
              title="Trocar câmera"
              aria-label="Trocar câmera"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9Z"/>
                <path d="M21 3v6h-6"/>
                <path d="M3 21v-6h6"/>
                <path d="M21 12H9"/>
              </svg>
            </button>
          </div>
          {error ? <p role="alert" className="mt-3 rounded-lg bg-gold-100/70 p-3 text-center text-xs leading-relaxed text-navy-900">{error}</p> : null}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-full border border-navy-900/20 px-5 py-4 text-xs uppercase tracking-[0.18em] text-navy-800/70 transition hover:bg-navy-900/5"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={capture}
              className="flex-[2] rounded-full bg-navy-900 px-5 py-4 text-sm uppercase tracking-[0.2em] text-ivory transition active:scale-[0.98] shadow-soft"
            >
              Tirar foto
            </button>
          </div>
        </div>
      ) : null}

      {step === "preview" || step === "uploading" ? (
        <div className="animate-in fade-in duration-500">
          {preview ? (
            <img
              src={preview}
              alt="Prévia da foto que você vai enviar"
              className="aspect-[4/5] w-full rounded-media border border-navy-900/10 object-cover shadow-soft"
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
                className="flex-1 rounded-full border border-navy-900/20 px-5 py-4 text-xs uppercase tracking-[0.18em] text-navy-800/70 transition hover:bg-navy-900/5"
              >
                Escolher outra foto
              </button>
              <button
                type="button"
                onClick={upload}
                className="flex-[2] rounded-full bg-navy-900 px-5 py-4 text-sm uppercase tracking-[0.2em] text-ivory transition active:scale-[0.98] shadow-soft"
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
        <div className="text-center animate-in zoom-in-95 duration-500">
          <p className="text-sm uppercase tracking-[0.2em] text-gold-700">
            {queued ? "Foto recebida" : "Foto enviada"}
          </p>
          <h2 className="mt-3 font-display text-2xl text-navy-900">
             {queued ? "Sua foto chegou" : "Essa já é nossa. 💙"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-navy-800/75">
            {queued
              ? "Ainda não conseguimos guardar sua foto no Drive. Ela ficou salva temporariamente, e as noivas poderão tentar o envio novamente. Não precisa reenviar."
              : "Obrigada por compartilhar essa lembrança com a gente."}
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
        Sua foto fica guardada pelas noivas como parte das memórias do casamento. Não é preciso
        informar seu nome nem criar uma conta.
      </p>
    </div>
  );
}
