-- 0007_sync_role_sources.sql — make `profiles.role` and `"user".role` agree, and
-- keep them that way.
--
-- THE BUG THIS FIXES
-- A role lives in two tables. The application reads `profiles.role` for every
-- authorization decision (src/lib/authz.ts, every page guard). The RLS policies
-- read `"user".role`, through `app_is_admin()`. Nothing kept the two in step, and
-- they had drifted: one account was `admin` in `profiles` and `student` in
-- `"user"`.
--
-- While `profiles_select` was `USING (true)` that drift was invisible, because the
-- policy did not consult `app_is_admin()` to decide whether to show a row. Once
-- 0006 scoped the policy, the same account got the full admin UI (page guard reads
-- profiles -> admin) and zero rows in it (policy reads "user" -> not admin). A
-- silently empty page, which is the worst possible failure shape.
--
-- THE SHAPE OF THE FIX
--   1. Repair the existing drift.
--   2. Mirror `profiles.role`/`status` into `"user"` with a trigger, so the two
--      cannot diverge again regardless of which code path writes. `profiles` is
--      the authority because that is what the application already treats as
--      authoritative; `"user"` stays correct for Better Auth's session claims and
--      for the RLS functions.
--   3. Since `profiles` is now authoritative for an RLS decision, guard it: a
--      trigger refuses self-promotion to `admin` and self-approval to `approved`.
--      `profiles_update` lets a user write their own row, and policies cannot do
--      column-level or old-vs-new comparisons, so this has to be a trigger. It is
--      the database-level backstop for the same escalation the application now
--      blocks in `updateProfProfile` and `/api/auth/profile/update`.
--
-- Apply as a role that owns the tables (neondb_owner), not as schollective_app:
--   psql "$DATABASE_URL" -f db/migrations/0007_sync_role_sources.sql
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- 0. Refuse to run as a role that cannot see the whole table.
--
--    This is not paperwork. The repair below reads `profiles` inside an UPDATE,
--    and `profiles` has FORCE ROW LEVEL SECURITY. Run as `schollective_app` with
--    no `app.user_id` set, that read returns ZERO rows: the UPDATE matches
--    nothing, reports success, and the verification block at the bottom also sees
--    nothing and declares victory. The migration would appear to work and change
--    nothing at all. (This happened during development, which is why the check
--    exists.)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION
      'run this migration as a BYPASSRLS role (neondb_owner), not as %. '
      'Otherwise the profiles read below is filtered to zero rows and the repair '
      'silently does nothing.', current_user
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Repair the drift.
--    profiles wins: it is what the app reads, and the admin whose "user" row said
--    'student' genuinely is an admin.
-- ---------------------------------------------------------------------------
UPDATE "user" u
SET role        = p.role,
    status      = p.status,
    "updatedAt" = now()
FROM profiles p
WHERE p.id = u.id
  AND (u.role IS DISTINCT FROM p.role OR u.status IS DISTINCT FROM p.status);

-- ---------------------------------------------------------------------------
-- 2. Keep them in sync from here on.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mirror_profile_role_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only touches the matching auth row; a profile with no auth row (there are
  -- legacy ones) is left alone rather than treated as an error.
  UPDATE "user"
  SET role        = NEW.role,
      status      = NEW.status,
      "updatedAt" = now()
  WHERE id = NEW.id
    AND (role IS DISTINCT FROM NEW.role OR status IS DISTINCT FROM NEW.status);
  RETURN NULL; -- AFTER trigger; return value is ignored
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mirror_profile_role_to_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS profiles_mirror_role_to_user ON profiles;
CREATE TRIGGER profiles_mirror_role_to_user
  AFTER INSERT OR UPDATE OF role, status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.mirror_profile_role_to_user();

-- ---------------------------------------------------------------------------
-- 3. Refuse self-escalation at the database layer.
--
--    `profiles_update` permits `id = app_user_id()`, and an UPDATE policy cannot
--    compare the old row to the new one, so the column-level rule lives here.
--
--    Allowed self-transitions, matching what onboarding actually does:
--      student  -> professor   (status must become 'pending', or stay 'approved')
--      professor -> student
--    Refused:
--      anything -> admin
--      self-setting status to 'approved' (that is the admin review outcome)
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
    RAISE EXCEPTION 'refusing to self-approve % — approval is an admin action', actor
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_profile_role_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS profiles_guard_role_change ON profiles;
CREATE TRIGGER profiles_guard_role_change
  BEFORE UPDATE OF role, status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_role_change();

-- ---------------------------------------------------------------------------
-- 4. Verify, and fail loudly if the repair did not take.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  mismatches int;
  admins_ok  int;
BEGIN
  SELECT count(*) INTO mismatches
  FROM profiles p JOIN "user" u ON u.id = p.id
  WHERE u.role IS DISTINCT FROM p.role OR u.status IS DISTINCT FROM p.status;

  SELECT count(*) INTO admins_ok
  FROM profiles p JOIN "user" u ON u.id = p.id
  WHERE p.role = 'admin' AND u.role = 'admin';

  RAISE NOTICE 'role/status mismatches remaining: %', mismatches;
  RAISE NOTICE 'admins consistent across both tables: %', admins_ok;
  RAISE NOTICE 'profiles with no auth row (legacy, left alone): %',
    (SELECT count(*) FROM profiles p LEFT JOIN "user" u ON u.id = p.id WHERE u.id IS NULL);

  IF mismatches > 0 THEN
    RAISE EXCEPTION 'profiles and "user" still disagree on % row(s) — admin pages would render empty', mismatches;
  END IF;
END $$;
