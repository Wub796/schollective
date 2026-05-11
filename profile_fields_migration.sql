-- ──────────────────────────────────────────────────────────────────────────
-- Schollective — Profile Fields Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ──────────────────────────────────────────────────────────────────────────

-- Add missing columns to the profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS institution      TEXT,
  ADD COLUMN IF NOT EXISTS education_level  TEXT,
  ADD COLUMN IF NOT EXISTS expertise_fields TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avatar_url       TEXT;

-- Reload PostgREST schema cache so the new columns are immediately visible
-- (Supabase does this automatically within ~1 min, but this forces it now)
NOTIFY pgrst, 'reload schema';
