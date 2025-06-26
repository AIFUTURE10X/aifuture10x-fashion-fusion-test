
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

interface AuthRequest {
  apiKey: string;
}

interface PerfectCorpAuthResponse {
  result?: {
    access_token: string;
    expires_in?: number;
  };
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface AuthResponse {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}

const PERFECTCORP_AUTH_URL = 'https://yce-api-01.perfectcorp.com/s2s/v1.0/client/auth';

function formatPEMKey(keyData: string): string {
  // Remove any existing headers/footers and whitespace
  const cleanKey = keyData
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '');
  
  // Add proper PEM headers
  return `-----BEGIN PUBLIC KEY-----\n${cleanKey}\n-----END PUBLIC KEY-----`;
}

async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    // Format the key properly
    const formattedKey = formatPEMKey(publicKey);
    console.log('Using formatted PEM key for encryption');
    
    // Clean the public key - remove headers and whitespace for crypto operations
    const keyData = formattedKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s+/g, '');
    
    // Decode base64 to binary
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
    console.log('Importing RSA public key...');
    
    // Import the public key
    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      binaryKey,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );

    console.log('RSA public key imported successfully');

    // Encrypt the data
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      'RSA-OAEP',
      cryptoKey,
      encodedData
    );

    // Convert to base64
    const encryptedArray = new Uint8Array(encryptedData);
    const base64Result = btoa(String.fromCharCode(...encryptedArray));
    
    console.log('Data encrypted successfully');
    return base64Result;
    
  } catch (error) {
    console.error('RSA encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

async function authenticateWithPerfectCorp(apiKey: string): Promise<AuthResponse> {
  try {
    // Use service_role key for database operations (has RLS access)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for cached token first using the database function
    const { data: existingTokenData } = await supabase.rpc('get_valid_perfect_corp_token');

    if (existingTokenData && existingTokenData.length > 0) {
      const token = existingTokenData[0];
      console.log('Using cached access token');
      return {
        success: true,
        accessToken: token.access_token,
        expiresIn: Math.max(token.seconds_until_expiry, 0)
      };
    }

    console.log('Generating new Perfect Corp access token...');
    console.log('Using API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT PROVIDED');
    
    // Get credentials from environment
    const clientId = Deno.env.get('PERFECTCORP_API_KEY');
    const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
    
    console.log('Perfect Corp Auth Debug:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      secretHasCorrectFormat: clientSecret?.includes('BEGIN PUBLIC KEY') || false,
      timestamp: new Date().toISOString()
    });
    
    // Validate that we have real credentials
    if (!clientId || clientId === 'your_api_key_here' || clientId.includes('placeholder')) {
      return {
        success: false,
        error: 'Real Perfect Corp API key not configured. Please update your API credentials in Supabase secrets.'
      };
    }
    
    if (!clientSecret || clientSecret === 'your_api_secret_here' || clientSecret.includes('placeholder')) {
      return {
        success: false,
        error: 'Real Perfect Corp API secret not configured. Please update your API secret in Supabase secrets.'
      };
    }
    
    // Generate unique identifier for id_token - use the correct format
    const timestamp = Date.now();
    const dataToEncrypt = `client_id=${clientId}&timestamp=${timestamp}`;
    
    console.log('Generated data for encryption:', dataToEncrypt.substring(0, 30) + '...');

    // Encrypt the id_token using RSA
    let encryptedToken: string;
    try {
      encryptedToken = await encryptWithRSA(dataToEncrypt, clientSecret);
      console.log('Successfully encrypted id_token');
    } catch (encryptError) {
      console.error('Failed to encrypt id_token:', encryptError);
      return {
        success: false,
        error: 'Failed to encrypt authentication token. Please verify the RSA public key format in your PERFECTCORP_API_SECRET.'
      };
    }

    // Make authentication request to Perfect Corp using correct format
    console.log('Sending authentication request to Perfect Corp...');
    console.log('Auth URL:', PERFECTCORP_AUTH_URL);

    const requestBody = {
      client_id: clientId,
      id_token: encryptedToken
    };

    const authResponse = await fetch(PERFECTCORP_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`Perfect Corp auth response status: ${authResponse.status}`);

    if (!authResponse.ok) {
      let errorMessage = `Authentication failed with status ${authResponse.status}`;
      
      try {
        const errorData = await authResponse.json();
        console.error('Perfect Corp auth error response:', errorData);
        
        switch (authResponse.status) {
          case 400:
            errorMessage = 'Bad Request: Invalid client_id, malformed id_token, or RSA encryption issue. Check your API credentials format.';
            break;
          case 401:
            errorMessage = 'Unauthorized: Invalid API credentials. Please verify your Perfect Corp API key and secret.';
            break;
          case 403:
            errorMessage = 'Forbidden: API key does not have required permissions';
            break;
          case 500:
            errorMessage = 'Internal Server Error: Perfect Corp service unavailable';
            break;
          default:
            errorMessage = errorData.error || errorMessage;
        }
      } catch (e) {
        console.error('Could not parse error response:', e);
      }

      return {
        success: false,
        error: errorMessage
      };
    }

    const authData: PerfectCorpAuthResponse = await authResponse.json();
    console.log('Perfect Corp authentication response keys:', Object.keys(authData));

    // Handle different response formats
    let accessToken: string;
    let expiresIn: number = 7200; // Default 2 hours

    if (authData.result?.access_token) {
      accessToken = authData.result.access_token;
      expiresIn = authData.result.expires_in || 7200;
    } else if (authData.access_token) {
      accessToken = authData.access_token;
      expiresIn = authData.expires_in || 7200;
    } else {
      console.error('No access token found in response:', authData);
      return {
        success: false,
        error: 'No access token received from Perfect Corp API'
      };
    }

    console.log('Perfect Corp authentication successful');
    console.log('Token expires in:', expiresIn, 'seconds');

    // Cache the token (subtract 60 seconds for safety margin)
    const expiresAt = new Date(Date.now() + ((expiresIn - 60) * 1000));
    
    try {
      // Use direct insert since service_role has RLS access
      await supabase.from('perfect_corp_tokens').insert({
        access_token: accessToken,
        expires_at: expiresAt.toISOString()
      });
      console.log('Token cached successfully');
    } catch (cacheError) {
      console.warn('Failed to cache token:', cacheError);
      // Continue anyway, token is still valid
    }

    return {
      success: true,
      accessToken: accessToken,
      expiresIn: expiresIn
    };

  } catch (error) {
    console.error('Perfect Corp authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Test endpoint for configuration validation
  if (req.url.endsWith('/test')) {
    const clientId = Deno.env.get('PERFECTCORP_API_KEY');
    const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
    
    const validation = {
      status: 'Configuration Test',
      timestamp: new Date().toISOString(),
      checks: {
        hasClientId: !!clientId,
        clientIdLength: clientId?.length || 0,
        clientIdValid: (clientId?.length || 0) > 10 && !clientId?.includes('placeholder'),
        hasClientSecret: !!clientSecret,
        secretStartsWith: clientSecret?.substring(0, 20) + '...' || 'NOT SET',
        secretContainsPEMHeader: clientSecret?.includes('-----BEGIN PUBLIC KEY-----') || false,
        secretContainsPEMFooter: clientSecret?.includes('-----END PUBLIC KEY-----') || false,
        secretLength: clientSecret?.length || 0,
        secretLengthValid: (clientSecret?.length || 0) > 200,
        isLikelyValid: (clientSecret?.length || 0) > 200 && 
                       !clientSecret?.includes('placeholder') &&
                       !clientSecret?.includes('REPLACE_WITH_ACTUAL')
      },
      recommendation: ((clientSecret?.length || 0) > 200 && 
                      !clientSecret?.includes('placeholder') &&
                      !clientSecret?.includes('REPLACE_WITH_ACTUAL'))
                      ? '✅ Configuration appears valid'
                      : '❌ Please check your PERFECTCORP_API_KEY and PERFECTCORP_API_SECRET in Supabase secrets'
    };
    
    return new Response(
      JSON.stringify(validation, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { apiKey }: AuthRequest = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing Perfect Corp authentication request...');
    const result = await authenticateWithPerfectCorp(apiKey);

    const statusCode = result.success ? 200 : 400;
    
    return new Response(
      JSON.stringify(result),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Perfect Corp auth endpoint error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
