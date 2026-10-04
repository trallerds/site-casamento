import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { PhotoStorage, SaveInput, StoredObject } from "./types";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

function bucket() {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return path.join(UPLOADS_DIR, month);
}

export const localStorage: PhotoStorage = {
  name: "local",

  async save(input: SaveInput): Promise<StoredObject> {
    const target = bucket();
    await fs.mkdir(target, { recursive: true });
    const name = `${input.publicId}${EXTENSIONS[input.mimeType] ?? ".bin"}`;
    const fullPath = path.join(target, name);
    await fs.writeFile(fullPath, input.buffer);
    return { key: path.posix.join("uploads", path.basename(target), name), externalId: null };
  },

  async read(key: string) {
    try {
      const buffer = await fs.readFile(path.resolve(UPLOADS_DIR, "..", key));
      const ext = path.extname(key).toLowerCase();
      const mimeType =
        Object.entries(EXTENSIONS).find(([, value]) => value === ext)?.[0] ?? "application/octet-stream";
      return { buffer, mimeType };
    } catch {
      return null;
    }
  },

  async delete(stored: StoredObject) {
    if (!stored.key) return;
    try {
      await fs.unlink(path.resolve(UPLOADS_DIR, "..", stored.key));
    } catch {
      return;
    }
  },

  async health() {
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      await fs.access(UPLOADS_DIR);
      return { ok: true, message: `Armazenamento local em data/uploads` };
    } catch (error) {
      return { ok: false, message: `Falha no armazenamento local: ${(error as Error).message}` };
    }
  },
};

export function isUnsafeStorageKey(key: string) {
  const resolved = path.resolve(UPLOADS_DIR, "..", key);
  return !resolved.startsWith(path.resolve(UPLOADS_DIR) + path.sep);
}