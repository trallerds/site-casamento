"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { QuickAction } from "@/components/QuickAction";

type HubAction = "invite" | "date" | "venue" | "rsvp" | "dress";

export function WeddingHub({
  names,
  dateLabel,
  date,
  time,
  venue,
  address,
  mapsUrl: configuredMapsUrl,
  parking,
  invitationUrl,
  dressCode,
}: {
  names: string;
  dateLabel: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapsUrl: string;
  parking: string;
  invitationUrl: string;
  dressCode: string;
}) {
  const [active, setActive] = useState<HubAction | null>(null);
  const [name, setName] = useState("");
  const [companions, setCompanions] = useState("");
  const [rsvpState, setRsvpState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [addressCopied, setAddressCopied] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const isSafeMapsUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" && (
        parsed.hostname === "share.google" ||
        parsed.hostname === "maps.app.goo.gl" ||
        parsed.hostname === "google.com" ||
        parsed.hostname.endsWith(".google.com")
      );
    } catch {
      return false;
    }
  };
  const mapUrl = isSafeMapsUrl(configuredMapsUrl)
    ? configuredMapsUrl
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : "";
  const safeInvitationUrl = /^(https?:\/\/|\/)/i.test(invitationUrl) ? invitationUrl : "";
  const driveFileId = safeInvitationUrl.match(/^https:\/\/drive\.google\.com\/file\/d\/([^/]+)/i)?.[1];
  const invitationPreviewUrl = driveFileId
    ? `https://drive.google.com/file/d/${encodeURIComponent(driveFileId)}/preview`
    : "";
  const calendarStart = /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time)
    ? new Date(`${date}T${time}:00-03:00`)
    : null;
  const calendarEnd = calendarStart && !Number.isNaN(calendarStart.getTime())
    ? new Date(calendarStart.getTime() + 5 * 60 * 60 * 1000)
    : null;
  const calendarUrl = calendarStart && calendarEnd && !Number.isNaN(calendarStart.getTime())
    ? `https://calendar.google.com/calendar/render?${new URLSearchParams({
        action: "TEMPLATE",
        text: `Casamento ${names}`,
        dates: `${calendarStart.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}/${calendarEnd.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
        ctz: "America/Sao_Paulo",
        details: `Celebração de ${names}.`,
        location: [venue, address].filter(Boolean).join(" - ") || mapUrl,
      })}`
    : "";

  useEffect(() => {
    if (!active) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus({ preventScroll: true });
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      document.removeEventListener("keydown", handleDialogKeys);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [active]);

  async function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRsvpState("sending");
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, companions: companions.split("\n") }),
      });
      if (!response.ok) throw new Error("request failed");
      setRsvpState("sent");
    } catch {
      setRsvpState("error");
    }
  }

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setAddressCopied(true);
      window.setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      setAddressCopied(false);
    }
  }

  const cards: { id: HubAction; icon: string; eyebrow: string; title: string; detail: string }[] = [
    { id: "invite", icon: "✉", eyebrow: "Para consultar", title: "O convite", detail: "Ver convite" },
    { id: "date", icon: "▦", eyebrow: "Guarde a data", title: "Data e hora", detail: [dateLabel, time].filter(Boolean).join(" · ") || "Em breve · adicionar ao Google Agenda" },
    { id: "venue", icon: "⌖", eyebrow: "Onde vamos celebrar", title: "Local e como chegar", detail: venue || "Endereço, estacionamento e mapa" },
    { id: "rsvp", icon: "✓", eyebrow: "Esperamos você", title: "Confirmar presença", detail: "Enviar confirmação", },
  ];

  return (
    <section aria-labelledby="wedding-hub-title">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs uppercase tracking-widest text-gold-700">Informações do casamento</p>
        <h2 id="wedding-hub-title" className="mt-3 font-display text-3xl text-navy-900 sm:text-4xl">
          Nosso dia, em um toque.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-navy-800/70">
          Tudo o que você precisa saber para chegar, participar e curtir com a gente.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 items-stretch gap-3 sm:gap-4">
        {cards.map((card) => {
          return <QuickAction
            key={card.id}
            icon={<span aria-hidden="true" className="text-lg">{card.icon}</span>}
            eyebrow={card.eyebrow}
            title={card.title}
            description={card.detail}
            variant={card.id === "rsvp" ? "primary" : "default"}
            className="min-h-36 w-full text-left sm:min-h-40"
            action={() => { setActive(card.id); setRsvpState("idle"); }}
          />;
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        <a className="inline-flex min-h-11 min-w-36 items-center justify-center gap-1 rounded-full px-2 py-2 text-navy-800/70 underline decoration-gold-500/50 underline-offset-4 hover:text-navy-900" href="#nossa-historia">
          <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center leading-none">♡</span>
          <span>Nossa história</span>
        </a>
        <button className="inline-flex min-h-11 min-w-36 items-center justify-center gap-1 rounded-full px-2 py-2 text-navy-800/70 underline decoration-gold-500/50 underline-offset-4 hover:text-navy-900" type="button" onClick={() => setActive("dress")}>
          <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="m8 4-4 2-2 4 4 2v8h12v-8l4-2-2-4-4-2c-1 2-2 3-4 3s-3-1-4-3Z" />
          </svg>
          <span>O que vestir</span>
        </button>
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setActive(null); }}>
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="hub-dialog-title" tabIndex={-1} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-card sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 id="hub-dialog-title" className="font-display text-2xl text-navy-900">
                {active === "invite" ? "O convite" : active === "date" ? "Data e hora" : active === "venue" ? "Local e como chegar" : active === "rsvp" ? "Confirmar presença" : "O que vestir"}
              </h2>
              <button type="button" onClick={() => setActive(null)} aria-label="Fechar" className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-full text-xl text-navy-800/60 hover:bg-navy-900/5">×</button>
            </div>

            {active === "invite" ? (
              safeInvitationUrl ? (
                <div className="mt-5">
                  {invitationPreviewUrl ? (
                    <div className="h-[58dvh] min-h-72 overflow-hidden rounded-lg border border-navy-900/10 bg-navy-50">
                      <iframe
                        src={invitationPreviewUrl}
                        title="Convite de Jéssica & Jennifer"
                        className="h-full w-full"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-navy-800/70">
                      Abra o convite para conferir a versão completa.
                    </p>
                  )}
                  <a
                    className="mt-3 inline-flex min-h-11 items-center text-sm text-navy-800/70 underline decoration-gold-500/50 underline-offset-4 hover:text-navy-900"
                    href={safeInvitationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir convite em outra aba
                  </a>
                </div>
              ) : (
                <p className="mt-5 text-sm leading-relaxed text-navy-800/70">
                  O convite será disponibilizado aqui em breve.
                </p>
              )
            ) : null}

            {active === "date" ? (
              <div className="mt-6 text-center"><p className="font-display text-3xl text-navy-900">{dateLabel || "Data a confirmar"}</p><p className="mt-2 text-lg text-gold-700">{time || "Horário a confirmar"}</p><p className="mt-3 text-sm text-navy-800/65">{names}</p>{calendarUrl ? <a href={calendarUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-gold-500/50 px-6 py-3 text-sm uppercase tracking-wider text-navy-900">＋ Adicionar ao Google Agenda</a> : null}</div>
            ) : null}

            {active === "venue" ? (
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-navy-800/75">
                {venue ? <p className="font-display text-xl text-navy-900">{venue}</p> : null}
                <p>{address || (mapUrl ? "Veja o local, o endereço e planeje sua chegada pelo mapa." : "O endereço será informado em breve.")}</p>
                {parking ? <p><strong className="text-navy-900">Estacionamento e acesso:</strong> {parking}</p> : null}
                {mapUrl || address ? <div className="flex flex-col gap-3 pt-2 sm:flex-row">{mapUrl ? <a className="min-h-12 flex-1 rounded-full bg-navy-900 px-5 py-3 text-center text-sm uppercase tracking-wider text-ivory" href={mapUrl} target="_blank" rel="noreferrer">Abrir no Google Maps</a> : null}{address ? <button className="min-h-12 flex-1 rounded-full border border-navy-900/20 px-5 py-3 text-sm uppercase tracking-wider text-navy-900" type="button" onClick={() => void copyAddress()}>{addressCopied ? "Endereço copiado" : "Copiar endereço"}</button> : null}</div> : null}
              </div>
            ) : null}

            {active === "dress" ? <p className="mt-5 text-base leading-relaxed text-navy-800/75">Traje: <strong className="font-medium text-navy-900">{dressCode || "Social"}</strong>.</p> : null}

            {active === "rsvp" ? (
              rsvpState === "sent" ? <p role="status" className="mt-6 text-center font-display text-2xl text-navy-900">Presença confirmada! 💙</p> : (
                <form className="mt-5 space-y-4" onSubmit={submitRsvp}>
                  <p className="text-sm leading-relaxed text-navy-800/70">Informe seu nome e, se for o caso, cada acompanhante em uma linha.</p>
                  <label className="block text-xs uppercase tracking-wider text-navy-800/70">Nome completo<input className="mt-2 min-h-12 w-full rounded-lg border border-navy-900/15 px-3 text-base normal-case tracking-normal text-navy-900" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>
                  <label className="block text-xs uppercase tracking-wider text-navy-800/70">Acompanhantes (opcional)<textarea className="mt-2 w-full rounded-lg border border-navy-900/15 px-3 py-3 text-base normal-case tracking-normal text-navy-900" rows={3} maxLength={500} value={companions} onChange={(event) => setCompanions(event.target.value)} /></label>
                  {rsvpState === "error" ? <p role="alert" className="text-sm text-gold-700">Não foi possível confirmar agora. Tente novamente, por favor.</p> : null}
                  <button disabled={rsvpState === "sending"} className="min-h-12 w-full rounded-full bg-navy-900 px-6 py-4 text-sm uppercase tracking-wider text-ivory disabled:opacity-60">{rsvpState === "sending" ? "Enviando…" : "Confirmar presença"}</button>
                </form>
              )
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
