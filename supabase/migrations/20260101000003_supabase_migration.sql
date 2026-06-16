-- ══════════════════════════════════════════════════════════════════════════════
-- SCHOLLECTIVE SUPABASE SCHEMA & RLS CONFIGURATION
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. PROFILES TABLE
-- Stores user-specific information linked to Supabase Auth.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'professor', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  first_name TEXT,
  preferred_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REQUESTS TABLE
-- Manages the mentorship request lifecycle.
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  professor_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'closed')),
  topic TEXT,
  expected_outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MESSAGES TABLE
-- Handles the conversation history within a request thread.
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════════════
-- RLS POLICIES: PROFILES
-- ══════════════════════════════════════════════════════════════════════════════

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Authenticated users can browse approved professors
CREATE POLICY "Authenticated users can browse approved professors"
ON public.profiles FOR SELECT
TO authenticated
USING (role = 'professor' AND status = 'approved');


-- ══════════════════════════════════════════════════════════════════════════════
-- RLS POLICIES: REQUESTS
-- ══════════════════════════════════════════════════════════════════════════════

-- Students can read and insert their own requests
CREATE POLICY "Students can handle own requests"
ON public.requests FOR ALL
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Professors can view and update requests assigned to them
CREATE POLICY "Professors can handle assigned requests"
ON public.requests FOR ALL
TO authenticated
USING (auth.uid() = professor_id)
WITH CHECK (auth.uid() = professor_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- RLS POLICIES: MESSAGES
-- ══════════════════════════════════════════════════════════════════════════════

-- Users can read messages if they are the student, professor, or sender in the request
CREATE POLICY "Users can view messages in their threads"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id = public.messages.request_id
    AND (auth.uid() = r.student_id OR auth.uid() = r.professor_id)
  )
);

-- Users can insert messages if they are part of the request thread
CREATE POLICY "Users can send messages to their threads"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id = public.messages.request_id
    AND (auth.uid() = r.student_id OR auth.uid() = r.professor_id)
  )
);


-- ══════════════════════════════════════════════════════════════════════════════
-- AUTH SYNCHRONIZATION TRIGGER
-- Automatically creates a profile entry when a new user signs up via Supabase Auth.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student'), -- Default to student
    CASE 
      WHEN (new.raw_user_meta_data->>'role') = 'professor' THEN 'pending'
      ELSE 'approved' -- Students are approved by default
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
