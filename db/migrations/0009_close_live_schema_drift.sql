-- 0009_close_live_schema_drift.sql - three differences between what db/migrations
-- describes and what the production database actually holds. Found by dumping the
-- live catalog and comparing it against a replay of every migration.
--
--   1. profiles_orphan_backup IS READABLE BY THE APP ROLE, WITH NO RLS.
--      db/maintenance/001 created it as neondb_owner. The ALTER DEFAULT PRIVILEGES
--      in 0006 then granted schollective_app SELECT/INSERT/UPDATE/DELETE on it
--      automatically - that is what default privileges do for every table the
--      owner creates. The table holds whole copies of profile rows (email
--      addresses, grades, activity history) and has no row-level security, so any
--      query the app role runs could read every row of it. The application never
--      touches it; it is a restore point for the owner alone.
--
--   2. profiles.ai_score IS numeric IN PRODUCTION, integer IN THE REPOSITORY
--      (src/lib/neon/schema.ts, ProfileRecord). The Neon driver returns numeric as
--      a string, so `typeof ai_score === "number"` was never true: the admin review
--      queue treated every scored applicant as unscored and re-ran scoring for the
--      whole queue on every visit.
--
--   3. guard_profile_role_change CARRIES A MIS-ENCODED MESSAGE.
--      0007 was applied through a client whose encoding was not UTF-8, so the em
--      dash in one exception message was stored as three Mac-Roman characters. It
--      changes no behaviour, but it is the text a user sees if the guard fires, and
--      any later non-ASCII migration would be damaged the same way. The function is
--      recreated below in plain ASCII, and migrations from 0008 on are ASCII-only
--      (tests/social-schema.test.mjs).
--
-- Apply as neondb_owner, after 0008:
--   psql "$DATABASE_URL" -f db/migrations/0009_close_live_schema_drift.sql
-- Re-runnable.

DO $$
BEGIN
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION
      'run this migration as a BYPASSRLS role (neondb_owner), not as %.', current_user
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Lock the backup table away from the application.
--    RLS with no policies denies every non-owner outright; the revoke means the
--    app role cannot even attempt it. The owner (BYPASSRLS) can still restore.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.profiles_orphan_backup') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.profiles_orphan_backup FROM schollective_app';
    EXECUTE 'ALTER TABLE public.profiles_orphan_backup ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. ai_score becomes the integer the application already assumes.
--    Every stored score is a whole number from scoreProfessorApplication; round()
--    only guards against a value written by hand.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF (
    SELECT data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ai_score'
  ) <> 'integer' THEN
    ALTER TABLE public.profiles
      ALTER COLUMN ai_score TYPE integer USING round(ai_score)::integer;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. The same guard as 0007, with its messages in ASCII.
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

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status = 'approved'
     AND OLD.status <> 'approved' THEN
    RAISE EXCEPTION 'refusing to self-approve %: approval is an admin action', actor
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_profile_role_change() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 4. Verify.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  backup_privs int := 0;
  score_type   text;
BEGIN
  IF to_regclass('public.profiles_orphan_backup') IS NOT NULL THEN
    SELECT count(*) INTO backup_privs
    FROM (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS p(priv)
    WHERE has_table_privilege('schollective_app', 'public.profiles_orphan_backup', p.priv);
  END IF;

  SELECT data_type INTO score_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ai_score';

  RAISE NOTICE 'app-role privileges left on profiles_orphan_backup: %', backup_privs;
  RAISE NOTICE 'profiles.ai_score type: %', score_type;

  IF backup_privs > 0 THEN
    RAISE EXCEPTION 'schollective_app can still read or write profiles_orphan_backup';
  END IF;
  IF score_type <> 'integer' THEN
    RAISE EXCEPTION 'profiles.ai_score is still %, not integer', score_type;
  END IF;
END $$;
