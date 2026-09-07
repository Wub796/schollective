-- 0004_rls_activate.sql — make row-level security ENFORCING.
--
-- Companion to 0003_rls_policies.sql (which only staged policies while the app
-- still connected as the BYPASSRLS owner). This file:
--   1. hands table ownership to the least-privilege `schollective_app` role
--      created out-of-band (password never in git),
--   2. replaces the staged policies with the app's real authorization model,
--      expressed in SQL against the `app.user_id` setting the sql wrapper
--      (src/lib/neon/db.ts) attaches to every query,
--   3. keeps the Better Auth tables owner-managed (their RLS is enabled but
--      NOT forced, so their owner bypasses it — the library must read and
--      write sessions across users to function).
--
-- Ownership transfer is what activates enforcement: schollective_app has no
-- BYPASSRLS attribute, and the app tables carry FORCE ROW LEVEL SECURITY, so
-- its owner status does not exempt it from the policies below. Every policy
-- mirrors a check the application already performs (src/lib/authz.ts and the
-- per-route gates); RLS is the second layer that holds even if a route
-- forgets.
--
-- Role creation happens out-of-band, before this file runs:
--   CREATE ROLE schollective_app LOGIN PASSWORD '<from secret store>';
--   GRANT schollective_app TO neondb_owner WITH ADMIN OPTION;
-- Apply with:
--   psql "$DATABASE_URL" -f db/migrations/0004_rls_activate.sql
-- Rollback: point DATABASE_URL back at the neondb_owner connection string and
-- redeploy — BYPASSRLS makes every policy moot for that role.

-- ---------------------------------------------------------------------------
-- 1. Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.app_user_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')
$$;

-- Admins are identified by their own row in the auth user table, which the
-- connecting role can read (its owner; RLS not forced there).
CREATE OR REPLACE FUNCTION public.app_is_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM "user" u
    WHERE u.id = public.app_user_id() AND u.role = 'admin'
  )
$$;

-- Kept for the auth-stack policies; names the privileged infrastructure roles.
CREATE OR REPLACE FUNCTION public.app_is_server() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT current_user IN ('neondb_owner', 'neon_service', 'cloud_admin')
$$;

-- ---------------------------------------------------------------------------
-- 2. Privileges + ownership (idempotent)
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO schollective_app;
GRANT CREATE ON SCHEMA public TO schollective_app; -- schema bootstrap creates new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO schollective_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO schollective_app;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO schollective_app', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Better Auth tables — unchanged from 0003: owner full access, RLS not
--    forced, so the connecting role bypasses and the library works as-is.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS server_full_access ON "user";
CREATE POLICY server_full_access ON "user"
  USING (app_is_server()) WITH CHECK (app_is_server());

DROP POLICY IF EXISTS server_full_access ON session;
CREATE POLICY server_full_access ON session
  USING (app_is_server()) WITH CHECK (app_is_server());

DROP POLICY IF EXISTS server_full_access ON account;
CREATE POLICY server_full_access ON account
  USING (app_is_server()) WITH CHECK (app_is_server());

DROP POLICY IF EXISTS server_full_access ON verification;
CREATE POLICY server_full_access ON verification
  USING (app_is_server()) WITH CHECK (app_is_server());

DROP POLICY IF EXISTS server_full_access ON "rateLimit";
CREATE POLICY server_full_access ON "rateLimit"
  USING (app_is_server()) WITH CHECK (app_is_server());

-- ---------------------------------------------------------------------------
-- 4. profiles
--    id equals the auth user id. Directory and professor lookups are public
--    reads; writes are the owner's own row, the email-claim migration path
--    (a signed-in user adopting the pre-Neon profile row with their email),
--    or admins (suspension, role changes, application scoring).
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_insert ON profiles;
CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (id = app_user_id());

DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles
  FOR UPDATE
  USING (
    id = app_user_id()
    OR email = (SELECT u.email FROM "user" u WHERE u.id = app_user_id())
    OR app_is_admin()
  )
  WITH CHECK (
    id = app_user_id()
    OR email = (SELECT u.email FROM "user" u WHERE u.id = app_user_id())
    OR app_is_admin()
  );

DROP POLICY IF EXISTS profiles_delete ON profiles;
CREATE POLICY profiles_delete ON profiles
  FOR DELETE USING (app_is_admin());

-- ---------------------------------------------------------------------------
-- 5. requests — visible to the two participants and admins.
-- ---------------------------------------------------------------------------
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS requests_select ON requests;
CREATE POLICY requests_select ON requests
  FOR SELECT USING (
    student_id = app_user_id()
    OR professor_id = app_user_id()
    OR app_is_admin()
  );

DROP POLICY IF EXISTS requests_insert ON requests;
CREATE POLICY requests_insert ON requests
  FOR INSERT WITH CHECK (student_id = app_user_id());

DROP POLICY IF EXISTS requests_update ON requests;
CREATE POLICY requests_update ON requests
  FOR UPDATE
  USING (
    student_id = app_user_id()
    OR professor_id = app_user_id()
    OR app_is_admin()
  )
  WITH CHECK (
    student_id = app_user_id()
    OR professor_id = app_user_id()
    OR app_is_admin()
  );

DROP POLICY IF EXISTS requests_delete ON requests;
CREATE POLICY requests_delete ON requests
  FOR DELETE USING (
    student_id = app_user_id()
    OR professor_id = app_user_id()
    OR app_is_admin()
  );

-- ---------------------------------------------------------------------------
-- 6. messages — private to the thread's two participants; admins may insert
--    system warnings into any thread (sender_id is the admin's own id there,
--    so the participant subquery is bypassed only for the admin branch).
-- ---------------------------------------------------------------------------
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages
  FOR SELECT USING (
    app_is_admin()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = messages.request_id
        AND (r.student_id = app_user_id() OR r.professor_id = app_user_id())
    )
  );

DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (
    app_is_admin()
    OR (
      sender_id = app_user_id()
      AND EXISTS (
        SELECT 1 FROM requests r
        WHERE r.id = messages.request_id
          AND (r.student_id = app_user_id() OR r.professor_id = app_user_id())
      )
    )
  );

DROP POLICY IF EXISTS messages_update ON messages;
CREATE POLICY messages_update ON messages
  FOR UPDATE
  USING (
    app_is_admin()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = messages.request_id
        AND (r.student_id = app_user_id() OR r.professor_id = app_user_id())
    )
  )
  WITH CHECK (
    app_is_admin()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = messages.request_id
        AND (r.student_id = app_user_id() OR r.professor_id = app_user_id())
    )
  );

DROP POLICY IF EXISTS messages_delete ON messages;
CREATE POLICY messages_delete ON messages
  FOR DELETE USING (
    app_is_admin()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = messages.request_id
        AND (r.student_id = app_user_id() OR r.professor_id = app_user_id())
    )
  );

-- ---------------------------------------------------------------------------
-- 7. notifications — reads and updates strictly the recipient's; inserts are
--    any authenticated user because the app legitimately writes on behalf of
--    others (a professor accepting a request notifies the student; the admin
--    warning flow notifies users). App code chooses the recipient.
-- ---------------------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (user_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS notifications_insert ON notifications;
CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (app_user_id() IS NOT NULL OR app_is_admin());

DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_update ON notifications
  FOR UPDATE
  USING (user_id = app_user_id() OR app_is_admin())
  WITH CHECK (user_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS notifications_delete ON notifications;
CREATE POLICY notifications_delete ON notifications
  FOR DELETE USING (user_id = app_user_id() OR app_is_admin());

-- ---------------------------------------------------------------------------
-- 8. ai_profile_review_jobs — strictly the owning user's rows. The background
--    worker re-attaches the job owner's identity via runAs before it runs.
-- ---------------------------------------------------------------------------
ALTER TABLE ai_profile_review_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_profile_review_jobs FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobs_select ON ai_profile_review_jobs;
CREATE POLICY jobs_select ON ai_profile_review_jobs
  FOR SELECT USING (user_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS jobs_insert ON ai_profile_review_jobs;
CREATE POLICY jobs_insert ON ai_profile_review_jobs
  FOR INSERT WITH CHECK (user_id = app_user_id());

DROP POLICY IF EXISTS jobs_update ON ai_profile_review_jobs;
CREATE POLICY jobs_update ON ai_profile_review_jobs
  FOR UPDATE
  USING (user_id = app_user_id() OR app_is_admin())
  WITH CHECK (user_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS jobs_delete ON ai_profile_review_jobs;
CREATE POLICY jobs_delete ON ai_profile_review_jobs
  FOR DELETE USING (user_id = app_user_id() OR app_is_admin());

-- ---------------------------------------------------------------------------
-- 9. Drop 0003 policies whose names 0004 did not reuse (they are OR'd with
--    the ones above, so leaving them would weaken scoping).
--    NOTE for app code: INSERT..RETURNING also applies the SELECT policy to
--    the returned row — cross-user inserts (notifications) must not use
--    RETURNING. The app's notification insert does not.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS requests_participant_select ON requests;
DROP POLICY IF EXISTS messages_participant_select ON messages;
DROP POLICY IF EXISTS notifications_recipient_select ON notifications;
DROP POLICY IF EXISTS jobs_owner_select ON ai_profile_review_jobs;
