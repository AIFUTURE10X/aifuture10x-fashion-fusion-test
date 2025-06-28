
export async function getCachedToken(supabase: any): Promise<string | null> {
  try {
    const { data: tokenData, error: tokenError } = await supabase.rpc('get_valid_perfect_corp_token');
    
    if (tokenError) {
      console.warn('⚠️ [Auth] Token check error:', tokenError);
      return null;
    }
    
    if (tokenData && tokenData.length > 0) {
      const token = tokenData[0];
      console.log(`✅ [Auth] Using cached token, expires in ${token.seconds_until_expiry}s`);
      return token.access_token;
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️ [Auth] Token check failed:', error);
    return null;
  }
}

export async function cacheToken(supabase: any, accessToken: string, expiresIn: number = 7200): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ((expiresIn - 60) * 1000)).toISOString();
    
    await supabase.rpc('cleanup_expired_perfect_corp_tokens');
    
    const { error: insertError } = await supabase
      .from('perfect_corp_tokens')
      .insert({
        access_token: accessToken,
        expires_at: expiresAt
      });
      
    if (insertError) {
      console.warn('⚠️ [Auth] Failed to store token:', insertError);
    } else {
      console.log('💾 [Auth] Token cached successfully');
    }
  } catch (storeError) {
    console.warn('⚠️ [Auth] Token storage error:', storeError);
  }
}
