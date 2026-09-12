/**
 * Durable, cross-isolate sliding-window rate limiting.
 *
 * The in-memory limiters in `security.ts` / `ai/guardrails.ts` count per
 * Worker isolate. On Cloudflare, isolates recycle on every deploy and traffic
 * fans out across many, so per-isolate counters barely limit at all — the same
 * reason Better Auth's auth-endpoint limiter is configured with
 * `storage: "database"`. This module is that shared counter for app features
 * (messages, AI endpoints): the window state lives in Postgres, so every
 * isolate sees the same count.
 *
 * Failure policy: if the database is unreachable we FAIL OPEN to the legacy
 * in-memory check. Rate limiting must never take the product down — a missed
 * limit during a DB outage is far cheaper than blocking every signed-in user.
 */

import { sql } from "@/lib/neon/db";
import { checkRateLimit } from "@/lib/security";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** Module-level throttle so pruning runs at most every 10 minutes per isolate. */
let lastPruneAt = 0;

/**
 * One Sentry report per bucket per isolate. The fallback fires on every request
 * once it starts failing, and a per-request event would bury the signal it is
 * meant to raise.
 */
const reportedBuckets = new Set<string>();

function reportDegradation(bucket: string, err: unknown): void {
  const detail = err instanceof Error ? err.message : String(err);
  console.error(
    `[rate-limit] durable check failed for "${bucket}", falling back to per-isolate counter:`,
    detail,
  );

  if (reportedBuckets.has(bucket)) return;
  reportedBuckets.add(bucket);

  // Imported lazily and defensively: this module is reached from server actions,
  // route handlers and the Workers runtime, and a monitoring failure must never
  // be the thing that breaks rate limiting.
  void (async () => {
    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(err instanceof Error ? err : new Error(detail), {
        level: "error",
        tags: { subsystem: "rate-limit", bucket, degraded: "fail-open" },
        extra: {
          impact:
            "Durable rate limiting is not running for this bucket. Requests are " +
            "only bounded by the per-isolate counter, which on Cloudflare barely " +
            "limits at all. Check that the connecting role has SELECT/INSERT/DELETE " +
            "on rate_limit_events (db/migrations/0006).",
        },
      });
    } catch {
      // Sentry unavailable (or not configured in this runtime) — the
      // console.error above is the remaining signal.
    }
  })();
}

/**
 * Counts events for (bucket, actor) inside the window; if under the max,
 * records one. The count and insert race slightly under concurrency — the
 * rare overshoot is bounded by the number of concurrent requests in flight
 * and is acceptable for abuse limits.
 */
export async function checkDurableRateLimit(
  bucket: string,
  actor: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    // Opportunistic housekeeping: fire-and-forget, at most every 10 minutes
    // per isolate, so the table never grows without bound.
    const now = Date.now();
    if (now - lastPruneAt > 10 * 60 * 1000) {
      lastPruneAt = now;
      void pruneRateLimitEvents();
    }

    const windowSeconds = Math.ceil(windowMs / 1000);
    const counts = await sql`
      SELECT COUNT(*)::int AS count
      FROM rate_limit_events
      WHERE bucket = ${bucket}
        AND actor = ${actor}
        AND created_at > now() - (${windowSeconds} * interval '1 second');
    `;
    const count = counts[0]?.count ?? 0;

    if (count >= max) {
      const oldest = await sql`
        SELECT EXTRACT(EPOCH FROM (created_at + (${windowSeconds} * interval '1 second') - now()))::int AS retry_after
        FROM rate_limit_events
        WHERE bucket = ${bucket}
          AND actor = ${actor}
          AND created_at > now() - (${windowSeconds} * interval '1 second')
        ORDER BY created_at ASC
        LIMIT 1;
      `;
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, oldest[0]?.retry_after ?? windowSeconds),
      };
    }

    await sql`
      INSERT INTO rate_limit_events (bucket, actor) VALUES (${bucket}, ${actor});
    `;
    return { allowed: true, remaining: Math.max(0, max - count - 1), retryAfterSeconds: 0 };
  } catch (err) {
    // DB unavailable: fall back to the per-isolate limiter so the endpoint
    // still has some protection and, more importantly, still works.
    //
    // Reported to Sentry, not just console.error. This path is silent by
    // design — the product keeps working — which is exactly why it needs to be
    // loud somewhere. A missing GRANT on rate_limit_events (the table was
    // created in migration 0005, after 0004 had already granted privileges on
    // "all tables") put every call down this branch, and because the fallback
    // answers normally there was nothing to notice: the durable limiter was
    // degraded indefinitely while appearing to work.
    reportDegradation(bucket, err);
    const local = checkRateLimit(`${bucket}:${actor}`, max, windowMs);
    return {
      allowed: local.allowed,
      remaining: local.remaining,
      retryAfterSeconds: local.retryAfterSeconds,
    };
  }
}

/**
 * Housekeeping: prunes window events older than the largest window in use.
 * Fire-and-forget — call it opportunistically (e.g. after a successful check);
 * a failed prune is logged and retried on the next call.
 */
export async function pruneRateLimitEvents(): Promise<void> {
  try {
    await sql`
      DELETE FROM rate_limit_events
      WHERE created_at < now() - interval '24 hours';
    `;
  } catch (err) {
    console.error("[rate-limit] prune failed:", err instanceof Error ? err.message : err);
  }
}
