"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { BottomSheet } from "@/components/BottomSheet";
import { QuickAction } from "@/components/QuickAction";

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

enum HubAction {
  INVITE = "invite",
  DATE = "date",
  VENUE = "venue",
  RSVP = "rsvp",
  DRESS = "dress",
}

enum RsvpState {
  IDLE = "idle",
  SENDING = "sending",
  SENT = "sent",
  ERROR = "error",
}

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

interface WeddingHubProps {
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
}

interface HubCard {
  id: HubAction;
  icon: string;
  eyebrow: string;
  title: string;
  detail: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const CALENDAR_DURATION_HOURS = 5;

const GOOGLE_MAPS_HOSTS = new Set([
  "share.google",
  "maps.app.goo.gl",
  "google.com",
]);

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function isSafeMapsUrl(value: string): boolean {
  if (!value) {
    return false;
  }

  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.protocol !== "https:") {
      return false;
    }

    return (
      GOOGLE_MAPS_HOSTS.has(parsedUrl.hostname) ||
      parsedUrl.hostname.endsWith(".google.com")
    );
  } catch {
    return false;
  }
}

function getMapsUrl(configuredUrl: string, address: string): string {
  if (isSafeMapsUrl(configuredUrl)) {
    return configuredUrl;
  }

  if (!address) {
    return "";
  }

  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(address)
  );
}

function getSafeInvitationUrl(value: string): string {
  if (!value) {
    return "";
  }

  return /^(https?:\/\/|\/)/i.test(value) ? value : "";
}

function getDriveFileId(url: string): string {
  const match = url.match(/^https:\/\/drive\.google\.com\/file\/d\/([^/]+)/i);

  return match?.[1] ?? "";
}

function getInvitationPreviewUrl(invitationUrl: string): string {
  const driveFileId = getDriveFileId(invitationUrl);

  if (!driveFileId) {
    return "";
  }

  return (
    "https://drive.google.com/file/d/" +
    encodeURIComponent(driveFileId) +
    "/preview"
  );
}

function getCalendarDate(date: string, time: string): Date | null {
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const validTime = /^\d{2}:\d{2}$/.test(time);

  if (!validDate || !validTime) {
    return null;
  }

  const calendarDate = new Date(`${date}T${time}:00-03:00`);

  return Number.isNaN(calendarDate.getTime()) ? null : calendarDate;
}

function formatCalendarDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function getCalendarUrl({
  names,
  date,
  time,
  venue,
  address,
  mapsUrl,
}: {
  names: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapsUrl: string;
}): string {
  const calendarStart = getCalendarDate(date, time);

  if (!calendarStart) {
    return "";
  }

  const calendarEnd = new Date(
    calendarStart.getTime() + CALENDAR_DURATION_HOURS * 60 * 60 * 1000,
  );

  const location = [venue, address].filter(Boolean).join(" - ") || mapsUrl;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Casamento ${names}`,
    dates: `${formatCalendarDate(calendarStart)}/${formatCalendarDate(calendarEnd)}`,
    ctz: "America/Sao_Paulo",
    details: `Celebração de ${names}.`,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getModalTitle(action: HubAction | null): string {
  switch (action) {
    case HubAction.INVITE:
      return "O convite";

    case HubAction.DATE:
      return "Data e hora";

    case HubAction.VENUE:
      return "Local e como chegar";

    case HubAction.RSVP:
      return "Confirmar presença";

    case HubAction.DRESS:
      return "O que vestir";

    default:
      return "";
  }
}

/* -------------------------------------------------------------------------- */
/*                              Main component                                */
/* -------------------------------------------------------------------------- */

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
}: WeddingHubProps) {
  /* --------------------------------- State -------------------------------- */

  const [active, setActive] = useState<HubAction | null>(null);

  const [name, setName] = useState("");
  const [companions, setCompanions] = useState("");

  const [rsvpState, setRsvpState] = useState<RsvpState>(RsvpState.IDLE);

  const [rsvpError, setRsvpError] = useState("");

  const [addressCopied, setAddressCopied] = useState(false);

  /* -------------------------------- Derived -------------------------------- */

  const mapUrl = getMapsUrl(configuredMapsUrl, address);

  const safeInvitationUrl = getSafeInvitationUrl(invitationUrl);

  const invitationPreviewUrl = getInvitationPreviewUrl(safeInvitationUrl);

  const calendarUrl = getCalendarUrl({
    names,
    date,
    time,
    venue,
    address,
    mapsUrl: mapUrl,
  });

  const cards: HubCard[] = [
    {
      id: HubAction.INVITE,
      icon: "✉",
      eyebrow: "Para consultar",
      title: "O convite",
      detail: "Ver convite",
    },
    {
      id: HubAction.DATE,
      icon: "▦",
      eyebrow: "Guarde a data",
      title: "Data e hora",
      detail:
        [dateLabel, time].filter(Boolean).join(" · ") ||
        "Em breve · adicionar ao Google Agenda",
    },
    {
      id: HubAction.VENUE,
      icon: "⌖",
      eyebrow: "Onde vamos celebrar",
      title: "Local e como chegar",
      detail: venue || "Endereço, estacionamento e mapa",
    },
    {
      id: HubAction.RSVP,
      icon: "✓",
      eyebrow: "Esperamos você",
      title: "Confirmar presença",
      detail: "Enviar confirmação",
    },
  ];

  /* -------------------------------- Handlers ------------------------------- */

  function openModal(action: HubAction): void {
    setActive(action);

    setRsvpState(RsvpState.IDLE);
    setRsvpError("");
  }

  function closeModal(): void {
    setActive(null);
  }

  async function submitRsvp(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setRsvpState(RsvpState.SENDING);
    setRsvpError("");

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          companions: companions
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const result = (await response.json()) as {
        error?: string;
      };

      if (response.status === 400) {
        setRsvpError(result.error ?? "Confira seu nome e tente novamente.");

        setRsvpState(RsvpState.ERROR);
        return;
      }

      if (!response.ok) {
        throw new Error("RSVP request failed");
      }

      setRsvpState(RsvpState.SENT);
    } catch {
      setRsvpError(
        "Não foi possível confirmar agora. Tente novamente, por favor.",
      );

      setRsvpState(RsvpState.ERROR);
    }
  }

  async function copyAddress(): Promise<void> {
    if (!address) {
      return;
    }

    try {
      await navigator.clipboard.writeText(address);

      setAddressCopied(true);

      window.setTimeout(() => {
        setAddressCopied(false);
      }, 2000);
    } catch {
      setAddressCopied(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                              Modal content                               */
  /* ------------------------------------------------------------------------ */

  function renderInviteContent(): ReactNode {
    if (!safeInvitationUrl) {
      return (
        <p className="mt-5 text-sm leading-relaxed text-navy-800/70">
          O convite será disponibilizado aqui em breve.
        </p>
      );
    }

    return (
      <div className="mt-5">
        {invitationPreviewUrl ? (
          <div className="h-[52dvh] min-h-64 overflow-hidden rounded-lg border border-navy-900/10 bg-navy-50 sm:h-[60dvh]">
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
    );
  }

  function renderDateContent(): ReactNode {
    return (
      <div className="mt-6 text-center">
        <p className="font-display text-3xl text-navy-900">
          {dateLabel || "Data a confirmar"}
        </p>

        <p className="mt-2 text-lg text-gold-700">
          {time || "Horário a confirmar"}
        </p>

        <p className="mt-3 text-sm text-navy-800/65">{names}</p>

        {calendarUrl ? (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-gold-500/50 px-6 py-3 text-sm uppercase tracking-wider text-navy-900"
          >
            ＋ Adicionar ao Google Agenda
          </a>
        ) : null}
      </div>
    );
  }

  function renderVenueContent(): ReactNode {
    return (
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-navy-800/75">
        {venue ? (
          <p className="font-display text-xl text-navy-900">{venue}</p>
        ) : null}

        <p>
          {address ||
            (mapUrl
              ? "Veja o local, o endereço e planeje sua chegada pelo mapa."
              : "O endereço será informado em breve.")}
        </p>

        {parking ? (
          <p>
            <strong className="text-navy-900">Estacionamento e acesso:</strong>{" "}
            {parking}
          </p>
        ) : null}

        {mapUrl || address ? (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            {mapUrl ? (
              <a
                className="min-h-12 flex-1 rounded-full bg-navy-900 px-5 py-3 text-center text-sm uppercase tracking-wider text-ivory"
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir no Google Maps
              </a>
            ) : null}

            {address ? (
              <button
                className="min-h-12 flex-1 rounded-full border border-navy-900/20 px-5 py-3 text-sm uppercase tracking-wider text-navy-900"
                type="button"
                onClick={() => void copyAddress()}
              >
                {addressCopied ? "Endereço copiado" : "Copiar endereço"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  function renderDressContent(): ReactNode {
    return (
      <p className="mt-5 text-base leading-relaxed text-navy-800/75">
        Traje:{" "}
        <strong className="font-medium text-navy-900">
          {dressCode || "Esporte fino || Social"}
        </strong>
        .
      </p>
    );
  }

  function renderRsvpContent(): ReactNode {
    if (rsvpState === RsvpState.SENT) {
      return (
        <p
          role="status"
          className="mt-6 text-center font-display text-2xl text-navy-900"
        >
          Presença confirmada! 💙
        </p>
      );
    }

    return (
      <form id="rsvp-form" className="space-y-4" onSubmit={submitRsvp}>
        <p className="text-sm leading-relaxed text-navy-800/70">
          Informe seu nome e, se for o caso, cada acompanhante em uma linha.
        </p>

        <label className="block text-sm uppercase tracking-wide text-navy-800/70">
          Nome completo
          <input
            name="name"
            className="mt-2 min-h-12 w-full rounded-lg border border-navy-900/15 px-3 text-base normal-case tracking-normal text-navy-900"
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </label>

        <label className="block text-sm uppercase tracking-wide text-navy-800/70">
          Acompanhantes (opcional)
          <textarea
            name="companions"
            className="mt-2 w-full rounded-lg border border-navy-900/15 px-3 py-3 text-base normal-case tracking-normal text-navy-900"
            rows={3}
            maxLength={500}
            value={companions}
            onChange={(event) => setCompanions(event.target.value)}
          />
        </label>

        {rsvpState === RsvpState.ERROR ? (
          <p role="alert" className="text-sm text-gold-700">
            {rsvpError}
          </p>
        ) : null}
      </form>
    );
  }

  function renderModalContent(): ReactNode {
    switch (active) {
      case HubAction.INVITE:
        return renderInviteContent();

      case HubAction.DATE:
        return renderDateContent();

      case HubAction.VENUE:
        return renderVenueContent();

      case HubAction.DRESS:
        return renderDressContent();

      case HubAction.RSVP:
        return renderRsvpContent();

      default:
        return null;
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                   JSX                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <section aria-labelledby="wedding-hub-title">
      {/* Header ------------------------------------------------------------- */}

      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs uppercase tracking-widest text-gold-700">
          Informações do casamento
        </p>

        <h2
          id="wedding-hub-title"
          className="mt-3 font-display text-3xl text-navy-900 sm:text-4xl"
        >
          Nosso dia, em um toque.
        </h2>

        <p className="mt-4 text-sm leading-relaxed text-navy-800/70">
          Tudo o que você precisa saber para chegar, participar e curtir com a
          gente.
        </p>
      </div>

      {/* Main actions ------------------------------------------------------ */}

      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 items-stretch gap-3 sm:gap-4">
        {cards.map((card) => (
          <QuickAction
            key={card.id}
            icon={
              <span aria-hidden="true" className="text-lg">
                {card.icon}
              </span>
            }
            eyebrow={card.eyebrow}
            title={card.title}
            description={card.detail}
            variant={card.id === HubAction.RSVP ? "primary" : "default"}
            className="min-h-36 w-full text-left sm:min-h-40"
            action={() => openModal(card.id)}
          />
        ))}
      </div>

      {/* Secondary actions ------------------------------------------------- */}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        <a
          className="inline-flex min-h-11 min-w-36 items-center justify-center gap-1 rounded-full px-2 py-2 text-navy-800/70 underline decoration-gold-500/50 underline-offset-4 hover:text-navy-900"
          href="#nossa-historia"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-5 w-5 items-center justify-center leading-none"
          >
            ♡
          </span>

          <span>Nossa história</span>
        </a>

        <button
          className="inline-flex min-h-11 min-w-36 items-center justify-center gap-1 rounded-full px-2 py-2 text-navy-800/70 underline decoration-gold-500/50 underline-offset-4 hover:text-navy-900"
          type="button"
          onClick={() => openModal(HubAction.DRESS)}
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          >
            <path d="m8 4-4 2-2 4 4 2v8h12v-8l4-2-2-4-4-2c-1 2-3 3-4 3s-3-1-4-3Z" />
          </svg>

          <span>O que vestir</span>
        </button>
      </div>

      {/* Bottom sheet ------------------------------------------------------ */}

      <BottomSheet
        isOpen={Boolean(active)}
        onClose={closeModal}
        title={getModalTitle(active)}
        actions={
          active === HubAction.RSVP && rsvpState !== RsvpState.SENT ? (
            <button
              form="rsvp-form"
              type="submit"
              disabled={rsvpState === RsvpState.SENDING}
              className="min-h-12 w-full rounded-full bg-navy-900 px-6 py-4 text-sm uppercase tracking-wider text-ivory disabled:opacity-60"
            >
              {rsvpState === RsvpState.SENDING
                ? "Enviando…"
                : "Confirmar presença"}
            </button>
          ) : null
        }
      >
        {renderModalContent()}
      </BottomSheet>
    </section>
  );
}
