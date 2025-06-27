
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

// RSA encryption using Web Crypto API
async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    // Clean up the PEM format
    const cleanKey = publicKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\n/g, '')
      .replace(/\r/g, '')
      .trim();

    // Convert base64 to ArrayBuffer
    const keyData = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));

    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );

    // Encrypt the payload
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      data
    );

    // Convert to base64
    const encryptedArray = new Uint8Array(encrypted);
    return btoa(String.fromCharCode(...encryptedArray));
  } catch (error) {
    console.error('❌ [RSA] Encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

// Validate credentials format
function validateCredentials(apiKey: string, apiSecret: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!apiKey) {
    issues.push('API key is missing');
  } else if (apiKey.length < 10) {
    issues.push(`API key too short: ${apiKey.length} characters`);
  } else if (apiKey.includes('test') || apiKey.includes('demo') || apiKey.includes('placeholder')) {
    issues.push('API key appears to be a test/placeholder value');
  }
  
  if (!apiSecret) {
    issues.push('API secret is missing');
  } else if (apiSecret.length < 100) {
    issues.push(`API secret too short: ${apiSecret.length} characters (should be RSA public key)`);
  } else if (!apiSecret.includes('-----BEGIN PUBLIC KEY-----')) {
    issues.push('API secret does not appear to be in PEM format (should be RSA public key)');
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

  // Validate credentials first
  const validation = validateCredentials(apiKey, apiSecret);
  if (!validation.valid) {
    console.error('❌ [Auth] Credential validation failed:');
    validation.issues.forEach(issue => console.error('  -', issue));
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

    // Create the payload to encrypt (following Perfect Corp's sample code)
    const timestamp = Date.now();
    const payload = `client_id=${apiKey}&timestamp=${timestamp}`;
    
    console.log('🔒 [Auth] Encrypting payload with RSA...');
    console.log('📝 [Auth] Payload:', payload);
    
    // Encrypt the payload using the RSA public key
    const idToken = await rsaEncrypt(payload, apiSecret);
    console.log('✅ [Auth] RSA encryption successful');
    console.log('🎫 [Auth] ID Token length:', idToken.length);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
      },
      body: JSON.stringify({
        id_token: idToken
      }),
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
      console.log(`❌ [Auth] Authentication failed with status ${authResponse.status}:`, responseText);
      throw new Error(`Authentication failed: ${responseText}`);
    }
    
  } catch (error) {
    console.error('❌ [Auth] Authentication error:', error);
    
    // Provide detailed error context
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Perfect Corp API. Check internet connection and API endpoint.');
    }
    
    if (error.message.includes('RSA')) {
      throw new Error(`RSA encryption error: ${error.message}. Please verify the PERFECTCORP_API_SECRET contains a valid RSA public key in PEM format.`);
    }
    
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
