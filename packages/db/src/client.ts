import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

declare global {
  var __artsiteDbPool__: Pool | undefined;
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const pool =
    globalThis.__artsiteDbPool__ ??
    new Pool({
      connectionString: process.env.DATABASE_URL
    });

  if (!globalThis.__artsiteDbPool__) {
    globalThis.__artsiteDbPool__ = pool;
  }

  return drizzle(pool, { schema });
}

export type DbClient = ReturnType<typeof createDb>;
