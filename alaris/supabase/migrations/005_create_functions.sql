-- ============================================
-- MIGRATION 005: Create Helper Functions
-- Run this FIFTH in Supabase SQL Editor
-- ============================================

-- Check if user can start a new session today (daily limit)
-- Returns TRUE if user can start a session, FALSE otherwise
CREATE OR REPLACE FUNCTION check_daily_session_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_sessions_today INTEGER;
  v_last_session_date DATE;
  v_daily_limit INTEGER := 1; -- One session per day
BEGIN
  SELECT sessions_today, last_session_date
  INTO v_sessions_today, v_last_session_date
  FROM public.users
  WHERE id = p_user_id;
  
  -- If no record found, allow (new user)
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  -- If last session was not today, reset count (they can start)
  IF v_last_session_date IS NULL OR v_last_session_date < CURRENT_DATE THEN
    RETURN TRUE;
  END IF;
  
  -- Check if under daily limit
  RETURN COALESCE(v_sessions_today, 0) < v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset daily session counts (run via cron at midnight)
CREATE OR REPLACE FUNCTION reset_daily_session_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET sessions_today = 0
  WHERE last_session_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user with memory (combined query for efficiency)
CREATE OR REPLACE FUNCTION get_user_with_memory(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  age_bracket TEXT,
  session_count INTEGER,
  is_admin BOOLEAN,
  profile_json JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.email,
    u.age_bracket,
    u.session_count,
    u.is_admin,
    m.profile_json
  FROM public.users u
  LEFT JOIN public.memories m ON m.user_id = u.id
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT is_admin INTO v_is_admin
  FROM public.users
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_daily_session_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_with_memory(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;

-- Only service role can reset daily counts
GRANT EXECUTE ON FUNCTION reset_daily_session_counts() TO service_role;

COMMENT ON FUNCTION check_daily_session_limit IS 'Check if user has remaining sessions for today. Returns TRUE if allowed.';
COMMENT ON FUNCTION reset_daily_session_counts IS 'Reset all users daily session counts. Run at midnight via cron.';
COMMENT ON FUNCTION get_user_with_memory IS 'Efficient combined query to get user profile with learner memory.';
COMMENT ON FUNCTION is_user_admin IS 'Check if a user has admin privileges.';

