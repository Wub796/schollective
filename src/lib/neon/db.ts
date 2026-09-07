import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";
import { getDbUserContext } from "./user-context";

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

/** Variables the auth stack reads. Names only — never log or return the values. */
const AUTH_ENV_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

/**
 * Explains a missing connection string in terms of what the running Worker can
 * actually see. "DATABASE_URL is not set" is not actionable when the operator
 * believes they have set it — knowing whether the Worker sees *any* of the
 * expected variables separates "this one variable did not get applied" from
 * "no environment bindings are reaching this Worker at all".
 */
export function describeMissingDbUrl(): string {
  const visible = AUTH_ENV_KEYS.filter((key) => process.env[key]);

  const seen = visible.length
    ? `This deployment can currently see: ${visible.join(", ")}.`
    : "This deployment cannot see any of the variables the app expects, so no environment bindings are reaching it.";

  return (
    "DATABASE_URL is not configured. " +
    seen +
    " Set it on the Worker itself with `wrangler secret put DATABASE_URL` — a build-time variable, " +
    "or a plain-text variable added in the dashboard while wrangler.jsonc declares no `vars`, does not " +
    "survive as a runtime binding."
  );
}

/**
 * Lazy Neon Serverless SQL client
 * Reads the connection string dynamically at request time to ensure compatibility with Cloudflare Workers.
 *
 * Row-level security: when the request carries a signed-in user (set by
 * `getCurrentUserAndProfile`, or `runAs` for the background worker), every
 * query is executed inside a one-shot transaction that first sets the
 * `app.user_id` setting the RLS policies in db/migrations/0004 read. The Neon
 * HTTP driver has no session state between calls, so the setting must travel
 * with each query — the batch below is a single HTTP round trip, and the
 * transaction scope guarantees the setting cannot leak into any other query.
 * Unauthenticated queries run bare and see only what the policies declare
 * public.
 */
export const sql: NeonQueryFunction<false, false> = (async (strings: any, ...values: any[]) => {
  const fn = neon(getServerlessDbUrl());
  const userId = getDbUserContext();
  if (!userId) return fn(strings, ...values);

  const results = await fn.transaction([
    fn`SELECT set_config('app.user_id', ${userId}, true)`,
    fn(strings, ...values),
  ]);
  return results[1];
}) as any;
