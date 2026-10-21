import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const POOL_MAX = 10;
const CONNECTION_TIMEOUT_MS = 5_000;
const STATEMENT_TIMEOUT_MS = 10_000;
const QUERY_TIMEOUT_MS = 60_000;

export type DrizzleSchema = typeof schema;
export type DrizzleDb = NodePgDatabase<DrizzleSchema>;

let poolInstance: Pool | null = null;
let dbInstance: DrizzleDb | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

export function getDb(): DrizzleDb | null {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!dbInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: POOL_MAX,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
      statement_timeout: STATEMENT_TIMEOUT_MS,
      query_timeout: QUERY_TIMEOUT_MS,
    });

    dbInstance = drizzle({
      client: poolInstance,
      schema,
    });
  }

  return dbInstance;
}

export { schema };
