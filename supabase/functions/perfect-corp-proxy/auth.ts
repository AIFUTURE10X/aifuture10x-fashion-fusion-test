
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

// RSA encryption using Web Crypto API - Enhanced version
async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting encryption process...');
    console.log('🔐 [RSA] Payload to encrypt:', payload);
    console.log('🔐 [RSA] Public key length:', publicKeyPem.length);
    
    // Clean and format the public key
    let cleanKey = publicKeyPem.trim();
    
    // Remove any existing headers and whitespace
    cleanKey = cleanKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
      .replace(/-----END RSA PUBLIC KEY-----/g, '')
      .replace(/\s/g, '')
      .replace(/\n/g, '')
      .replace(/\r/g, '');

    console.log('🔐 [RSA] Cleaned key length:', cleanKey.length);
    console.log('🔐 [RSA] Cleaned key preview:', cleanKey.substring(0, 50) + '...');

    if (cleanKey.length === 0) {
      throw new Error('Empty key content after cleaning');
    }

    // Convert base64 to ArrayBuffer
    let keyData: Uint8Array;
    try {
      keyData = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));
      console.log('✅ [RSA] Successfully decoded base64, length:', keyData.length);
    } catch (decodeError) {
      console.error('❌ [RSA] Base64 decode failed:', decodeError);
      throw new Error(`Invalid base64 in RSA key: ${decodeError.message}`);
    }

    // Import the public key with enhanced error handling
    let publicKey: CryptoKey;
    try {
      // Try SPKI format first (most common)
      publicKey = await crypto.subtle.importKey(
        'spki',
        keyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );
      console.log('✅ [RSA] Successfully imported RSA key (SPKI format)');
    } catch (spkiError) {
      console.log('⚠️ [RSA] SPKI import failed, trying PKCS1 format...');
      try {
        // Try different hash algorithms
        publicKey = await crypto.subtle.importKey(
          'spki',
          keyData,
          {
            name: 'RSA-OAEP',
            hash: 'SHA-1',
          },
          false,
          ['encrypt']
        );
        console.log('✅ [RSA] Successfully imported RSA key (SHA-1 hash)');
      } catch (sha1Error) {
        console.error('❌ [RSA] Both SPKI formats failed:', spkiError, sha1Error);
        throw new Error(`Failed to import RSA key. Ensure it's a valid RSA public key in SPKI/PKCS#8 format. Original error: ${spkiError.message}`);
      }
    }

    // Encrypt the payload with enhanced error handling
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    console.log('🔐 [RSA] Payload encoded, length:', data.length);
    
    // Check payload size against key size
    if (data.length > 190) { // RSA-2048 with OAEP padding limit
      throw new Error(`Payload too large for RSA encryption: ${data.length} bytes (max ~190 bytes)`);
    }
    
    let encrypted: ArrayBuffer;
    try {
      encrypted = await crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey,
        data
      );
      console.log('✅ [RSA] Encryption successful, result length:', encrypted.byteLength);
    } catch (encryptError) {
      console.error('❌ [RSA] Encryption failed:', encryptError);
      console.error('❌ [RSA] Payload length:', data.length);
      console.error('❌ [RSA] Key info available:', !!publicKey);
      throw new Error(`RSA encryption failed: ${encryptError.message}. Check that the key is valid and payload size is appropriate.`);
    }

    // Convert to base64
    const encryptedArray = new Uint8Array(encrypted);
    const result = btoa(String.fromCharCode(...encryptedArray));
    console.log('✅ [RSA] Final encrypted token length:', result.length);
    console.log('✅ [RSA] Encrypted token preview:', result.substring(0, 50) + '...');
    
    return result;
  } catch (error) {
    console.error('❌ [RSA] Complete encryption process failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

// Enhanced validation function
function validateCredentials(apiKey: string, apiSecret: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!apiKey) {
    issues.push('API key is missing');
  } else if (apiKey.length < 10) {
    issues.push(`API key too short: ${apiKey.length} characters`);
  }
  
  if (!apiSecret) {
    issues.push('API secret is missing');
  } else {
    console.log('🔍 [Validation] Checking API secret format...');
    console.log('🔍 [Validation] Secret length:', apiSecret.length);
    console.log('🔍 [Validation] Secret preview:', apiSecret.substring(0, 100) + '...');
    
    // Clean the key for validation
    const cleanKey = apiSecret
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
      .replace(/-----END RSA PUBLIC KEY-----/g, '')
      .replace(/\s/g, '');
    
    const isLikelyBase64 = /^[A-Za-z0-9+/]+=*$/.test(cleanKey);
    
    console.log('🔍 [Validation] Cleaned key length:', cleanKey.length);
    console.log('🔍 [Validation] Is likely base64:', isLikelyBase64);
    
    if (!isLikelyBase64) {
      issues.push('API secret does not appear to be valid base64 (should be RSA public key)');
    }
    
    if (cleanKey.length < 100) {
      issues.push(`API secret too short: ${cleanKey.length} characters (RSA keys are typically 300+ characters)`);
    }
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

  // Enhanced validation first
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

    // Create the payload to encrypt (following Perfect Corp's sample code exactly)
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
      throw new Error(`RSA encryption error: ${error.message}. Please verify the PERFECTCORP_API_SECRET contains a valid RSA public key.`);
    }
    
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
