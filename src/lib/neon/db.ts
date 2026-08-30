import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";

// Use stateless HTTP fetch queries for serverless edge / Cloudflare Workers.
// neon() already speaks HTTP to https://<host>/sql; poolQueryViaFetch makes
// any Pool.query() take the same fetch path instead of a TCP/WebSocket socket.
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchEndpoint = (host: string) => `https://${host}/sql`;

function normalizeServerlessUrl(url: string): string {
  if (!url) return "";
  return url
    // Neon's /sql HTTP endpoint lives on the compute host, not the -pooler (PgBouncer) host.
    .replace("-pooler.", ".")
    // channel_binding is a libpq SCRAM-over-TCP option; meaningless over HTTP.
    .replace("channel_binding=require&", "")
    .replace("&channel_binding=require", "")
    .replace("?channel_binding=require", "?");
}

/** Resolve a Neon connection string that is safe for the stateless HTTP driver. */
export function getServerlessDbUrl(): string {
  const pooled = process.env.DATABASE_URL || "";
  const unpooled = process.env.DATABASE_URL_UNPOOLED || "";
  return normalizeServerlessUrl(unpooled || pooled);
}

/**
 * Lazy Neon Serverless SQL client
 * Reads the connection string dynamically at request time to ensure compatibility with Cloudflare Workers.
 */
export const sql: NeonQueryFunction<false, false> = ((strings: TemplateStringsArray, ...values: any[]) => {
  const fn = neon(getServerlessDbUrl());
  return (fn as any)(strings, ...values);
}) as any;
