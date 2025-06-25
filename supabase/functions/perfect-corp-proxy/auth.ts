
import { AuthResult } from './types.ts';

const PERFECTCORP_BASE_URL = 'https://yce-api-01.perfectcorp.com';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp S2S API...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('Running in mock mode - using test token');
    return { accessToken: 'mock_token_for_testing' };
  }
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    console.log('Attempting Perfect Corp S2S authentication...');
    console.log('Auth URL:', authUrl);
    
    // Perfect Corp S2S authentication with client credentials
    const timestamp = Date.now();
    
    // Create a basic id_token for S2S authentication
    // In production, this should use proper RSA encryption
    const idToken = btoa(`client_id=${apiKey}&timestamp=${timestamp}`);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        id_token: idToken
      }),
    });

    console.log(`S2S Auth response status: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('S2S Auth response data keys:', Object.keys(authData));
      
      if (authData.result?.access_token) {
        console.log('S2S Authentication successful with access_token');
        return { accessToken: authData.result.access_token };
      } else if (authData.access_token) {
        console.log('S2S Authentication successful with direct access_token');
        return { accessToken: authData.access_token };
      }
    }
    
    const errorText = await authResponse.text();
    console.error('S2S Auth failed response:', authResponse.status, errorText);
    
    // If S2S auth fails, try using API key as bearer token (fallback)
    console.log('Falling back to using API key as Bearer token');
    return { accessToken: apiKey };
    
  } catch (error) {
    console.error('S2S Auth error:', error);
    throw new Error(`Perfect Corp S2S API authentication failed: ${error.message}`);
  }
}
