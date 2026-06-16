-- ============================================================
-- Schollective Phase 1 Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Professor availability toggle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_accepting_requests BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,           -- 'request_accepted' | 'request_declined' | 'new_request' | 'message'
  title       TEXT NOT NULL,
  body        TEXT,
  request_id  UUID REFERENCES requests(id) ON DELETE CASCADE,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user-specific queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx  ON notifications(user_id, is_read);

-- RLS: users can only see their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role inserts notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users mark own notifications read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
