"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export type PixPaymentView = {
  publicId: string;
  status: "pending" | "paid" | "expired" | "cancelled" | "failed";
  pixAvailable: boolean;
  claimed: boolean;
  confirmHref: string;
};

type CopyState = "idle" | "loading" | "copied" | "manual";

export function PixPanel({ payment }: { payment: PixPaymentView }) {
  const [status, setStatus] = useState(payment.status);
  const [claimed, setClaimed] = useState(payment.claimed);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [message, setMessage] = useState("");
  const [claiming, setClaiming] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const manualRef = useRef<HTMLTextAreaElement | null>(null);

  const isPending = status === "pending";

  const ensureCode = useCallback(async () => {
    if (pixCode) return pixCode;
    const response = await fetch(`/api/payments/${payment.publicId}/pix-code`, {
      method: "POST",
      cache: "no-store",
    });
    const body = (await response.json()) as { pixCopyPaste?: string; error?: string };
    if (!response.ok || !body.pixCopyPaste) {
      throw new Error(body.error ?? "Não conseguimos gerar o Pix agora.");
    }
    setPixCode(body.pixCopyPaste);
    return body.pixCopyPaste;
  }, [payment.publicId, pixCode]);

  useEffect(() => {
    if (!isPending || !payment.pixAvailable) return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    ensureCode().catch(() => setPixCode(null));
  }, [isPending, payment.pixAvailable, ensureCode]);

  useEffect(() => {
    if (!isPending) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/payments/${payment.publicId}`, { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as { status: PixPaymentView["status"]; claimed: boolean };
        if (cancelled) return;
        setStatus(body.status);
        setClaimed(body.claimed);
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
      width: 220,
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
    try {
      const code = await ensureCode();
      const secureClipboard =
        typeof navigator.clipboard?.writeText === "function" && window.isSecureContext;
      const ok = secureClipboard ? await navigator.clipboard.writeText(code) : legacyCopy(code);
      if (ok === false) throw new Error("clipboard indisponível");
      setCopyState("copied");
      setMessage("Pix copiado!");
    } catch {
      setCopyState("manual");
      setMessage("Toque no código abaixo e segure para copiar.");
      try {
        const code = await ensureCode();
        setPixCode(code);
      } catch {
        setMessage("Não conseguimos gerar o Pix agora. Tente novamente em alguns instantes.");
        setCopyState("idle");
      }
    }
  }, [ensureCode]);

  const claim = useCallback(async () => {
    setClaiming(true);
    try {
      await fetch(`/api/payments/${payment.publicId}/manual-confirmation`, { method: "POST" });
    } catch {
      /* a confirmação manual é apenas um registro */
    } finally {
      setClaiming(false);
      setClaimed(true);
    }
  }, [payment.publicId]);

  if (status === "paid") {
    return (
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gold-700">Presente recebido</p>
        <h2 className="mt-3 font-display text-3xl text-navy-900 text-balance">
          Obrigada por fazer parte desse momento
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-navy-800/75">
          Seu presente já apareceu para as noivas.
        </p>
        <a
          href={payment.confirmHref}
          className="mt-7 inline-block rounded-full bg-navy-900 px-8 py-4 text-sm uppercase tracking-[0.2em] text-ivory"
        >
          Ver a msg das noivas
        </a>
      </div>
    );
  }

  if (!isPending) {
    return (
      <div className="text-center">
        <h2 className="font-display text-2xl text-navy-900">
          {status === "expired" ? "Esse Pix expirou" : "Não conseguimos continuar"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-navy-800/75">
          Volte para a lista e gere um novo código Pix, é instantâneo.
        </p>
        <Link
          href="/presentes"
          className="mt-7 inline-block rounded-full border border-navy-900/25 px-8 py-4 text-sm uppercase tracking-[0.2em] text-navy-900"
        >
          Ver presentes
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-center text-sm uppercase tracking-[0.2em] text-gold-700">Pagamento Pix</p>
      <p className="mt-4 text-center text-sm leading-relaxed text-navy-800/75">
        Toque no botão, abra o aplicativo do seu banco, cole e confirme. O valor já vai preenchido.
      </p>

      <button
        type="button"
        onClick={copy}
        disabled={copyState === "loading"}
        className="mt-6 w-full rounded-full bg-navy-900 px-8 py-5 text-sm uppercase tracking-[0.2em] text-ivory shadow-soft transition hover:bg-navy-800 disabled:opacity-60"
      >
        {copyState === "loading"
          ? "Gerando o Pix…"
          : copyState === "copied"
            ? "Pix copiado!"
            : "Copiar Pix"}
      </button>

      <p aria-live="polite" className="mt-3 min-h-5 text-center text-xs text-navy-800/65">
        {message || "O código completo é copiado, sem precisar ser exposto na tela."}
      </p>

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
              if (legacyCopy(pixCode)) setMessage("Pix copiado!");
            }}
            className="mt-3 w-full rounded-full border border-navy-900/25 px-5 py-3 text-xs uppercase tracking-[0.18em] text-navy-900"
          >
            Selecionar e copiar
          </button>
        </div>
      ) : null}

      <div className="mt-8 hidden justify-center md:flex">
        {pixCode ? (
        <figure className="rounded-xl border border-navy-900/10 bg-white p-4">
          <canvas ref={canvasRef} aria-label="QR Code do Pix" />
          <figcaption className="mt-2 text-center text-[0.65rem] uppercase tracking-[0.2em] text-navy-800/50">
            Ou leia com a câmera do banco
          </figcaption>
        </figure>
        ) : null}
      </div>

      <div className="mt-9 border-t border-navy-900/10 pt-6 text-center">
        <button
          type="button"
          onClick={claim}
          disabled={claiming || claimed}
          className="text-sm text-navy-800/75 underline decoration-gold-500/60 underline-offset-4 transition hover:text-navy-900 disabled:opacity-60"
        >
          {claimed ? "Já registramos que você pagou ✓" : claiming ? "Registrando…" : "Já fiz meu Pix"}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-navy-800/50">
          Esse botão não confirma o pagamento: ele só avisa as noivas de que você já pagou, para
          conference mais rápida. A confirmação real é sempre a do banco.
        </p>
      </div>
    </div>
  );
}