-- 0013_feedback_reports.sql - the beta feedback queue: bugs, suggestions and
-- anything else a student or professor wants to tell the team.
--
-- WHAT THIS ADDS
--   1. feedback_reports   one row per report, written by its author
--   2. RLS policies       the author reads their own rows; admins read all
--
-- WHY A TABLE RATHER THAN AN EMAIL
-- Sending feedback straight to an inbox is one API call and no schema, and it
-- was the first option. It fails in two ways that matter here: delivery is
-- best-effort, so a report can be accepted from the user and vanish, and there
-- is no record the reporter can be shown afterwards ("did that send?"). A row
-- is the record: the reporter can see the report was received and where it
-- stands, and the admin queue reads the same row. Resend is still used, but only
-- to *notify* - the row is the artifact, and losing the email loses nothing.
--
-- WHO CAN SEE A REPORT
-- Only its author, and admins. A report is free text about a person's
-- experience of the product and may name a classmate or describe what they
-- typed, so it is not readable by anyone else -- there is no "public" branch
-- here, unlike profiles. The policy follows the same shape as the rest of the
-- schema: keyed on the `app.user_id` setting the sql wrapper attaches per query
-- (see src/lib/neon/db.ts and migration 0004).
--
-- WHY THE ROW GOES WITH THE ACCOUNT
-- user_id references profiles (id) ON DELETE CASCADE, so deleting an account
-- deletes its reports. That is the promise the delete button makes, and a queue
-- that keeps producing names of people whose accounts are gone would break it.
--
-- Apply as a role that owns the tables (neondb_owner), not as schollective_app:
--   psql "$DATABASE_URL" -f db/migrations/0013_feedback_reports.sql
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- 0. Refuse to run in a database this file does not fit, and refuse to run as a
--    role RLS applies to. The policies below call app_user_id() and
--    app_is_admin(), which migrations 0004 and 0006 create; without them the
--    CREATE POLICY statements fail one by one with an error that names the
--    function but not the migration that provides it.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION
      'run this migration as a BYPASSRLS role (neondb_owner), not as %. '
      'The table must be handed to the app role by its owner.',
      current_user
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF to_regprocedure('public.app_user_id()') IS NULL
     OR to_regprocedure('public.app_is_admin()') IS NULL THEN
    RAISE EXCEPTION
      'app_user_id() and app_is_admin() are missing: apply 0004 and 0006 first. '
      'The policies below are written in terms of them.'
      USING ERRCODE = 'undefined_function';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'schollective_app') THEN
    RAISE EXCEPTION
      'role schollective_app does not exist: this database is not the RLS '
      'schema these policies belong to (see migration 0004).'
      USING ERRCODE = 'undefined_object';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. The table.
--    `page_path` is where the report was written, not what happened; it is the
--    single most useful field in a bug report and the hardest thing to
--    reconstruct afterwards, so it is stored rather than inferred from logs.
--    `role` is copied at write time because the queue wants to know whether it
--    is reading a student's or a professor's report, and a role can change.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_reports (
  id          text PRIMARY KEY,
  user_id     text NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role        text,
  category    text NOT NULL,
  subject     text,
  message     text NOT NULL,
  page_path   text,
  user_agent  text,
  status      text NOT NULL DEFAULT 'new',
  admin_note  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_reports_category_check CHECK (category IN ('bug', 'idea', 'other')),
  CONSTRAINT feedback_reports_status_check   CHECK (status   IN ('new', 'reviewed', 'closed')),
  -- The write path enforces both bounds; this repeats them so a row cannot be
  -- created by a query that bypassed the app (psql, a script) with an empty or
  -- runaway body. Kept in step with FEEDBACK_MESSAGE_MIN/MAX in
  -- src/lib/feedback.ts by tests/feedback.test.mjs.
  CONSTRAINT feedback_reports_message_check  CHECK (char_length(message) BETWEEN 10 AND 2000)
);

COMMENT ON TABLE public.feedback_reports IS
  'Beta feedback written by its author: a bug, a suggestion or anything else. '
  'Readable by that author and by admins only (see the policies below).';
COMMENT ON COLUMN public.feedback_reports.category IS
  'A slug from FEEDBACK_CATEGORIES in src/lib/feedback.ts.';
COMMENT ON COLUMN public.feedback_reports.status IS
  'A slug from FEEDBACK_STATUSES in src/lib/feedback.ts. `new` means nobody has '
  'looked at it yet; the reporter sees reviewed/closed as "read" and "closed".';
COMMENT ON COLUMN public.feedback_reports.page_path IS
  'The in-app path the report was written from, or NULL when the client did not '
  'send one. Never an absolute URL: only a site-relative path is stored.';

-- ---------------------------------------------------------------------------
-- 2. RLS: enabled, forced (so the least-privilege owner is subject to its own
--    policies like anyone else), and scoped to the author plus admins.
-- ---------------------------------------------------------------------------
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_reports FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_reports_select_own ON public.feedback_reports;
CREATE POLICY feedback_reports_select_own ON public.feedback_reports
  FOR SELECT USING (user_id = app_user_id() OR app_is_admin());

-- The author is the only non-admin writer, and only into their own name. There
-- is no UPDATE or DELETE for authors: a report is a record of what someone
-- asked for at a point in time, and rewriting it afterwards would make the
-- status column mean nothing.
DROP POLICY IF EXISTS feedback_reports_insert_own ON public.feedback_reports;
CREATE POLICY feedback_reports_insert_own ON public.feedback_reports
  FOR INSERT WITH CHECK (user_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS feedback_reports_admin_update ON public.feedback_reports;
CREATE POLICY feedback_reports_admin_update ON public.feedback_reports
  FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());

DROP POLICY IF EXISTS feedback_reports_admin_delete ON public.feedback_reports;
CREATE POLICY feedback_reports_admin_delete ON public.feedback_reports
  FOR DELETE USING (app_is_admin());

-- ---------------------------------------------------------------------------
-- 3. Hand it to the app role, with explicit grants. 0006's default privileges
--    already cover a table created by the owner, but a database that ran 0004
--    and 0006 before this file existed is exactly the case that default
--    privileges do not retroactively fix.
-- ---------------------------------------------------------------------------
ALTER TABLE public.feedback_reports OWNER TO schollective_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_reports TO schollective_app;

CREATE INDEX IF NOT EXISTS "feedback_reports_user_created_at_idx"
  ON public.feedback_reports (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS "feedback_reports_status_created_at_idx"
  ON public.feedback_reports (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. Verify, and fail loudly rather than leaving a queue nobody can read or
--    one everybody can.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rls_on        boolean;
  rls_forced    boolean;
  select_policy int;
  reporters     int;
BEGIN
  SELECT relrowsecurity, relforcerowsecurity
    INTO rls_on, rls_forced
    FROM pg_class
   WHERE oid = 'public.feedback_reports'::regclass;

  SELECT count(*) INTO select_policy
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename  = 'feedback_reports'
     AND cmd IN ('SELECT', 'ALL');

  SELECT count(*) INTO reporters FROM public.feedback_reports;

  RAISE NOTICE 'feedback_reports rows: %', reporters;

  IF NOT rls_on THEN
    RAISE EXCEPTION 'RLS is not enabled on feedback_reports: every report would be readable by every caller';
  END IF;
  IF NOT rls_forced THEN
    RAISE EXCEPTION 'RLS is not FORCEd on feedback_reports: the app role owns the table and would bypass its own policies';
  END IF;
  IF select_policy = 0 THEN
    RAISE EXCEPTION 'feedback_reports has no SELECT policy: nobody could read their own report back';
  END IF;
END $$;
