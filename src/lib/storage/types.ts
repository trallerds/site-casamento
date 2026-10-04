export type StoredObject = { key: string; externalId: string | null };

export type SaveInput = {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  publicId: string;
};

export interface PhotoStorage {
  readonly name: string;
  save(input: SaveInput): Promise<StoredObject>;
  read(key: string): Promise<{ buffer: Buffer; mimeType: string } | null>;
  delete(stored: StoredObject): Promise<void>;
  health(): Promise<{ ok: boolean; message: string }>;
}

export class StorageError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}