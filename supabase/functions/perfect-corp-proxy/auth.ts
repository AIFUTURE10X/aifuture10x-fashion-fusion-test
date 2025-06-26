
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

// Enhanced RSA encryption with comprehensive debugging
async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    console.log('🔐 [Auth] Starting RSA encryption...');
    console.log('📊 [Auth] Data to encrypt:', data);
    console.log('📏 [Auth] Data length:', data.length);
    console.log('🔑 [Auth] Public key preview:', publicKey.substring(0, 50) + '...');
    
    // Clean the key with multiple format support
    let cleanKey = publicKey.trim();
    
    // Handle different key formats
    if (cleanKey.includes('-----BEGIN')) {
      console.log('🔧 [Auth] Detected PEM format key');
      cleanKey = cleanKey
        .replace(/-----BEGIN[^-]+-----/g, '')
        .replace(/-----END[^-]+-----/g, '')
        .replace(/\s+/g, '');
    } else {
      console.log('🔧 [Auth] Detected raw base64 key');
      cleanKey = cleanKey.replace(/\s+/g, '');
    }
    
    console.log('🧹 [Auth] Cleaned key length:', cleanKey.length);
    console.log('🔍 [Auth] Key starts with:', cleanKey.substring(0, 20));
    
    if (!cleanKey || cleanKey.length < 100) {
      throw new Error(`RSA public key too short: ${cleanKey.length} characters`);
    }
    
    // Validate base64
    try {
      atob(cleanKey);
      console.log('✅ [Auth] Base64 validation passed');
    } catch (e) {
      throw new Error('Invalid base64 in RSA public key');
    }
    
    // Convert to binary
    const binaryString = atob(cleanKey);
    const keyBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      keyBuffer[i] = binaryString.charCodeAt(i);
    }
    
    console.log('📦 [Auth] Key buffer length:', keyBuffer.length);
    
    // Try multiple encryption methods
    const methods = [
      { name: 'RSA-OAEP', hash: 'SHA-1' },
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-1' },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    ];
    
    for (const method of methods) {
      try {
        console.log(`🔧 [Auth] Attempting ${method.name} with ${method.hash}...`);
        
        const keyUsage = method.name.includes('OAEP') ? ['encrypt'] : ['sign'];
        
        const cryptoKey = await crypto.subtle.importKey(
          'spki',
          keyBuffer,
          { name: method.name, hash: method.hash },
          false,
          keyUsage
        );
        
        console.log(`✅ [Auth] Key imported successfully with ${method.name}-${method.hash}`);
        
        const encodedData = new TextEncoder().encode(data);
        
        let encryptedData;
        if (method.name.includes('OAEP')) {
          encryptedData = await crypto.subtle.encrypt(
            { name: method.name },
            cryptoKey,
            encodedData
          );
        } else {
          // For signing methods, we'll use sign instead of encrypt
          encryptedData = await crypto.subtle.sign(
            { name: method.name },
            cryptoKey,
            encodedData
          );
        }
        
        console.log('🎯 [Auth] Encryption/signing successful, length:', encryptedData.byteLength);
        
        const encryptedArray = new Uint8Array(encryptedData);
        const base64Result = btoa(String.fromCharCode(...encryptedArray));
        
        console.log('📊 [Auth] Final encrypted length:', base64Result.length);
        console.log('🎉 [Auth] Encryption completed with', method.name, method.hash);
        
        return base64Result;
        
      } catch (error) {
        console.log(`❌ [Auth] ${method.name}-${method.hash} failed:`, error.message);
      }
    }
    
    throw new Error('All RSA encryption methods failed');
    
  } catch (error) {
    console.error('💥 [Auth] RSA encryption error:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

// Alternative authentication methods
async function tryAlternativeAuth(apiKey: string, apiSecret: string): Promise<string | null> {
  console.log('🔄 [Auth] Trying alternative authentication methods...');
  
  // Method 1: Simple timestamp + API key concatenation
  try {
    const timestamp = Date.now();
    const simpleData = `${apiKey}:${timestamp}`;
    console.log('🧪 [Auth] Trying simple concatenation:', simpleData);
    
    const encrypted = await encryptWithRSA(simpleData, apiSecret);
    return encrypted;
  } catch (error) {
    console.log('❌ [Auth] Simple concatenation failed:', error.message);
  }
  
  // Method 2: JSON format
  try {
    const timestamp = Date.now();
    const jsonData = JSON.stringify({
      client_id: apiKey,
      timestamp: timestamp
    });
    console.log('🧪 [Auth] Trying JSON format:', jsonData);
    
    const encrypted = await encryptWithRSA(jsonData, apiSecret);
    return encrypted;
  } catch (error) {
    console.log('❌ [Auth] JSON format failed:', error.message);
  }
  
  // Method 3: URL encoded without timestamp
  try {
    const simpleData = `client_id=${apiKey}`;
    console.log('🧪 [Auth] Trying without timestamp:', simpleData);
    
    const encrypted = await encryptWithRSA(simpleData, apiSecret);
    return encrypted;
  } catch (error) {
    console.log('❌ [Auth] No timestamp method failed:', error.message);
  }
  
  return null;
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
    issues.push(`API secret too short: ${apiSecret.length} characters`);
  } else if (apiSecret.includes('test') || apiSecret.includes('demo') || apiSecret.includes('placeholder')) {
    issues.push('API secret appears to be a test/placeholder value');
  }
  
  // Check if secret looks like a valid RSA key
  if (apiSecret && !apiSecret.includes('BEGIN') && !apiSecret.match(/^[A-Za-z0-9+/=]+$/)) {
    issues.push('API secret does not appear to be valid base64 or PEM format');
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
    console.log('🗝️ [Auth] Secret length:', apiSecret.length);
    console.log('🌐 [Auth] Auth URL:', authUrl);
    
    // Try standard method first
    const timestamp = Date.now();
    const dataToEncrypt = `client_id=${apiKey}&timestamp=${timestamp}`;
    
    console.log('📝 [Auth] Standard auth data:', dataToEncrypt);
    console.log('⏰ [Auth] Timestamp:', timestamp, '(', new Date(timestamp).toISOString(), ')');
    
    let encryptedToken: string;
    try {
      encryptedToken = await encryptWithRSA(dataToEncrypt, apiSecret);
      console.log('✅ [Auth] Standard encryption successful');
    } catch (encryptError) {
      console.error('❌ [Auth] Standard encryption failed:', encryptError.message);
      
      // Try alternative methods
      console.log('🔄 [Auth] Attempting alternative authentication methods...');
      const altToken = await tryAlternativeAuth(apiKey, apiSecret);
      
      if (altToken) {
        encryptedToken = altToken;
        console.log('✅ [Auth] Alternative encryption successful');
      } else {
        throw new Error(`All encryption methods failed. Last error: ${encryptError.message}`);
      }
    }
    
    const requestBody = {
      client_id: apiKey,
      id_token: encryptedToken
    };
    
    console.log('📤 [Auth] Request body structure:', {
      client_id: apiKey.substring(0, 8) + '...',
      id_token_length: encryptedToken.length,
      id_token_preview: encryptedToken.substring(0, 20) + '...'
    });
    
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
    console.log('📋 [Auth] Response headers:', Object.fromEntries(authResponse.headers.entries()));
    
    const responseText = await authResponse.text();
    console.log('📄 [Auth] Raw response:', responseText);
    
    if (authResponse.ok) {
      let authData;
      try {
        authData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [Auth] Failed to parse response as JSON:', parseError);
        throw new Error('Invalid JSON response from Perfect Corp API');
      }
      
      console.log('📊 [Auth] Parsed response:', authData);
      
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
        console.log('🎉 [Auth] Authentication successful!');
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
        console.error('❌ [Auth] No access token in successful response');
        console.log('🔍 [Auth] Available fields:', Object.keys(authData));
        throw new Error('No access token received despite successful response');
      }
    }
    
    // Handle error responses
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ [Auth] Failed to parse error response:', parseError);
      throw new Error(`Authentication failed: ${authResponse.status} ${responseText}`);
    }
    
    console.error('❌ [Auth] Error response:', errorData);
    
    let errorMessage = 'Authentication failed';
    
    if (errorData.error_code === 'InvalidParameters') {
      errorMessage = 'Invalid request parameters - check API key format';
    } else if (errorData.error_code === 'InvalidAuthentication') {
      errorMessage = 'Authentication failed - verify API credentials and RSA key format';
    } else if (errorData.error_code === 'Unauthorized') {
      errorMessage = 'Unauthorized - API key may be invalid or expired';
    } else if (errorData.error) {
      errorMessage = errorData.error;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    }
    
    // Add debugging suggestions
    if (authResponse.status === 401) {
      errorMessage += '. Suggestions: 1) Verify API credentials are not test values, 2) Check if RSA key is in correct format, 3) Ensure timestamp is within acceptable range';
    }
    
    throw new Error(errorMessage);
    
  } catch (error) {
    console.error('❌ [Auth] Authentication error:', error);
    
    // Provide detailed error context
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Perfect Corp API. Check internet connection and API endpoint.');
    }
    
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
