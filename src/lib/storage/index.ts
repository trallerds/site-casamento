import { appsScriptStorage, isAppsScriptConfigured } from "./apps-script";
import { googleDriveStorage, isDriveConfigured } from "./drive";
import type { PhotoStorage } from "./types";

export type { PhotoStorage, SaveInput, StoredObject } from "./types";
export { StorageError } from "./types";

export async function photoStorageName() {
  return "drive" as const;
}

/** A ponte por Apps Script dispensa Google Cloud Console; sem ela, cai no OAuth. */
export function driveStorage(): PhotoStorage {
  return isAppsScriptConfigured() ? appsScriptStorage : googleDriveStorage;
}

export async function getPhotoStorage(): Promise<PhotoStorage> {
  return driveStorage();
}

export async function photoStorageHealth() {
  return (await getPhotoStorage()).health();
}

export { appsScriptStorage, isAppsScriptConfigured, googleDriveStorage, isDriveConfigured };
