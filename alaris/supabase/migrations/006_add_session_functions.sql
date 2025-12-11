-- Migration: Add session-related functions
-- Run this after migrations 001-005

-- Function to increment user session count
CREATE OR REPLACE FUNCTION increment_session_count(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET 
    session_count = session_count + 1,
    last_session_at = NOW(),
    updated_at = NOW()
  WHERE auth_id = p_user_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION increment_session_count(UUID) TO authenticated;

-- Comment
COMMENT ON FUNCTION increment_session_count IS 'Increments the session count for a user after completing a session';

