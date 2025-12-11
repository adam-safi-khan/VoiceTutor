-- ============================================
-- MIGRATION 002: Create Memories Table
-- Run this SECOND in Supabase SQL Editor
-- ============================================

-- Memories table (learner profiles)
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- JSON learner profile
  -- Structure: {
  --   interest_tags: string[],
  --   known_topics: { name: string, level: 'unknown' | 'fragile' | 'usable' | 'robust' }[],
  --   skill_dimensions: { name: string, level: number, notes: string, trend: string }[],
  --   cognitive_style: { approach: string, verbosity: string },
  --   open_loops: { content: string, created_at: string }[],
  --   misconceptions_flagged: { topic: string, misconception: string }[],
  --   recent_topics: string[]
  -- }
  profile_json JSONB NOT NULL DEFAULT '{
    "interest_tags": [],
    "known_topics": [],
    "skill_dimensions": [
      {"name": "explanatory", "level": 5, "notes": "", "trend": "stable"},
      {"name": "argumentation", "level": 5, "notes": "", "trend": "stable"},
      {"name": "hypothetical", "level": 5, "notes": "", "trend": "stable"},
      {"name": "epistemic", "level": 5, "notes": "", "trend": "stable"},
      {"name": "metacognition", "level": 5, "notes": "", "trend": "stable"},
      {"name": "synthesis", "level": 5, "notes": "", "trend": "stable"},
      {"name": "question_asking", "level": 5, "notes": "", "trend": "stable"},
      {"name": "transfer", "level": 5, "notes": "", "trend": "stable"},
      {"name": "affective", "level": 5, "notes": "", "trend": "stable"}
    ],
    "cognitive_style": {"approach": "unknown", "verbosity": "unknown"},
    "open_loops": [],
    "misconceptions_flagged": [],
    "recent_topics": []
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user lookups
CREATE INDEX idx_memories_user_id ON public.memories(user_id);

-- Updated_at trigger
CREATE TRIGGER memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Users can read their own memory
CREATE POLICY "Users can view own memory" ON public.memories
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own memory
CREATE POLICY "Users can update own memory" ON public.memories
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role has full access to memories" ON public.memories
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Auto-create memory when user is created
CREATE OR REPLACE FUNCTION create_memory_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.memories (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_memory_for_user();

COMMENT ON TABLE public.memories IS 'Learner profiles with cognitive skill tracking and personalization data.';

