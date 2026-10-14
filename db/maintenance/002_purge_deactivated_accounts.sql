-- 002_purge_deactivated_accounts.sql - permanently remove accounts that were
-- disabled by their owners and never restored.
--
-- NOT a migration: this changes DATA, not schema, and it is a sweep meant to be
-- run on a schedule. It lives in db/maintenance so the change is reviewable and
-- auditable rather than happening in an ad-hoc console session.
--
-- NOW ALSO AUTOMATIC, AND THIS IS THE FALLBACK
-- db/migrations/0016 puts the deletes in a SECURITY DEFINER function and
-- wrangler.jsonc runs it daily from a Cron Trigger, so this no longer has to be
-- remembered for the promise to hold. Run it by hand when the cron did not fire
-- (its error is in the Worker logs), after restoring a database from a backup,
-- or when the targets need a human to look at them first. The deltas it adds are
-- the audit list in step 1 and the refusal in step 3, which the cron answers
-- with a log line instead.
--
-- WHY IT IS A CALL AND NOT THE STATEMENTS
-- The order of the deletes is load-bearing and was previously written in two
-- places. It now lives in `purge_expired_deactivated_accounts` alone, so a change
-- to it cannot reach the cron path and miss this one.
--
--   psql "$DATABASE_URL" -f db/maintenance/002_purge_deactivated_accounts.sql
--
-- WHAT IT DELETES, AND WHY IN THIS ORDER
--   The four statements and the reasoning behind their order are in
--   db/migrations/0016, next to the function that now owns them. Read that
--   before changing either file.
--
-- The grace window is passed in below as 30. Keep it in step with
-- src/lib/account-deletion.ts (DEACTIVATION_GRACE_DAYS), which is what the user
-- was told: the cron path reads that constant directly, and this literal is the
-- one hand-run copy left.
--
-- IRREVERSIBLE. There is no backup table, on purpose: the account was told its
-- data would be deleted, and a hidden copy would make that a lie. The SELECT at
-- the end of step 1 prints every address about to go, so the run can be audited
-- (or stopped) before the deletes.
--
-- Apply as a role that owns the tables (neondb_owner).
-- Re-runnable: an account already purged is simply no longer selected.

-- ---------------------------------------------------------------------------
-- 0. Same guard as the migrations. The DELETEs no longer need it, because
--    0016's function is SECURITY DEFINER. The audit list below and the "must be
--    0" check at the end still do: `profiles` has FORCE ROW LEVEL SECURITY, so a
--    non-BYPASSRLS role would read zero rows and this file would report a
--    clean database it never actually looked at.
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
-- 1. Show what is about to go, before it goes.
--    The addresses are printed so a run can be audited or stopped first, which
--    is the whole reason this file still exists next to the cron.
-- ---------------------------------------------------------------------------
SELECT p.id, p.email, p.role, p.deactivated_at
FROM profiles p
WHERE p.status = 'deactivated'
  AND p.deactivated_at IS NOT NULL
  AND p.deactivated_at < now() - interval '30 days'
ORDER BY p.deactivated_at;

-- ---------------------------------------------------------------------------
-- 2. Delete, through the one definition of the order.
--    A limit far above any realistic backlog: an operator running this by hand
--    means "clear it", while the cron's own bound keeps a scheduled run short.
--    The function reports per account rather than in bulk, so a profile the
--    database refuses to delete is named instead of being lost in a count.
-- ---------------------------------------------------------------------------
SELECT account_id, was_deleted, detail
FROM purge_expired_deactivated_accounts(30, 100000);

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
