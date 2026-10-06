"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export type PixPaymentView = {
  publicId: string;
  status: "pending" | "paid" | "expired" | "cancelled" | "failed";
  pixAvailable: boolean;
  confirmHref: string;
  giftHref: string;
  expiresAt: string | null;
};

type CopyState = "idle" | "loading" | "copied" | "manual";
type PixState = "idle" | "generating" | "ready" | "error";

const QR_SIZE = 220;

export function PixPanel({ payment }: { payment: PixPaymentView }) {
  const [status, setStatus] = useState(payment.status);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [pixState, setPixState] = useState<PixState>("idle");
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const manualRef = useRef<HTMLTextAreaElement | null>(null);

  const isPending = status === "pending";

  const isExpired =
    status === "expired" ||
    (isPending &&
      payment.expiresAt != null &&
      Date.now() > Date.parse(payment.expiresAt));

  const ensureCode = useCallback(async () => {
    if (pixCode) return pixCode;
    setPixState("generating");
    try {
      const response = await fetch(`/api/payments/${payment.publicId}/pix-code`, {
        method: "POST",
        cache: "no-store",
      });
      const body = (await response.json()) as { pixCopyPaste?: string };
      if (!response.ok || !body.pixCopyPaste) {
        throw new Error("Pix unavailable");
      }
      setPixCode(body.pixCopyPaste);
      setPixState("ready");
      return body.pixCopyPaste;
    } catch {
      setPixState("error");
      setMessage("Não conseguimos preparar o Pix agora. Tente novamente em instantes.");
      return null;
    }
  }, [payment.publicId, pixCode]);

  useEffect(() => {
    if (!isPending || !payment.pixAvailable) return;
    ensureCode().catch(() => setPixState("error"));
  }, [isPending, payment.pixAvailable, ensureCode]);

  useEffect(() => {
    if (!isPending) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/payments/${payment.publicId}`, { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as { status: PixPaymentView["status"] };
        if (cancelled) return;
        setStatus(body.status);
      } catch {
        return;
      }
    };

    const timer = setInterval(poll, 6000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isPending, payment.publicId]);

  useEffect(() => {
    if (!pixCode || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, pixCode, {
      width: QR_SIZE,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0b2545", light: "#ffffff" },
    }).catch(() => undefined);
  }, [pixCode]);

  useEffect(() => {
    if (copyState === "manual" && manualRef.current) {
      manualRef.current.focus();
      manualRef.current.select();
    }
  }, [copyState]);

  useEffect(() => {
    if (copyState === "copied") {
      const timer = setTimeout(() => {
        setCopyState("idle");
        setMessage("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copyState]);

  const legacyCopy = (value: string) => {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const done = document.execCommand("copy");
    document.body.removeChild(area);
    return done;
  };

  const copy = useCallback(async () => {
    setCopyState("loading");
    setMessage("");
    const code = await ensureCode();
    if (!code) {
      setCopyState("idle");
      return;
    }

    try {
      const secureClipboard =
        typeof navigator.clipboard?.writeText === "function" && window.isSecureContext;
      const ok = secureClipboard ? await navigator.clipboard.writeText(code) : legacyCopy(code);
      if (ok === false) throw new Error("clipboard indisponível");
      setCopyState("copied");
      setMessage("Pix copiado. Agora é só colar no app do seu banco.");
    } catch {
      setCopyState("manual");
      setMessage("Selecione o código abaixo e copie para o app do seu banco.");
      setPixCode(code);
    }
  }, [ensureCode]);

  if (status === "paid") {
    return (
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gold-700">Presente recebido</p>
        <h2 className="mt-3 font-display text-3xl text-navy-900 text-balance">
          Obrigada por fazer parte desse momento
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-navy-800/75">
          As noivas já receberam seu presente. Obrigada pelo carinho.
        </p>
        <Link
          href={payment.confirmHref}
          className="mt-7 inline-block rounded-full bg-navy-900 px-8 py-4 text-sm uppercase tracking-[0.2em] text-ivory transition active:scale-[0.98]"
        >
          Ver mensagem das noivas
        </Link>
      </div>
    );
  }

  if (!isPending || isExpired) {
    return (
      <div className="text-center">
        <h2 className="font-display text-2xl text-navy-900">
          {status === "expired" ? "O prazo deste Pix terminou" : "Vamos tentar de novo?"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-navy-800/75">
          Este código não está mais disponível. Volte ao presente para preparar outro Pix.
        </p>
        <Link
          href={payment.giftHref}
          className="mt-7 inline-block rounded-full border border-navy-900/25 px-8 py-4 text-sm uppercase tracking-[0.2em] text-navy-900 transition hover:border-gold-500 hover:text-gold-700 active:scale-[0.98]"
        >
          Voltar ao presente
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-center text-sm uppercase tracking-[0.2em] text-gold-700">Pagamento Pix</p>
      <p className="mt-4 text-center text-sm leading-relaxed text-navy-800/75">
        Toque em &ldquo;Copiar Pix&rdquo;, abra o app do seu banco, cole o código e confirme. O valor já vai preenchido.
      </p>

      <button
        type="button"
        onClick={copy}
        disabled={copyState === "loading" || pixState === "generating" || pixState === "error"}
        className="mt-6 w-full rounded-full bg-navy-900 px-8 py-5 text-sm uppercase tracking-[0.2em] text-ivory shadow-soft transition hover:bg-navy-800 active:scale-[0.98] disabled:opacity-60"
      >
        {pixState === "generating"
          ? "Gerando o Pix…"
          : pixState === "error"
            ? "Pix indisponível no momento"
            : copyState === "loading"
              ? "Copiando…"
              : copyState === "copied"
                ? "Pix copiado!"
                : "Copiar Pix"}
      </button>

      {pixState === "error" && (
        <div className="mt-3 text-center">
          <p className="text-sm text-gold-700">{message}</p>
          <button
            type="button"
            onClick={() => { setPixState("idle"); setMessage(""); void ensureCode(); }}
            className="mt-2 inline-block text-sm underline decoration-gold-500/60 underline-offset-4 text-navy-900 transition hover:text-gold-700"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <p aria-live="polite" className="mt-3 min-h-5 text-center text-xs text-navy-800/65">{message}</p>

      {copyState === "manual" && pixCode ? (
        <div className="mt-4 rounded-xl border border-gold-500/40 bg-gold-100/50 p-4">
          <label
            htmlFor="pix-manual"
            className="block text-[0.65rem] uppercase tracking-[0.18em] text-navy-800/70"
          >
            Código Pix Copia e Cola
          </label>
          <textarea
            id="pix-manual"
            ref={manualRef}
            readOnly
            rows={3}
            value={pixCode}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 w-full resize-none break-all rounded-lg border border-navy-900/15 bg-white p-3 font-mono text-[0.7rem] leading-relaxed text-navy-900 outline-none focus:border-gold-500"
          />
          <button
            type="button"
            onClick={() => {
              manualRef.current?.select();
              if (legacyCopy(pixCode)) setMessage("Pix copiado. Agora é só colar no app do seu banco.");
            }}
            className="mt-3 w-full rounded-full border border-navy-900/25 px-5 py-3 text-xs uppercase tracking-[0.18em] text-navy-900 transition active:scale-[0.98]"
          >
            Copiar código Pix
          </button>
        </div>
      ) : null}

      {pixCode && (
        <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <p className="text-center text-xs leading-relaxed text-navy-800/55 md:text-left">
            Para escanear o QR Code, abra esta página em outro dispositivo. No celular, prefira copiar o Pix.
          </p>
          <figure className="w-fit max-w-full justify-self-center bg-white p-3 md:justify-self-end md:p-4">
            <canvas ref={canvasRef} role="img" aria-label="QR Code do Pix" className="block h-auto max-w-full" />
            <figcaption
              style={{ width: QR_SIZE }}
              className="mt-3 text-balance text-center text-[0.65rem] uppercase leading-relaxed tracking-[0.16em] text-navy-800/50"
            >
              QR Code (opcional)
            </figcaption>
          </figure>
        </div>
      )}

    </div>
  );
}
