
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

interface AuthRequest {
  apiKey?: string; // Optional for backwards compatibility
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

// Simplified RSA encryption function
async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    console.log('Starting RSA encryption...');
    
    // Clean and format the public key
    let cleanKey = publicKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
      .replace(/-----END RSA PUBLIC KEY-----/g, '')
      .replace(/\s+/g, '')
      .replace(/\n/g, '')
      .replace(/\r/g, '');
    
    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanKey)) {
      throw new Error('Invalid base64 format in public key');
    }
    
    // Convert base64 to ArrayBuffer
    const binaryString = atob(cleanKey);
    const binaryKey = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      binaryKey[i] = binaryString.charCodeAt(i);
    }
    
    // Import the RSA public key (try SHA-256 first, then SHA-1)
    let cryptoKey;
    try {
      cryptoKey = await crypto.subtle.importKey(
        'spki',
        binaryKey,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );
      console.log('RSA key imported with SHA-256');
    } catch (error) {
      console.log('SHA-256 failed, trying SHA-1...');
      cryptoKey = await crypto.subtle.importKey(
        'spki',
        binaryKey,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-1',
        },
        false,
        ['encrypt']
      );
      console.log('RSA key imported with SHA-1');
    }

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
    
    console.log('RSA encryption successful');
    return base64Result;
    
  } catch (error) {
    console.error('RSA encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

// Add a simple mutex for token caching
const tokenMutex = {
  locked: false,
  queue: [] as Array<() => void>,
  
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  },
  
  release(): void {
    this.locked = false;
    const next = this.queue.shift();
    if (next) {
      this.locked = true;
      next();
    }
  }
};

async function authenticateWithPerfectCorp(): Promise<AuthResponse> {
  try {
    // Acquire mutex to prevent concurrent token requests
    await tokenMutex.acquire();
    
    try {
      // Use service_role key for database operations
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Check for cached token first
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
      
      // Get credentials from environment
      const clientId = Deno.env.get('PERFECTCORP_API_KEY');
      const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
      
      // Validate credentials exist and aren't placeholders
      if (!clientId || clientId.length < 10 || clientId.includes('placeholder') || clientId.includes('your_api_key')) {
        return {
          success: false,
          error: 'Invalid or missing PERFECTCORP_API_KEY. Please configure a valid API key in Supabase secrets.'
        };
      }
      
      if (!clientSecret || clientSecret.length < 100 || clientSecret.includes('placeholder') || clientSecret.includes('REPLACE_WITH_ACTUAL')) {
        return {
          success: false,
          error: 'Invalid or missing PERFECTCORP_API_SECRET. Please configure a valid RSA public key in Supabase secrets.'
        };
      }

      // Generate timestamp and create the data to encrypt
      const timestamp = Date.now();
      const dataToEncrypt = `client_id=${clientId}&timestamp=${timestamp}`;
      
      console.log('Encrypting authentication data...');

      // Encrypt the id_token using RSA
      const encryptedToken = await encryptWithRSA(dataToEncrypt, clientSecret);

      // Make authentication request to Perfect Corp
      console.log('Sending authentication request to Perfect Corp...');
      
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
              errorMessage = 'Unauthorized: Invalid API credentials or expired key. Please verify your Perfect Corp API key and secret.';
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
      console.log('Perfect Corp authentication response received');

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

    } finally {
      tokenMutex.release();
    }

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
        secretLength: clientSecret?.length || 0,
        secretLengthValid: (clientSecret?.length || 0) > 200,
        secretContainsRSAMarker: clientSecret?.includes('MIGfMA0GCSqGSIb3DQEB') || false,
        isLikelyValid: ((clientSecret?.length || 0) > 200 && 
                       !clientSecret?.includes('placeholder') &&
                       !clientSecret?.includes('REPLACE_WITH_ACTUAL') &&
                       (clientSecret?.includes('MIGfMA0GCSqGSIb3DQEB') || clientSecret?.includes('BEGIN PUBLIC KEY')))
      },
      recommendation: (((clientSecret?.length || 0) > 200 && 
                       !clientSecret?.includes('placeholder') &&
                       !clientSecret?.includes('REPLACE_WITH_ACTUAL') &&
                       (clientSecret?.includes('MIGfMA0GCSqGSIb3DQEB') || clientSecret?.includes('BEGIN PUBLIC KEY'))))
                      ? '✅ Configuration appears valid'
                      : '❌ Please check your PERFECTCORP_API_KEY and PERFECTCORP_API_SECRET in Supabase secrets.'
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
    // For backwards compatibility, accept request body but use environment variables
    const body = await req.json().catch(() => ({}));
    
    console.log('Processing Perfect Corp authentication request...');
    const result = await authenticateWithPerfectCorp();

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
