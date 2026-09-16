-- 0010_self_service_account_deletion.sql - let an account delete itself, and
-- record what it was before it disabled itself.
--
-- WHAT THIS ADDS
--   1. profiles.deactivated_at               when the owner disabled the account
--   2. profiles.status_before_deactivation   the status a restore returns to
--   3. profiles_delete: the row's owner may delete its own row (was: admins only)
--   4. guard_profile_role_change: extended so a restore can put an approved
--      professor back into a live listing -- and so nothing else can.
--
-- WHY THE DELETE POLICY CHANGES
-- profiles_delete was `USING (app_is_admin())`. The app tables carry FORCE ROW
-- LEVEL SECURITY, so the least-privilege owner is subject to policies as well,
-- and a self-service deletion issued by the signed-in user matched zero rows:
-- the endpoint would have answered "deleted" while deleting nothing. Deleting
-- your own row is now allowed explicitly, and admins keep the power they had.
--
-- WHY THE GUARD CHANGES
-- 0007 (and its ASCII twin in 0009) refuses a non-admin status change to
-- 'approved', because approval is the admin review outcome. Restoring a
-- professor who WAS approved is not self-approval, so deactivated -> approved is
-- allowed exactly when the row records 'approved' as what it held. Two further
-- rules keep that unclaimable: status_before_deactivation may only be written in
-- the same statement that disables the account, and only to the status being
-- left behind. Without them a user could write 'approved' into the column while
-- their account was live and then restore into a live faculty listing.
--
-- IRREVERSIBILITY
-- Nothing in this file deletes data. The application's deleting endpoint removes
-- the profile row, and every foreign key into profiles is ON DELETE CASCADE, so
-- that account's threads, messages, notifications, friendships, memberships and
-- read positions go with it -- including the other participant's copy of a
-- mentorship conversation. That is why the app asks for a typed confirmation and
-- keeps no copy of its own: a hidden backup of "deleted" data would make the
-- promise on the button false.
--
-- Apply as a role that owns the tables (neondb_owner), not as schollective_app:
--   psql "$DATABASE_URL" -f db/migrations/0010_self_service_account_deletion.sql
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- 0. Refuse to run as a role that RLS applies to.
--    The verification block at the bottom reads pg_policies (visible to all)
--    and information_schema, but the ALTERs need ownership; running as the app
--    role would fail halfway with a confusing error instead.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION
      'run this migration as a BYPASSRLS role (neondb_owner), not as %. '
      'The policies below must be dropped and recreated by the table owner.',
      current_user
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Columns
--    Nullable and default-less: an existing row was never disabled, and the app
--    treats a null deactivated_at as "no deadline to show".
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status_before_deactivation text;

COMMENT ON COLUMN public.profiles.deactivated_at IS
  'When the account owner disabled this account. The purge deadline is derived '
  'from it (30 days), not stored, so the two cannot disagree.';
COMMENT ON COLUMN public.profiles.status_before_deactivation IS
  'The status to restore to. Written by the disable endpoint and only ever equal '
  'to the status the row held at that moment; the guard trigger enforces both.';

-- ---------------------------------------------------------------------------
-- 2. profiles_delete: the owner may delete their own row.
--    profiles_update and profiles_insert are already owner-scoped; this was the
--    one operation 0004 reserved for admins.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_delete ON public.profiles;
CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE USING (id = app_user_id() OR app_is_admin());

-- ---------------------------------------------------------------------------
-- 3. The guard, with the disable/restore pair understood.
--    Reproduces 0009's body (so this file is the current definition) plus the
--    two status_before_deactivation rules, and widens the AFTER/BEFORE trigger
--    to fire on that column too -- a trigger that only fired on `status` would
--    let the column be written on its own, which is the whole hole.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor text := public.app_user_id();
BEGIN
  -- Nothing being claimed about identity (migrations, the schema bootstrap, and
  -- any query with no app.user_id) is left to the privileges that got it here.
  IF actor IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins may set anything.
  IF public.app_is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NEW.role = 'admin' THEN
      RAISE EXCEPTION 'refusing to grant admin to % via a profile update', actor
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.role NOT IN ('student', 'professor') THEN
      RAISE EXCEPTION 'role % is not self-assignable', NEW.role
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- The disable bookkeeping. Only the disable endpoint may set it, only to the
  -- status being left behind, and only in the statement that disables the
  -- account. Clearing it (restore) is always allowed -- it grants nothing.
  IF NEW.status_before_deactivation IS DISTINCT FROM OLD.status_before_deactivation
     AND NEW.status_before_deactivation IS NOT NULL
     AND (
       NEW.status <> 'deactivated'
       OR NEW.status_before_deactivation IS DISTINCT FROM OLD.status
     ) THEN
    RAISE EXCEPTION
      'status_before_deactivation may only be recorded when an account disables itself, and only as the status it held'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status = 'approved'
     AND OLD.status <> 'approved'
     AND NOT (OLD.status = 'deactivated' AND OLD.status_before_deactivation = 'approved') THEN
    RAISE EXCEPTION 'refusing to self-approve %: approval is an admin action', actor
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_profile_role_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS profiles_guard_role_change ON public.profiles;
CREATE TRIGGER profiles_guard_role_change
  BEFORE UPDATE OF role, status, status_before_deactivation ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_role_change();

-- ---------------------------------------------------------------------------
-- 4. Verify, and fail loudly rather than leaving the app half wired.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  columns_ok int;
  policy_ok  int;
  trigger_ok int;
BEGIN
  SELECT count(*) INTO columns_ok
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
    AND column_name IN ('deactivated_at', 'status_before_deactivation');

  SELECT count(*) INTO policy_ok
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles'
    AND policyname = 'profiles_delete' AND cmd = 'DELETE'
    AND qual LIKE '%app_user_id%';

  SELECT count(*) INTO trigger_ok
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'profiles'
    AND t.tgname = 'profiles_guard_role_change'
    AND pg_get_triggerdef(t.oid) LIKE '%status_before_deactivation%';

  RAISE NOTICE 'disable columns present: % of 2', columns_ok;
  RAISE NOTICE 'profiles_delete policies naming app_user_id: %', policy_ok;
  RAISE NOTICE 'guard trigger covering status_before_deactivation: %', trigger_ok;

  IF columns_ok <> 2 THEN
    RAISE EXCEPTION 'the disable columns are missing: the app cannot record a grace window';
  END IF;
  IF policy_ok <> 1 THEN
    RAISE EXCEPTION 'profiles_delete does not allow a user to delete their own row';
  END IF;
  IF trigger_ok <> 1 THEN
    RAISE EXCEPTION 'the guard trigger does not cover status_before_deactivation';
  END IF;
END $$;
