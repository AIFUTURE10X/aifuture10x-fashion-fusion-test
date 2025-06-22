
import { AuthResult } from './types.ts';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('Running in mock mode - using test token');
    return { accessToken: 'mock_token_for_testing' };
  }
  
  const authEndpoint = 'https://openapi.perfectcorp.com/v1/oauth/token';
  
  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', apiKey);
    formData.append('client_secret', apiSecret);
    
    const authResponse = await fetch(authEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      if (authData.access_token) {
        console.log('Authentication successful');
        return { accessToken: authData.access_token };
      }
    }
    
    const errorText = await authResponse.text();
    console.error('Auth failed:', authResponse.status, errorText);
    throw new Error('Authentication failed');
    
  } catch (error) {
    console.error('Auth error:', error);
    throw new Error(`Perfect Corp API authentication failed: ${error.message}`);
  }
}
