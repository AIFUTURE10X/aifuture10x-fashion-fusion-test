
-- Function to get a valid (non-expired) Perfect Corp token
CREATE OR REPLACE FUNCTION get_valid_perfect_corp_token()
RETURNS TABLE (
  token_id UUID,
  access_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  seconds_until_expiry INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    pct.access_token,
    pct.expires_at,
    EXTRACT(EPOCH FROM (pct.expires_at - NOW()))::INTEGER as seconds_until_expiry
  FROM perfect_corp_tokens pct
  WHERE pct.expires_at > NOW()
  ORDER BY pct.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to cleanup expired Perfect Corp tokens
CREATE OR REPLACE FUNCTION cleanup_expired_perfect_corp_tokens()
RETURNS TABLE (
  deleted_count INTEGER,
  cleanup_timestamp TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_rows INTEGER;
BEGIN
  DELETE FROM perfect_corp_tokens 
  WHERE expires_at <= NOW();
  
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  
  RETURN QUERY
  SELECT deleted_rows, NOW();
END;
$$;

-- Function to get token expiry information
CREATE OR REPLACE FUNCTION get_token_expiry_info()
RETURNS TABLE (
  has_valid_token BOOLEAN,
  token_count INTEGER,
  next_expiry TIMESTAMP WITH TIME ZONE,
  seconds_until_expiry INTEGER,
  expired_token_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  valid_count INTEGER;
  total_count INTEGER;
  expired_count INTEGER;
  next_exp TIMESTAMP WITH TIME ZONE;
  seconds_left INTEGER;
BEGIN
  -- Count total tokens
  SELECT COUNT(*) INTO total_count FROM perfect_corp_tokens;
  
  -- Count valid tokens
  SELECT COUNT(*) INTO valid_count FROM perfect_corp_tokens WHERE expires_at > NOW();
  
  -- Count expired tokens
  SELECT COUNT(*) INTO expired_count FROM perfect_corp_tokens WHERE expires_at <= NOW();
  
  -- Get next expiry time
  SELECT expires_at INTO next_exp 
  FROM perfect_corp_tokens 
  WHERE expires_at > NOW() 
  ORDER BY expires_at ASC 
  LIMIT 1;
  
  -- Calculate seconds until expiry
  IF next_exp IS NOT NULL THEN
    seconds_left := EXTRACT(EPOCH FROM (next_exp - NOW()))::INTEGER;
  ELSE
    seconds_left := NULL;
  END IF;
  
  RETURN QUERY
  SELECT 
    (valid_count > 0),
    total_count,
    next_exp,
    seconds_left,
    expired_count;
END;
$$;

-- Function to force refresh Perfect Corp token (invalidate current token)
CREATE OR REPLACE FUNCTION force_refresh_perfect_corp_token()
RETURNS TABLE (
  invalidated_tokens INTEGER,
  action_timestamp TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
DECLARE
  invalidated_count INTEGER;
BEGIN
  -- Set all current tokens to expired (force refresh)
  UPDATE perfect_corp_tokens 
  SET expires_at = NOW() - INTERVAL '1 second'
  WHERE expires_at > NOW();
  
  GET DIAGNOSTICS invalidated_count = ROW_COUNT;
  
  RETURN QUERY
  SELECT invalidated_count, NOW();
END;
$$;

-- Add some helpful comments
COMMENT ON FUNCTION get_valid_perfect_corp_token() IS 'Returns the most recent valid Perfect Corp access token that has not expired';
COMMENT ON FUNCTION cleanup_expired_perfect_corp_tokens() IS 'Removes all expired Perfect Corp tokens from the database and returns count of deleted records';
COMMENT ON FUNCTION get_token_expiry_info() IS 'Provides comprehensive information about Perfect Corp token status including counts and expiry times';
COMMENT ON FUNCTION force_refresh_perfect_corp_token() IS 'Invalidates all current tokens to force generation of a new token on next authentication request';
