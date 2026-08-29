import { neon, Pool, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Lazy Neon Serverless SQL client
 * Reads DATABASE_URL dynamically at request time to ensure compatibility with Cloudflare Workers.
 */
export const sql: NeonQueryFunction<false, false> = ((strings: TemplateStringsArray, ...values: any[]) => {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
  const fn = neon(url);
  return (fn as any)(strings, ...values);
}) as any;

/**
 * Neon Connection Pool for transactions and persistent connections.
 */
export function getDbPool() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
  return new Pool({ connectionString: url });
}
