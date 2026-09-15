-- 0008_friends_and_group_mentorship.sql - student friendships, and group
-- mentorship threads in which several students work with one professor.
--
-- WHAT THIS ADDS
--   friendships      a request/accept edge between two students
--   user_blocks      one-directional blocks: no friend requests, no invites
--   request_members  co-students on a mentorship request
--   thread_reads     each participant's read position in a thread
--
-- A request's `student_id` keeps its meaning and becomes the thread's LEAD: the
-- student who wrote the request, manages who is on it, and may close it. Every
-- other student on the thread has a `request_members` row. A one-to-one thread
-- is simply a request with no members, so nothing that exists changes shape.
--
-- WHY UNREAD STATE MOVES OFF messages.read_at
-- `read_at` is one column per message, so it can only ever mean "the other party
-- has read this". With three participants that is wrong in a way people notice:
-- the first collaborator to open the thread clears the badge for everyone else.
-- `thread_reads` keeps a read position per user instead. Existing read state is
-- backfilled from `read_at` in section 5, so no badge moves at deploy time. The
-- column stays for history and is no longer written.
--
-- WHY THE MEMBERSHIP HELPERS ARE SECURITY DEFINER
-- Requests are now visible to their members, and memberships to the request's
-- participants. Written as plain subqueries those two policies read each other,
-- which Postgres rejects as infinite recursion. The lookups therefore live in
-- SECURITY DEFINER functions owned by the BYPASSRLS role applying this file, so
-- the reads inside them are not policy-checked a second time. Each helper
-- answers only about `app_user_id()` - never about an arbitrary pair of users -
-- so none of them can be used to probe someone else's relationships.
--
-- DISCOVERY IS A FUNCTION, NOT A WIDER POLICY
-- Adding a friend means finding a student you are not yet connected to. A
-- `profiles_select` branch for that would make every student row readable, and a
-- profile row carries GPA, class rank and test scores: policies scope rows, not
-- columns. `app_search_students` returns a fixed set of safe columns instead, and
-- `profiles_select` widens only to people you are actually connected to.
--
-- Apply as a role that owns the tables (neondb_owner), not as schollective_app,
-- BEFORE deploying the application code that reads these tables:
--   psql "$DATABASE_URL" -f db/migrations/0008_friends_and_group_mentorship.sql
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- 0. Refuse to run as a role that is subject to RLS.
--
--    The helpers below are SECURITY DEFINER and rely on their owner bypassing
--    RLS. Created by schollective_app they would be policy-checked from inside
--    a policy - the recursion they exist to avoid - and the backfill in section 5
--    would read zero messages and report success.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION
      'run this migration as a BYPASSRLS role (neondb_owner), not as %. '
      'The membership helpers must be owned by a role that bypasses RLS.', current_user
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Tables
--    Status vocabularies mirror src/lib/status.ts; tests/social-schema.test.mjs
--    fails if the CHECK lists and the TypeScript lists drift apart.
-- ---------------------------------------------------------------------------

-- A declined, cancelled or removed friendship is deleted rather than kept in a
-- terminal state: nobody learns they were turned down, and the pair can connect
-- again later without an old row in the way.
CREATE TABLE IF NOT EXISTS friendships (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id text        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id text        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       text        NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT friendships_not_self CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_status_check CHECK (status IN ('pending', 'accepted'))
);

-- One edge per pair, whichever direction it was requested in. Without this, two
-- students adding each other at the same moment would become friends twice.
CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_uidx
  ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));
CREATE INDEX IF NOT EXISTS friendships_addressee_status_idx ON friendships (addressee_id, status);
CREATE INDEX IF NOT EXISTS friendships_requester_status_idx ON friendships (requester_id, status);

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id text        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id text        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT user_blocks_not_self CHECK (blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON user_blocks (blocked_id);

-- Rows are kept after a member declines, leaves or is removed: the history of who
-- was on a thread is what lets their earlier messages keep a name, and it is
-- what the lead's re-invite updates.
CREATE TABLE IF NOT EXISTS request_members (
  request_id   uuid        NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  student_id   text        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       text        NOT NULL DEFAULT 'invited',
  invited_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  PRIMARY KEY (request_id, student_id),
  CONSTRAINT request_members_status_check
    CHECK (status IN ('invited', 'joined', 'declined', 'left', 'removed'))
);
CREATE INDEX IF NOT EXISTS request_members_student_status_idx ON request_members (student_id, status);

CREATE TABLE IF NOT EXISTS thread_reads (
  request_id   uuid        NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  user_id      text        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 2. Helpers
--    All answer about the caller (`app_user_id()`) only. None includes admins:
--    policies add `app_is_admin()` explicitly, and application code uses these
--    to mean "is a participant", which an admin is not.
-- ---------------------------------------------------------------------------

-- The caller's membership status on a request, or NULL when they have none.
CREATE OR REPLACE FUNCTION public.app_member_status(target_request uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT m.status
  FROM request_members m
  WHERE m.request_id = target_request
    AND m.student_id = public.app_user_id()
$$;

-- True when the caller may read and post in a thread: its lead, its professor,
-- or a member who has joined.
CREATE OR REPLACE FUNCTION public.app_is_thread_participant(target_request uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM requests r
    WHERE r.id = target_request
      AND (
        r.student_id = public.app_user_id()
        OR r.professor_id = public.app_user_id()
        OR EXISTS (
          SELECT 1 FROM request_members m
          WHERE m.request_id = r.id
            AND m.student_id = public.app_user_id()
            AND m.status = 'joined'
        )
      )
  )
$$;

-- True when the caller may see that a request exists: its participants, plus a
-- student who has been invited and needs to see what they are being invited to.
-- An invitee sees the request row, never its messages.
CREATE OR REPLACE FUNCTION public.app_can_view_request(target_request uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.app_is_thread_participant(target_request)
      OR COALESCE(public.app_member_status(target_request) = 'invited', false)
$$;

-- True when either user has blocked the other. It answers only for a pair that
-- includes the caller, and is false for everyone else, so a student cannot use
-- it to learn who has blocked whom.
CREATE OR REPLACE FUNCTION public.app_blocked_between(first_user text, second_user text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(public.app_user_id() IN (first_user, second_user), false)
     AND EXISTS (
       SELECT 1 FROM user_blocks b
       WHERE (b.blocker_id = first_user  AND b.blocked_id = second_user)
          OR (b.blocker_id = second_user AND b.blocked_id = first_user)
     )
$$;

-- True when the caller is connected to `target` closely enough to see their
-- profile row: an accepted friendship, a friend request the target sent the
-- caller, or a request they are both on. This subsumes 0006's "other party on a
-- thread" branch.
CREATE OR REPLACE FUNCTION public.app_is_connected_to(target text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
      SELECT 1 FROM friendships f
      WHERE (
          f.status = 'accepted'
          AND ((f.requester_id = public.app_user_id() AND f.addressee_id = target)
            OR (f.addressee_id = public.app_user_id() AND f.requester_id = target))
        )
        -- Someone who sends you a request has chosen to show you who they are.
        -- The reverse must not hold: sending a request is one-sided, and it
        -- cannot be what unlocks the full profile row of the person it went to.
        OR (f.status = 'pending' AND f.addressee_id = public.app_user_id() AND f.requester_id = target)
    )
    OR EXISTS (
      SELECT 1
      FROM requests r
      -- A request the caller is currently on...
      WHERE (
          r.student_id = public.app_user_id()
          OR r.professor_id = public.app_user_id()
          OR EXISTS (
            SELECT 1 FROM request_members mine
            WHERE mine.request_id = r.id
              AND mine.student_id = public.app_user_id()
              AND mine.status IN ('invited', 'joined')
          )
        )
        -- ...that the target is on in any role. Past members stay included so the
        -- messages they wrote before leaving still carry a name.
        AND (
          r.student_id = target
          OR r.professor_id = target
          OR EXISTS (
            SELECT 1 FROM request_members theirs
            WHERE theirs.request_id = r.id AND theirs.student_id = target
          )
        )
    )
$$;

-- True when `target` is a student the caller may find and send a friend request
-- to. Both must be active students; the target must have finished onboarding and
-- have a real auth account (legacy profile rows and test fixtures cannot answer
-- a request); and neither may have blocked the other.
CREATE OR REPLACE FUNCTION public.app_is_discoverable_student(target text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles me
    JOIN profiles p ON p.id = target
    WHERE me.id = public.app_user_id()
      AND me.role = 'student' AND me.status = 'active'
      AND p.id <> me.id
      AND p.role = 'student' AND p.status = 'active'
      AND p.profile_complete IS TRUE
      AND EXISTS (SELECT 1 FROM "user" u WHERE u.id = p.id)
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks b
        WHERE (b.blocker_id = me.id AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id  AND b.blocked_id = me.id)
      )
  )
$$;

-- Student discovery. With a search term of two or more characters, matches on
-- name or institution; with an empty term, suggests classmates at the caller's
-- own institution they are not already connected to. Returns only columns that
-- are fine for any student to see - never grades, scores or contact details.
CREATE OR REPLACE FUNCTION public.app_search_students(search text, max_results integer DEFAULT 20)
RETURNS TABLE (
  id              text,
  first_name      text,
  last_name       text,
  preferred_name  text,
  institution     text,
  education_level text,
  major           text,
  graduation_year text,
  avatar_url      text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH me AS (
    SELECT p.id, p.institution
    FROM profiles p
    WHERE p.id = public.app_user_id() AND p.role = 'student' AND p.status = 'active'
  ),
  term AS (
    SELECT
      length(btrim(COALESCE(search, ''))) AS len,
      -- Escape LIKE wildcards so a search for "100%" is not a match-everything.
      '%' || replace(replace(replace(lower(btrim(COALESCE(search, ''))),
        '\', '\\'), '%', '\%'), '_', '\_') || '%' AS pattern
  )
  SELECT p.id, p.first_name, p.last_name, p.preferred_name, p.institution,
         p.education_level, p.major, p.graduation_year, p.avatar_url
  FROM profiles p
  CROSS JOIN me
  CROSS JOIN term
  WHERE p.role = 'student'
    AND public.app_is_discoverable_student(p.id)
    AND (
      (
        term.len >= 2
        AND (
          lower(concat_ws(' ', p.first_name, p.last_name)) LIKE term.pattern
          OR lower(concat_ws(' ', p.preferred_name, p.last_name)) LIKE term.pattern
          OR lower(COALESCE(p.institution, '')) LIKE term.pattern
        )
      )
      OR (
        term.len = 0
        AND me.institution IS NOT NULL
        AND p.institution = me.institution
        AND NOT EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.requester_id = me.id AND f.addressee_id = p.id)
             OR (f.addressee_id = me.id AND f.requester_id = p.id)
        )
      )
    )
  ORDER BY (p.institution IS NOT DISTINCT FROM me.institution) DESC,
           lower(COALESCE(p.last_name, '')),
           lower(COALESCE(p.first_name, ''))
  LIMIT LEAST(GREATEST(COALESCE(max_results, 20), 1), 50)
$$;

REVOKE EXECUTE ON FUNCTION public.app_search_students(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_search_students(text, integer) TO schollective_app;

-- Safe cards (the same columns as search) for specific students the caller has
-- a reason to name: anyone they could discover, an active student on either end
-- of a friendship with them - an outgoing request included - and anyone they
-- have blocked. The friends page needs names for who a request went to and who
-- to unblock; neither may widen profiles_select to those rows.
CREATE OR REPLACE FUNCTION public.app_student_cards(student_ids text[])
RETURNS TABLE (
  id              text,
  first_name      text,
  last_name       text,
  preferred_name  text,
  institution     text,
  education_level text,
  major           text,
  graduation_year text,
  avatar_url      text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id, p.first_name, p.last_name, p.preferred_name, p.institution,
         p.education_level, p.major, p.graduation_year, p.avatar_url
  FROM profiles p
  WHERE p.id = ANY(student_ids)
    AND p.role = 'student'
    AND public.app_user_id() IS NOT NULL
    AND (
      public.app_is_discoverable_student(p.id)
      OR (
        p.status = 'active'
        AND EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.requester_id = public.app_user_id() AND f.addressee_id = p.id)
             OR (f.addressee_id = public.app_user_id() AND f.requester_id = p.id)
        )
      )
      OR EXISTS (
        SELECT 1 FROM user_blocks b
        WHERE b.blocker_id = public.app_user_id() AND b.blocked_id = p.id
      )
    )
$$;

REVOKE EXECUTE ON FUNCTION public.app_student_cards(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_student_cards(text[]) TO schollective_app;

-- ---------------------------------------------------------------------------
-- 3. Triggers
-- ---------------------------------------------------------------------------

-- A message moves its thread to the top of everyone's list. The app used to do
-- this with its own UPDATE, which a joined member is not permitted to run (only
-- the lead and professor may update a request), so their messages would never
-- have reordered anything.
CREATE OR REPLACE FUNCTION public.touch_request_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE requests SET updated_at = now() WHERE id = NEW.request_id;
  RETURN NULL; -- AFTER trigger; return value is ignored
END;
$$;

REVOKE EXECUTE ON FUNCTION public.touch_request_on_message() FROM PUBLIC;

DROP TRIGGER IF EXISTS messages_touch_request ON messages;
CREATE TRIGGER messages_touch_request
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_request_on_message();

-- An UPDATE policy cannot compare the old row with the new one, so the rules
-- about which edits are legal live here, as in 0007. These are the database
-- backstop for the same rules the server actions check first.
--
-- Friendships: the two ends never change, and the only status change is the
-- addressee accepting.
CREATE OR REPLACE FUNCTION public.guard_friendship_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor text := public.app_user_id();
BEGIN
  IF actor IS NULL OR public.app_is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.requester_id IS DISTINCT FROM OLD.requester_id
     OR NEW.addressee_id IS DISTINCT FROM OLD.addressee_id THEN
    RAISE EXCEPTION 'a friendship cannot be moved to a different pair of students'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'pending' AND NEW.status = 'accepted' AND actor = OLD.addressee_id) THEN
    RAISE EXCEPTION 'friendship cannot move from % to % for this user', OLD.status, NEW.status
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_friendship_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS friendships_guard_change ON friendships;
CREATE TRIGGER friendships_guard_change
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_friendship_change();

-- Memberships. Mirrored by isAllowedMemberTransition in src/lib/collaboration.ts.
--   the member themself:   invited -> joined | declined,  joined -> left
--   the lead or professor: invited | joined -> removed
--   the lead:              declined | left | removed -> invited  (accepted friends only)
-- Moving INTO invited or joined also requires the request to still be open.
CREATE OR REPLACE FUNCTION public.guard_request_member_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor text := public.app_user_id();
  req   requests%ROWTYPE;
BEGIN
  IF actor IS NULL OR public.app_is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.request_id IS DISTINCT FROM OLD.request_id
     OR NEW.student_id IS DISTINCT FROM OLD.student_id THEN
    RAISE EXCEPTION 'a membership cannot be moved to another request or student'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO req FROM requests WHERE id = OLD.request_id;

  IF NEW.status IN ('invited', 'joined')
     AND req.status NOT IN ('pending', 'viewed', 'active') THEN
    RAISE EXCEPTION 'request % is no longer open to new members', OLD.request_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF actor = OLD.student_id AND (
       (OLD.status = 'invited' AND NEW.status IN ('joined', 'declined'))
    OR (OLD.status = 'joined'  AND NEW.status = 'left')
  ) THEN
    RETURN NEW;
  END IF;

  IF actor IN (req.student_id, req.professor_id)
     AND OLD.status IN ('invited', 'joined') AND NEW.status = 'removed' THEN
    RETURN NEW;
  END IF;

  IF actor = req.student_id
     AND OLD.status IN ('declined', 'left', 'removed') AND NEW.status = 'invited' THEN
    -- A re-invite is an invite, and gets the INSERT policy's friendship rule.
    -- Without this, a student who blocked the lead (which deletes their
    -- friendship) could be invited straight back through this UPDATE path.
    IF NOT EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND ((f.requester_id = actor AND f.addressee_id = OLD.student_id)
          OR (f.addressee_id = actor AND f.requester_id = OLD.student_id))
    ) THEN
      RAISE EXCEPTION 'only accepted friends can be invited to a request'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'membership cannot move from % to % for this user', OLD.status, NEW.status
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_request_member_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS request_members_guard_change ON request_members;
CREATE TRIGGER request_members_guard_change
  BEFORE UPDATE ON request_members
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_request_member_change();

-- ---------------------------------------------------------------------------
-- 4. Policies
-- ---------------------------------------------------------------------------
ALTER TABLE friendships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships     FORCE  ROW LEVEL SECURITY;
ALTER TABLE user_blocks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks     FORCE  ROW LEVEL SECURITY;
ALTER TABLE request_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_members FORCE  ROW LEVEL SECURITY;
ALTER TABLE thread_reads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_reads    FORCE  ROW LEVEL SECURITY;

-- friendships - visible to and removable by either end. Only the requester
-- creates an edge, only towards a discoverable student, and only the addressee
-- accepts it (transition enforced by guard_friendship_change).
DROP POLICY IF EXISTS friendships_select ON friendships;
CREATE POLICY friendships_select ON friendships
  FOR SELECT USING (
    requester_id = app_user_id() OR addressee_id = app_user_id() OR app_is_admin()
  );

DROP POLICY IF EXISTS friendships_insert ON friendships;
CREATE POLICY friendships_insert ON friendships
  FOR INSERT WITH CHECK (
    requester_id = app_user_id()
    AND status = 'pending'
    AND app_is_discoverable_student(addressee_id)
  );

DROP POLICY IF EXISTS friendships_update ON friendships;
CREATE POLICY friendships_update ON friendships
  FOR UPDATE
  USING (addressee_id = app_user_id() OR app_is_admin())
  WITH CHECK (addressee_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS friendships_delete ON friendships;
CREATE POLICY friendships_delete ON friendships
  FOR DELETE USING (
    requester_id = app_user_id() OR addressee_id = app_user_id() OR app_is_admin()
  );

-- user_blocks - private to the blocker. The blocked student is never told, and
-- app_blocked_between answers the one question the app needs without exposing
-- the row. No UPDATE policy: a block is created or removed, never edited.
DROP POLICY IF EXISTS user_blocks_select ON user_blocks;
CREATE POLICY user_blocks_select ON user_blocks
  FOR SELECT USING (blocker_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS user_blocks_insert ON user_blocks;
CREATE POLICY user_blocks_insert ON user_blocks
  FOR INSERT WITH CHECK (blocker_id = app_user_id());

DROP POLICY IF EXISTS user_blocks_delete ON user_blocks;
CREATE POLICY user_blocks_delete ON user_blocks
  FOR DELETE USING (blocker_id = app_user_id() OR app_is_admin());

-- request_members - the roster is visible to everyone who can see the request.
-- Only the lead invites, only accepted friends, and only into an open request.
-- Rows are never deleted by users; status carries the history.
DROP POLICY IF EXISTS request_members_select ON request_members;
CREATE POLICY request_members_select ON request_members
  FOR SELECT USING (
    student_id = app_user_id() OR app_can_view_request(request_id) OR app_is_admin()
  );

DROP POLICY IF EXISTS request_members_insert ON request_members;
CREATE POLICY request_members_insert ON request_members
  FOR INSERT WITH CHECK (
    status = 'invited'
    AND student_id <> app_user_id()
    AND EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_members.request_id
        AND r.student_id = app_user_id()
        AND r.status IN ('pending', 'viewed', 'active')
    )
    AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND ((f.requester_id = app_user_id() AND f.addressee_id = request_members.student_id)
          OR (f.addressee_id = app_user_id() AND f.requester_id = request_members.student_id))
    )
    AND NOT app_blocked_between(app_user_id(), student_id)
  );

DROP POLICY IF EXISTS request_members_update ON request_members;
CREATE POLICY request_members_update ON request_members
  FOR UPDATE
  USING (
    student_id = app_user_id()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_members.request_id
        AND (r.student_id = app_user_id() OR r.professor_id = app_user_id())
    )
    OR app_is_admin()
  )
  WITH CHECK (
    student_id = app_user_id()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_members.request_id
        AND (r.student_id = app_user_id() OR r.professor_id = app_user_id())
    )
    OR app_is_admin()
  );

DROP POLICY IF EXISTS request_members_delete ON request_members;
CREATE POLICY request_members_delete ON request_members
  FOR DELETE USING (app_is_admin());

-- thread_reads - strictly your own read position, and only on a thread you are
-- currently participating in.
DROP POLICY IF EXISTS thread_reads_select ON thread_reads;
CREATE POLICY thread_reads_select ON thread_reads
  FOR SELECT USING (user_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS thread_reads_insert ON thread_reads;
CREATE POLICY thread_reads_insert ON thread_reads
  FOR INSERT WITH CHECK (user_id = app_user_id() AND app_is_thread_participant(request_id));

DROP POLICY IF EXISTS thread_reads_update ON thread_reads;
CREATE POLICY thread_reads_update ON thread_reads
  FOR UPDATE
  USING (user_id = app_user_id())
  WITH CHECK (user_id = app_user_id() AND app_is_thread_participant(request_id));

DROP POLICY IF EXISTS thread_reads_delete ON thread_reads;
CREATE POLICY thread_reads_delete ON thread_reads
  FOR DELETE USING (user_id = app_user_id() OR app_is_admin());

-- requests - members join the set of people who can see a request. Writes are
-- unchanged: only the lead creates it, and only the lead and professor update
-- or delete it.
DROP POLICY IF EXISTS requests_select ON requests;
CREATE POLICY requests_select ON requests
  FOR SELECT USING (
    student_id = app_user_id()
    OR professor_id = app_user_id()
    OR COALESCE(app_member_status(id) IN ('invited', 'joined'), false)
    OR app_is_admin()
  );

-- messages - joined members read and post alongside the lead and professor. An
-- invitee does not see the conversation until they join.
DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages
  FOR SELECT USING (app_is_admin() OR app_is_thread_participant(request_id));

DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (
    app_is_admin()
    OR (sender_id = app_user_id() AND app_is_thread_participant(request_id))
  );

DROP POLICY IF EXISTS messages_update ON messages;
CREATE POLICY messages_update ON messages
  FOR UPDATE
  USING (app_is_admin() OR app_is_thread_participant(request_id))
  WITH CHECK (app_is_admin() OR app_is_thread_participant(request_id));

DROP POLICY IF EXISTS messages_delete ON messages;
CREATE POLICY messages_delete ON messages
  FOR DELETE USING (app_is_admin() OR app_is_thread_participant(request_id));

-- profiles - 0006's rule, with the thread-party branch widened to "connected":
-- friends (in either state), fellow members of a group thread, and everyone on a
-- request you are on.
DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (
    id = app_user_id()
    OR (role = 'professor' AND status = 'approved')
    OR app_is_connected_to(id)
    OR email = (SELECT u.email FROM "user" u WHERE u.id = app_user_id())
    OR app_is_admin()
  );

-- ---------------------------------------------------------------------------
-- 5. Backfill read positions from messages.read_at
--
--    In a two-party thread `read_at` was set by the one participant who did not
--    send the message, and always in bulk on opening the thread, so the read
--    messages form a prefix in time. A participant's read position is therefore
--    the newest message from the other side that they had marked read. Someone
--    who has read nothing gets no row, and every message from the other side
--    stays unread - exactly the count the old query produced.
-- ---------------------------------------------------------------------------
INSERT INTO thread_reads (request_id, user_id, last_read_at)
SELECT r.id, participant.user_id, max(m.created_at)
FROM requests r
CROSS JOIN LATERAL (VALUES (r.student_id), (r.professor_id)) AS participant(user_id)
JOIN messages m
  ON m.request_id = r.id
 AND m.sender_id <> participant.user_id
 AND m.read_at IS NOT NULL
 AND m.created_at IS NOT NULL
GROUP BY r.id, participant.user_id
ON CONFLICT (request_id, user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Ownership, matching every other app table (0004, 0006). Named explicitly
--    rather than looped, so this file never touches a table it did not create.
--    FORCE above keeps the owner subject to the policies.
-- ---------------------------------------------------------------------------
ALTER TABLE friendships     OWNER TO schollective_app;
ALTER TABLE user_blocks     OWNER TO schollective_app;
ALTER TABLE request_members OWNER TO schollective_app;
ALTER TABLE thread_reads    OWNER TO schollective_app;

-- ---------------------------------------------------------------------------
-- 7. Verify, and fail loudly if anything did not take.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  unprotected int;
  helper_owner_bypasses boolean;
BEGIN
  SELECT count(*) INTO unprotected
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('friendships', 'user_blocks', 'request_members', 'thread_reads')
    AND NOT (c.relrowsecurity AND c.relforcerowsecurity);

  SELECT bool_and(r.rolbypassrls) INTO helper_owner_bypasses
  FROM pg_proc p
  JOIN pg_roles r ON r.oid = p.proowner
  WHERE p.pronamespace = 'public'::regnamespace
    AND p.proname IN ('app_member_status', 'app_is_thread_participant', 'app_can_view_request',
                      'app_blocked_between', 'app_is_connected_to', 'app_is_discoverable_student',
                      'app_search_students', 'app_student_cards');

  RAISE NOTICE 'new tables without enabled+forced RLS: %', unprotected;
  RAISE NOTICE 'read positions backfilled: %', (SELECT count(*) FROM thread_reads);

  IF unprotected > 0 THEN
    RAISE EXCEPTION '% new table(s) are missing enforced row-level security', unprotected;
  END IF;
  IF helper_owner_bypasses IS NOT TRUE THEN
    RAISE EXCEPTION 'membership helpers are owned by a role subject to RLS - policies would recurse';
  END IF;
END $$;
