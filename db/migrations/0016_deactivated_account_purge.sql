-- 0016_deactivated_account_purge.sql - actually remove the accounts whose grace
-- window has closed.
--
-- WHAT THIS FIXES
-- Disabling an account promises, in the email and on /deactivated, that its data
-- is removed 30 days later. The deletion itself was written twice over. A
-- deadline was computed in `account-deletion.ts`, with `isPastGraceWindow` tested
-- called from nowhere, and a working sweep in
-- `db/maintenance/002_purge_deactivated_accounts.sql` that only runs when an
-- operator remembers it. `wrangler.jsonc` declared no cron triggers, and the
-- Worker connects as the least-privilege app role, so no part of the running
-- application could perform the delete at all.
--
-- This file makes the deletion something the deployment can run on a timer, and
-- gives it one definition: `db/maintenance/002` becomes a caller of the function
-- below rather than a second copy of the same four statements.
--
-- WHY THE WORK IS A FUNCTION AND NOT APP CODE
-- Every table here is owned by the least-privilege `schollective_app` role and
-- `profiles` carries FORCE ROW LEVEL SECURITY, so a sweep running with no
-- `app.user_id` matches zero rows: `DELETE` reports success and deletes nothing.
-- That is why the sweep could only ever be a psql script, and why making it
-- automatic needs a privileged entry point.
-- Three ways out, and only one of them is small:
--   1. widen `profiles_delete` with a maintenance setting. That widens the one
--      policy standing between a signed-in user and every other account's row,
--      for a job that must never be reachable from a request.
--   2. run the sweep as an admin id. It borrows a privilege the job does not
--      have, and breaks on an instance whose admin was deleted.
--   3. put the deletion in SECURITY DEFINER here. It runs as the BYPASSRLS
--      owner, so no policy is widened, the ability is granted explicitly to one
--      function, and the ordering below lives in one reviewed place instead of
--      being restated in TypeScript.
-- This file takes (3).
--
-- IRREVERSIBILITY
-- This deletes real accounts. The order is the one `account/delete` already
-- uses, and it is chosen for the failure it leaves behind:
--   1. sessions            access is gone even if everything below fails
--   2. AI review jobs      no foreign key to profiles, so nothing else would
--                          ever remove rows holding a copy of the profile
--   3. the profile row     cascades the app data; the row count is checked
--   4. the auth row        last, so a failure between 3 and 4 leaves an account
--                          that can still sign in and gets a fresh, empty
--                          profile, which is recoverable
-- The reverse order would leave data behind with no way in.
--
-- `safety_reports` references profiles with ON DELETE SET NULL (0014), so a
-- report and the thread copy filed with it outlive the account. That is the same
-- deliberate outcome as self-service deletion: deleting an account is not a way
-- to erase a report about it.
--
-- Apply as a role that owns the tables (neondb_owner), not as schollective_app:
--   psql "$DATABASE_URL" -f db/migrations/0016_deactivated_account_purge.sql
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- 0. Refuse to run as a role that RLS applies to.
--    SECURITY DEFINER captures CURRENT_USER as the function's owner, so a
--    function created by schollective_app would inherit its policies and the
--    deletes below would silently match nothing.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION
      'run this migration as a BYPASSRLS role (neondb_owner), not as %. '
      'The purge function must be owned by a role the policies do not apply to, '
      'or its deletes match no rows and report success.',
      current_user
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. The purge.
--    p_grace_days is a parameter rather than a literal on purpose:
--    DEACTIVATION_GRACE_DAYS in src/lib/account-deletion.ts is the single place
--    the 30 is written, the email and the restore page both quote it, and
--    restating it here would give it a second source that a change could miss.
--    p_limit bounds one run so the caller can never ask for an unbounded delete.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_expired_deactivated_accounts(
  p_grace_days integer,
  p_limit integer DEFAULT 25
)
RETURNS TABLE (account_id text, was_deleted boolean, detail text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  candidate text;
  profiles_removed integer;
BEGIN
  IF p_grace_days IS NULL OR p_grace_days < 1 THEN
    RAISE EXCEPTION 'p_grace_days must be a positive number of days, got %', p_grace_days
      USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'p_limit must be positive, got %', p_limit
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Oldest deadline first, so a bounded run always makes progress and a run
  -- that hits the limit leaves the youngest accounts for the next one.
  FOR candidate IN
    SELECT p.id
    FROM public.profiles p
    WHERE p.status = 'deactivated'
      AND p.deactivated_at IS NOT NULL
      AND p.deactivated_at <= now() - make_interval(days => p_grace_days)
    ORDER BY p.deactivated_at ASC
    LIMIT p_limit
  LOOP
    DELETE FROM public.session WHERE "userId" = candidate;
    DELETE FROM public.ai_profile_review_jobs WHERE ai_profile_review_jobs.user_id = candidate;

    DELETE FROM public.profiles WHERE profiles.id = candidate;
    GET DIAGNOSTICS profiles_removed = ROW_COUNT;

    -- A profile that refused the delete is reported rather than passed over:
    -- step 4 would otherwise leave an unreachable profile behind, which is the
    -- failure 0016's own predecessors were written to prevent.
    IF profiles_removed = 0 THEN
      account_id := candidate;
      was_deleted := false;
      detail := 'the profile row was not deleted, so nothing was removed for this account';
      RETURN NEXT;
      CONTINUE;
    END IF;

    DELETE FROM public."user" WHERE "user".id = candidate;

    account_id := candidate;
    was_deleted := true;
    detail := NULL;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Not callable by PUBLIC. Only the app role the Worker connects as.
REVOKE EXECUTE ON FUNCTION public.purge_expired_deactivated_accounts(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_deactivated_accounts(integer, integer) TO schollective_app;

COMMENT ON FUNCTION public.purge_expired_deactivated_accounts(integer, integer) IS
  'Deletes accounts whose owner disabled them more than p_grace_days ago. '
  'Bounded by p_limit, idempotent, and safe to run twice: a row it already '
  'removed is no longer a candidate. SECURITY DEFINER so the deletes are not '
  'subject to the profiles policies, which no request surface may bypass.';

-- ---------------------------------------------------------------------------
-- 2. Verify, and fail loudly rather than leaving the sweep half wired.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  definer_ok boolean;
  secdef_ok  boolean;
  grant_ok   integer;
BEGIN
  SELECT p.prosecdef, r.rolbypassrls
    INTO secdef_ok, definer_ok
  FROM pg_proc p
  JOIN pg_roles r ON r.oid = p.proowner
  WHERE p.pronamespace = 'public'::regnamespace
    AND p.proname = 'purge_expired_deactivated_accounts';

  SELECT count(*) INTO grant_ok
  FROM information_schema.routine_privileges
  WHERE routine_schema = 'public'
    AND routine_name = 'purge_expired_deactivated_accounts'
    AND grantee = 'schollective_app'
    AND privilege_type = 'EXECUTE';

  RAISE NOTICE 'purge function is SECURITY DEFINER: %', secdef_ok;
  RAISE NOTICE 'purge function owner bypasses RLS: %', definer_ok;
  RAISE NOTICE 'EXECUTE granted to schollective_app: %', grant_ok;

  IF NOT COALESCE(secdef_ok, false) THEN
    RAISE EXCEPTION 'purge_expired_deactivated_accounts exists but is not SECURITY DEFINER';
  END IF;
  IF NOT COALESCE(definer_ok, false) THEN
    RAISE EXCEPTION
      'purge_expired_deactivated_accounts is owned by a role the policies apply to, '
      'so its DELETEs will match zero rows and report success';
  END IF;
  IF grant_ok <> 1 THEN
    RAISE EXCEPTION 'schollective_app cannot execute the purge, so the sweep can never run';
  END IF;
END $$;
