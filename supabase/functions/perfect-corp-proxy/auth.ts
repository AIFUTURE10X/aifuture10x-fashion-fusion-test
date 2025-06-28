
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

  // Validate credentials
  const validation = validateCredentials(apiKey, apiSecret);
  if (!validation.valid) {
    console.error('❌ [Auth] Credential validation failed:', validation.issues);
    throw new Error(`Invalid credentials: ${validation.issues.join(', ')}`);
  }
  
  console.log('✅ [Auth] Credential validation passed');

  // Check for cached token
  const cachedToken = await getCachedToken(supabase);
  if (cachedToken) {
    return { accessToken: cachedToken };
  }
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    console.log('🚀 [Auth] Starting fresh authentication');
    console.log('🔑 [Auth] API Key:', apiKey.substring(0, 8) + '...');
    console.log('🗝️ [Auth] RSA Key length:', apiSecret.length);
    console.log('🗝️ [Auth] RSA Key preview:', apiSecret.substring(0, 50) + '...');
    console.log('🌐 [Auth] Auth URL:', authUrl);

    // Create timestamp and payload with minimal size
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);
    
    const payloadObj = {
      client_id: apiKey,
      timestamp: timestamp.toString()
    };
    const jsonPayload = JSON.stringify(payloadObj);
    
    console.log('📝 [Auth] Current time:', now.toISOString());
    console.log('📝 [Auth] Unix timestamp (seconds):', timestamp);
    console.log('📝 [Auth] JSON payload:', jsonPayload);
    console.log('📏 [Auth] Payload length:', jsonPayload.length, 'characters');
    
    // Encrypt the payload using the enhanced RSA encryption
    const idToken = await rsaEncrypt(jsonPayload, apiSecret);
    console.log('✅ [Auth] RSA encryption successful');
    console.log('🎫 [Auth] ID Token length:', idToken.length);
    console.log('🎫 [Auth] ID Token preview:', idToken.substring(0, 50) + '...');
    
    // Send request body exactly like Postman
    const requestBody = {
      client_id: apiKey,
      id_token: idToken
    };
    
    console.log('📤 [Auth] Request body keys:', Object.keys(requestBody));
    console.log('📤 [Auth] Client ID in body:', requestBody.client_id.substring(0, 8) + '...');
    console.log('📤 [Auth] Making request to:', authUrl);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Perfect-Corp-S2S-Client/1.0'
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📥 [Auth] Response: ${authResponse.status} ${authResponse.statusText}`);
    console.log(`📋 [Auth] Response headers:`, Object.fromEntries(authResponse.headers.entries()));
    
    const responseText = await authResponse.text();
    console.log(`📄 [Auth] Raw response:`, responseText);
    
    if (authResponse.ok) {
      let authData;
      try {
        authData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ [Auth] Failed to parse response as JSON:`, parseError);
        throw new Error('Invalid JSON response from Perfect Corp API');
      }
      
      console.log(`📊 [Auth] Parsed response:`, authData);
      
      let accessToken: string | null = null;
      let expiresIn: number = 7200;
      
      // Handle different response formats
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
        console.log('🔑 [Auth] Token preview:', accessToken.substring(0, 20) + '...');
        
        // Cache token
        await cacheToken(supabase, accessToken, expiresIn);
        
        return { accessToken };
      } else {
        console.error(`❌ [Auth] No access token in successful response`);
        console.log(`🔍 [Auth] Available fields:`, Object.keys(authData));
        throw new Error('No access token returned from Perfect Corp API');
      }
    } else {
      let errorMessage = `Authentication failed (${authResponse.status})`;
      try {
        const errorData = JSON.parse(responseText);
        
        console.error('❌ [Auth] Error response data:', errorData);
        
        if (errorData.error?.includes('Invalid client_id or invalid id_token')) {
          errorMessage = `Perfect Corp Authentication Error: ${errorData.error}

Troubleshooting steps:
1. Verify PERFECTCORP_API_KEY is correct
2. Verify PERFECTCORP_API_SECRET contains the complete RSA public key  
3. Check that credentials are not expired
4. Ensure RSA key format is correct

Timestamp used: ${timestamp} (${new Date(timestamp * 1000).toISOString()})
Payload: ${jsonPayload}`;
        } else {
          errorMessage = errorData.error || responseText;
        }
      } catch {
        errorMessage = responseText;
      }
      
      console.log(`❌ [Auth] Authentication failed:`, errorMessage);
      throw new Error(errorMessage);
    }
    
  } catch (error) {
    console.error('❌ [Auth] Authentication error:', error);
    
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Perfect Corp API. Check internet connection and API endpoint.');
    }
    
    if (error.message.includes('RSA')) {
      throw new Error(`RSA encryption error: ${error.message}. Please verify the PERFECTCORP_API_SECRET contains a valid RSA public key.`);
    }
    
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
