"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartGiftButton({ giftId, slug }: { giftId: number; slug: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function start() {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId }),
      });
      const body = (await response.json()) as { publicId?: string; error?: string };
      if (!response.ok || !body.publicId) {
        throw new Error(body.error ?? "Não conseguimos gerar o Pix agora.");
      }
      router.push(`/presentes/${slug}/pix?p=${body.publicId}`);
    } catch (error) {
      setMessage((error as Error).message);
      setState("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={state === "loading"}
        className="w-full rounded-full bg-navy-900 px-8 py-4 text-sm uppercase tracking-[0.2em] text-ivory shadow-soft transition hover:bg-navy-800 disabled:opacity-60"
      >
        {state === "loading" ? "Preparando seu Pix…" : "Quero presentear"}
      </button>
      {message ? (
        <p role="alert" className="mt-3 text-center text-sm text-gold-700">
          {message}
        </p>
      ) : null}    </div>
  );
}