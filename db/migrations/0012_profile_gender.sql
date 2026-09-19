-- 0012_profile_gender.sql - an optional gender on the profile, which the
-- account chooses to list and other people can then see.
--
-- WHAT THIS ADDS
--   1. profiles.gender    a slug from GENDER_CHOICES (src/lib/people.ts)
--
-- WHY NULL IS "NOTHING TO SHOW", AND WHY THAT IS TWO THINGS
-- The column has three states and only two of them display:
--   NULL                  nobody answered. Nothing is shown, and nothing is
--                         claimed about them.
--   'prefer-not-to-say'   they answered, and the answer is "keep this off my
--                         profile". Also shown as nothing -- which is the point
--                         of storing it rather than leaving the column null:
--                         a person can say "asked and declined" instead of
--                         being indistinguishable from "never filled in".
--   'woman' / 'man' /
--   'nonbinary'           shown on the profile to whoever may see the profile.
-- No default, so no account is given a gender it did not choose.
--
-- WHY THERE IS NO CHECK CONSTRAINT
-- The vocabulary lives in GENDER_CHOICES in src/lib/people.ts, and the write path
-- in src/lib/profile-input.ts refuses any value that is not on that list
-- (storing a clear instead). Putting the list in the database as well would mean
-- a migration every time it grows, for a column the app is the only writer of.
-- There is deliberately no index: nothing filters or orders on this column.
--
-- WHO SEES IT
-- The same rule as the rest of a profile's detail: it renders on the public
-- faculty profile and on a student's profile page to viewers who may see that
-- profile at all (the page itself, and row-level security underneath it, decide
-- that -- see migration 0008 for the connected-viewer rules). It is not part of
-- `app_student_cards`, so it is not shown to students who are not connected to
-- the profile's owner.
--
-- Apply as a role that owns the tables (neondb_owner), not as schollective_app:
--   psql "$DATABASE_URL" -f db/migrations/0012_profile_gender.sql
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
  ADD COLUMN IF NOT EXISTS gender text;

COMMENT ON COLUMN public.profiles.gender IS
  'A slug from GENDER_CHOICES in src/lib/people.ts, or ''prefer-not-to-say'' '
  'when the account asked for this to stay off their profile. NULL means nobody '
  'answered. Both NULL and the sentinel display as nothing.';

-- ---------------------------------------------------------------------------
-- 2. Verify, and fail loudly rather than leaving the app half wired.
--    No backfill: this is the account's to answer, and guessing it would label
--    people who never made the choice.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  column_ok int;
  answered  int;
BEGIN
  SELECT count(*) INTO column_ok
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
    AND column_name = 'gender' AND data_type = 'text';

  SELECT count(*) INTO answered
  FROM public.profiles
  WHERE gender IS NOT NULL;

  RAISE NOTICE 'gender columns present: % of 1', column_ok;
  RAISE NOTICE 'profiles that have answered: %', answered;

  IF column_ok <> 1 THEN
    RAISE EXCEPTION 'profiles.gender is missing: nobody can list a gender';
  END IF;
END $$;
