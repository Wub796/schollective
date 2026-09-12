-- 001_prune_orphan_profiles.sql — remove test-fixture profiles left behind in
-- production, and strip an unusable admin role.
--
-- NOT a migration: this changes DATA, not schema, and is a one-off. It lives in
-- db/maintenance so the change is reviewable and auditable rather than happening
-- in an ad-hoc console session.
--
-- BACKGROUND
-- `profiles` holds 22 rows; the Better Auth `"user"` table holds 6. The 16
-- profiles with no matching auth row cannot be signed into: they predate the
-- current auth stack or were created directly by automated tests. Of those:
--
--   9 are synthetic fixtures  (e2e-*, toast-*, rls-*, notif-* at .local / example
--     domains) left behind by test runs. Debris.
--   7 look like real people    (gmail / hotmail / icloud addresses, created
--     2026-08-03..08-26, all carrying profile content). These are KEPT — they are
--     someone's academic profile, and deleting them is not cleanup.
--
-- One of those 7 carries `role = 'admin'` with no auth row. It is already
-- harmless: the email-claim path in getCurrentUserAndProfile no longer inherits
-- an elevated role (it grants 'student' instead). But it still renders in
-- /admin/users as an administrator who cannot log in, so the role is stripped
-- while the row itself is kept.
--
-- IRREVERSIBILITY
-- The foreign keys into `profiles` are ON DELETE CASCADE — requests, messages and
-- notifications referencing a deleted profile go with it. Exactly one fixture row
-- carries any linked data (a single notification). Step 1 therefore copies every
-- orphan row into a backup table inside the database BEFORE deleting anything, so
-- the profile rows can be restored with a plain INSERT. Cascaded children are NOT
-- recoverable from that backup; for these 9 fixtures there is one notification
-- row at stake.
--
-- Apply as a role that owns the tables (neondb_owner):
--   psql "$DATABASE_URL" -f db/maintenance/001_prune_orphan_profiles.sql
-- Re-runnable: the backup table is only created if absent, and the delete is
-- scoped to rows that still match.

-- ---------------------------------------------------------------------------
-- 0. Same guard as the migrations: `profiles` has FORCE ROW LEVEL SECURITY, so a
--    non-BYPASSRLS role sees zero rows here and every statement below becomes a
--    silent no-op that reports success.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION
      'run this as a BYPASSRLS role (neondb_owner), not as %. Otherwise every '
      'statement below matches zero rows and silently does nothing.', current_user
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Back up every orphan row first.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles_orphan_backup AS
SELECT p.*, now() AS backed_up_at
FROM profiles p
LEFT JOIN "user" u ON u.id = p.id
WHERE u.id IS NULL;

DO $$
BEGIN
  RAISE NOTICE 'backup table holds % row(s)', (SELECT count(*) FROM profiles_orphan_backup);
END $$;

-- ---------------------------------------------------------------------------
-- 2. Delete the synthetic fixtures only.
--
--    Matched on the prefixes the test suites generate, AND on having no auth row,
--    so a real account that happens to start with one of these words is never
--    caught.
-- ---------------------------------------------------------------------------
WITH doomed AS (
  SELECT p.id
  FROM profiles p
  LEFT JOIN "user" u ON u.id = p.id
  WHERE u.id IS NULL
    AND p.email ~* '^(e2e-|rls-|toast-|notif-|test-|qa-|playwright)'
)
DELETE FROM profiles WHERE id IN (SELECT id FROM doomed);

-- ---------------------------------------------------------------------------
-- 3. Strip the admin role from any orphan that still holds it.
--    The row is kept; only the privilege goes.
-- ---------------------------------------------------------------------------
UPDATE profiles p
SET role = 'student', status = 'active', updated_at = now()
WHERE p.role = 'admin'
  AND NOT EXISTS (SELECT 1 FROM "user" u WHERE u.id = p.id);

-- ---------------------------------------------------------------------------
-- 4. Report, and refuse to finish quietly if an elevated orphan survives.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  total     int;
  orphans   int;
  elevated  int;
  mismatch  int;
BEGIN
  SELECT count(*) INTO total FROM profiles;
  SELECT count(*) INTO orphans
    FROM profiles p LEFT JOIN "user" u ON u.id = p.id WHERE u.id IS NULL;
  SELECT count(*) INTO elevated
    FROM profiles p LEFT JOIN "user" u ON u.id = p.id
    WHERE u.id IS NULL AND p.role IN ('admin', 'professor');
  SELECT count(*) INTO mismatch
    FROM profiles p JOIN "user" u ON u.id = p.id
    WHERE u.role IS DISTINCT FROM p.role OR u.status IS DISTINCT FROM p.status;

  RAISE NOTICE 'profiles remaining: %', total;
  RAISE NOTICE 'orphans remaining (real-looking, deliberately kept): %', orphans;
  RAISE NOTICE 'elevated orphans remaining (must be 0): %', elevated;
  RAISE NOTICE 'role/status mismatches (must be 0): %', mismatch;

  IF elevated > 0 THEN
    RAISE EXCEPTION 'an orphan profile still holds an elevated role', elevated;
  END IF;
END $$;

-- To undo step 2:
--   INSERT INTO profiles
--   SELECT (b).* FROM (SELECT b FROM profiles_orphan_backup b) s
--   WHERE (b).id NOT IN (SELECT id FROM profiles);
-- To discard the backup once you are satisfied:
--   DROP TABLE profiles_orphan_backup;
