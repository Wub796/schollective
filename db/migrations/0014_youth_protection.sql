-- 0014_youth_protection.sql - a date of birth, a guardian's consent, and a
-- queue for safety reports that keeps its own copy of the evidence.
--
-- WHAT THIS ADDS
--   1. profiles.is_minor            the derived flag the message guard reads
--   2. youth_protection             the date of birth and the guardian consent,
--                                   readable only by its owner and by admins
--   3. safety_reports               one row per report, with a status flow
--   4. safety_report_evidence       a copy of the thread's messages, taken at
--                                   report time
--   5. RLS policies and FORCE on the three new tables
--
-- WHY THE DATE OF BIRTH IS NOT A COLUMN ON profiles
-- profiles is read with `SELECT *` in three places (src/lib/neon/profiles.ts)
-- and the resulting row is handed to client components as `profile`. A column
-- there is one careless query away from a browser, and a date of birth is the
-- one field on this platform that identifies a child. So it lives in
-- `youth_protection`, whose only readers are its owner and an admin, and what
-- the rest of the app sees is the boolean below. The same reasoning is why the
-- table is not exposed through app_student_cards or any other helper that
-- returns a fixed column list.
--
-- WHY A DERIVED BOOLEAN IS STORED AT ALL
-- The message guard needs to know whether a thread involves a minor, and it asks
-- that question AS THE PROFESSOR (the send action runs under the caller's own
-- database identity). A professor cannot read a student's `youth_protection`
-- row, and should not be able to: learning a student's birth date to avoid
-- saying the wrong thing in a message would be worse than the problem. So the
-- narrow answer - is there a minor here - is copied onto profiles, where every
-- participant can already read the education level it is derived from.
--
-- `is_minor` is therefore a cache, written by the app from the date of birth
-- when there is one and from the education level when there is not
-- (resolveMinorFlag in src/lib/youth-protection.ts, applied by
-- syncMinorFlag in src/lib/neon/youth-protection.ts). Two consequences worth
-- knowing:
--   * It is right on a birthday only once something writes it. A student who
--     ages out and never edits their profile stays flagged until they do, which
--     is the safe direction: over-protected, never under-protected.
--   * It must never be taken from a request body. It is derived, and a client
--     able to set it could switch off the rules protecting it. The write path
--     does not accept it (the column is absent from SanitisedProfileInput and
--     from the columns upsertProfile binds).
--
-- WHY A REPORT COPIES THE MESSAGES
-- Deleting an account cascades: profiles -> requests -> messages, and the other
-- participant's copy of the conversation goes with it (migration 0010 says so
-- in as many words). A report that only pointed at a thread would therefore be
-- erasable by the person it is about, by deleting their account. So a report
-- made from a thread copies that thread's messages into
-- `safety_report_evidence`, which references nothing that can cascade, and the
-- report outlives every account it mentions.
--
-- The limitation, stated plainly: RLS can check WHO writes evidence, not that
-- the content matches the thread. The app writes it from the thread's own rows
-- (src/lib/neon/youth-protection.ts) and the author of a report can insert rows
-- only against their own report, but an operator with SQL access should treat
-- this table as the platform's copy rather than as a tamper-evident record.
--
-- WHAT THIS DOES NOT DO
-- It does not stop a mentor's account being deleted while a report about them is
-- open. It makes that survivable rather than silent, which is the part that was
-- missing; refusing the deletion is a product decision, not a schema one.
--
-- Apply as a role that owns the tables (neondb_owner), not as schollective_app:
--   psql "$DATABASE_URL" -f db/migrations/0014_youth_protection.sql
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- 0. Refuse to run in a database this file does not fit. Same shape as 0013:
--    the policies below are written in terms of app_user_id() and
--    app_is_admin(), and without them the CREATE POLICY statements fail one at
--    a time with an error that names the function and not the migration.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION
      'run this migration as a BYPASSRLS role (neondb_owner), not as %. '
      'The tables must be handed to the app role by their owner.',
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
-- 1. The derived flag.
--    NOT NULL DEFAULT false, unlike the nullable columns this schema usually
--    adds: "not a minor" is the right reading of a row written before this
--    column existed, because the education-level fallback still protects those
--    accounts and the flag only ever narrows the answer.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_minor boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_minor IS
  'Derived, never client-set: true when the account has a recorded date of '
  'birth under 18, or no date of birth and a high-school education level. '
  'Written by the app (src/lib/neon/youth-protection.ts, syncMinorFlag) and '
  'read by the message guard. Safe to show a thread participant; it carries no '
  'more than the education level it is usually derived from.';

-- ---------------------------------------------------------------------------
-- 2. The date of birth and the guardian consent.
--    One row per student who has answered. Absent means "never asked or never
--    answered", which is why there is no row for an adult who has given nothing:
--    inserting a default row would record an answer nobody gave.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.youth_protection (
  profile_id          text PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  date_of_birth       date NOT NULL,
  guardian_name       text,
  guardian_email      text,
  guardian_consent_at timestamptz,
  consent_version     text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  -- The app validates the date; this repeats the two bounds that matter so a
  -- row written by psql cannot be a date that makes somebody two years old or
  -- a hundred and twenty-six. Kept in step with EARLIEST_BIRTH_YEAR and the
  -- "not in the future" rule in src/lib/youth-protection.ts.
  CONSTRAINT youth_protection_dob_check CHECK (
    date_of_birth > DATE '1900-01-01' AND date_of_birth <= CURRENT_DATE
  ),
  -- Consent is all three fields or none of them: a version with no timestamp
  -- cannot be told apart from a guess, and a timestamp with no version cannot
  -- be re-asked when the wording changes.
  CONSTRAINT youth_protection_consent_check CHECK (
    (guardian_consent_at IS NULL AND consent_version IS NULL)
    OR (guardian_consent_at IS NOT NULL AND consent_version IS NOT NULL)
  )
);

COMMENT ON TABLE public.youth_protection IS
  'A student''s date of birth and their parent or guardian''s consent. Readable '
  'by the account it belongs to and by admins, and by nobody else - not by a '
  'professor, not by a classmate, not through any search or card helper.';

COMMENT ON COLUMN public.youth_protection.date_of_birth IS
  'Never rendered anywhere in the product. The only thing derived from it that '
  'anyone else sees is profiles.is_minor.';

COMMENT ON COLUMN public.youth_protection.consent_version IS
  'A value of GUARDIAN_CONSENT_VERSION in src/lib/youth-protection.ts. A bump '
  'there is what makes "ask everyone who agreed to the old wording again" a '
  'question the database can answer.';

ALTER TABLE public.youth_protection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youth_protection FORCE  ROW LEVEL SECURITY;

-- The owner reads and writes their own row. No INSERT-with-check on someone
-- else's id, so one account cannot attach a date of birth to another.
DROP POLICY IF EXISTS youth_protection_select_own ON public.youth_protection;
CREATE POLICY youth_protection_select_own ON public.youth_protection
  FOR SELECT USING (profile_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS youth_protection_insert_own ON public.youth_protection;
CREATE POLICY youth_protection_insert_own ON public.youth_protection
  FOR INSERT WITH CHECK (profile_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS youth_protection_update_own ON public.youth_protection;
CREATE POLICY youth_protection_update_own ON public.youth_protection
  FOR UPDATE USING (profile_id = app_user_id() OR app_is_admin())
  WITH CHECK (profile_id = app_user_id() OR app_is_admin());

-- Deleting a profile cascades this row, so a separate DELETE policy would only
-- ever let someone clear their own date of birth and keep the account. That is
-- a thing a person should be able to ask for, but it is not a thing they should
-- be able to do silently while the rules still depend on it, so it is left to
-- an admin and to account deletion.
DROP POLICY IF EXISTS youth_protection_admin_delete ON public.youth_protection;
CREATE POLICY youth_protection_admin_delete ON public.youth_protection
  FOR DELETE USING (app_is_admin());

-- ---------------------------------------------------------------------------
-- 3. Safety reports.
--    Two foreign keys, both ON DELETE SET NULL, and that is the point of the
--    file. The report is about the other person, so it must not disappear with
--    them; and the reporter's own deletion should not destroy a record of abuse
--    either, which is the choice a student being pressured is most likely to be
--    made to take. Both columns go NULL rather than cascading. When they do, the
--    report's own message and its evidence are the record; the name survives in
--    safety_report_evidence.sender_label, and nothing in the queue tries to
--    open an account that is no longer there.
--
--    `request_id` has no foreign key at all, for the same reason: the thread may
--    be gone by the time anyone reads the report.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.safety_reports (
  id                  text PRIMARY KEY,
  reporter_id         text REFERENCES public.profiles (id) ON DELETE SET NULL,
  reporter_role       text,
  reported_profile_id text REFERENCES public.profiles (id) ON DELETE SET NULL,
  request_id          uuid,
  category            text NOT NULL,
  message             text NOT NULL,
  minor_involved      boolean NOT NULL DEFAULT false,
  snapshot_summary    text,
  status              text NOT NULL DEFAULT 'new',
  admin_note          text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT safety_reports_category_check CHECK (category IN (
    'off-platform', 'boundaries', 'sexual-content',
    'threats', 'impersonation', 'self-harm', 'other'
  )),
  CONSTRAINT safety_reports_status_check CHECK (status IN ('new', 'reviewing', 'closed')),
  -- Bounds repeated from src/lib/youth-protection.ts, where the write path
  -- enforces them, so a row cannot be created by a query that bypassed the app
  -- with an empty or runaway body. tests/youth-protection.test.mjs compares
  -- these lists to the exported arrays.
  CONSTRAINT safety_reports_message_check CHECK (
    char_length(message) BETWEEN 10 AND 4000
  )
);

COMMENT ON TABLE public.safety_reports IS
  'A safety concern raised by a signed-in account, about a person, a thread, or '
  'both. Readable by its reporter and by admins. Unlike feedback_reports, the '
  'row is NOT deleted when its reporter deletes their account: reporter_id goes '
  'NULL and the record stays.';

COMMENT ON COLUMN public.safety_reports.minor_involved IS
  'Copied from profiles.is_minor for the students on the thread at report time, '
  'so the queue does not have to reconstruct who was a minor then.';

COMMENT ON COLUMN public.safety_reports.request_id IS
  'The thread the report was made from, when there was one. No foreign key: the '
  'thread may be deleted before the report is read, and the evidence table is '
  'the copy that survives.';

ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_reports FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS safety_reports_select_own ON public.safety_reports;
CREATE POLICY safety_reports_select_own ON public.safety_reports
  FOR SELECT USING (reporter_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS safety_reports_insert_own ON public.safety_reports;
CREATE POLICY safety_reports_insert_own ON public.safety_reports
  FOR INSERT WITH CHECK (reporter_id = app_user_id() OR app_is_admin());

-- No UPDATE and no DELETE for the reporter, matching feedback_reports: the
-- record of what was reported is not the reporter's to rewrite, and the status
-- column would mean nothing if it were.
DROP POLICY IF EXISTS safety_reports_admin_update ON public.safety_reports;
CREATE POLICY safety_reports_admin_update ON public.safety_reports
  FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());

DROP POLICY IF EXISTS safety_reports_admin_delete ON public.safety_reports;
CREATE POLICY safety_reports_admin_delete ON public.safety_reports
  FOR DELETE USING (app_is_admin());

-- ---------------------------------------------------------------------------
-- 4. The evidence copy.
--    `sender_id` is text with NO foreign key on purpose. The whole reason this
--    table exists is to survive the deletion of the accounts it names, and a
--    foreign key would either cascade the evidence away or block the deletion.
--    `sender_label` carries the name as it read at the time, for the same
--    reason: after a deletion there is no profile row left to join to.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.safety_report_evidence (
  id          text PRIMARY KEY,
  report_id   text NOT NULL REFERENCES public.safety_reports (id) ON DELETE CASCADE,
  sender_id   text,
  sender_label text,
  sender_role text,
  content     text NOT NULL,
  sent_at     timestamptz NOT NULL,
  copied_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.safety_report_evidence IS
  'A copy of a thread''s messages, taken when a safety report was made from it. '
  'References nothing that can cascade, so the words survive the deletion of '
  'every account in the conversation.';

ALTER TABLE public.safety_report_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_report_evidence FORCE  ROW LEVEL SECURITY;

-- Readable exactly when the report it belongs to is readable. Written as an
-- EXISTS against safety_reports rather than a duplicated reporter column, so
-- the two can never disagree about who may read a report.
DROP POLICY IF EXISTS safety_report_evidence_select ON public.safety_report_evidence;
CREATE POLICY safety_report_evidence_select ON public.safety_report_evidence
  FOR SELECT USING (
    app_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.safety_reports r
       WHERE r.id = report_id AND r.reporter_id = app_user_id()
    )
  );

DROP POLICY IF EXISTS safety_report_evidence_insert ON public.safety_report_evidence;
CREATE POLICY safety_report_evidence_insert ON public.safety_report_evidence
  FOR INSERT WITH CHECK (
    app_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.safety_reports r
       WHERE r.id = report_id AND r.reporter_id = app_user_id()
    )
  );

DROP POLICY IF EXISTS safety_report_evidence_admin_delete ON public.safety_report_evidence;
CREATE POLICY safety_report_evidence_admin_delete ON public.safety_report_evidence
  FOR DELETE USING (app_is_admin());

-- ---------------------------------------------------------------------------
-- 5. Hand the tables to the app role, with explicit grants. 0006's default
--    privileges cover a table this owner creates, but a database that ran 0004
--    and 0006 before this file existed is exactly the case they do not
--    retroactively fix.
-- ---------------------------------------------------------------------------
ALTER TABLE public.youth_protection        OWNER TO schollective_app;
ALTER TABLE public.safety_reports          OWNER TO schollective_app;
ALTER TABLE public.safety_report_evidence  OWNER TO schollective_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.youth_protection       TO schollective_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_reports         TO schollective_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_report_evidence TO schollective_app;

-- The queue is read newest-first with urgent categories first, and
-- "everything still open" is the default view, so the status index carries the
-- ordering the page actually asks for.
CREATE INDEX IF NOT EXISTS "safety_reports_status_created_idx"
  ON public.safety_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS "safety_reports_category_created_idx"
  ON public.safety_reports (category, created_at DESC);
CREATE INDEX IF NOT EXISTS "safety_report_evidence_report_idx"
  ON public.safety_report_evidence (report_id, sent_at);
-- Finding the reports about one account is the first thing an admin does with
-- a report in hand, and the column is nullable now that SET NULL is the rule.
CREATE INDEX IF NOT EXISTS "safety_reports_reported_idx"
  ON public.safety_reports (reported_profile_id)
  WHERE reported_profile_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6. Backfill the derived flag from the signal that already exists.
--    An account with a high-school education level is a minor until a date of
--    birth says otherwise, which is exactly what resolveMinorFlag decides in the
--    app. Without this, every existing high-school student would be unflagged
--    until they next touched their profile, and the message guard would fall
--    back to the education level it is trying to stop depending on.
-- ---------------------------------------------------------------------------
UPDATE public.profiles
   SET is_minor = true
 WHERE is_minor = false
   AND role = 'student'
   AND education_level LIKE 'high-school%';

-- ---------------------------------------------------------------------------
-- 7. Verify, and fail loudly rather than leaving the guard reading a column
--    nobody can write, or a table everyone can read.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  column_ok      int;
  rls_missing    text;
  policies       int;
  minors         int;
  dob_rows       int;
BEGIN
  SELECT count(*) INTO column_ok
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'profiles'
     AND column_name = 'is_minor' AND data_type = 'boolean';

  SELECT string_agg(format('%s (rls=%s, forced=%s)', c.relname, c.relrowsecurity, c.relforcerowsecurity), ', ')
    INTO rls_missing
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname IN ('youth_protection', 'safety_reports', 'safety_report_evidence')
     AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity);

  SELECT count(*) INTO policies
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('youth_protection', 'safety_reports', 'safety_report_evidence')
     AND cmd IN ('SELECT', 'ALL');

  SELECT count(*) INTO minors   FROM public.profiles WHERE is_minor;
  SELECT count(*) INTO dob_rows FROM public.youth_protection;

  RAISE NOTICE 'profiles.is_minor columns present: % of 1', column_ok;
  RAISE NOTICE 'profiles currently flagged as minors: %', minors;
  RAISE NOTICE 'dates of birth on file: %', dob_rows;

  IF column_ok <> 1 THEN
    RAISE EXCEPTION 'profiles.is_minor is missing: the message guard cannot tell a minor thread from any other';
  END IF;
  IF rls_missing IS NOT NULL THEN
    RAISE EXCEPTION 'RLS is not enabled and FORCEd on: %', rls_missing;
  END IF;
  IF policies < 3 THEN
    RAISE EXCEPTION 'only % SELECT policies exist across the three tables: something is unreadable or wide open', policies;
  END IF;
END $$;
