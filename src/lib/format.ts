const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number) {
  return brl.format(cents / 100);
}

export function parseAmountToCents(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value * 100) : null;
  }
  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

/**
 * O pg devolve timestamptz como "2026-10-05 02:10:29.999739+00".
 * Virar "T" e colar "Z" no final gera "+00Z", que o Date rejeita —
 * por isso o offset de 2 digitos vira 4 ("+00" -> "+0000") e o Z
 * so entra quando a string nao tem offset nenhum.
 */
function normalizeSqlDate(sqlDate: string) {
  if (sqlDate.includes("T")) return sqlDate;
  const withTime = sqlDate.replace(" ", "T").replace(/([+-]\d{2})$/, "$100");
  return /[+-]\d{4}$/i.test(withTime) ? withTime : `${withTime}Z`;
}

export function toIso(sqlDate: string | null): string | null {
  if (!sqlDate) return null;
  const date = new Date(normalizeSqlDate(sqlDate));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatDateTime(sqlDate: string | null) {
  if (!sqlDate) return "—";
  const date = new Date(normalizeSqlDate(sqlDate));
  if (Number.isNaN(date.getTime())) return sqlDate;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    // O banco guarda em UTC; as noivas querem ver o horario
    // do casamento, independente do timezone do servidor.
    timeZone: "America/Sao_Paulo",
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function randomId(bytes = 12) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return [...values].map((value) => alphabet[value % alphabet.length]).join("");
}