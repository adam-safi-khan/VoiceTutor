-- ============================================
-- MIGRATION 001: Create Users Table
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  -- Primary key links to auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  location TEXT, -- Optional, from Google Places
  
  -- Age bracket (calculated by trigger)
  age_bracket TEXT,
  
  -- Session tracking
  session_count INTEGER DEFAULT 0,
  sessions_today INTEGER DEFAULT 0,
  last_session_date DATE,
  
  -- Admin flag
  is_admin BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_age CHECK (
    EXTRACT(YEAR FROM AGE(date_of_birth)) >= 13
  )
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_last_session ON public.users(last_session_date);

-- Function to calculate age bracket
CREATE OR REPLACE FUNCTION calculate_age_bracket(dob DATE)
RETURNS TEXT AS $$
DECLARE
  age_years INTEGER;
BEGIN
  IF dob IS NULL THEN
    RETURN 'unknown';
  END IF;
  
  age_years := EXTRACT(YEAR FROM AGE(dob));
  
  IF age_years < 16 THEN
    RETURN '13-15';
  ELSIF age_years < 19 THEN
    RETURN '16-18';
  ELSIF age_years < 26 THEN
    RETURN '19-25';
  ELSE
    RETURN '26+';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Age bracket trigger
CREATE OR REPLACE FUNCTION update_age_bracket()
RETURNS TRIGGER AS $$
BEGIN
  NEW.age_bracket = calculate_age_bracket(NEW.date_of_birth);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_age_bracket
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_age_bracket();

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data (except admin flag)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role has full access" ON public.users
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Comment for documentation
COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth. Contains personal info and session tracking.';

