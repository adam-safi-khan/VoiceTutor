-- ============================================
-- MIGRATION 003: Create Sessions Table
-- Run this THIRD in Supabase SQL Editor
-- ============================================

-- Session status enum
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned', 'error');

-- Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- Calculated on end
  
  -- Topic information
  topic_chosen TEXT,
  topic_options JSONB, -- Array of 3 topic options offered
  
  -- Transcript and summary
  transcript TEXT,
  summary JSONB, -- Generated summary with key points
  
  -- Engagement metrics
  engagement_score DECIMAL(3,1) CHECK (engagement_score >= 0 AND engagement_score <= 10),
  user_talk_time_seconds INTEGER DEFAULT 0,
  ai_talk_time_seconds INTEGER DEFAULT 0,
  interruption_count INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  
  -- Status
  status session_status DEFAULT 'active',
  
  -- Resume capability
  resume_token TEXT UNIQUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_started_at ON public.sessions(started_at DESC);
CREATE INDEX idx_sessions_status ON public.sessions(status);
-- Composite index for user + date queries (using timestamp directly)
CREATE INDEX idx_sessions_user_started ON public.sessions(user_id, started_at DESC);

-- Updated_at trigger
CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can create own sessions" ON public.sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON public.sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role has full access to sessions" ON public.sessions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Update user stats when session completes
CREATE OR REPLACE FUNCTION update_user_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when session is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.users
    SET 
      session_count = session_count + 1,
      sessions_today = CASE 
        WHEN last_session_date = CURRENT_DATE THEN sessions_today + 1
        ELSE 1
      END,
      last_session_date = CURRENT_DATE
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_session_completed
  AFTER INSERT OR UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_session_stats();

COMMENT ON TABLE public.sessions IS 'Voice tutorial sessions with transcripts, metrics, and summaries.';

