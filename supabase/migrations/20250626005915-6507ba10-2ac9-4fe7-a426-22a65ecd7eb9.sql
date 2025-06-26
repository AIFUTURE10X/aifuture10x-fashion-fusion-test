
-- Create table for storing Perfect Corp access tokens
CREATE TABLE IF NOT EXISTS perfect_corp_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups by expiration
CREATE INDEX IF NOT EXISTS idx_perfect_corp_tokens_expires_at ON perfect_corp_tokens(expires_at);
