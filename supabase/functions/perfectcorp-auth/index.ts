
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

interface AuthRequest {
  apiKey: string;
}

interface PerfectCorpAuthResponse {
  access_token: string;
  expires_in: number;
}

interface AuthResponse {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}

// Perfect Corp's RSA public key - replace with actual key from their documentation
const PERFECTCORP_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2mF8DWKBBxMZgPrjgNB1
xKgJ4RzTm9GGF6QK8wFCfGHp3nQ5vLJYUGZE4zFqVrWaG9pN2X8cE7KhR9TgWz7j
lKpQhUFJGHJGKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMN
VCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVcSD
FGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGhJ
KLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLmN
VCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCSDFGHJKLMNVCsD
-----END PUBLIC KEY-----`;

const PERFECTCORP_AUTH_URL = 'https://yce-api-01.perfectcorp.com/s2s/v1.0/client/auth';

// Cache for storing access tokens
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    // Clean the public key
    const keyData = publicKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s+/g, '');
    
    // Decode base64
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
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

    // Encrypt the data
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      'RSA-OAEP',
      cryptoKey,
      encodedData
    );

    // Convert to base64
    const encryptedArray = new Uint8Array(encryptedData);
    return btoa(String.fromCharCode(...encryptedArray));
  } catch (error) {
    console.error('RSA encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

async function authenticateWithPerfectCorp(apiKey: string): Promise<AuthResponse> {
  try {
    // Check cache first
    const cached = tokenCache.get(apiKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log('Using cached access token');
      return {
        success: true,
        accessToken: cached.token,
        expiresIn: Math.floor((cached.expiresAt - Date.now()) / 1000)
      };
    }

    console.log('Generating new Perfect Corp access token...');
    
    // Generate unique identifier for id_token
    const timestamp = Date.now();
    const uniqueId = `${apiKey}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Generated unique ID for token:', uniqueId.substring(0, 20) + '...');

    // Encrypt the id_token using RSA
    let encryptedToken: string;
    try {
      encryptedToken = await encryptWithRSA(uniqueId, PERFECTCORP_PUBLIC_KEY);
      console.log('Successfully encrypted id_token');
    } catch (encryptError) {
      console.error('Failed to encrypt id_token:', encryptError);
      return {
        success: false,
        error: 'Failed to encrypt authentication token'
      };
    }

    // Make authentication request to Perfect Corp using correct format
    console.log('Sending authentication request to Perfect Corp...');
    console.log('Auth URL:', PERFECTCORP_AUTH_URL);

    const requestBody = {
      client_id: apiKey,
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
            errorMessage = 'Bad Request: Malformed authentication request or invalid client_id/id_token';
            break;
          case 401:
            errorMessage = 'Unauthorized: Invalid API key or client_id';
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
    console.log('Perfect Corp authentication successful');
    console.log('Token expires in:', authData.expires_in, 'seconds');

    // Cache the token (subtract 60 seconds for safety margin)
    const expiresAt = Date.now() + ((authData.expires_in - 60) * 1000);
    tokenCache.set(apiKey, {
      token: authData.access_token,
      expiresAt
    });

    return {
      success: true,
      accessToken: authData.access_token,
      expiresIn: authData.expires_in
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
