-- 0006_rls_scope_profiles_and_grants.sql
--
-- Three fixes, all consequences of the same thing: privileges and policies were
-- written once, against the tables that existed at that moment, with nothing to
-- carry them forward.
--
--   1. GRANTS FOR LATER TABLES.  0004 ran `GRANT ... ON ALL TABLES` and a
--      one-shot ownership loop. `rate_limit_events` was created afterwards, by
--      0005, so `schollective_app` — the role the app actually connects as —
--      received no privileges on it at all. Every query in src/lib/rate-limit.ts
--      then failed with "permission denied", hit the catch, and fell back to the
--      per-isolate counter the module exists to replace. Because the failure
--      policy is deliberately fail-open, nothing surfaced: the durable rate
--      limiter has most likely never once limited anything in production. This
--      migration grants the missing privileges AND sets default privileges so the
--      next table added does not repeat it.
--
--   2. profiles_select WAS `USING (true)`.  Every row of every profile —
--      student emails, GPAs, class rank, research goals, activity history — was
--      readable by any query the app made, authenticated or not. The comment in
--      0004 describes this as "directory and professor lookups are public
--      reads", which is the intent, but the policy as written covers far more
--      than the directory. Since RLS exists here as the layer that holds when a
--      route forgets, a policy this wide could not do that job. It is now scoped
--      to: your own row, approved professors (the public directory), the other
--      party on a thread you are in, the email-claim migration path, and admins.
--
--   3. Safety net for the hardening in (2).  A stricter SELECT policy turns
--      "forgot runAs" from a harmless no-op into a silently empty page, so the
--      app-side reads that ran bare have been wrapped in runAs in the same
--      commit (src/app/admin/dashboard/page.tsx, src/app/admin/users/page.tsx).
--
-- Apply with:
--   psql "$DATABASE_URL" -f db/migrations/0006_rls_scope_profiles_and_grants.sql
--
-- Apply as a role that owns the tables (neondb_owner), not as schollective_app.
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- 1. Privileges: the tables 0004 could not have known about, plus a default
--    so this class of bug cannot recur.
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO schollective_app;
GRANT USAGE, SELECT                 ON ALL SEQUENCES  IN SCHEMA public TO schollective_app;

-- Ownership transfer for anything created since 0004 (rate_limit_events, and
-- whatever the schema bootstrap has added since).
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tableowner <> 'schollective_app'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO schollective_app', t);
  END LOOP;
END $$;

-- The part 0004 was missing: privileges for tables that do not exist yet.
-- Without this, every future migration has to remember to re-grant, and the one
-- that forgets fails open and silent.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO schollective_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO schollective_app;

-- `rate_limit_events` carries no RLS by design (see 0005): rows are keyed by an
-- opaque bucket string and hold no user data. Stated explicitly so a future
-- reader does not "fix" its absence.
-- Named here so the grant above is visibly the point of this section:
GRANT SELECT, INSERT, DELETE ON rate_limit_events TO schollective_app;

-- ---------------------------------------------------------------------------
-- 2. profiles: replace the blanket public read with the app's real rule.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (
    -- Your own row.
    id = app_user_id()

    -- The public faculty directory and the public professor pages. This is the
    -- only branch that is readable with no session at all, which is why it is
    -- narrowed to exactly what those pages render.
    OR (role = 'professor' AND status = 'approved')

    -- The other party on a thread you are part of: the thread page and the
    -- professor's roster both need to show the counterpart's name.
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE (r.student_id = profiles.id AND r.professor_id = app_user_id())
         OR (r.professor_id = profiles.id AND r.student_id = app_user_id())
    )

    -- The email-claim path: a signed-in user adopting a pre-Neon profile row
    -- that carries their address (see getCurrentUserAndProfile). Mirrors the
    -- same clause already present on profiles_update — without it that lookup
    -- returns nothing and the migration path breaks.
    OR email = (SELECT u.email FROM "user" u WHERE u.id = app_user_id())

    -- Admins moderate every account.
    OR app_is_admin()
  );

-- ---------------------------------------------------------------------------
-- 3. Verification — run these after applying and read the output.
--
--    Expected:
--      * rate_limit_events privileges: 3 rows (SELECT/INSERT/DELETE or more)
--      * default privileges: at least one row
--      * no table in public still owned by anything but schollective_app
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  missing_grants int;
  wrong_owner    int;
  default_acl    int;
BEGIN
  SELECT count(*) INTO missing_grants
  FROM (VALUES ('SELECT'), ('INSERT'), ('DELETE')) AS needed(priv)
  WHERE NOT has_table_privilege('schollective_app', 'rate_limit_events', needed.priv);

  SELECT count(*) INTO wrong_owner
  FROM pg_tables
  WHERE schemaname = 'public' AND tableowner <> 'schollective_app';

  SELECT count(*) INTO default_acl
  FROM pg_default_acl d
  JOIN pg_namespace n ON n.oid = d.defaclnamespace
  WHERE n.nspname = 'public' AND d.defaclobjtype = 'r';

  RAISE NOTICE 'rate_limit_events privileges still missing: %', missing_grants;
  RAISE NOTICE 'public tables not owned by schollective_app: %', wrong_owner;
  RAISE NOTICE 'default ACL entries for tables in public: %', default_acl;

  IF missing_grants > 0 THEN
    RAISE EXCEPTION 'schollective_app still cannot use rate_limit_events — the durable rate limiter would keep failing open';
  END IF;
END $$;
