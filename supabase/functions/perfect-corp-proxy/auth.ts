
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

// Perfect Corp's RSA public key - this needs to be replaced with the actual key from their documentation
const PERFECTCORP_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2mF8DWKBBxMZgPrjgNB1
xKgJ4RzTm9GGF6QK8wFCfGHp3nQ5vLJYUGZE4zFqVrWaG9pN2X8cE7KhR9TgWz7j
lKpQhUFJGHJGKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMN
VCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVcSD
FGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGhJ
KLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLmN
VCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCsD
-----END PUBLIC KEY-----`;

async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    // Clean the public key
    const keyData = publicKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s+/g, '');
    
    // Decode base64
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
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

    // Encrypt the data
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      'RSA-OAEP',
      cryptoKey,
      encodedData
    );

    // Convert to base64
    const encryptedArray = new Uint8Array(encryptedData);
    return btoa(String.fromCharCode(...encryptedArray));
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
    
    // Generate unique identifier for id_token
    const timestamp = Date.now();
    const uniqueId = `${apiKey}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Generated unique ID for RSA encryption');

    // Encrypt the id_token using RSA
    let encryptedToken: string;
    try {
      encryptedToken = await encryptWithRSA(uniqueId, PERFECTCORP_PUBLIC_KEY);
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
      
      if (authData.access_token) {
        console.log('S2S Authentication successful with RSA encryption');
        return { accessToken: authData.access_token };
      }
    }
    
    const errorText = await authResponse.text();
    console.error('S2S Auth failed response:', authResponse.status, errorText);
    
    // Enhanced error handling
    let errorMessage = 'Perfect Corp S2S API authentication failed';
    switch (authResponse.status) {
      case 400:
        errorMessage = 'Bad Request: Malformed authentication request or invalid RSA encryption';
        break;
      case 401:
        errorMessage = 'Unauthorized: Invalid API key or client_id';
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
