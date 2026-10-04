import { getSetting } from "@/lib/settings";
import { googleDriveStorage, isDriveConfigured } from "./drive";
import { localStorage } from "./local";
import type { PhotoStorage } from "./types";

export type { PhotoStorage, SaveInput, StoredObject } from "./types";
export { StorageError } from "./types";
export { isUnsafeStorageKey } from "./local";

export function photoStorageName() {
  const configured = (getSetting("photo_storage") || process.env.PHOTO_STORAGE || "local").trim();
  return configured === "drive" ? "drive" : "local";
}

export function getPhotoStorage(): PhotoStorage {
  if (photoStorageName() === "drive") return googleDriveStorage;
  return localStorage;
}

export function photoStorageHealth() {
  return getPhotoStorage().health();
}

export { googleDriveStorage, isDriveConfigured };