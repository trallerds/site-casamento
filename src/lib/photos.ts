import fs from "node:fs/promises";
import path from "node:path";
import { run, sql, type PhotoUpload } from "@/lib/db";
import { getPhotoStorage, type PhotoStorage } from "@/lib/storage";

const STAGING_DIR = path.join(process.cwd(), "data", "staging");

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export function maxPhotoBytes() {
  const parsed = Number(process.env.MAX_PHOTO_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15 * 1024 * 1024;
}

export class PhotoValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function startsWith(buffer: Buffer, bytes: number[], offset = 0) {
  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

function ascii(buffer: Buffer, start: number, end: number) {
  return buffer.subarray(start, end).toString("latin1");
}

export function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(buffer, 0, 4) === "RIFF" && ascii(buffer, 8, 12) === "WEBP") return "image/webp";
  if (ascii(buffer, 4, 8) === "ftyp") {
    const brand = ascii(buffer, 8, 12);
    if (["heic", "heix", "hevc", "hevx"].includes(brand)) return "image/heic";
    if (["mif1", "msf1"].includes(brand)) return "image/heif";
  }
  return null;
}

export async function readAndValidatePhoto(file: File) {
  if (!file || file.size === 0) {
    throw new PhotoValidationError("Selecione uma foto para enviar.");
  }
  if (file.size > maxPhotoBytes()) {
    throw new PhotoValidationError(
      `Essa foto passa de ${Math.round(maxPhotoBytes() / (1024 * 1024))} MB. Escolha uma menor.`,
      413,
    );
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = sniffImageMime(buffer);
  if (!detected || !ALLOWED_MIME.has(detected)) {
    throw new PhotoValidationError("Esse arquivo não é uma foto válida (JPG, PNG ou WebP).");
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    throw new PhotoValidationError("Esse tipo de arquivo não é aceito.");
  }
  return { buffer, mimeType: detected };
}

export async function createPhotoRecord(input: {
  publicId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: string;
}) {
  const [row] = await sql<{ id: number }>(
    `INSERT INTO photo_uploads
      (public_id, original_filename, mime_type, size_bytes, storage_provider, status)
     VALUES ($1, $2, $3, $4, $5, 'received')
     RETURNING id`,
    [
      input.publicId,
      input.filename.slice(0, 200),
      input.mimeType,
      input.sizeBytes,
      input.storageProvider,
    ],
  );
  return row.id;
}

async function stage(publicId: string, extension: string, buffer: Buffer) {
  await fs.mkdir(STAGING_DIR, { recursive: true });
  const key = path.posix.join("staging", `${publicId}${extension}`);
  await fs.writeFile(path.join(STAGING_DIR, `${publicId}${extension}`), buffer);
  return key;
}

export async function readStaged(stagingKey: string) {
  const name = path.basename(stagingKey);
  try {
    return await fs.readFile(path.join(STAGING_DIR, name));
  } catch {
    return null;
  }
}

export async function dropStaged(stagingKey: string | null) {
  if (!stagingKey) return;
  try {
    await fs.unlink(path.join(STAGING_DIR, path.basename(stagingKey)));
  } catch {
    return;
  }
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

/**
 * `injected` existe para o teste exercitar um storage especifico em vez do que
 * estiver configurado no banco. Em producao sempre cai no getPhotoStorage().
 */
export async function pushToStorage(
  photo: PhotoUpload,
  buffer: Buffer,
  injected?: PhotoStorage,
) {
  const storage = injected ?? (await getPhotoStorage());

  let stagingKey: string | null = null;
  if (storage.name !== "local") {
    try {
      stagingKey = await stage(photo.public_id, EXTENSION_BY_MIME[photo.mime_type] ?? ".jpg", buffer);
      await run(
        `UPDATE photo_uploads SET staging_key = $1, status = 'uploading', error = NULL WHERE id = $2`,
        [stagingKey, photo.id],
      );
    } catch {
      stagingKey = null;
      await run(`UPDATE photo_uploads SET status = 'uploading' WHERE id = $1`, [photo.id]);
    }
  } else {
    await run(`UPDATE photo_uploads SET status = 'uploading' WHERE id = $1`, [photo.id]);
  }

  try {
    const stored = await storage.save({
      buffer,
      mimeType: photo.mime_type,
      filename: photo.original_filename,
      publicId: photo.public_id,
    });
    await run(
      `UPDATE photo_uploads
       SET status = 'uploaded', storage_key = $1, external_id = $2, staging_key = NULL,
           uploaded_at = now(), error = NULL
       WHERE id = $3`,
      [stored.key, stored.externalId, photo.id],
    );
    await dropStaged(stagingKey);
    return true;
  } catch (error) {
    const message = (error as Error).message.slice(0, 300);
    await run(
      `UPDATE photo_uploads SET status = 'failed', staging_key = $1, error = $2 WHERE id = $3`,
      [stagingKey, message, photo.id],
    );
    return false;
  }
}

export async function retryFailedPhoto(publicId: string, storage?: PhotoStorage) {
  const [photo] = await sql<PhotoUpload>(`SELECT * FROM photo_uploads WHERE public_id = $1`, [
    publicId,
  ]);
  if (!photo || !photo.staging_key) return { ok: false, message: "Sem cópia local para reprocessar." };
  const buffer = await readStaged(photo.staging_key);
  if (!buffer) return { ok: false, message: "Cópia temporária não encontrada." };
  const ok = await pushToStorage(photo, buffer, storage);
  return { ok, message: ok ? "Foto enviada." : "Ainda não deu certo." };
}