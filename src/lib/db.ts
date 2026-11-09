import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/schema";

// Use direct Postgres connection (server-side only)
const connectionString = process.env.DATABASE_URL!;

// Prevent multiple connections in dev
const globalForDb = globalThis as unknown as { conn: postgres.Sql };
const conn = globalForDb.conn ?? postgres(connectionString);
if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
export type DB = typeof db;

