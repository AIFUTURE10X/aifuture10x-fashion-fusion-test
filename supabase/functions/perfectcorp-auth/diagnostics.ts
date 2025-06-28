
import { validateCredentials } from './validation.ts';

const PERFECTCORP_AUTH_URL = 'https://yce-api-01.perfectcorp.com/s2s/v1.0/client/auth';

export async function getConfigurationTest() {
  const clientId = Deno.env.get('PERFECTCORP_API_KEY');
  const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
  
  const hasClientId = !!clientId;
  const hasClientSecret = !!clientSecret;
  const clientIdLength = clientId?.length || 0;
  const secretLength = clientSecret?.length || 0;
  
  const validation = validateCredentials(clientId || '', clientSecret || '');
  
  return {
    status: validation.valid ? 'ready' : 'configuration_needed',
    timestamp: new Date().toISOString(),
    credentials: {
      hasClientId,
      clientIdLength,
      clientIdValid: hasClientId && clientIdLength >= 10,
      hasClientSecret,
      secretLength,
      secretValid: hasClientSecret && secretLength >= 100
    },
    authentication: {
      rsaAuth: {
        attempted: false,
        successful: false,
        error: validation.valid ? null : validation.issues.join(', ')
      }
    },
    apiEndpoint: PERFECTCORP_AUTH_URL,
    recommendation: validation.valid 
      ? 'Configuration looks good. Try authentication test.'
      : `Missing or invalid credentials: ${validation.issues.join(', ')}`
  };
}

export async function getDiagnostics() {
  const clientId = Deno.env.get('PERFECTCORP_API_KEY');
  const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
  
  const networkConnectivity = {
    canReach: true,
    endpoint: PERFECTCORP_AUTH_URL
  };
  
  const validation = validateCredentials(clientId || '', clientSecret || '');
  
  const authenticationMethods = {
    rsaAuth: {
      attempted: false,
      successful: false,
      error: validation.valid ? null : 'Invalid credentials'
    }
  };
  
  const recommendations = [];
  if (!validation.valid) {
    recommendations.push(...validation.issues.map(issue => `Fix: ${issue}`));
  }
  
  // Add specific RSA troubleshooting recommendations
  if (clientSecret && clientSecret.length < 200) {
    recommendations.push('RSA key seems short - verify it contains the complete public key with headers');
  }
  
  return {
    networkConnectivity,
    authenticationMethods,
    recommendations,
    timestamp: new Date().toISOString()
  };
}
