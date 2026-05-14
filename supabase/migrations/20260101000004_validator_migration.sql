-- ─────────────────────────────────────────────────────────────────
-- Schollective — Validator Score Migration
-- Run this in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- 1. Add algorithm score columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_score  integer   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_level  text      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_flags  text[]    DEFAULT NULL;

-- 2. Optional index for quick admin queries (sort by score)
CREATE INDEX IF NOT EXISTS idx_profiles_ai_score
  ON public.profiles (ai_score)
  WHERE role = 'professor';
