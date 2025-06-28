
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

// Simplified RSA encryption matching Postman approach
async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting encryption...');
    console.log('🔐 [RSA] Payload:', payload);
    
    // Clean the public key
    let cleanKey = publicKeyPem.trim()
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
      .replace(/-----END RSA PUBLIC KEY-----/g, '')
      .replace(/\s/g, '');

    if (cleanKey.length === 0) {
      throw new Error('Empty key content after cleaning');
    }

    const keyData = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));
    console.log('✅ [RSA] Key decoded, length:', keyData.length);

    // Import the public key with SHA-1 (as Perfect Corp likely uses)
    const publicKey = await crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-1', // Use SHA-1 as it worked in logs
      },
      false,
      ['encrypt']
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      data
    );

    const result = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    console.log('✅ [RSA] Encryption successful, token length:', result.length);
    
    return result;
    
  } catch (error) {
    console.error('❌ [RSA] Encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

function validateCredentials(apiKey: string, apiSecret: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!apiKey || apiKey.length < 10) {
    issues.push('Invalid API key');
  }
  
  if (!apiSecret || apiSecret.length < 100) {
    issues.push('Invalid API secret (RSA key)');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

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
  try {
    const { data: tokenData, error: tokenError } = await supabase.rpc('get_valid_perfect_corp_token');
    
    if (tokenError) {
      console.warn('⚠️ [Auth] Token check error:', tokenError);
    } else if (tokenData && tokenData.length > 0) {
      const token = tokenData[0];
      console.log(`✅ [Auth] Using cached token, expires in ${token.seconds_until_expiry}s`);
      return { accessToken: token.access_token };
    }
  } catch (error) {
    console.warn('⚠️ [Auth] Token check failed:', error);
  }
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    console.log('🚀 [Auth] Starting fresh authentication');
    console.log('🔑 [Auth] API Key:', apiKey.substring(0, 8) + '...');
    console.log('🗝️ [Auth] RSA Key length:', apiSecret.length);
    console.log('🌐 [Auth] Auth URL:', authUrl);

    // SIMPLIFIED: Use current Unix timestamp in seconds (like Postman)
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadObj = {
      client_id: apiKey,
      timestamp: timestamp.toString()
    };
    const payload = JSON.stringify(payloadObj);
    
    console.log('📝 [Auth] Timestamp (seconds):', timestamp);
    console.log('📝 [Auth] Payload object:', payloadObj);
    console.log('📝 [Auth] JSON payload:', payload);
    console.log('🔒 [Auth] Encrypting payload with RSA...');
    
    // Encrypt the payload using the RSA public key
    const idToken = await rsaEncrypt(payload, apiSecret);
    console.log('✅ [Auth] RSA encryption successful');
    console.log('🎫 [Auth] ID Token length:', idToken.length);
    
    // Send exactly like Postman: client_id + id_token
    const requestBody = {
      client_id: apiKey,
      id_token: idToken
    };
    
    console.log('📤 [Auth] Request body structure:', Object.keys(requestBody));
    console.log('📤 [Auth] Client ID in body:', requestBody.client_id.substring(0, 8) + '...');
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
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
        if (errorData.error === 'Invalid client_id or invalid id_token or key expired') {
          errorMessage = `Perfect Corp Authentication Error:
- Status: ${authResponse.status}
- Error: ${errorData.error}
- Error Code: ${errorData.error_code}

This suggests either:
1. The credentials don't match what's registered with Perfect Corp
2. The timestamp format is incorrect  
3. The RSA encryption method doesn't match their requirements

Since Postman works, the issue is in our request format.`;
        } else {
          errorMessage = responseText;
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
