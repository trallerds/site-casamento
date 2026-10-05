import { Pool, types, type PoolClient, type QueryResultRow } from "pg";
 
 // node-postgres devolve int8 (COUNT/SUM) como string e timestamptz como Date.
 // O app inteiro assume number e string ISO, entao os dois tipos sao fixados aqui.
 types.setTypeParser(20, (value) => Number(value));
 types.setTypeParser(1114, (value) => value);
 types.setTypeParser(1184, (value) => value);
 
 export type Gift = {
   id: number;
   slug: string;
   name: string;
   description: string;
   image_key: string;
   amount_cents: number;
   total_quantity: number;
   sold_quantity: number;
   category: string;
   display_order: number;
   active: number;
   created_at: string;
   updated_at: string;
 };
 
 export type PaymentStatus = "pending" | "paid" | "expired" | "cancelled" | "failed";
 
 export type Payment = {
   id: number;
   public_id: string;
   gift_id: number;
   provider: string;
   provider_charge_id: string | null;
   amount_cents: number;
   status: PaymentStatus;
   pix_code: string | null;
   error: string | null;
   expires_at: string | null;
   paid_at: string | null;
   claimed_at: string | null;
   confirmed_by_admin: number;
   oversold: number;
   created_at: string;
   updated_at: string;
 };
 
 export type PhotoStatus = "received" | "uploading" | "uploaded" | "failed";
 
 export type PhotoUpload = {
   id: number;
   public_id: string;
   original_filename: string;
   mime_type: string;
   size_bytes: number;
   storage_provider: string;
   storage_key: string | null;
   staging_key: string | null;
   external_id: string | null;
   status: PhotoStatus;
   error: string | null;
   hidden: number;
   created_at: string;
   uploaded_at: string | null;
 };
 
 export type AdminSession = {
   id: number;
   token_hash: string;
   created_at: string;
   expires_at: string;
 };
 
 const SCHEMA = `
 CREATE TABLE IF NOT EXISTS gifts (
   id BIGSERIAL PRIMARY KEY,
   slug TEXT NOT NULL UNIQUE,
   name TEXT NOT NULL,
   description TEXT NOT NULL DEFAULT '',
   image_key TEXT NOT NULL DEFAULT 'default',
   amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
   total_quantity INTEGER NOT NULL DEFAULT 1 CHECK (total_quantity >= 0),
   sold_quantity INTEGER NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
   category TEXT NOT NULL DEFAULT 'Momentos da festa',
   display_order INTEGER NOT NULL DEFAULT 0,
   active INTEGER NOT NULL DEFAULT 1,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
 );
 
 CREATE TABLE IF NOT EXISTS payments (
   id BIGSERIAL PRIMARY KEY,
   public_id TEXT NOT NULL UNIQUE,
   gift_id INTEGER NOT NULL REFERENCES gifts(id),
   provider TEXT NOT NULL,
   provider_charge_id TEXT UNIQUE,
   amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
   status TEXT NOT NULL DEFAULT 'pending',
   pix_code TEXT,
   error TEXT,
   expires_at TIMESTAMPTZ,
   paid_at TIMESTAMPTZ,
   claimed_at TIMESTAMPTZ,
   confirmed_by_admin INTEGER NOT NULL DEFAULT 0,
   oversold INTEGER NOT NULL DEFAULT 0,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
 );
 
 CREATE INDEX IF NOT EXISTS payments_gift_idx ON payments(gift_id);
 CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
 
 CREATE TABLE IF NOT EXISTS payment_events (
   id BIGSERIAL PRIMARY KEY,
   payment_id INTEGER REFERENCES payments(id),
   provider_event_id TEXT NOT NULL UNIQUE,
   event_type TEXT NOT NULL,
   payload TEXT NOT NULL,
   received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   processed_at TIMESTAMPTZ
 );
 
 CREATE TABLE IF NOT EXISTS photo_uploads (
   id BIGSERIAL PRIMARY KEY,
   public_id TEXT NOT NULL UNIQUE,
   original_filename TEXT NOT NULL,
   mime_type TEXT NOT NULL,
   size_bytes INTEGER NOT NULL,
   storage_provider TEXT NOT NULL DEFAULT 'local',
   storage_key TEXT,
   staging_key TEXT,
   external_id TEXT,
   status TEXT NOT NULL DEFAULT 'received',
   error TEXT,
   hidden INTEGER NOT NULL DEFAULT 0,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   uploaded_at TIMESTAMPTZ
 );
 
 CREATE TABLE IF NOT EXISTS admin_sessions (
   id BIGSERIAL PRIMARY KEY,
   token_hash TEXT NOT NULL UNIQUE,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   expires_at TIMESTAMPTZ NOT NULL
 );
 
 CREATE TABLE IF NOT EXISTS settings (
   key TEXT PRIMARY KEY,
   value TEXT NOT NULL,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
 );
 
 CREATE TABLE IF NOT EXISTS rate_limit (
   bucket TEXT NOT NULL,
   window_start TIMESTAMPTZ NOT NULL,
   hits INTEGER NOT NULL,
   PRIMARY KEY (bucket, window_start)
 );
 
 CREATE INDEX IF NOT EXISTS rate_limit_window_idx ON rate_limit(window_start);
 `;
 
 let ready: Promise<void> | undefined;
 
 function ensureSchema() {
   ready ??= (async () => {
     const client = await pool().connect();
     try {
       await client.query(SCHEMA);
       await client.query(
         `DELETE FROM rate_limit WHERE window_start < now() - interval '2 days'`,
       );
     } finally {
       client.release();
     }
   })();
   return ready;
 }
 
 export async function sql<T extends QueryResultRow = QueryResultRow>(
   text: string,
   params: unknown[] = [],
 ): Promise<T[]> {
   await ensureSchema();
   return (await pool().query<T>(text, params)).rows;
 }
 
 export async function run(text: string, params: unknown[] = []): Promise<number> {
   await ensureSchema();
   return (await pool().query(text, params)).rowCount ?? 0;
 }
 
 export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
   await ensureSchema();
   const client = await pool().connect();
   try {
     await client.query("BEGIN");
     const value = await fn(client);
     await client.query("COMMIT");
     return value;
   } catch (error) {
     await client.query("ROLLBACK");
     throw error;
   } finally {
     client.release();
 }
 }
 
 export function pool(): Pool {
   const scope = globalThis as any;
   if (!scope.__deixaAquiPool) {
     const connectionString = process.env.DATABASE_URL;
     if (!connectionString) {
       throw new Error(
         "DATABASE_URL ausente: defina a string de conexao do Neon (branch production) no ambiente.",
       );
     }
     scope.__deixaAquiPool = new Pool({
       connectionString,
       max: Number(process.env.DATABASE_POOL_MAX) || 4,
       ssl: /neon\.tech/.test(connectionString)
         ? { rejectUnauthorized: true }
         : undefined,
     });
   }
   return scope.__deixaAquiPool;
 }
