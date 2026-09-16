-- 002_purge_deactivated_accounts.sql - permanently remove accounts that were
-- disabled by their owners and never restored.
--
-- NOT a migration: this changes DATA, not schema, and it is a sweep meant to be
-- run on a schedule. It lives in db/maintenance so the change is reviewable and
-- auditable rather than happening in an ad-hoc console session.
--
-- WHY THIS EXISTS AS A SCRIPT AND NOT A SCHEDULED WORKER
-- The deployment (wrangler.jsonc) declares no cron triggers and the platform has
-- no queue consumer, so there is nothing that can run on a timer. Rather than
-- promise an automatic deletion the infrastructure cannot deliver, the app tells
-- the user a date and the deletion happens when an operator runs this. Run it
-- monthly:
--   psql "$DATABASE_URL" -f db/maintenance/002_purge_deactivated_accounts.sql
--
-- WHAT IT DELETES, AND WHY IN THIS ORDER
--   session                 access goes first; a deleted auth row would take
--                           these with it, but the explicit delete also covers a
--                           profile that is somehow already gone
--   ai_profile_review_jobs  keyed by user id with NO foreign key, so nothing
--                           else would ever remove these copies of the profile
--   profiles                cascades the account's threads, messages,
--                           notifications, friendships, blocks, group
--                           memberships and read positions
--   "user"                  the auth row: credentials, sessions, OAuth links
--
-- The grace window is read from the same 30 days the application uses. Keep the
-- two in step: src/lib/account-deletion.ts (DEACTIVATION_GRACE_DAYS) is what the
-- user was told, and this interval is what actually happens.
--
-- IRREVERSIBLE. There is no backup table, on purpose: the account was told its
-- data would be deleted, and a hidden copy would make that a lie. The SELECT at
-- the end of step 1 prints every address about to go, so the run can be audited
-- (or stopped) before the deletes.
--
-- Apply as a role that owns the tables (neondb_owner).
-- Re-runnable: an account already purged is simply no longer selected.

-- ---------------------------------------------------------------------------
-- 0. Same guard as the migrations: `profiles` has FORCE ROW LEVEL SECURITY, so a
--    non-BYPASSRLS role sees zero rows here and every statement below becomes a
--    silent no-op that reports success.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION
      'run this as a BYPASSRLS role (neondb_owner), not as %. Otherwise the '
      'sweep below matches zero rows and silently does nothing.', current_user
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Materialise the targets, and show them.
--    A temp table, not a CTE: each DELETE below is a separate statement, and a
--    CTE cannot span them. Dropping it first makes a re-run start clean instead
--    of reusing whatever the previous run selected.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS purge_targets;

CREATE TEMP TABLE purge_targets AS
SELECT p.id, p.email, p.role, p.deactivated_at
FROM profiles p
WHERE p.status = 'deactivated'
  AND p.deactivated_at IS NOT NULL
  AND p.deactivated_at < now() - interval '30 days';

DO $$
BEGIN
  RAISE NOTICE 'accounts past the grace window: %', (SELECT count(*) FROM purge_targets);
END $$;

SELECT id, email, role, deactivated_at FROM purge_targets ORDER BY deactivated_at;

-- ---------------------------------------------------------------------------
-- 2. Delete. Sessions and review jobs first, then the profile (which cascades
--    the rest of the account's data), then the auth row.
-- ---------------------------------------------------------------------------
DELETE FROM session
WHERE "userId" IN (SELECT id FROM purge_targets);

DELETE FROM ai_profile_review_jobs
WHERE user_id IN (SELECT id FROM purge_targets);

DELETE FROM profiles
WHERE id IN (SELECT id FROM purge_targets);

DELETE FROM "user"
WHERE id IN (SELECT id FROM purge_targets);

-- ---------------------------------------------------------------------------
-- 3. Report, and refuse to finish quietly if anything is left behind.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  remaining_profiles int;
  remaining_users    int;
  orphan_jobs        int;
BEGIN
  SELECT count(*) INTO remaining_profiles FROM profiles WHERE status = 'deactivated'
    AND deactivated_at IS NOT NULL AND deactivated_at < now() - interval '30 days';

  SELECT count(*) INTO remaining_users FROM "user" u
    WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
      AND u."createdAt" < now() - interval '30 days';

  SELECT count(*) INTO orphan_jobs FROM ai_profile_review_jobs j
    WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = j.user_id)
      AND j.created_at < now() - interval '30 days';

  RAISE NOTICE 'deactivated profiles still past the window (must be 0): %', remaining_profiles;
  RAISE NOTICE 'auth rows older than 30 days with no profile (may be legitimate): %', remaining_users;
  RAISE NOTICE 'review jobs older than 30 days with no profile: %', orphan_jobs;

  IF remaining_profiles > 0 THEN
    RAISE EXCEPTION 'deactivated accounts remain past the grace window: %', remaining_profiles;
  END IF;
END $$;

DROP TABLE IF EXISTS purge_targets;
