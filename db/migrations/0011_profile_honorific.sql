-- 0011_profile_honorific.sql - let a professor choose the title they are shown
-- with, instead of the product assuming "Dr." for everyone.
--
-- WHAT THIS ADDS
--   1. profiles.honorific    the form of address the account chose
--
-- WHY NULL IS NOT "NO TITLE"
-- Three states have to be told apart, and two of them are absences:
--   NULL          nobody has chosen. The naming helpers read this as "Dr.",
--                 which is what every faculty profile showed before this column
--                 existed, so nothing changes for an account that never picks.
--   'none'        the account explicitly asked to be shown without a title.
--   'Dr.' etc.    a chosen title, or a short title of the account's own.
-- A NULL default would collapse the first two into "Dr.", and no title at all
-- would be unexpressible -- somebody who wants to be "Jiwoo Kim" rather than
-- "Dr. Jiwoo Kim" has no way to ask for it.
--
-- WHY THERE IS NO CHECK CONSTRAINT OR DEFAULT
-- A CHECK would have to enumerate the titles, and the list of titles people
-- legitimately use is longer than any list we would think to write (Prof., Mx.,
-- Rev., a title in another language, an honorific we have never seen). The
-- picker in src/lib/people.ts (HONORIFIC_CHOICES) offers the common ones and
-- accepts a short custom value; the column stores whatever was chosen, as
-- text, and never needs revisiting when that list grows. There is deliberately
-- no index: nothing filters or orders on this column.
--
-- Apply as a role that owns the tables (neondb_owner), not as schollective_app:
--   psql "$DATABASE_URL" -f db/migrations/0011_profile_honorific.sql
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- 0. Refuse to run as a role that RLS applies to.
--    The ALTER below needs ownership; running as the app role would fail
--    midway with a privilege error that says nothing about what to do.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION
      'run this migration as a BYPASSRLS role (neondb_owner), not as %. '
      'The column must be added by the table owner.',
      current_user
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. The column.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS honorific text;

COMMENT ON COLUMN public.profiles.honorific IS
  'The form of address this account chose: a title such as ''Dr.'' or ''Prof.'', '
  'or ''none'' for no title at all. NULL means nobody has chosen, which reads as '
  '''Dr.'' so a profile from before this column keeps the title it always had.';

-- ---------------------------------------------------------------------------
-- 2. Verify, and fail loudly rather than leaving the app half wired.
--    No backfill: the values are the account's to choose, and inventing one
--    would be a title nobody asked for.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  column_ok int;
  chosen    int;
BEGIN
  SELECT count(*) INTO column_ok
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
    AND column_name = 'honorific' AND data_type = 'text';

  SELECT count(*) INTO chosen
  FROM public.profiles
  WHERE honorific IS NOT NULL;

  RAISE NOTICE 'honorific columns present: % of 1', column_ok;
  RAISE NOTICE 'profiles that have chosen a title: %', chosen;

  IF column_ok <> 1 THEN
    RAISE EXCEPTION 'profiles.honorific is missing: nobody can choose a title';
  END IF;
END $$;
