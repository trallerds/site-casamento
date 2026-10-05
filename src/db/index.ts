import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export async function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL ausente");
  }
  
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX) || 4,
    ssl: /neon\.tech/.test(connectionString)
      ? { rejectUnauthorized: true }
      : undefined,
  });

  return drizzle(pool, { schema });
}
