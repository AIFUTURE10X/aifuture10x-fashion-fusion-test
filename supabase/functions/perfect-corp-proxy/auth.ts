
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';
import { rsaEncrypt } from './rsa-encryption.ts';
import { validateCredentials } from './validation.ts';
import { getCachedToken, cacheToken } from './token-cache.ts';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string, supabase: any): Promise<AuthResult> {
  console.log('🔐 [Auth] Starting Perfect Corp authentication...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('🧪 [Auth] Mock mode enabled - returning test token');
    return { accessToken: 'mock_token_for_testing' };
  }

  // Enhanced credential validation
  const validation = validateCredentials(apiKey, apiSecret);
  if (!validation.valid) {
    console.error('❌ [Auth] Credential validation failed:', validation.issues);
    throw new Error(`Invalid credentials: ${validation.issues.join(', ')}`);
  }
  
  console.log('✅ [Auth] Credential validation passed');

  // Check for cached token first
  const cachedToken = await getCachedToken(supabase);
  if (cachedToken) {
    return { accessToken: cachedToken };
  }
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    console.log('🚀 [Auth] Starting fresh authentication');
    console.log('🔑 [Auth] API Key:', apiKey.substring(0, 8) + '...');
    console.log('🗝️ [Auth] RSA Key length:', apiSecret.length);
    console.log('🗝️ [Auth] RSA Key format:', apiSecret.includes('BEGIN') ? 'PEM' : 'Raw Base64');
    console.log('🌐 [Auth] Auth URL:', authUrl);

    // Create timestamp - Perfect Corp requires timestamp in milliseconds
    const timestamp = new Date().getTime();
    
    // Try URL-encoded format instead of JSON - this might be what Perfect Corp expects
    const urlEncodedPayload = `client_id=${apiKey}&timestamp=${timestamp}`;
    
    console.log('📝 [Auth] Current time:', new Date().toISOString());
    console.log('📝 [Auth] Unix timestamp (milliseconds):', timestamp);
    console.log('📝 [Auth] URL-encoded payload:', urlEncodedPayload);
    console.log('📏 [Auth] Payload size:', urlEncodedPayload.length, 'characters');
    
    // Encrypt the payload using enhanced RSA encryption
    const idToken = await rsaEncrypt(urlEncodedPayload, apiSecret);
    console.log('✅ [Auth] RSA encryption successful');
    console.log('🎫 [Auth] ID Token length:', idToken.length);
    
    // Prepare request body exactly as Perfect Corp expects
    const requestBody = {
      client_id: apiKey,
      id_token: idToken
    };
    
    console.log('📤 [Auth] Request structure:', Object.keys(requestBody));
    console.log('📤 [Auth] Making request to Perfect Corp...');
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Perfect-Corp-S2S-Client/1.0',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📥 [Auth] Response: ${authResponse.status} ${authResponse.statusText}`);
    
    const responseText = await authResponse.text();
    console.log(`📄 [Auth] Raw response:`, responseText);
    
    if (authResponse.ok) {
      let authData;
      try {
        authData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ [Auth] Failed to parse JSON response:`, parseError);
        throw new Error('Invalid JSON response from Perfect Corp API');
      }
      
      console.log(`📊 [Auth] Parsed response:`, authData);
      
      // Extract access token from various possible response formats
      let accessToken: string | null = null;
      let expiresIn: number = 7200; // Default 2 hours
      
      if (authData.result?.access_token) {
        accessToken = authData.result.access_token;
        expiresIn = authData.result.expires_in || 7200;
      } else if (authData.access_token) {
        accessToken = authData.access_token;
        expiresIn = authData.expires_in || 7200;
      } else if (authData.token) {
        accessToken = authData.token;
        expiresIn = authData.expires_in || 7200;
      }
      
      if (accessToken) {
        console.log(`🎉 [Auth] Authentication successful!`);
        console.log('⏱️ [Auth] Token expires in:', expiresIn, 'seconds');
        console.log('🔑 [Auth] Token length:', accessToken.length);
        
        // Cache the successful token
        await cacheToken(supabase, accessToken, expiresIn);
        
        return { accessToken };
      } else {
        console.error(`❌ [Auth] No access token in response`);
        console.log(`🔍 [Auth] Available response fields:`, Object.keys(authData));
        throw new Error('No access token returned from Perfect Corp API');
      }
    } else {
      // Enhanced error handling for authentication failures
      let errorMessage = `Authentication failed (${authResponse.status})`;
      let errorDetails = '';
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ [Auth] Error response:', errorData);
        
        if (errorData.error?.includes('Invalid client_id or invalid id_token')) {
          errorDetails = `

🔍 Perfect Corp Authentication Troubleshooting:

1. ✅ Verify PERFECTCORP_API_KEY matches your Perfect Corp Client ID exactly
2. ✅ Verify PERFECTCORP_API_SECRET contains the complete RSA public key
3. ✅ Ensure your Perfect Corp account has API access enabled
4. ✅ Check that your RSA key is in the correct format (PEM or base64)
5. ✅ Confirm your credentials haven't expired
6. ✅ Try using URL-encoded payload format instead of JSON

📋 Debug Information:
- Timestamp: ${timestamp} (${new Date(timestamp).toISOString()})
- Payload format: URL-encoded (${urlEncodedPayload})
- Key format: ${apiSecret.includes('BEGIN') ? 'PEM format' : 'Raw base64'}
- Key length: ${apiSecret.length} characters

💡 Contact Perfect Corp support if credentials are correct but authentication still fails.`;
          
          errorMessage = `Perfect Corp Authentication Error: ${errorData.error}${errorDetails}`;
        } else {
          errorMessage = errorData.error || errorData.message || responseText;
        }
      } catch {
        errorMessage = responseText || `HTTP ${authResponse.status} error`;
      }
      
      console.log(`❌ [Auth] Final error message:`, errorMessage);
      throw new Error(errorMessage);
    }
    
  } catch (error) {
    console.error('❌ [Auth] Authentication process error:', error);
    
    // Provide specific error guidance
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Perfect Corp API. Check internet connection and firewall settings.');
    }
    
    if (error.message.includes('RSA')) {
      throw new Error(`RSA encryption error: ${error.message}. Verify PERFECTCORP_API_SECRET contains a valid RSA public key in PEM format or base64.`);
    }
    
    // Re-throw the original error if it's already detailed
    throw error;
  }
}
