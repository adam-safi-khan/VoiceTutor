-- ============================================
-- MIGRATION 004: Create Moderation Logs Table
-- Run this FOURTH in Supabase SQL Editor
-- ============================================

-- Flag severity enum
CREATE TYPE flag_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Flag type enum
CREATE TYPE flag_type AS ENUM (
  'inappropriate_content',
  'safety_concern',
  'age_inappropriate',
  'technical_issue',
  'user_distress',
  'policy_violation',
  'other'
);

-- Moderation logs table
CREATE TABLE public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Flag details
  flag_type flag_type NOT NULL,
  severity flag_severity NOT NULL DEFAULT 'low',
  description TEXT,
  
  -- Context
  transcript_excerpt TEXT, -- Relevant portion of transcript
  ai_response_excerpt TEXT, -- AI response that triggered flag
  
  -- Review status
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  action_taken TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_moderation_user_id ON public.moderation_logs(user_id);
CREATE INDEX idx_moderation_session_id ON public.moderation_logs(session_id);
CREATE INDEX idx_moderation_reviewed ON public.moderation_logs(reviewed);
CREATE INDEX idx_moderation_severity ON public.moderation_logs(severity);
CREATE INDEX idx_moderation_created_at ON public.moderation_logs(created_at DESC);

-- Row Level Security
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can view moderation logs
CREATE POLICY "Admins can view moderation logs" ON public.moderation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Service role can do everything
CREATE POLICY "Service role has full access to moderation" ON public.moderation_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Only service role can insert (from API)
CREATE POLICY "Service role can insert moderation logs" ON public.moderation_logs
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.moderation_logs IS 'Safety and moderation tracking for session content.';

