import { getSetting } from "@/lib/settings";
import { googleDriveStorage, isDriveConfigured } from "./drive";
import { localStorage } from "./local";
import type { PhotoStorage } from "./types";

export type { PhotoStorage, SaveInput, StoredObject } from "./types";
export { StorageError } from "./types";
export { isUnsafeStorageKey } from "./local";

export async function photoStorageName() {
  const configured = (
    (await getSetting("photo_storage")) ||
    process.env.PHOTO_STORAGE ||
    "local"
  ).trim();
  return configured === "drive" ? "drive" : "local";
}

export async function getPhotoStorage(): Promise<PhotoStorage> {
  if ((await photoStorageName()) === "drive") return googleDriveStorage;
  return localStorage;
}

export async function photoStorageHealth() {
  return (await getPhotoStorage()).health();
}

export { googleDriveStorage, isDriveConfigured };