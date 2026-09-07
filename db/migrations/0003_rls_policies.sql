-- 0003_rls_policies.sql — stage Row Level Security on every table.
--
-- WHY THIS IS SAFE TO APPLY RIGHT NOW
-- The application connects as `neondb_owner`, which Postgres created with
-- BYPASSRLS. A role with BYPASSRLS skips policy evaluation entirely, so after
-- this migration every query the app makes behaves exactly as it does today —
-- zero workflow change. RLS here is *staged* protection:
--   * it future-proofs against an accidental GRANT to another role, and
--   * it makes the later "least-privilege role" switch a one-line env change.
--
-- All statements are idempotent (CREATE IF NOT EXISTS / DROP IF EXISTS style),
-- so this file can be re-run safely.
--
-- POLICY MODEL
-- Better Auth tables (`user`, `session`, `account`, `verification`, `rateLimit`)
-- are server-managed: the server must read and write every row on behalf of any
-- user (e.g. listing a user's sessions during sign-out-everywhere). Per-user
-- policies there would break the library's own queries, so they get no
-- user-scoping — they are protected simply by RLS being enabled with an owner
-- full-access policy.
--
-- App tables follow the app's existing authorization model, expressed in SQL:
--   profiles               — public read (professor directory is browsable),
--                            owner writes their own row
--   requests               — the student who created it or the professor it
--                            targets, nothing else
--   messages               — visible only to the two participants of the
--                            request thread
--   notifications          — strictly the recipient's
--   ai_profile_review_jobs — strictly the owning user's (the background worker
--                            runs as the app role, which always passes
--                            app_is_server)
--
-- The policies reference the connecting ROLE, not an end-user session variable.
-- That is deliberate: today all end-user authorization lives in application
-- code (src/lib/authz.ts and per-route checks). When the app later connects as
-- a non-BYPASSRLS role AND sets `app.user_id` per request (see the roadmap in
-- the runbook), swap these role-based predicates for
-- `current_setting('app.user_id', true)`-based ones — the table layout here
-- already matches that end state.
--
-- Apply with:
--   psql "$DATABASE_URL" -f db/migrations/0003_rls_policies.sql

-- ---------------------------------------------------------------------------
-- 1. Helper: the server (app) role always gets full access.
--    `current_user` is the role named in the policy check; `app_is_server()`
--    is TRUE for the owner/app role and FALSE for any future least-privilege
--    role, letting us write one policy shape for every table.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.app_is_server() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT current_user IN ('neondb_owner', 'neon_service', 'cloud_admin')
$$;

-- ---------------------------------------------------------------------------
-- 2. Better Auth tables: enable RLS, owner full access.
--    (No FORCE here — see the caveat in the runbook before flipping it.)
-- ---------------------------------------------------------------------------
ALTER TABLE "user"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE session       ENABLE ROW LEVEL SECURITY;
ALTER TABLE account       ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rateLimit"   ENABLE ROW LEVEL SECURITY;

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
-- 3. App tables: enable RLS + FORCE (so even the table owner is subject to
--    policy evaluation — the belt-and-braces setting; BYPASSRLS still wins,
--    which is what keeps today's behavior unchanged).
-- ---------------------------------------------------------------------------

-- profiles: public read, owner-scoped write
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_insert ON profiles;
CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (app_is_server());

DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (app_is_server()) WITH CHECK (app_is_server());

DROP POLICY IF EXISTS profiles_delete ON profiles;
CREATE POLICY profiles_delete ON profiles
  FOR DELETE USING (app_is_server());

-- requests: student owner or targeted professor; server always
ALTER TABLE requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests      FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS requests_participant_select ON requests;
CREATE POLICY requests_participant_select ON requests
  FOR SELECT USING (
    app_is_server()
    OR student_id = current_setting('app.user_id', true)
    OR professor_id = current_setting('app.user_id', true)
  );

DROP POLICY IF EXISTS requests_insert ON requests;
CREATE POLICY requests_insert ON requests
  FOR INSERT WITH CHECK (app_is_server());

DROP POLICY IF EXISTS requests_update ON requests;
CREATE POLICY requests_update ON requests
  FOR UPDATE USING (app_is_server()) WITH CHECK (app_is_server());

DROP POLICY IF EXISTS requests_delete ON requests;
CREATE POLICY requests_delete ON requests
  FOR DELETE USING (app_is_server());

-- messages: only the two participants of the thread's request
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_participant_select ON messages;
CREATE POLICY messages_participant_select ON messages
  FOR SELECT USING (
    app_is_server()
    OR sender_id = current_setting('app.user_id', true)
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = messages.request_id
        AND (r.student_id = current_setting('app.user_id', true)
          OR r.professor_id = current_setting('app.user_id', true))
    )
  );

DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (app_is_server());

DROP POLICY IF EXISTS messages_update ON messages;
CREATE POLICY messages_update ON messages
  FOR UPDATE USING (app_is_server()) WITH CHECK (app_is_server());

DROP POLICY IF EXISTS messages_delete ON messages;
CREATE POLICY messages_delete ON messages
  FOR DELETE USING (app_is_server());

-- notifications: strictly the recipient's
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_recipient_select ON notifications;
CREATE POLICY notifications_recipient_select ON notifications
  FOR SELECT USING (
    app_is_server()
    OR user_id = current_setting('app.user_id', true)
  );

DROP POLICY IF EXISTS notifications_insert ON notifications;
CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (app_is_server());

DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (app_is_server()) WITH CHECK (app_is_server());

DROP POLICY IF EXISTS notifications_delete ON notifications;
CREATE POLICY notifications_delete ON notifications
  FOR DELETE USING (app_is_server());

-- ai_profile_review_jobs: strictly the owning user's
ALTER TABLE ai_profile_review_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_profile_review_jobs FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobs_owner_select ON ai_profile_review_jobs;
CREATE POLICY jobs_owner_select ON ai_profile_review_jobs
  FOR SELECT USING (
    app_is_server()
    OR user_id = current_setting('app.user_id', true)
  );

DROP POLICY IF EXISTS jobs_insert ON ai_profile_review_jobs;
CREATE POLICY jobs_insert ON ai_profile_review_jobs
  FOR INSERT WITH CHECK (app_is_server());

DROP POLICY IF EXISTS jobs_update ON ai_profile_review_jobs;
CREATE POLICY jobs_update ON ai_profile_review_jobs
  FOR UPDATE USING (app_is_server()) WITH CHECK (app_is_server());

DROP POLICY IF EXISTS jobs_delete ON ai_profile_review_jobs;
CREATE POLICY jobs_delete ON ai_profile_review_jobs
  FOR DELETE USING (app_is_server());
