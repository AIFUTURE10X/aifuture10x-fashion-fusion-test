
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

// Enhanced RSA encryption function with better key handling
async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    console.log('🔐 Starting RSA encryption process...');
    console.log('📊 Input data length:', data.length);
    console.log('🔑 Raw key length:', publicKey.length);
    
    // More careful key cleaning - preserve structure but remove headers
    let cleanKey = publicKey.trim();
    
    // Log the first few characters to debug key format
    console.log('🔍 Key starts with:', cleanKey.substring(0, 50));
    
    // Remove PEM headers/footers but preserve line breaks initially
    cleanKey = cleanKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
      .replace(/-----END RSA PUBLIC KEY-----/g, '');
    
    // Now remove whitespace and newlines
    cleanKey = cleanKey.replace(/\s+/g, '').replace(/\n/g, '').replace(/\r/g, '');
    
    console.log('🧹 Cleaned key length:', cleanKey.length);
    console.log('✅ Key format check:', /^[A-Za-z0-9+/]*={0,2}$/.test(cleanKey) ? 'Valid base64' : 'Invalid base64');
    
    if (!cleanKey || cleanKey.length < 100) {
      throw new Error('RSA public key appears to be too short or invalid');
    }
    
    // Validate base64 format more thoroughly
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanKey)) {
      throw new Error('RSA public key is not valid base64 format');
    }
    
    // Convert base64 to ArrayBuffer with better error handling
    let binaryKey: Uint8Array;
    try {
      const binaryString = atob(cleanKey);
      binaryKey = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryKey[i] = binaryString.charCodeAt(i);
      }
      console.log('📦 Binary key length:', binaryKey.length);
    } catch (error) {
      console.error('❌ Base64 decode failed:', error);
      throw new Error('Failed to decode base64 RSA key: ' + error.message);
    }
    
    // Try multiple import approaches
    let cryptoKey;
    const importErrors = [];
    
    // Try different hash algorithms in order of preference
    const hashAlgorithms = ['SHA-256', 'SHA-1'];
    
    for (const hash of hashAlgorithms) {
      try {
        console.log(`🔧 Attempting RSA key import with ${hash}...`);
        cryptoKey = await crypto.subtle.importKey(
          'spki',
          binaryKey,
          {
            name: 'RSA-OAEP',
            hash: hash,
          },
          false,
          ['encrypt']
        );
        console.log(`✅ RSA key imported successfully with ${hash}`);
        break;
      } catch (error) {
        console.log(`❌ ${hash} import failed:`, error.message);
        importErrors.push(`${hash}: ${error.message}`);
      }
    }
    
    if (!cryptoKey) {
      throw new Error('Failed to import RSA key with any hash algorithm. Errors: ' + importErrors.join('; '));
    }

    // Encrypt the data with detailed logging
    console.log('🔒 Encrypting data...');
    const encodedData = new TextEncoder().encode(data);
    console.log('📏 Encoded data length:', encodedData.length);
    
    let encryptedData;
    try {
      encryptedData = await crypto.subtle.encrypt(
        'RSA-OAEP',
        cryptoKey,
        encodedData
      );
      console.log('🎯 Encryption successful, result length:', encryptedData.byteLength);
    } catch (error) {
      console.error('❌ Encryption operation failed:', error);
      throw new Error('RSA encryption operation failed: ' + error.message);
    }

    // Convert to base64
    const encryptedArray = new Uint8Array(encryptedData);
    const base64Result = btoa(String.fromCharCode(...encryptedArray));
    
    console.log('📊 Final encrypted result length:', base64Result.length);
    console.log('🎉 RSA encryption completed successfully');
    
    return base64Result;
    
  } catch (error) {
    console.error('💥 RSA encryption failed:', error);
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
        console.log('✅ Using cached access token, expires in', token.seconds_until_expiry, 'seconds');
        return {
          success: true,
          accessToken: token.access_token,
          expiresIn: Math.max(token.seconds_until_expiry, 0)
        };
      }

      console.log('🔄 Generating new Perfect Corp access token...');
      
      // Get credentials from environment
      const clientId = Deno.env.get('PERFECTCORP_API_KEY');
      const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
      
      console.log('🔍 Validating credentials...');
      console.log('📋 Client ID length:', clientId?.length || 0);
      console.log('📋 Client Secret length:', clientSecret?.length || 0);
      
      // Enhanced credential validation
      if (!clientId || clientId.length < 10 || clientId.includes('placeholder') || clientId.includes('your_api_key')) {
        console.error('❌ Invalid PERFECTCORP_API_KEY detected');
        return {
          success: false,
          error: 'Invalid or missing PERFECTCORP_API_KEY. Please configure a valid API key in Supabase secrets.'
        };
      }
      
      if (!clientSecret || clientSecret.length < 100 || clientSecret.includes('placeholder') || clientSecret.includes('REPLACE_WITH_ACTUAL')) {
        console.error('❌ Invalid PERFECTCORP_API_SECRET detected');
        return {
          success: false,
          error: 'Invalid or missing PERFECTCORP_API_SECRET. Please configure a valid RSA public key in Supabase secrets.'
        };
      }

      // Enhanced data format for Perfect Corp API
      const timestamp = Date.now();
      console.log('⏰ Generated timestamp:', timestamp);
      
      // Try multiple data formats - Perfect Corp might be picky about format
      const dataFormats = [
        `client_id=${clientId}&timestamp=${timestamp}`,
        `{"client_id":"${clientId}","timestamp":${timestamp}}`,
        `client_id=${clientId}&timestamp=${Math.floor(timestamp/1000)}`, // Unix timestamp
      ];
      
      let encryptedToken;
      let successfulFormat = '';
      
      for (const dataFormat of dataFormats) {
        try {
          console.log('🧪 Trying data format:', dataFormat.substring(0, 50) + '...');
          encryptedToken = await encryptWithRSA(dataFormat, clientSecret);
          successfulFormat = dataFormat;
          console.log('✅ Successfully encrypted with format:', successfulFormat.substring(0, 50) + '...');
          break;
        } catch (error) {
          console.log('❌ Format failed:', error.message);
          continue;
        }
      }
      
      if (!encryptedToken) {
        throw new Error('Failed to encrypt authentication data with any format');
      }

      // Make authentication request to Perfect Corp with enhanced logging
      console.log('🚀 CRITICAL: Making POST request to Perfect Corp');
      console.log('🎯 URL:', PERFECTCORP_AUTH_URL);
      console.log('📝 Method: POST');
      console.log('📊 Using data format:', successfulFormat.substring(0, 50) + '...');
      
      const requestBody = {
        client_id: clientId,
        id_token: encryptedToken
      };

      console.log('📤 Request body keys:', Object.keys(requestBody));
      console.log('📤 ID token length:', encryptedToken.length);

      const authResponse = await fetch(PERFECTCORP_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📥 Perfect Corp response status: ${authResponse.status}`);
      console.log(`📥 Response headers:`, Object.fromEntries(authResponse.headers.entries()));

      if (!authResponse.ok) {
        let errorMessage = `Authentication failed with status ${authResponse.status}`;
        
        try {
          const errorData = await authResponse.json();
          console.error('❌ Perfect Corp error response:', JSON.stringify(errorData, null, 2));
          
          // Enhanced error handling
          switch (authResponse.status) {
            case 400:
              errorMessage = 'Bad Request: Invalid client_id, malformed id_token, or RSA encryption issue. Please verify your API credentials format and the RSA public key.';
              break;
            case 401:
              errorMessage = 'Unauthorized: Invalid API credentials or expired key. Please verify your Perfect Corp API key and RSA public key are correct.';
              break;
            case 403:
              errorMessage = 'Forbidden: API key does not have required permissions or is not activated for this service.';
              break;
            case 405:
              errorMessage = 'Method Not Allowed: This error should not occur with POST requests. Check for redirects or middleware issues.';
              console.error('🚨 405 ERROR: This suggests a configuration issue or the API endpoint has changed');
              break;
            case 500:
              errorMessage = 'Internal Server Error: Perfect Corp service is experiencing issues. Please try again later.';
              break;
            default:
              errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (e) {
          console.error('❌ Could not parse error response:', e);
          const errorText = await authResponse.text();
          console.error('❌ Raw error response:', errorText);
        }

        return {
          success: false,
          error: errorMessage
        };
      }

      const authData: PerfectCorpAuthResponse = await authResponse.json();
      console.log('📦 Perfect Corp authentication response received');
      console.log('📊 Response keys:', Object.keys(authData));

      // Handle different response formats
      let accessToken: string;
      let expiresIn: number = 7200; // Default 2 hours

      if (authData.result?.access_token) {
        accessToken = authData.result.access_token;
        expiresIn = authData.result.expires_in || 7200;
        console.log('✅ Found token in result object');
      } else if (authData.access_token) {
        accessToken = authData.access_token;
        expiresIn = authData.expires_in || 7200;
        console.log('✅ Found token in root object');
      } else {
        console.error('❌ No access token found in response:', authData);
        return {
          success: false,
          error: 'No access token received from Perfect Corp API. Response format may have changed.'
        };
      }

      console.log('🎉 Perfect Corp authentication successful!');
      console.log('⏰ Token expires in:', expiresIn, 'seconds');

      // Cache the token (subtract 60 seconds for safety margin)
      const expiresAt = new Date(Date.now() + ((expiresIn - 60) * 1000));
      
      try {
        await supabase.from('perfect_corp_tokens').insert({
          access_token: accessToken,
          expires_at: expiresAt.toISOString()
        });
        console.log('💾 Token cached successfully, expires at:', expiresAt.toISOString());
      } catch (cacheError) {
        console.warn('⚠️ Failed to cache token:', cacheError);
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
    console.error('💥 Perfect Corp authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

serve(async (req) => {
  console.log(`🌐 Incoming request: ${req.method} ${req.url}`);
  console.log(`🔗 Request headers:`, Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS/CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  // Enhanced test endpoint for debugging
  if (req.url.endsWith('/test')) {
    console.log('🧪 Test endpoint called');
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
        secretContainsPEMHeaders: clientSecret?.includes('BEGIN PUBLIC KEY') || false,
        isLikelyValid: ((clientSecret?.length || 0) > 200 && 
                       !clientSecret?.includes('placeholder') &&
                       !clientSecret?.includes('REPLACE_WITH_ACTUAL') &&
                       (clientSecret?.includes('MIGfMA0GCSqGSIb3DQEB') || clientSecret?.includes('BEGIN PUBLIC KEY')))
      },
      keyAnalysis: {
        firstChars: clientSecret?.substring(0, 50) || 'N/A',
        hasLineBreaks: clientSecret?.includes('\n') || false,
        hasPEMFormat: clientSecret?.includes('-----BEGIN') || false,
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
    console.error(`❌ Invalid method: ${req.method} - Expected POST`);
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
    
    console.log('🔐 Processing Perfect Corp authentication request...');
    const result = await authenticateWithPerfectCorp();

    const statusCode = result.success ? 200 : 400;
    console.log(`📤 Returning response with status: ${statusCode}`);
    console.log(`📊 Response success: ${result.success}`);
    
    return new Response(
      JSON.stringify(result),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('💥 Perfect Corp auth endpoint error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
