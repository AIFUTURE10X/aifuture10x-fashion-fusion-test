
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

// Perfect Corp's RSA public key - REPLACE THIS WITH THE ACTUAL PUBLIC KEY FROM PERFECT CORP
// Get this from Perfect Corp's developer documentation or API documentation
const PERFECTCORP_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
REPLACE_WITH_ACTUAL_PERFECTCORP_RSA_PUBLIC_KEY_FROM_THEIR_DOCUMENTATION
-----END PUBLIC KEY-----`;

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

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp S2S API using RSA encryption...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('Running in mock mode - using test token');
    return { accessToken: 'mock_token_for_testing' };
  }
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    console.log('Attempting Perfect Corp S2S authentication with RSA encryption...');
    console.log('Auth URL:', authUrl);
    console.log('Using API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT PROVIDED');
    console.log('Using API Secret:', apiSecret ? 'PROVIDED' : 'NOT PROVIDED');
    
    // Validate that we have real credentials
    if (!apiKey || apiKey === 'your_api_key_here' || apiKey.includes('placeholder')) {
      throw new Error('Real Perfect Corp API key not configured. Please update PERFECTCORP_API_KEY in Supabase secrets.');
    }
    
    if (!apiSecret || apiSecret === 'your_api_secret_here' || apiSecret.includes('placeholder')) {
      throw new Error('Real Perfect Corp API secret not configured. Please update PERFECTCORP_API_SECRET in Supabase secrets.');
    }
    
    // Check if RSA public key is still placeholder
    if (PERFECTCORP_PUBLIC_KEY.includes('REPLACE_WITH_ACTUAL')) {
      throw new Error('Perfect Corp RSA public key is still a placeholder. Please replace with the actual public key from Perfect Corp documentation.');
    }
    
    // Generate correct data format for encryption
    const timestamp = Date.now();
    const dataToEncrypt = `client_id=${apiKey}&timestamp=${timestamp}`;
    
    console.log('Generated data for RSA encryption');

    // Encrypt the id_token using RSA
    let encryptedToken: string;
    try {
      encryptedToken = await encryptWithRSA(dataToEncrypt, PERFECTCORP_PUBLIC_KEY);
      console.log('Successfully encrypted id_token with RSA');
    } catch (encryptError) {
      console.error('RSA encryption failed:', encryptError);
      throw new Error(`Failed to encrypt authentication token: ${encryptError.message}`);
    }
    
    // Use the correct format from Perfect Corp documentation
    const requestBody = {
      client_id: apiKey,
      id_token: encryptedToken
    };
    
    console.log('Sending authentication request to Perfect Corp...');
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`S2S Auth response status: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('S2S Auth response data keys:', Object.keys(authData));
      
      // Handle different response formats
      let accessToken: string | null = null;
      
      if (authData.result?.access_token) {
        accessToken = authData.result.access_token;
      } else if (authData.access_token) {
        accessToken = authData.access_token;
      }
      
      if (accessToken) {
        console.log('S2S Authentication successful with RSA encryption');
        return { accessToken };
      } else {
        console.error('No access token found in response:', authData);
        throw new Error('No access token received from Perfect Corp API');
      }
    }
    
    const errorText = await authResponse.text();
    console.error('S2S Auth failed response:', authResponse.status, errorText);
    
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
      case 500:
        errorMessage = 'Internal Server Error: Perfect Corp service unavailable';
        break;
    }
    
    throw new Error(errorMessage);
    
  } catch (error) {
    console.error('S2S Auth error:', error);
    throw new Error(`Perfect Corp S2S API authentication failed: ${error.message}`);
  }
}
