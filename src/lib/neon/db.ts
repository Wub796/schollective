import { neon, Pool } from "@neondatabase/serverless";

/**
 * Neon Serverless SQL client
 * Uses lightweight HTTP transport optimized for edge runtimes and serverless functions.
 */
export const sql = neon(process.env.DATABASE_URL || "");

/**
 * Neon Connection Pool for transactions and persistent connections.
 */
export function getDbPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL || "" });
}
