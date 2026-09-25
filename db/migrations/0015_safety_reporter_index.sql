-- 0015_safety_reporter_index.sql - index the direction a report is read from.
--
-- WHAT THIS ADDS
--   safety_reports_reporter_idx ON public.safety_reports (reporter_id)
--
-- WHY
-- 0014 indexed safety_reports in the direction the queue reads it (status and
-- category, newest first) and the direction an admin investigates it
-- (reported_profile_id). The direction the *reporter* reads it was missed, and
-- it is the one that runs on the app's hot path:
--
--   * `listOwnSafetyReports` filters `WHERE reporter_id = $1`, which is what the
--     "your reports" list and the /api/safety GET answer.
--   * The SELECT policy that scopes a report to its author
--     (safety_reports_select_own, `reporter_id = app_user_id() OR
--     app_is_admin()`) is a per-row qual, so without this index every
--     non-admin read of the table scans all of it before the app's own WHERE
--     clause has a chance to help.
--   * reporter_id is nullable (both foreign keys into profiles are
--     ON DELETE SET NULL so a report outlives the account it is about), and a
--     referential action needs to find the referencing rows. The index serves
--     that scan as well as the query.
--
-- It is not partial (unlike safety_reports_reported_idx): an admin's view reads
-- reports whose reporter has been deleted too.
--
-- Because it is only an index, the runtime bootstrap creates it as well
-- (APP_INDEXES in src/lib/neon/schema.ts), so a database whose schema is managed
-- by the app gets it on the first authenticated request after this deploys. Run
-- this file for a database whose schema is managed by hand
-- (AUTH_SCHEMA_AUTO_MIGRATE=false), and to know an environment has it without
-- waiting for a request. Idempotent and safe to re-run.
--
--   psql "$DATABASE_URL" -f db/migrations/0015_safety_reporter_index.sql
--
-- Either role may run it: `schollective_app` owns safety_reports, and a
-- BYPASSRLS role (neondb_owner) may create an index on any table it can write.
-- Both see the same result.
--
-- Check the whole schema, not just this index, with:
--   npm run verify:db

-- ---------------------------------------------------------------------------
-- 1. The index.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "safety_reports_reporter_idx"
  ON public.safety_reports (reporter_id);

-- ---------------------------------------------------------------------------
-- 2. Verify, and fail loudly rather than leaving the read path unindexed.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  index_ok   int;
  was_partial boolean;
BEGIN
  SELECT count(*) INTO index_ok
    FROM pg_indexes
   WHERE schemaname = 'public'
     AND tablename = 'safety_reports'
     AND indexname = 'safety_reports_reporter_idx';

  -- A partial index would not serve the admin view, so check that too rather
  -- than trusting the name.
  SELECT (pg_get_indexdef(i.indexrelid) LIKE '%WHERE%') INTO was_partial
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
   WHERE c.relname = 'safety_reports_reporter_idx';

  RAISE NOTICE 'safety_reports_reporter_idx present: % of 1', index_ok;
  RAISE NOTICE 'safety_reports_reporter_idx is partial: %', coalesce(was_partial, false);

  IF index_ok <> 1 THEN
    RAISE EXCEPTION 'safety_reports_reporter_idx was not created';
  END IF;

  IF coalesce(was_partial, false) THEN
    RAISE EXCEPTION 'safety_reports_reporter_idx must not be partial: it also serves the admin view';
  END IF;
END $$;
