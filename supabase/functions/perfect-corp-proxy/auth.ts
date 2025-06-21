
import { AuthResult } from './types.ts';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp...');
  console.log('Using credentials:', {
    clientId: apiKey?.substring(0, 8) + '...',
    clientSecretLength: apiSecret?.length
  });
  
  // Try the main Perfect Corp authentication endpoint
  let authResponse;
  let authUrl = 'https://api.perfectcorp.com/v2/auth/token';
  
  try {
    console.log('Trying Perfect Corp auth endpoint:', authUrl);
    authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        grant_type: 'client_credentials'
      }),
    });
  } catch (error) {
    console.log('First auth attempt failed, trying alternative endpoint...');
    
    // Try alternative endpoint format
    authUrl = 'https://developer-api.perfectcorp.com/v1/auth/token';
    try {
      authResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: apiKey,
          client_secret: apiSecret,
          grant_type: 'client_credentials'
        }),
      });
    } catch (error2) {
      console.log('Second auth attempt failed, trying basic auth...');
      
      // Try with basic authentication
      const basicAuth = btoa(`${apiKey}:${apiSecret}`);
      authResponse = await fetch('https://api.perfectcorp.com/auth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials'
        }),
      });
    }
  }

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
}
