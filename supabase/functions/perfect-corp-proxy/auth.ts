
import { AuthResult } from './types.ts';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp...');
  console.log('Using credentials:', {
    clientId: apiKey?.substring(0, 8) + '...',
    clientSecretLength: apiSecret?.length
  });
  
  // Check for mock mode first
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('Running in mock mode - using test token');
    return { accessToken: 'mock_token_for_testing' };
  }
  
  // Primary OAuth 2.0 endpoint with form data
  const primaryEndpoint = 'https://openapi.perfectcorp.com/v1/oauth/token';
  
  try {
    console.log(`Attempting OAuth authentication: ${primaryEndpoint}`);
    
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', apiKey);
    formData.append('client_secret', apiSecret);
    
    const authResponse = await fetch(primaryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: formData.toString(),
    });

    console.log(`OAuth response status:`, authResponse.status);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('OAuth response received:', { 
        status: authResponse.status, 
        hasAccessToken: !!authData.access_token,
        tokenType: authData.token_type
      });
      
      if (authData.access_token) {
        console.log('Authentication successful');
        return { accessToken: authData.access_token };
      }
    } else {
      const authError = await authResponse.text();
      console.log(`OAuth failed:`, {
        status: authResponse.status,
        error: authError
      });
    }
  } catch (error) {
    console.log(`OAuth endpoint error:`, error.message);
  }

  // Try basic auth method as fallback
  try {
    console.log('Trying basic authentication method...');
    
    const authResponse = await fetch(primaryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      }),
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      const accessToken = authData.access_token || authData.token;

      if (accessToken) {
        console.log('Basic authentication successful');
        return { accessToken };
      }
    }
  } catch (error) {
    console.log(`Basic auth error:`, error.message);
  }
  
  // If all methods fail, provide detailed error
  console.log('All Perfect Corp authentication methods failed.');
  console.log('This indicates either:');
  console.log('1. Invalid API credentials');
  console.log('2. Perfect Corp API connectivity issues');
  console.log('3. API endpoint changes');
  
  throw new Error(`Perfect Corp API authentication failed. Please verify your API credentials are correct and active. If you need to test the system, you can set PERFECTCORP_MOCK_MODE=true in your environment variables.`);
}
