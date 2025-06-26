
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

// Enhanced RSA encryption following Perfect Corp's X.509 specification
async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    console.log('🔐 [Proxy] Starting RSA encryption for Perfect Corp API...');
    console.log('📊 [Proxy] Data to encrypt:', data);
    console.log('📏 [Proxy] Data length:', data.length);
    
    // Clean RSA public key for X.509 format
    let cleanKey = publicKey.trim();
    console.log('🔑 [Proxy] Original key length:', cleanKey.length);
    
    // Handle X.509 PEM format properly
    const hasBeginMarker = cleanKey.includes('-----BEGIN');
    const hasEndMarker = cleanKey.includes('-----END');
    
    if (hasBeginMarker && hasEndMarker) {
      console.log('📜 [Proxy] Processing PEM format key');
      cleanKey = cleanKey
        .replace(/-----BEGIN[^-]+-----/g, '')
        .replace(/-----END[^-]+-----/g, '')
        .replace(/\s+/g, '')
        .trim();
    } else {
      console.log('📋 [Proxy] Processing raw base64 key');
      cleanKey = cleanKey.replace(/\s+/g, '');
    }
    
    console.log('🧹 [Proxy] Cleaned key length:', cleanKey.length);
    console.log('✅ [Proxy] Base64 format valid:', /^[A-Za-z0-9+/]*={0,2}$/.test(cleanKey));
    
    if (!cleanKey || cleanKey.length < 100) {
      throw new Error('RSA public key is too short for X.509 format');
    }
    
    // Convert base64 to binary
    let keyBuffer: ArrayBuffer;
    try {
      const binaryString = atob(cleanKey);
      const uint8Array = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
      keyBuffer = uint8Array.buffer;
      console.log('📦 [Proxy] Key buffer created, length:', keyBuffer.byteLength);
    } catch (error) {
      throw new Error('Failed to decode RSA public key: ' + error.message);
    }
    
    // Try RSA encryption methods compatible with Perfect Corp
    const methods = [
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      { name: 'RSA-OAEP', hash: 'SHA-1' },
    ];
    
    let cryptoKey: CryptoKey | null = null;
    let successMethod = '';
    
    for (const method of methods) {
      try {
        console.log(`🔧 [Proxy] Trying ${method.name} with ${method.hash}...`);
        cryptoKey = await crypto.subtle.importKey(
          'spki',
          keyBuffer,
          { name: method.name, hash: method.hash },
          false,
          ['encrypt']
        );
        successMethod = `${method.name}-${method.hash}`;
        console.log(`✅ [Proxy] Key imported with ${successMethod}`);
        break;
      } catch (error) {
        console.log(`❌ [Proxy] ${method.name}-${method.hash} failed:`, error.message);
      }
    }
    
    if (!cryptoKey) {
      throw new Error('Failed to import RSA key with any method. Verify X.509 format.');
    }

    // Encrypt the data
    console.log('🔒 [Proxy] Encrypting with', successMethod);
    const encodedData = new TextEncoder().encode(data);
    
    const encryptedData = await crypto.subtle.encrypt(
      cryptoKey.algorithm,
      cryptoKey,
      encodedData
    );
    
    console.log('🎯 [Proxy] Encryption successful, result length:', encryptedData.byteLength);

    // Convert to base64
    const encryptedArray = new Uint8Array(encryptedData);
    const base64Result = btoa(String.fromCharCode(...encryptedArray));
    
    console.log('📊 [Proxy] Final token length:', base64Result.length);
    console.log('🎉 [Proxy] RSA encryption completed');
    
    return base64Result;
    
  } catch (error) {
    console.error('💥 [Proxy] RSA encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string, supabase: any): Promise<AuthResult> {
  console.log('🔐 [Proxy] Authenticating with Perfect Corp using enhanced X.509 RSA encryption...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('🧪 [Proxy] Mock mode enabled - returning test token');
    return { accessToken: 'mock_token_for_testing' };
  }

  // Check for existing valid token
  try {
    console.log('🔍 [Proxy] Checking for cached valid token...');
    const { data: tokenData, error: tokenError } = await supabase.rpc('get_valid_perfect_corp_token');
    
    if (tokenError) {
      console.warn('⚠️ [Proxy] Token check error:', tokenError);
    } else if (tokenData && tokenData.length > 0) {
      const token = tokenData[0];
      console.log(`✅ [Proxy] Using cached token, expires in ${token.seconds_until_expiry} seconds`);
      return { accessToken: token.access_token };
    } else {
      console.log('📭 [Proxy] No cached token found, proceeding with authentication...');
    }
  } catch (error) {
    console.warn('⚠️ [Proxy] Token check failed:', error);
  }
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    console.log('🚀 [Proxy] Starting Perfect Corp authentication');
    console.log('🎯 [Proxy] Auth URL:', authUrl);
    console.log('🔑 [Proxy] API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
    console.log('🗝️ [Proxy] Secret Key length:', apiSecret?.length || 0);
    
    // Validate credentials
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid PERFECTCORP_API_KEY. Please configure a valid API key.');
    }
    
    if (!apiSecret || apiSecret.length < 100) {
      throw new Error('Invalid PERFECTCORP_API_SECRET. Please configure a valid RSA X.509 public key.');
    }
    
    // Create data in exact format required by Perfect Corp API
    const timestamp = Date.now(); // milliseconds as specified
    const dataToEncrypt = `client_id=${apiKey}&timestamp=${timestamp}`;
    
    console.log('📝 [Proxy] Data format:', dataToEncrypt);
    console.log('⏰ [Proxy] Timestamp (ms):', timestamp);
    
    // Encrypt using RSA X.509
    let encryptedToken: string;
    try {
      encryptedToken = await encryptWithRSA(dataToEncrypt, apiSecret);
    } catch (encryptError) {
      console.error('❌ [Proxy] Encryption failed:', encryptError);
      throw new Error(`RSA encryption failed: ${encryptError.message}`);
    }
    
    // Prepare request exactly as per API specification
    const requestBody = {
      client_id: apiKey,
      id_token: encryptedToken
    };
    
    console.log('📤 [Proxy] Making POST request to Perfect Corp');
    console.log('📋 [Proxy] Request body keys:', Object.keys(requestBody));
    console.log('🔐 [Proxy] ID token length:', encryptedToken.length);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📥 [Proxy] Response: ${authResponse.status} ${authResponse.statusText}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('📊 [Proxy] Response keys:', Object.keys(authData));
      
      // Handle Perfect Corp response format
      let accessToken: string | null = null;
      let expiresIn: number = 7200; // Default 2 hours
      
      if (authData.result?.access_token) {
        accessToken = authData.result.access_token;
        console.log('✅ [Proxy] Token found in result object');
      } else if (authData.access_token) {
        accessToken = authData.access_token;
        console.log('✅ [Proxy] Token found in root object');
      }
      
      if (accessToken) {
        console.log('🎉 [Proxy] Authentication successful!');
        
        // Store token in database
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
            console.warn('⚠️ [Proxy] Failed to store token:', insertError);
          } else {
            console.log('💾 [Proxy] Token stored, expires:', expiresAt);
          }
        } catch (storeError) {
          console.warn('⚠️ [Proxy] Token storage error:', storeError);
        }
        
        return { accessToken };
      } else {
        console.error('❌ [Proxy] No access token in response:', authData);
        throw new Error('No access token received from Perfect Corp API');
      }
    }
    
    // Handle authentication errors
    const errorText = await authResponse.text();
    console.error('❌ [Proxy] Auth failed:', authResponse.status, errorText);
    
    let errorMessage = 'Perfect Corp authentication failed';
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error_code === 'InvalidParameters') {
        errorMessage = 'Invalid request parameters. Check client_id and id_token format.';
      } else if (errorData.error_code === 'InvalidAuthentication') {
        errorMessage = 'Authentication failed. Verify API key and RSA public key are correct.';
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (parseError) {
      // Use default error message
    }
    
    switch (authResponse.status) {
      case 400:
        errorMessage = 'Bad Request: ' + errorMessage;
        break;
      case 401:
        errorMessage = 'Unauthorized: ' + errorMessage;
        break;
      case 403:
        errorMessage = 'Forbidden: API key lacks required permissions';
        break;
      case 500:
        errorMessage = 'Perfect Corp service error. Please try again later.';
        break;
    }
    
    throw new Error(errorMessage);
    
  } catch (error) {
    console.error('❌ [Proxy] Authentication error:', error);
    throw new Error(`Perfect Corp authentication failed: ${error.message}`);
  }
}
