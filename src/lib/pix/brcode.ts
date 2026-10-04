export type BrCodeInput = {
  key: string;
  recipientName: string;
  amountCents: number;
  txid: string;
  city?: string;
};

const CRC_TAG = "6304";

function tlv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

export function crc16(payload: string) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(value: string, max: number) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 &.'-]/g, "")
    .trim()
    .slice(0, max);
}

export function formatAmount(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}

export function buildBrCode(input: BrCodeInput) {
  const key = input.key.trim();
  if (!key) throw new Error("Chave Pix vazia");

  const name = sanitize(input.recipientName, 25) || "RECEBEDOR";
  const city = sanitize(input.city ?? "SAO PAULO", 15) || "SAO PAULO";
  const txid = sanitize(input.txid, 25);

  const merchantAccount = tlv("00", "BR.GOV.BCB.PIX") + tlv("01", key);
  const additional = txid ? tlv("05", txid) : "";

  let payload = tlv("00", "01");
  if (input.amountCents > 0) payload += tlv("01", "11");
  payload += tlv("26", merchantAccount);
  payload += tlv("52", "0000");
  payload += tlv("53", "986");
  if (input.amountCents > 0) payload += tlv("54", formatAmount(input.amountCents));
  payload += tlv("58", "BR");
  payload += tlv("59", name);
  payload += tlv("60", city);
  payload += tlv("62", additional);

  return payload + CRC_TAG + crc16(payload + CRC_TAG);
}

export type BrCodeParsed = {
  key: string | null;
  recipientName: string | null;
  city: string | null;
  amount: string | null;
  txid: string | null;
  crcValid: boolean;
};

export function parseBrCode(payload: string): BrCodeParsed {
  const result: BrCodeParsed = {
    key: null,
    recipientName: null,
    city: null,
    amount: null,
    txid: null,
    crcValid: false,
  };

  const body = payload.slice(0, -4);
  result.crcValid = crc16(body) === payload.slice(-4).toUpperCase();

  let index = 0;
  while (index + 4 <= body.length) {
    const id = body.slice(index, index + 2);
    const length = Number(body.slice(index + 2, index + 4));
    const value = body.slice(index + 4, index + 4 + length);
    index += 4 + length;

    if (id === "26") {
      let inner = 0;
      while (inner + 4 <= value.length) {
        const innerId = value.slice(inner, inner + 2);
        const innerLength = Number(value.slice(inner + 2, inner + 4));
        const innerValue = value.slice(inner + 4, inner + 4 + innerLength);
        inner += 4 + innerLength;
        if (innerId === "01") result.key = innerValue;
      }
    }
    if (id === "54") result.amount = value;
    if (id === "59") result.recipientName = value;
    if (id === "60") result.city = value;
    if (id === "62") {
      let inner = 0;
      while (inner + 4 <= value.length) {
        const innerId = value.slice(inner, inner + 2);
        const innerLength = Number(value.slice(inner + 2, inner + 4));
        const innerValue = value.slice(inner + 4, inner + 4 + innerLength);
        inner += 4 + innerLength;
        if (innerId === "05") result.txid = innerValue;
      }
    }
  }

  return result;
}

export function looksLikePixPayload(value: string) {
  const normalized = value.trim().toUpperCase();
  return normalized.startsWith("000201") && normalized.includes("BR.GOV.BCB.PIX") && normalized.length > 40;
}