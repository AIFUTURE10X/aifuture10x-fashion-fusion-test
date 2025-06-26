
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    // Clean the public key - remove headers and whitespace
    const keyData = publicKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s+/g, '');
    
    // Decode base64 to binary
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
    console.log('Importing RSA public key...');
    
    // Import the public key
    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      binaryKey,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );

    console.log('RSA public key imported successfully');

    // Encrypt the data
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      'RSA-OAEP',
      cryptoKey,
      encodedData
    );

    // Convert to base64
    const encryptedArray = new Uint8Array(encryptedData);
    const base64Result = btoa(String.fromCharCode(...encryptedArray));
    
    console.log('Data encrypted successfully');
    return base64Result;
    
  } catch (error) {
    console.error('RSA encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string, supabase: any): Promise<AuthResult> {
  console.log('🔐 Proxy Auth: Step 1: Authenticating with Perfect Corp S2S API using RSA encryption...');
  
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
    console.log('🚀 Proxy Auth: Attempting Perfect Corp S2S authentication with RSA encryption...');
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
    
    // Generate correct data format for encryption
    const timestamp = Date.now();
    const dataToEncrypt = `client_id=${apiKey}&timestamp=${timestamp}`;
    
    console.log('🔐 Proxy Auth: Generated data for RSA encryption');

    // Encrypt the id_token using RSA
    let encryptedToken: string;
    try {
      encryptedToken = await encryptWithRSA(dataToEncrypt, apiSecret);
      console.log('✅ Proxy Auth: Successfully encrypted id_token with RSA');
    } catch (encryptError) {
      console.error('❌ Proxy Auth: RSA encryption failed:', encryptError);
      throw new Error(`Failed to encrypt authentication token: ${encryptError.message}`);
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
        console.log('✅ Proxy Auth: S2S Authentication successful with RSA encryption');
        
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
        errorMessage = 'Bad Request: Invalid client_id, malformed id_token, or RSA encryption issue';
        break;
      case 401:
        errorMessage = 'Unauthorized: Invalid API credentials. Please verify your Perfect Corp API key and secret';
        break;
      case 403:
        errorMessage = 'Forbidden: API key does not have required permissions';
        break;
      case 405:
        errorMessage = 'Method Not Allowed: Perfect Corp received GET request instead of POST. Check for redirects or middleware issues.';
        console.error('🚨 Proxy Auth: 405 METHOD NOT ALLOWED - This indicates Perfect Corp received a GET request instead of POST');
        break;
      case 500:
        errorMessage = 'Internal Server Error: Perfect Corp service unavailable';
        break;
    }
    
    throw new Error(errorMessage);
    
  } catch (error) {
    console.error('❌ Proxy Auth: S2S Auth error:', error);
    throw new Error(`Perfect Corp S2S API authentication failed: ${error.message}`);
  }
}
