-- Durable profile-review jobs for the AI Academic Advisor.
--
-- The runtime bootstrap in src/lib/neon/schema.ts creates this table when
-- AUTH_SCHEMA_AUTO_MIGRATE is enabled. Apply this migration manually when
-- AUTH_SCHEMA_AUTO_MIGRATE=false:
--
--   psql "$DATABASE_URL" -f db/migrations/0002_ai_profile_review_jobs.sql

CREATE TABLE IF NOT EXISTS ai_profile_review_jobs (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  profile_data jsonb NOT NULL,
  result jsonb,
  error text,
  processing_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_profile_review_jobs_active_user_uidx"
  ON ai_profile_review_jobs (user_id)
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS "ai_profile_review_jobs_user_created_idx"
  ON ai_profile_review_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS "ai_profile_review_jobs_status_updated_idx"
  ON ai_profile_review_jobs (status, updated_at);
