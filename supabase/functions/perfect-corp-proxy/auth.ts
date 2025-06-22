
import { AuthResult } from './types.ts';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp...');
  console.log('Using credentials:', {
    clientId: apiKey?.substring(0, 8) + '...',
    clientSecretLength: apiSecret?.length
  });
  
  // For testing purposes, if Perfect Corp API is not accessible, 
  // we'll use a mock token to allow the system to work
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('Running in mock mode - using test token');
    return { accessToken: 'mock_token_for_testing' };
  }
  
  // Try the most likely correct Perfect Corp API endpoint first
  const primaryEndpoint = 'https://openapi.perfectcorp.com/api/v1/oauth/token';
  
  try {
    console.log(`Attempting primary Perfect Corp authentication: ${primaryEndpoint}`);
    
    const authResponse = await fetch(primaryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': apiKey,
        'client_secret': apiSecret
      }),
    });

    console.log(`Primary auth response status:`, authResponse.status);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Primary auth response received:', { 
        status: authResponse.status, 
        hasAccessToken: !!authData.access_token,
        tokenType: authData.token_type
      });
      
      if (authData.access_token) {
        console.log('Authentication successful with primary endpoint');
        return { accessToken: authData.access_token };
      }
    } else {
      const authError = await authResponse.text();
      console.log(`Primary auth failed:`, {
        status: authResponse.status,
        error: authError
      });
    }
  } catch (error) {
    console.log(`Primary endpoint error:`, error.message);
  }

  // Try alternative endpoint formats
  const alternativeEndpoints = [
    'https://api.perfectcorp.com/v1/oauth/token',
    'https://openapi.perfectcorp.com/v1/oauth/token',
    'https://api.perfectcorp.com/oauth/token'
  ];
  
  for (const authUrl of alternativeEndpoints) {
    try {
      console.log(`Attempting alternative Perfect Corp authentication: ${authUrl}`);
      
      const authResponse = await fetch(authUrl, {
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

      console.log(`Alternative auth response status for ${authUrl}:`, authResponse.status);
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('Alternative auth response received:', { 
          endpoint: authUrl,
          status: authResponse.status, 
          hasAccessToken: !!(authData.access_token || authData.token),
          tokenType: authData.token_type
        });
        
        const accessToken = authData.access_token || authData.token;

        if (accessToken) {
          console.log('Authentication successful with alternative endpoint:', authUrl);
          return { accessToken };
        }
      } else {
        const authError = await authResponse.text();
        console.log(`Alternative auth failed for ${authUrl}:`, {
          status: authResponse.status,
          error: authError
        });
      }
    } catch (error) {
      console.log(`Alternative endpoint error for ${authUrl}:`, error.message);
    }
  }
  
  // If all real endpoints fail, provide more detailed error information
  console.log('All Perfect Corp authentication endpoints failed.');
  console.log('This could indicate:');
  console.log('1. Invalid API credentials');
  console.log('2. Perfect Corp API is not accessible from this environment');
  console.log('3. API endpoint URLs have changed');
  console.log('4. Network connectivity issues');
  
  throw new Error(`Perfect Corp API authentication failed. Please verify:
1. Your API credentials are correct and active
2. Perfect Corp API is accessible from your deployment environment
3. Your Perfect Corp account has the necessary permissions for virtual try-on API

If you need to test the system, you can set PERFECTCORP_MOCK_MODE=true in your environment variables.`);
}
