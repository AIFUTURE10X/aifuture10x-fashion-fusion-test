
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rsaEncrypt } from './rsa-encryption.ts';
import { validateCredentials } from './validation.ts';
import { AuthResponse, PerfectCorpAuthResponse } from './types.ts';

const PERFECTCORP_AUTH_URL = 'https://yce-api-01.perfectcorp.com/s2s/v1.0/client/auth';

export async function authenticateWithPerfectCorp(): Promise<AuthResponse> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for cached token first
    const { data: existingTokenData } = await supabase.rpc('get_valid_perfect_corp_token');

    if (existingTokenData && existingTokenData.length > 0) {
      const token = existingTokenData[0];
      console.log('✅ [Auth] Using cached token, expires in', token.seconds_until_expiry, 'seconds');
      return {
        success: true,
        accessToken: token.access_token,
        expiresIn: Math.max(token.seconds_until_expiry, 0)
      };
    }

    console.log('🔄 [Auth] Generating new Perfect Corp access token...');
    
    const clientId = Deno.env.get('PERFECTCORP_API_KEY');
    const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
    
    const validation = validateCredentials(clientId || '', clientSecret || '');
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid credentials: ${validation.issues.join(', ')}`
      };
    }

    console.log('🔑 [Auth] Client ID:', clientId!.substring(0, 8) + '...');
    console.log('🔐 [Auth] RSA key length:', clientSecret!.length);

    try {
      // Create timestamp in seconds (not milliseconds) as Perfect Corp likely expects
      const now = new Date();
      const timestamp = Math.floor(now.getTime() / 1000);
      
      // Try different payload formats - Perfect Corp might expect URL-encoded format
      const urlEncodedPayload = `client_id=${clientId}&timestamp=${timestamp}`;
      
      console.log('📝 [Auth] Current time:', now.toISOString());
      console.log('📝 [Auth] Unix timestamp (seconds):', timestamp);
      console.log('📝 [Auth] URL-encoded payload:', urlEncodedPayload);
      console.log('📏 [Auth] Payload length:', urlEncodedPayload.length, 'characters');
      
      const idToken = await rsaEncrypt(urlEncodedPayload, clientSecret!);
      console.log('✅ [Auth] RSA encryption successful, token length:', idToken.length);
      
      const requestBody = {
        client_id: clientId,
        id_token: idToken
      };
      
      console.log('📤 [Auth] Sending request to:', PERFECTCORP_AUTH_URL);
      console.log('📤 [Auth] Request body structure:', Object.keys(requestBody));
      
      const authResponse = await fetch(PERFECTCORP_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Perfect-Corp-S2S-Client/1.0'
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📥 [Auth] Response status: ${authResponse.status} ${authResponse.statusText}`);

      const responseText = await authResponse.text();
      console.log(`📄 [Auth] Raw response:`, responseText);

      if (authResponse.ok) {
        const authData: PerfectCorpAuthResponse = JSON.parse(responseText);
        console.log(`📦 [Auth] Parsed response:`, authData);

        if (authData.result?.access_token) {
          const accessToken = authData.result.access_token;
          const expiresIn = 7200; // 2 hours
          
          console.log(`🎉 [Auth] Authentication successful!`);
          console.log(`🔑 [Auth] Token preview:`, accessToken.substring(0, 20) + '...');

          // Cache the token
          try {
            const expiresAt = new Date(Date.now() + ((expiresIn - 60) * 1000));
            await supabase.from('perfect_corp_tokens').insert({
              access_token: accessToken,
              expires_at: expiresAt.toISOString()
            });
            console.log('💾 [Auth] Token cached successfully');
          } catch (cacheError) {
            console.warn('⚠️ [Auth] Failed to cache token:', cacheError);
          }

          return {
            success: true,
            accessToken: accessToken,
            expiresIn: expiresIn
          };
        } else {
          console.error('❌ [Auth] No access token in response');
          return {
            success: false,
            error: 'No access token returned from Perfect Corp API'
          };
        }
      } else {
        let errorMessage = `Authentication failed (${authResponse.status})`;
        try {
          const errorData = JSON.parse(responseText);
          console.error('❌ [Auth] Error response data:', errorData);
          
          if (errorData.error?.includes('Invalid client_id or invalid id_token')) {
            errorMessage = `Perfect Corp Authentication Error: ${errorData.error}

🔍 Troubleshooting steps:
1. Verify PERFECTCORP_API_KEY matches your Perfect Corp Client ID exactly
2. Verify PERFECTCORP_API_SECRET contains your RSA public key in correct format
3. Check that your Perfect Corp account has active API access
4. Ensure your credentials haven't expired
5. Try regenerating your API credentials in Perfect Corp dashboard

📋 Debug Information:
- Timestamp: ${timestamp} (${new Date(timestamp * 1000).toISOString()})
- Payload format: URL-encoded (${urlEncodedPayload})
- Key format: ${clientSecret!.includes('BEGIN') ? 'PEM format' : 'Raw base64'}
- Key length: ${clientSecret!.length} characters

💡 If credentials are correct, contact Perfect Corp support for assistance.`;
          } else {
            errorMessage = errorData.error || responseText;
          }
        } catch {
          errorMessage = responseText;
        }
        
        console.log(`❌ [Auth] Authentication failed:`, errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      console.log(`❌ [Auth] Request error:`, error.message);
      return {
        success: false,
        error: `Authentication request failed: ${error.message}`
      };
    }

  } catch (error) {
    console.error('💥 [Auth] General error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}
