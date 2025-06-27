
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

// Enhanced RSA encryption with better key format handling
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

    // Determine key size and max payload size
    const keySize = keyData.length;
    let maxPayloadSize: number;
    let keyType: string;
    
    if (keySize <= 162) { // RSA-1024
      maxPayloadSize = 86; // RSA-1024 with OAEP SHA-256 padding
      keyType = 'RSA-1024';
    } else if (keySize <= 294) { // RSA-2048
      maxPayloadSize = 190; // RSA-2048 with OAEP SHA-256 padding
      keyType = 'RSA-2048';
    } else {
      maxPayloadSize = 446; // RSA-4096 with OAEP SHA-256 padding
      keyType = 'RSA-4096';
    }
    
    console.log(`🔑 [RSA] Detected key type: ${keyType}, max payload: ${maxPayloadSize} bytes`);

    // Check payload size
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    console.log('🔐 [RSA] Payload encoded, length:', data.length);
    
    if (data.length > maxPayloadSize) {
      throw new Error(`Payload too large for ${keyType}: ${data.length} bytes (max ${maxPayloadSize} bytes)`);
    }

    // Try multiple encryption approaches
    const encryptionMethods = [
      { name: 'RSA-OAEP with SHA-256', hash: 'SHA-256' },
      { name: 'RSA-OAEP with SHA-1', hash: 'SHA-1' },
    ];

    for (const method of encryptionMethods) {
      try {
        console.log(`🔑 [RSA] Trying ${method.name}...`);
        
        // Import the public key
        const publicKey = await crypto.subtle.importKey(
          'spki',
          keyData,
          {
            name: 'RSA-OAEP',
            hash: method.hash,
          },
          false,
          ['encrypt']
        );
        
        console.log(`✅ [RSA] Successfully imported key with ${method.name}`);

        // Encrypt the payload
        const encrypted = await crypto.subtle.encrypt(
          {
            name: 'RSA-OAEP',
          },
          publicKey,
          data
        );
        
        console.log('✅ [RSA] Encryption successful, result length:', encrypted.byteLength);

        // Convert to base64
        const encryptedArray = new Uint8Array(encrypted);
        const result = btoa(String.fromCharCode(...encryptedArray));
        console.log('✅ [RSA] Final encrypted token length:', result.length);
        console.log('✅ [RSA] Encrypted token preview:', result.substring(0, 50) + '...');
        
        return result;
        
      } catch (methodError) {
        console.log(`⚠️ [RSA] ${method.name} failed:`, methodError.message);
        continue;
      }
    }
    
    throw new Error('All RSA encryption methods failed. The key may be invalid or incompatible.');
    
  } catch (error) {
    console.error('❌ [RSA] Complete encryption process failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

// Enhanced validation with better key format detection
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
      issues.push(`API secret too short: ${cleanKey.length} characters (RSA keys are typically 200+ characters)`);
    }
    
    // Additional validation for common key sizes
    try {
      const keyData = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));
      const keySize = keyData.length;
      
      if (keySize < 100) {
        issues.push(`RSA key data too small: ${keySize} bytes (expected 162+ for RSA-1024, 294+ for RSA-2048)`);
      } else if (keySize <= 162) {
        console.log('🔑 [Validation] Detected RSA-1024 key');
      } else if (keySize <= 294) {
        console.log('🔑 [Validation] Detected RSA-2048 key');
      } else {
        console.log('🔑 [Validation] Detected RSA-4096+ key');
      }
    } catch (validationError) {
      issues.push(`Key validation failed: ${validationError.message}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Get server time from Perfect Corp to sync our timestamp
async function getServerTime(): Promise<number> {
  try {
    const response = await fetch(`${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`, {
      method: 'HEAD',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const serverDate = response.headers.get('date');
    if (serverDate) {
      const serverTime = new Date(serverDate).getTime();
      console.log('🕐 [Time] Server time:', new Date(serverTime).toISOString());
      console.log('🕐 [Time] Local time:', new Date().toISOString());
      console.log('🕐 [Time] Time difference:', Math.abs(serverTime - Date.now()), 'ms');
      return serverTime;
    }
  } catch (error) {
    console.log('⚠️ [Time] Could not get server time, using local time:', error.message);
  }
  
  return Date.now();
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

    // FIXED: Get synchronized timestamp from server
    const timestamp = await getServerTime();
    const payloadObj = {
      client_id: apiKey,
      timestamp: Math.floor(timestamp / 1000).toString() // Convert to seconds and stringify
    };
    const payload = JSON.stringify(payloadObj);
    
    console.log('📝 [Auth] Payload object:', payloadObj);
    console.log('📝 [Auth] JSON payload:', payload);
    console.log('🔒 [Auth] Encrypting payload with RSA...');
    
    // Encrypt the payload using the RSA public key
    const idToken = await rsaEncrypt(payload, apiSecret);
    console.log('✅ [Auth] RSA encryption successful');
    console.log('🎫 [Auth] ID Token length:', idToken.length);
    
    // FIXED: Send client_id as separate field alongside encrypted id_token
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
      // Enhanced error handling for authentication failures
      let errorDetails = '';
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error === 'Invalid client_id or invalid id_token or key expired') {
          errorDetails = `
❌ Perfect Corp Authentication Error Details:
- Status: ${authResponse.status}
- Error: ${errorData.error}
- Error Code: ${errorData.error_code}

🔍 Possible causes:
1. Client ID (${apiKey.substring(0, 8)}...) is not registered with Perfect Corp
2. RSA public key doesn't match the one registered for this client ID
3. Timestamp is too far from server time (check system clock)
4. Account may be suspended or credentials expired

💡 Next steps:
- Verify client ID and RSA public key with Perfect Corp support
- Check if credentials are active and not expired
- Ensure system time is synchronized`;
        } else {
          errorDetails = responseText;
        }
      } catch {
        errorDetails = responseText;
      }
      
      console.log(`❌ [Auth] Authentication failed with status ${authResponse.status}:`, errorDetails);
      throw new Error(`Authentication failed: ${errorDetails}`);
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
