
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

// Perfect Corp's RSA public key - this is a placeholder, replace with actual key from documentation
const PERFECTCORP_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwjw7/oJ+6tYO0qHlvY8d
7HqZzJcK3JtR6xOH7hBzPwQvkAKxK7cO4n8rZfXlFaXxPxYbzJQrKzXQNzRvMJHj
5YQmRbZwVfV0LF3kOFz5M7yXQOzCz2HtNV0wGbLbYxHKxQxGvTf4KzJzRxVfF8R
8XKJ5fLtV3xGxMzNwCzLzBwQvYxKzQ8FzRvXK3hNzVfLwHcOFzKxJfP7xYxQxGV
jZFrZzPzHtKxJzRfVwKfGzCzYxQxGV0LFzKzJjGzVwKzJ5hNzVfLwHcOFzKxJfP
7xYxQxGVjZFrZzPzHtKxJzRfVwKfGzCzYxQxGV0LFzKzJjGzVwKzJ5hNzVfLwHc
QIDAQAB
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
