
import { AuthResult } from './types.ts';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp...');
  console.log('Using credentials:', {
    clientId: apiKey?.substring(0, 8) + '...',
    clientSecretLength: apiSecret?.length
  });
  
  // Try multiple authentication endpoints in order
  const authEndpoints = [
    'https://api.perfectcorp.com/v2/oauth/token',
    'https://openapi.perfectcorp.com/v2/oauth/token', 
    'https://api.perfectcorp.com/v1/oauth/token',
    'https://openapi.perfectcorp.com/v1/oauth/token'
  ];
  
  for (const authUrl of authEndpoints) {
    try {
      console.log(`Attempting Perfect Corp OAuth authentication: ${authUrl}`);
      
      // Create form data for OAuth 2.0 client credentials
      const formData = new FormData();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', apiKey);
      formData.append('client_secret', apiSecret);
      
      const authResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0'
        },
        body: formData,
      });

      console.log(`Auth response status for ${authUrl}:`, authResponse.status);
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('Auth response received:', { 
          endpoint: authUrl,
          status: authResponse.status, 
          hasAccessToken: !!authData.access_token,
          tokenType: authData.token_type
        });
        
        const accessToken = authData.access_token;

        if (!accessToken) {
          console.error('No access token in auth response:', authData);
          continue; // Try next endpoint
        }

        console.log('Authentication successful with endpoint:', authUrl);
        return { accessToken };
      } else {
        const authError = await authResponse.text();
        console.log(`Auth failed for ${authUrl}:`, {
          status: authResponse.status,
          error: authError
        });
        continue; // Try next endpoint
      }
    } catch (error) {
      console.log(`Network error for ${authUrl}:`, error.message);
      continue; // Try next endpoint
    }
  }
  
  // If all endpoints failed, try a mock authentication for testing
  console.log('All Perfect Corp endpoints failed, attempting alternative authentication...');
  
  try {
    // Alternative: Try basic auth approach
    const altAuthUrl = 'https://api.perfectcorp.com/auth/token';
    const authResponse = await fetch(altAuthUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      }),
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Alternative auth successful');
      return { accessToken: authData.access_token || authData.token };
    }
  } catch (error) {
    console.log('Alternative auth also failed:', error.message);
  }
  
  throw new Error('All Perfect Corp authentication endpoints failed. Please verify your API credentials and check if Perfect Corp API is accessible.');
}
