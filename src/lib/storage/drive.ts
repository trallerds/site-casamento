import { getSetting } from "@/lib/settings";
import { StorageError, type PhotoStorage, type SaveInput, type StoredObject } from "./types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const FILE_URL = "https://www.googleapis.com/drive/v3/files";

type DriveConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId: string;
};

async function readConfig(): Promise<DriveConfig> {
  const raw = await getSetting("google_drive_config");
  let stored: Partial<DriveConfig> = {};
  if (raw) {
    try {
      stored = JSON.parse(raw) as Partial<DriveConfig>;
    } catch {
      stored = {};
    }
  }

  return {
    clientId: stored.clientId || process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: stored.clientSecret || process.env.GOOGLE_CLIENT_SECRET || "",
    refreshToken: stored.refreshToken || process.env.GOOGLE_REFRESH_TOKEN || "",
    folderId:
      stored.folderId ||
      (await getSetting("google_drive_folder_id")) ||
      process.env.GOOGLE_DRIVE_FOLDER_ID ||
      "",
  };
}

export async function isDriveConfigured() {
  const config = await readConfig();
  return Boolean(config.clientId && config.clientSecret && config.refreshToken && config.folderId);
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken() {
  const config = await readConfig();
  if (!(await isDriveConfigured())) {
    throw new StorageError("Google Drive não configurado (clientId, refreshToken e folderId).", 503);
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new StorageError(`OAuth do Google falhou (${response.status}): ${detail.slice(0, 200)}`);
  }

  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + (body.expires_in || 3600) * 1000,
  };
  return body.access_token;
}

function boundary() {
  return `deixa-aqui-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function multipartBody(fields: Record<string, string>, file: { name: string; mimeType: string; bytes: Buffer }) {
  const marker = boundary();
  const chunks: Buffer[] = [];
  for (const [key, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${marker}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`,
        "utf8",
      ),
    );
  }
  chunks.push(
    Buffer.from(
      `--${marker}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\n` +
        `Content-Type: ${file.mimeType}\r\n\r\n`,
      "utf8",
    ),
    file.bytes,
    Buffer.from(`\r\n--${marker}--\r\n`, "utf8"),
  );
  return { body: Buffer.concat(chunks), marker };
}

export const googleDriveStorage: PhotoStorage = {
  name: "drive",

  async save(input: SaveInput): Promise<StoredObject> {
    const config = await readConfig();
    const token = await accessToken();
    const extension = input.mimeType === "image/png" ? "png" : "jpg";
    const fileName = `${input.publicId}.${extension}`;
    const { body, marker } = multipartBody(
      {
        name: fileName,
        description: `Foto enviada pelo convidado - ${input.publicId}`,
        parents: config.folderId,
        appProperties: JSON.stringify({ origem: "deixa-aqui", publicId: input.publicId }),
      },
      { name: fileName, mimeType: input.mimeType, bytes: input.buffer },
    );

    const response = await fetch(`${UPLOAD_URL}?uploadType=multipart&fields=id,name`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${marker}`,
      },
      body,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new StorageError(`Upload ao Drive falhou (${response.status}): ${detail.slice(0, 200)}`);
    }

    const created = (await response.json()) as { id: string };
    return { key: created.id, externalId: created.id };
  },

  async read(key: string) {
    if (!key) return null;
    try {
      const token = await accessToken();
      const response = await fetch(`${FILE_URL}/${encodeURIComponent(key)}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      const mimeType = response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
      return { buffer, mimeType };
    } catch {
      return null;
    }
  },

  async delete(stored: StoredObject) {
    const id = stored.externalId ?? stored.key;
    if (!id) return;
    try {
      const token = await accessToken();
      await fetch(`${FILE_URL}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      return;
    }
  },

  async health() {
    const config = await readConfig();
    if (!(await isDriveConfigured())) {
      const missing = [
        !config.clientId && "clientId",
        !config.clientSecret && "clientSecret",
        !config.refreshToken && "refreshToken",
        !config.folderId && "folderId",
      ].filter(Boolean);
      return { ok: false, message: `Drive incompleto: ${missing.join(", ")}.` };
    }
    try {
      const token = await accessToken();
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(config.folderId)}` +
          `?fields=id,name&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      if (!response.ok) {
        return { ok: false, message: `Pasta do Drive inacessível (${response.status}).` };
      }
      const folder = (await response.json()) as { name?: string };
      return { ok: true, message: `Drive conectado na pasta "${folder.name ?? config.folderId}".` };
    } catch (error) {
      return { ok: false, message: `Drive inacessível: ${(error as Error).message}` };
    }
  },
};