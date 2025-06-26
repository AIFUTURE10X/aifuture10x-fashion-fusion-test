
-- Enable Row Level Security on perfect_corp_tokens table
ALTER TABLE public.perfect_corp_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access (needed for Edge Functions)
-- This policy allows the service role to perform all operations on the tokens table
CREATE POLICY "Service role can manage perfect corp tokens" 
ON public.perfect_corp_tokens 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create policy to restrict direct access from anon/authenticated users
-- Regular users should not have direct access to tokens
CREATE POLICY "Regular users cannot access perfect corp tokens" 
ON public.perfect_corp_tokens 
FOR ALL 
TO anon, authenticated 
USING (false) 
WITH CHECK (false);
