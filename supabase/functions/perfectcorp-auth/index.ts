
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

interface AuthRequest {
  apiKey?: string; // Optional for backwards compatibility
}

interface PerfectCorpAuthResponse {
  status?: number;
  result?: {
    access_token: string;
  };
  error?: string;
  error_code?: string;
}

interface AuthResponse {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}

const PERFECTCORP_AUTH_URL = 'https://yce-api-01.perfectcorp.com/s2s/v1.0/client/auth';

// Enhanced RSA encryption function following Perfect Corp's X.509 specification
async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    console.log('🔐 Starting RSA encryption process for Perfect Corp...');
    console.log('📊 Input data:', data);
    console.log('📏 Input data length:', data.length);
    
    // Clean the RSA public key - X.509 format processing
    let cleanKey = publicKey.trim();
    console.log('🔑 Original key length:', cleanKey.length);
    console.log('🔍 Key preview:', cleanKey.substring(0, 100) + '...');
    
    // Handle X.509 format - preserve structure for proper parsing
    const hasBeginMarker = cleanKey.includes('-----BEGIN');
    const hasEndMarker = cleanKey.includes('-----END');
    
    if (hasBeginMarker && hasEndMarker) {
      console.log('📜 Detected PEM format with headers');
      // Remove PEM headers but preserve the base64 content structure
      cleanKey = cleanKey
        .replace(/-----BEGIN[^-]+-----/g, '')
        .replace(/-----END[^-]+-----/g, '')
        .replace(/\s+/g, '') // Remove all whitespace
        .trim();
    } else {
      console.log('📋 Raw base64 format detected');
      // Remove any whitespace from raw base64
      cleanKey = cleanKey.replace(/\s+/g, '');
    }
    
    console.log('🧹 Cleaned key length:', cleanKey.length);
    console.log('✅ Base64 validation:', /^[A-Za-z0-9+/]*={0,2}$/.test(cleanKey) ? 'Valid' : 'Invalid');
    
    if (!cleanKey || cleanKey.length < 100) {
      throw new Error('RSA public key is too short or invalid for X.509 format');
    }
    
    // Convert base64 to binary for crypto operations
    let keyBuffer: ArrayBuffer;
    try {
      const binaryString = atob(cleanKey);
      const uint8Array = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
      keyBuffer = uint8Array.buffer;
      console.log('📦 Key buffer length:', keyBuffer.byteLength);
    } catch (error) {
      console.error('❌ Base64 decode failed:', error);
      throw new Error('Failed to decode RSA public key: ' + error.message);
    }
    
    // Try different RSA encryption methods - Perfect Corp might use PKCS#1 instead of OAEP
    const encryptionMethods = [
      // Method 1: RSA-OAEP with SHA-256
      { algorithm: { name: 'RSA-OAEP', hash: 'SHA-256' }, format: 'spki' as const },
      // Method 2: RSA-OAEP with SHA-1  
      { algorithm: { name: 'RSA-OAEP', hash: 'SHA-1' }, format: 'spki' as const },
    ];
    
    let cryptoKey: CryptoKey | null = null;
    let usedMethod = '';
    
    for (const method of encryptionMethods) {
      try {
        console.log(`🔧 Attempting RSA key import with ${method.algorithm.name}-${method.algorithm.hash}...`);
        cryptoKey = await crypto.subtle.importKey(
          method.format,
          keyBuffer,
          method.algorithm,
          false,
          ['encrypt']
        );
        usedMethod = `${method.algorithm.name}-${method.algorithm.hash}`;
        console.log(`✅ RSA key imported successfully with ${usedMethod}`);
        break;
      } catch (error) {
        console.log(`❌ ${method.algorithm.name}-${method.algorithm.hash} failed:`, error.message);
      }
    }
    
    if (!cryptoKey) {
      throw new Error('Failed to import RSA key with any supported method. Verify the key is in X.509 format.');
    }

    // Encrypt the data
    console.log('🔒 Encrypting data with', usedMethod);
    const encodedData = new TextEncoder().encode(data);
    console.log('📏 Encoded data length:', encodedData.length);
    
    const encryptedData = await crypto.subtle.encrypt(
      cryptoKey.algorithm,
      cryptoKey,
      encodedData
    );
    
    console.log('🎯 Encryption successful, result length:', encryptedData.byteLength);

    // Convert to base64 for transmission
    const encryptedArray = new Uint8Array(encryptedData);
    const base64Result = btoa(String.fromCharCode(...encryptedArray));
    
    console.log('📊 Final encrypted token length:', base64Result.length);
    console.log('🎉 RSA encryption completed successfully');
    
    return base64Result;
    
  } catch (error) {
    console.error('💥 RSA encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

// Simple mutex for token caching
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
    await tokenMutex.acquire();
    
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Check for cached valid token first
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
      
      console.log('🔍 Credential validation:');
      console.log('📋 Client ID length:', clientId?.length || 0);
      console.log('📋 Client Secret length:', clientSecret?.length || 0);
      console.log('🔑 Client ID preview:', clientId?.substring(0, 8) + '...' || 'NOT SET');
      
      if (!clientId || clientId.length < 10) {
        return {
          success: false,
          error: 'PERFECTCORP_API_KEY is not configured or invalid. Please set a valid API key in Supabase secrets.'
        };
      }
      
      if (!clientSecret || clientSecret.length < 100) {
        return {
          success: false,
          error: 'PERFECTCORP_API_SECRET is not configured or invalid. Please set a valid RSA X.509 public key in Supabase secrets.'
        };
      }

      // Create the exact data format specified by Perfect Corp API
      const timestamp = Date.now(); // milliseconds as required
      const dataToEncrypt = `client_id=${clientId}&timestamp=${timestamp}`;
      console.log('📝 Data to encrypt:', dataToEncrypt);
      console.log('⏰ Timestamp (ms):', timestamp);
      
      // Encrypt using RSA X.509 format
      let encryptedToken: string;
      try {
        encryptedToken = await encryptWithRSA(dataToEncrypt, clientSecret);
      } catch (encryptError) {
        console.error('❌ Encryption failed:', encryptError);
        return {
          success: false,
          error: `RSA encryption failed: ${encryptError.message}. Verify your RSA X.509 public key format.`
        };
      }

      // Prepare request body exactly as specified in API docs
      const requestBody = {
        client_id: clientId,
        id_token: encryptedToken
      };

      console.log('🚀 Making authentication request to Perfect Corp');
      console.log('📡 URL:', PERFECTCORP_AUTH_URL);
      console.log('📤 Request body keys:', Object.keys(requestBody));
      console.log('🔐 ID token length:', encryptedToken.length);

      const authResponse = await fetch(PERFECTCORP_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📥 Perfect Corp response: ${authResponse.status} ${authResponse.statusText}`);

      if (!authResponse.ok) {
        let errorMessage = `Authentication failed with status ${authResponse.status}`;
        
        try {
          const errorData: PerfectCorpAuthResponse = await authResponse.json();
          console.error('❌ Perfect Corp error response:', JSON.stringify(errorData, null, 2));
          
          if (errorData.error_code === 'InvalidParameters') {
            errorMessage = 'Invalid request parameters. Check your client_id format and id_token encryption.';
          } else if (errorData.error_code === 'InvalidAuthentication') {
            errorMessage = 'Authentication failed. Verify your API key and RSA public key are correct and not expired.';
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError);
          const errorText = await authResponse.text();
          console.error('❌ Raw error response:', errorText);
        }

        return {
          success: false,
          error: errorMessage
        };
      }

      const authData: PerfectCorpAuthResponse = await authResponse.json();
      console.log('📦 Perfect Corp auth response received');
      console.log('📊 Response status:', authData.status);
      console.log('📋 Response keys:', Object.keys(authData));

      if (authData.result?.access_token) {
        const accessToken = authData.result.access_token;
        const expiresIn = 7200; // 2 hours as per API docs
        
        console.log('🎉 Perfect Corp authentication successful!');
        console.log('⏰ Token expires in:', expiresIn, 'seconds (2 hours)');

        // Cache the token (subtract 60 seconds for safety margin)
        const expiresAt = new Date(Date.now() + ((expiresIn - 60) * 1000));
        
        try {
          await supabase.from('perfect_corp_tokens').insert({
            access_token: accessToken,
            expires_at: expiresAt.toISOString()
          });
          console.log('💾 Token cached successfully');
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache token:', cacheError);
        }

        return {
          success: true,
          accessToken: accessToken,
          expiresIn: expiresIn
        };
      } else {
        console.error('❌ No access token in response:', authData);
        return {
          success: false,
          error: 'No access token received from Perfect Corp API. Response format may have changed.'
        };
      }

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
  console.log(`🌐 ${req.method} ${req.url}`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Enhanced test endpoint for debugging
  if (req.url.endsWith('/test')) {
    console.log('🧪 Test endpoint - analyzing configuration');
    const clientId = Deno.env.get('PERFECTCORP_API_KEY');
    const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
    
    // Test data encryption to verify RSA setup
    let encryptionTest = { success: false, error: 'Not tested' };
    if (clientId && clientSecret) {
      try {
        const testData = `client_id=${clientId}&timestamp=${Date.now()}`;
        const encrypted = await encryptWithRSA(testData, clientSecret);
        encryptionTest = { 
          success: true, 
          error: `Success - encrypted ${testData.length} chars to ${encrypted.length} chars` 
        };
      } catch (error) {
        encryptionTest = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown encryption error' 
        };
      }
    }
    
    const diagnostics = {
      status: 'Perfect Corp Configuration Test',
      timestamp: new Date().toISOString(),
      credentials: {
        hasClientId: !!clientId,
        clientIdLength: clientId?.length || 0,
        clientIdValid: (clientId?.length || 0) >= 10,
        hasClientSecret: !!clientSecret,
        secretLength: clientSecret?.length || 0,
        secretValid: (clientSecret?.length || 0) >= 100,
      },
      encryption: encryptionTest,
      apiEndpoint: PERFECTCORP_AUTH_URL,
      recommendation: encryptionTest.success 
        ? '✅ Configuration appears ready for authentication' 
        : '❌ Fix the encryption error before proceeding'
    };
    
    return new Response(
      JSON.stringify(diagnostics, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('🔐 Processing Perfect Corp authentication request...');
    const result = await authenticateWithPerfectCorp();

    const statusCode = result.success ? 200 : 400;
    console.log(`📤 Returning response: ${statusCode} - Success: ${result.success}`);
    
    return new Response(
      JSON.stringify(result),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('💥 Endpoint error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
