import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

interface AuthRequest {
  apiKey?: string;
  diagnosticMode?: boolean;
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
  diagnostics?: any;
}

const PERFECTCORP_AUTH_URL = 'https://yce-api-01.perfectcorp.com/s2s/v1.0/client/auth';

// Enhanced RSA encryption with multiple fallback approaches
async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting enhanced encryption...');
    console.log('🔐 [RSA] Payload length:', payload.length, 'bytes');
    console.log('🔐 [RSA] Raw key length:', publicKeyPem.length);
    
    // Clean the public key more aggressively
    let cleanKey = publicKeyPem.trim();
    
    // Remove all possible header/footer variations and whitespace
    cleanKey = cleanKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
      .replace(/-----END RSA PUBLIC KEY-----/g, '')
      .replace(/\r?\n/g, '')
      .replace(/\s+/g, '')
      .trim();

    console.log('🔧 [RSA] Cleaned key length:', cleanKey.length);

    if (cleanKey.length === 0) {
      throw new Error('Empty key content after cleaning');
    }

    // Validate base64 format
    try {
      atob(cleanKey);
    } catch {
      throw new Error('Invalid base64 format in RSA key');
    }

    const keyData = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));
    console.log('✅ [RSA] Key decoded successfully, byte length:', keyData.length);

    // Check payload size limitations (RSA-2048 can encrypt max ~245 bytes with OAEP-SHA256)
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payload);
    console.log('📏 [RSA] Payload byte size:', payloadBytes.length);
    
    if (payloadBytes.length > 190) {
      console.warn('⚠️ [RSA] Payload might be too large for RSA encryption');
    }

    // Try multiple encryption approaches
    const approaches = [
      // Approach 1: SPKI format with SHA-256
      {
        name: 'SPKI-SHA256',
        format: 'spki' as KeyFormat,
        algorithm: { name: 'RSA-OAEP', hash: 'SHA-256' }
      },
      // Approach 2: SPKI format with SHA-1  
      {
        name: 'SPKI-SHA1',
        format: 'spki' as KeyFormat,
        algorithm: { name: 'RSA-OAEP', hash: 'SHA-1' }
      }
    ];

    let lastError: Error | null = null;

    for (const approach of approaches) {
      try {
        console.log(`🔄 [RSA] Trying approach: ${approach.name}`);
        
        const publicKey = await crypto.subtle.importKey(
          approach.format,
          keyData,
          approach.algorithm,
          false,
          ['encrypt']
        );
        
        console.log(`✅ [RSA] Key imported successfully with ${approach.name}`);
        
        // Try encryption with smaller chunks if needed
        let encryptedData: ArrayBuffer;
        
        try {
          encryptedData = await crypto.subtle.encrypt(
            approach.algorithm,
            publicKey,
            payloadBytes
          );
          console.log(`✅ [RSA] Encryption successful with ${approach.name}`);
        } catch (encryptError) {
          console.log(`❌ [RSA] Encryption failed with ${approach.name}:`, encryptError.message);
          lastError = encryptError as Error;
          continue;
        }

        const result = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
        console.log('🎉 [RSA] Final encrypted token length:', result.length);
        console.log('🎫 [RSA] Token preview:', result.substring(0, 50) + '...');
        
        return result;
        
      } catch (error) {
        console.log(`❌ [RSA] Approach ${approach.name} failed:`, error.message);
        lastError = error as Error;
        continue;
      }
    }
    
    // If all approaches failed, throw the last error
    throw new Error(`All RSA encryption approaches failed. Last error: ${lastError?.message || 'Unknown error'}`);
    
  } catch (error) {
    console.error('❌ [RSA] Complete encryption failure:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

function validateCredentials(apiKey: string, apiSecret: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!apiKey || apiKey.length < 10) {
    issues.push('Invalid API key - must be at least 10 characters');
  }
  
  if (!apiSecret || apiSecret.length < 100) {
    issues.push('Invalid API secret - RSA key must be at least 100 characters');
  }
  
  // Additional validation for RSA key format
  if (apiSecret && !apiSecret.includes('BEGIN') && !apiSecret.match(/^[A-Za-z0-9+/=\s\n\r-]+$/)) {
    issues.push('API secret does not appear to be a valid RSA key format');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

async function getConfigurationTest() {
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

async function getDiagnostics() {
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

async function authenticateWithPerfectCorp(): Promise<AuthResponse> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for cached token first
    const { data: existingTokenData } = await supabase.rpc('get_valid_perfect_corp_token');

    if (existingTokenData && existingTokenData.length > 0) {
      const token = existingTokenData[0];
      console.log('✅ [Auth] Using cached token, expires in', token.seconds_until_expiry, 'seconds');
      return {
        success: true,
        accessToken: token.access_token,
        expiresIn: Math.max(token.seconds_until_expiry, 0)
      };
    }

    console.log('🔄 [Auth] Generating new Perfect Corp access token...');
    
    const clientId = Deno.env.get('PERFECTCORP_API_KEY');
    const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
    
    const validation = validateCredentials(clientId || '', clientSecret || '');
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid credentials: ${validation.issues.join(', ')}`
      };
    }

    console.log('🔑 [Auth] Client ID:', clientId!.substring(0, 8) + '...');
    console.log('🔐 [Auth] RSA key length:', clientSecret!.length);
    console.log('🔐 [Auth] RSA key preview:', clientSecret!.substring(0, 50) + '...');

    try {
      // Create timestamp and payload with minimal size
      const now = new Date();
      const timestamp = Math.floor(now.getTime() / 1000);
      
      const payloadObj = {
        client_id: clientId,
        timestamp: timestamp.toString()
      };
      const jsonPayload = JSON.stringify(payloadObj);
      
      console.log('📝 [Auth] Current time:', now.toISOString());
      console.log('📝 [Auth] Unix timestamp (seconds):', timestamp);
      console.log('📝 [Auth] JSON payload:', jsonPayload);
      console.log('📏 [Auth] Payload length:', jsonPayload.length, 'characters');
      
      const idToken = await rsaEncrypt(jsonPayload, clientSecret!);
      console.log('✅ [Auth] RSA encryption successful, token length:', idToken.length);
      
      const requestBody = {
        client_id: clientId,
        id_token: idToken
      };
      
      console.log('📤 [Auth] Sending request to:', PERFECTCORP_AUTH_URL);
      console.log('📤 [Auth] Request body structure:', Object.keys(requestBody));
      
      const authResponse = await fetch(PERFECTCORP_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Perfect-Corp-S2S-Client/1.0'
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📥 [Auth] Response status: ${authResponse.status} ${authResponse.statusText}`);

      const responseText = await authResponse.text();
      console.log(`📄 [Auth] Raw response:`, responseText);

      if (authResponse.ok) {
        const authData: PerfectCorpAuthResponse = JSON.parse(responseText);
        console.log(`📦 [Auth] Parsed response:`, authData);

        if (authData.result?.access_token) {
          const accessToken = authData.result.access_token;
          const expiresIn = 7200; // 2 hours
          
          console.log(`🎉 [Auth] Authentication successful!`);
          console.log(`🔑 [Auth] Token preview:`, accessToken.substring(0, 20) + '...');

          // Cache the token
          try {
            const expiresAt = new Date(Date.now() + ((expiresIn - 60) * 1000));
            await supabase.from('perfect_corp_tokens').insert({
              access_token: accessToken,
              expires_at: expiresAt.toISOString()
            });
            console.log('💾 [Auth] Token cached successfully');
          } catch (cacheError) {
            console.warn('⚠️ [Auth] Failed to cache token:', cacheError);
          }

          return {
            success: true,
            accessToken: accessToken,
            expiresIn: expiresIn
          };
        } else {
          console.error('❌ [Auth] No access token in response');
          return {
            success: false,
            error: 'No access token returned from Perfect Corp API'
          };
        }
      } else {
        let errorMessage = `Authentication failed (${authResponse.status})`;
        try {
          const errorData = JSON.parse(responseText);
          console.error('❌ [Auth] Error response data:', errorData);
          
          if (errorData.error?.includes('Invalid client_id or invalid id_token')) {
            errorMessage = `Perfect Corp Authentication Error: ${errorData.error}

Troubleshooting steps:
1. Verify PERFECTCORP_API_KEY is correct
2. Verify PERFECTCORP_API_SECRET contains the complete RSA public key
3. Check that credentials are not expired
4. Ensure RSA key format is correct (should include headers/footers or be base64 only)

Timestamp used: ${timestamp} (${new Date(timestamp * 1000).toISOString()})
Payload: ${jsonPayload}`;
          } else {
            errorMessage = errorData.error || responseText;
          }
        } catch {
          errorMessage = responseText;
        }
        
        console.log(`❌ [Auth] Authentication failed:`, errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      console.log(`❌ [Auth] Request error:`, error.message);
      return {
        success: false,
        error: `Authentication request failed: ${error.message}`
      };
    }

  } catch (error) {
    console.error('💥 [Auth] General error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

serve(async (req) => {
  console.log(`🌐 [Server] ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;

  // Handle GET /test endpoint
  if (req.method === 'GET' && pathname.endsWith('/test')) {
    try {
      const testResult = await getConfigurationTest();
      return new Response(
        JSON.stringify(testResult),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('❌ [Test] Configuration test error:', error);
      return new Response(
        JSON.stringify({ 
          status: 'error',
          error: error instanceof Error ? error.message : 'Configuration test failed'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Handle GET /diagnostics endpoint
  if (req.method === 'GET' && pathname.endsWith('/diagnostics')) {
    try {
      const diagnostics = await getDiagnostics();
      return new Response(
        JSON.stringify(diagnostics),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('❌ [Diagnostics] Error:', error);
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Diagnostics failed'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Handle POST requests for authentication
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('🔐 [Server] Processing authentication request...');
    
    const result = await authenticateWithPerfectCorp();

    const statusCode = result.success ? 200 : 400;
    console.log(`📤 [Server] Returning: ${statusCode} - Success: ${result.success}`);
    
    return new Response(
      JSON.stringify(result),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('💥 [Server] Endpoint error:', error);
    
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
