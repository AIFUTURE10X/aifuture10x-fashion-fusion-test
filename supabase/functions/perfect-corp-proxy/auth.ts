
import { AuthResult } from './types.ts';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp...');
  console.log('Using credentials:', {
    clientId: apiKey?.substring(0, 8) + '...',
    clientSecretLength: apiSecret?.length
  });
  
  // Use the correct Perfect Corp OAuth2 endpoint with proper format
  const authResponse = await fetch('https://api.perfectcorp.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': apiKey,
      'client_secret': apiSecret,
      'scope': 'api'
    }).toString(),
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
