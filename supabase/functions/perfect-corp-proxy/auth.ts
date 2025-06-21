
import { AuthResult } from './types.ts';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp...');
  console.log('Using credentials:', {
    clientId: apiKey?.substring(0, 8) + '...',
    clientSecretLength: apiSecret?.length
  });
  
  // Perfect Corp uses OAuth 2.0 client credentials flow
  const authUrl = 'https://openapi.perfectcorp.com/v1/oauth/token';
  
  try {
    console.log('Attempting Perfect Corp OAuth authentication:', authUrl);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': apiKey,
        'client_secret': apiSecret
      }).toString(),
    });

    console.log('Auth response status:', authResponse.status);
    console.log('Auth response headers:', Object.fromEntries(authResponse.headers.entries()));

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.error('Perfect Corp authentication failed:', {
        status: authResponse.status,
        statusText: authResponse.statusText,
        error: authError,
        url: authUrl
      });
      throw new Error(`Authentication failed: ${authResponse.status} - ${authError}`);
    }

    const authData = await authResponse.json();
    console.log('Auth response received:', { 
      status: authResponse.status, 
      hasAccessToken: !!authData.access_token,
      authDataKeys: Object.keys(authData),
      tokenType: authData.token_type
    });
    
    const accessToken = authData.access_token;

    if (!accessToken) {
      console.error('No access token in auth response:', authData);
      throw new Error('No access token received from authentication');
    }

    console.log('Authentication successful, access token received');
    
    return { accessToken };
  } catch (error) {
    console.error('Perfect Corp authentication error:', error);
    throw error;
  }
}
