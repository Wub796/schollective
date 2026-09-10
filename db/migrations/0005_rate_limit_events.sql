-- 0005_rate_limit_events.sql — durable, cross-isolate sliding-window rate limiting.
--
-- The in-memory limiters (src/lib/security.ts, src/lib/ai/guardrails.ts) count
-- per Worker isolate; on Cloudflare an isolate recycles on every deploy and
-- traffic fans out across many, so their counters barely limit at all. This
-- table is the shared counter (the same design as Better Auth's
-- database-backed rateLimit storage used for the auth endpoints).
--
-- Deliberately NO row-level security: rows are keyed by an opaque bucket
-- string, are never selected per user, and every write goes through the app's
-- server-side sql wrapper. RLS here would add policy surface with nothing to
-- protect — no notification/user/message data lives in this table.

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id         bigserial PRIMARY KEY,
  bucket     text        NOT NULL,
  actor      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The only query pattern: count rows for one (bucket, actor) inside the
-- window, then insert. This index makes both the count and the prune a
-- range scan instead of a sequential sweep as the table grows.
CREATE INDEX IF NOT EXISTS rate_limit_events_bucket_actor_created_idx
  ON rate_limit_events (bucket, actor, created_at);
