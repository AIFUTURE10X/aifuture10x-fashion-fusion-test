
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    console.log('🔐 [Proxy] Starting RSA encryption process...');
    console.log('📊 [Proxy] Input data length:', data.length);
    console.log('🔑 [Proxy] Raw key length:', publicKey.length);
    
    // More careful key cleaning - preserve structure but remove headers
    let cleanKey = publicKey.trim();
    
    // Log the first few characters to debug key format
    console.log('🔍 [Proxy] Key starts with:', cleanKey.substring(0, 50));
    
    // Remove PEM headers/footers but preserve line breaks initially
    cleanKey = cleanKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
      .replace(/-----END RSA PUBLIC KEY-----/g, '');
    
    // Now remove whitespace and newlines
    cleanKey = cleanKey.replace(/\s+/g, '').replace(/\n/g, '').replace(/\r/g, '');
    
    console.log('🧹 [Proxy] Cleaned key length:', cleanKey.length);
    console.log('✅ [Proxy] Key format check:', /^[A-Za-z0-9+/]*={0,2}$/.test(cleanKey) ? 'Valid base64' : 'Invalid base64');
    
    if (!cleanKey || cleanKey.length < 100) {
      throw new Error('RSA public key appears to be too short or invalid');
    }
    
    // Validate base64 format more thoroughly
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanKey)) {
      throw new Error('RSA public key is not valid base64 format');
    }
    
    // Convert base64 to ArrayBuffer with better error handling
    let binaryKey: Uint8Array;
    try {
      const binaryString = atob(cleanKey);
      binaryKey = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryKey[i] = binaryString.charCodeAt(i);
      }
      console.log('📦 [Proxy] Binary key length:', binaryKey.length);
    } catch (error) {
      console.error('❌ [Proxy] Base64 decode failed:', error);
      throw new Error('Failed to decode base64 RSA key: ' + error.message);
    }
    
    // Try multiple import approaches
    let cryptoKey;
    const importErrors = [];
    
    // Try different hash algorithms in order of preference
    const hashAlgorithms = ['SHA-256', 'SHA-1'];
    
    for (const hash of hashAlgorithms) {
      try {
        console.log(`🔧 [Proxy] Attempting RSA key import with ${hash}...`);
        cryptoKey = await crypto.subtle.importKey(
          'spki',
          binaryKey,
          {
            name: 'RSA-OAEP',
            hash: hash,
          },
          false,
          ['encrypt']
        );
        console.log(`✅ [Proxy] RSA key imported successfully with ${hash}`);
        break;
      } catch (error) {
        console.log(`❌ [Proxy] ${hash} import failed:`, error.message);
        importErrors.push(`${hash}: ${error.message}`);
      }
    }
    
    if (!cryptoKey) {
      throw new Error('Failed to import RSA key with any hash algorithm. Errors: ' + importErrors.join('; '));
    }

    // Encrypt the data with detailed logging
    console.log('🔒 [Proxy] Encrypting data...');
    const encodedData = new TextEncoder().encode(data);
    console.log('📏 [Proxy] Encoded data length:', encodedData.length);
    
    let encryptedData;
    try {
      encryptedData = await crypto.subtle.encrypt(
        'RSA-OAEP',
        cryptoKey,
        encodedData
      );
      console.log('🎯 [Proxy] Encryption successful, result length:', encryptedData.byteLength);
    } catch (error) {
      console.error('❌ [Proxy] Encryption operation failed:', error);
      throw new Error('RSA encryption operation failed: ' + error.message);
    }

    // Convert to base64
    const encryptedArray = new Uint8Array(encryptedData);
    const base64Result = btoa(String.fromCharCode(...encryptedArray));
    
    console.log('📊 [Proxy] Final encrypted result length:', base64Result.length);
    console.log('🎉 [Proxy] RSA encryption completed successfully');
    
    return base64Result;
    
  } catch (error) {
    console.error('💥 [Proxy] RSA encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string, supabase: any): Promise<AuthResult> {
  console.log('🔐 Proxy Auth: Step 1: Authenticating with Perfect Corp S2S API using enhanced RSA encryption...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('🧪 Proxy Auth: Running in mock mode - using test token');
    return { accessToken: 'mock_token_for_testing' };
  }

  // Check for existing valid token using the database function
  try {
    console.log('🔍 Proxy Auth: Checking for existing valid token...');
    const { data: tokenData, error: tokenError } = await supabase.rpc('get_valid_perfect_corp_token');
    
    if (tokenError) {
      console.warn('⚠️ Proxy Auth: Error checking for existing token:', tokenError);
    } else if (tokenData && tokenData.length > 0) {
      const token = tokenData[0];
      console.log(`✅ Proxy Auth: Found valid token, expires in ${token.seconds_until_expiry} seconds`);
      return { accessToken: token.access_token };
    } else {
      console.log('📭 Proxy Auth: No valid token found, proceeding with authentication...');
    }
  } catch (error) {
    console.warn('⚠️ Proxy Auth: Failed to check existing token, proceeding with authentication:', error);
  }
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    console.log('🚀 Proxy Auth: Attempting Perfect Corp S2S authentication with enhanced RSA encryption...');
    console.log('🎯 Proxy Auth: Auth URL:', authUrl);
    console.log('🔑 Proxy Auth: Using API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT PROVIDED');
    console.log('🗝️ Proxy Auth: Using API Secret:', apiSecret ? 'PROVIDED' : 'NOT PROVIDED');
    
    // Validate that we have real credentials
    if (!apiKey || apiKey === 'your_api_key_here' || apiKey.includes('placeholder')) {
      throw new Error('Real Perfect Corp API key not configured. Please update PERFECTCORP_API_KEY in Supabase secrets.');
    }
    
    if (!apiSecret || apiSecret === 'your_api_secret_here' || apiSecret.includes('placeholder')) {
      throw new Error('Real Perfect Corp API secret not configured. Please update PERFECTCORP_API_SECRET in Supabase secrets.');
    }
    
    // Enhanced data format for Perfect Corp API
    const timestamp = Date.now();
    console.log('⏰ Proxy Auth: Generated timestamp:', timestamp);
    
    // Try multiple data formats - Perfect Corp might be picky about format
    const dataFormats = [
      `client_id=${apiKey}&timestamp=${timestamp}`,
      `{"client_id":"${apiKey}","timestamp":${timestamp}}`,
      `client_id=${apiKey}&timestamp=${Math.floor(timestamp/1000)}`, // Unix timestamp
    ];
    
    console.log('🔐 Proxy Auth: Attempting RSA encryption with multiple data formats...');

    let encryptedToken;
    let successfulFormat = '';
    
    for (const dataFormat of dataFormats) {
      try {
        console.log('🧪 Proxy Auth: Trying data format:', dataFormat.substring(0, 50) + '...');
        encryptedToken = await encryptWithRSA(dataFormat, apiSecret);
        successfulFormat = dataFormat;
        console.log('✅ Proxy Auth: Successfully encrypted with format:', successfulFormat.substring(0, 50) + '...');
        break;
      } catch (error) {
        console.log('❌ Proxy Auth: Format failed:', error.message);
        continue;
      }
    }
    
    if (!encryptedToken) {
      throw new Error('Failed to encrypt authentication data with any format');
    }
    
    // Use the correct format from Perfect Corp documentation
    const requestBody = {
      client_id: apiKey,
      id_token: encryptedToken
    };
    
    console.log('📤 Proxy Auth: CRITICAL - About to make POST request to Perfect Corp');
    console.log('🎯 Proxy Auth: URL:', authUrl);
    console.log('📝 Proxy Auth: Method: POST');
    console.log('📋 Proxy Auth: Headers: Content-Type: application/json, Accept: application/json');
    console.log('📦 Proxy Auth: Body keys:', Object.keys(requestBody));
    console.log('📊 Proxy Auth: Using data format:', successfulFormat.substring(0, 50) + '...');
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📥 Proxy Auth: S2S Auth response status: ${authResponse.status}`);
    console.log(`📥 Proxy Auth: Response headers:`, Object.fromEntries(authResponse.headers.entries()));
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('📊 Proxy Auth: S2S Auth response data keys:', Object.keys(authData));
      
      // Handle different response formats
      let accessToken: string | null = null;
      let expiresIn: number = 3600; // Default 1 hour
      
      if (authData.result?.access_token) {
        accessToken = authData.result.access_token;
        expiresIn = authData.result.expires_in || 3600;
      } else if (authData.access_token) {
        accessToken = authData.access_token;
        expiresIn = authData.expires_in || 3600;
      }
      
      if (accessToken) {
        console.log('✅ Proxy Auth: S2S Authentication successful with enhanced RSA encryption');
        
        // Store the new token in the database
        try {
          const expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();
          
          // Clean up expired tokens first
          await supabase.rpc('cleanup_expired_perfect_corp_tokens');
          
          // Store the new token directly using insert (service_role has access)
          const { error: insertError } = await supabase
            .from('perfect_corp_tokens')
            .insert({
              access_token: accessToken,
              expires_at: expiresAt
            });
            
          if (insertError) {
            console.warn('⚠️ Proxy Auth: Failed to store token in database:', insertError);
          } else {
            console.log('💾 Proxy Auth: Token stored successfully, expires at:', expiresAt);
          }
        } catch (storeError) {
          console.warn('⚠️ Proxy Auth: Error storing token:', storeError);
        }
        
        return { accessToken };
      } else {
        console.error('❌ Proxy Auth: No access token found in response:', authData);
        throw new Error('No access token received from Perfect Corp API');
      }
    }
    
    const errorText = await authResponse.text();
    console.error('❌ Proxy Auth: S2S Auth failed response:', authResponse.status, errorText);
    
    // Enhanced error handling
    let errorMessage = 'Perfect Corp S2S API authentication failed';
    switch (authResponse.status) {
      case 400:
        errorMessage = 'Bad Request: Invalid client_id, malformed id_token, or RSA encryption issue. Please verify API credentials format and RSA public key.';
        break;
      case 401:
        errorMessage = 'Unauthorized: Invalid API credentials or expired key. Please verify your Perfect Corp API key and RSA public key are correct.';
        break;
      case 403:
        errorMessage = 'Forbidden: API key does not have required permissions or is not activated for this service.';
        break;
      case 405:
        errorMessage = 'Method Not Allowed: Perfect Corp received GET request instead of POST. Check for redirects or middleware issues.';
        console.error('🚨 Proxy Auth: 405 METHOD NOT ALLOWED - This indicates Perfect Corp received a GET request instead of POST');
        break;
      case 500:
        errorMessage = 'Internal Server Error: Perfect Corp service unavailable. Please try again later.';
        break;
    }
    
    throw new Error(errorMessage);
    
  } catch (error) {
    console.error('❌ Proxy Auth: S2S Auth error:', error);
    throw new Error(`Perfect Corp S2S API authentication failed: ${error.message}`);
  }
}
