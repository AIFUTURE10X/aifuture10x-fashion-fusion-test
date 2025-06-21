
import { AuthResult } from './types.ts';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp...');
  console.log('Using credentials:', {
    clientId: apiKey?.substring(0, 8) + '...',
    clientSecretLength: apiSecret?.length
  });
  
  // Use the correct Perfect Corp authentication endpoint
  const authResponse = await fetch('https://yce-api-01.perfectcorp.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      'grant_type': 'client_credentials',
      'client_id': apiKey,
      'client_secret': apiSecret
    }),
  });

  console.log('Auth response status:', authResponse.status);
  console.log('Auth response headers:', Object.fromEntries(authResponse.headers.entries()));

  if (!authResponse.ok) {
    const authError = await authResponse.text();
    console.error('Perfect Corp authentication failed:', {
      status: authResponse.status,
      statusText: authResponse.statusText,
      error: authError
    });
    
    // Try alternative endpoint if the first one fails
    console.log('Trying alternative authentication endpoint...');
    const altAuthResponse = await fetch('https://api.perfectcorp.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'scope': 'tryon'
      }).toString(),
    });

    if (!altAuthResponse.ok) {
      const altError = await altAuthResponse.text();
      console.error('Alternative authentication also failed:', {
        status: altAuthResponse.status,
        error: altError
      });
      throw new Error(`Authentication failed: ${authResponse.status} - ${authError}. Alternative: ${altAuthResponse.status} - ${altError}`);
    }

    const altAuthData = await altAuthResponse.json();
    console.log('Alternative auth response received:', { 
      status: altAuthResponse.status, 
      hasAccessToken: !!altAuthData.access_token,
      authDataKeys: Object.keys(altAuthData),
      tokenType: altAuthData.token_type
    });
    
    const accessToken = altAuthData.access_token;

    if (!accessToken) {
      console.error('No access token in alternative auth response:', altAuthData);
      throw new Error('No access token received from alternative authentication');
    }

    console.log('Alternative authentication successful, access token received');
    return { accessToken };
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
