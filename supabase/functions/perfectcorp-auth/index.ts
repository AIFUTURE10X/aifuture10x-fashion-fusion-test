
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

// Simplified RSA encryption matching Postman approach
async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting encryption...');
    console.log('🔐 [RSA] Payload:', payload);
    
    // Clean the public key
    let cleanKey = publicKeyPem.trim()
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
      .replace(/-----END RSA PUBLIC KEY-----/g, '')
      .replace(/\s/g, '');

    if (cleanKey.length === 0) {
      throw new Error('Empty key content after cleaning');
    }

    const keyData = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));
    console.log('✅ [RSA] Key decoded, length:', keyData.length);

    // Import the public key with SHA-1 (as Perfect Corp likely uses)
    const publicKey = await crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-1', // Use SHA-1 as it worked in logs
      },
      false,
      ['encrypt']
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      data
    );

    const result = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    console.log('✅ [RSA] Encryption successful, token length:', result.length);
    
    return result;
    
  } catch (error) {
    console.error('❌ [RSA] Encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

function validateCredentials(apiKey: string, apiSecret: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!apiKey || apiKey.length < 10) {
    issues.push('Invalid API key');
  }
  
  if (!apiSecret || apiSecret.length < 100) {
    issues.push('Invalid API secret (RSA key)');
  }
  
  return {
    valid: issues.length === 0,
    issues
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

    try {
      // SIMPLIFIED: Use current Unix timestamp in seconds (like Postman)
      const timestamp = Math.floor(Date.now() / 1000);
      const payloadObj = {
        client_id: clientId,
        timestamp: timestamp.toString()
      };
      const payload = JSON.stringify(payloadObj);
      
      console.log('📝 [Auth] Timestamp (seconds):', timestamp);
      console.log('📝 [Auth] Payload object:', payloadObj);
      console.log('📝 [Auth] JSON payload:', payload);
      
      const idToken = await rsaEncrypt(payload, clientSecret!);
      console.log('✅ [Auth] RSA encryption successful, token length:', idToken.length);
      
      // Send exactly like Postman: client_id + id_token
      const requestBody = {
        client_id: clientId,
        id_token: idToken
      };
      
      console.log('📤 [Auth] Sending request to:', PERFECTCORP_AUTH_URL);
      console.log('📤 [Auth] Request body keys:', Object.keys(requestBody));
      console.log('📤 [Auth] Client ID in request:', requestBody.client_id.substring(0, 8) + '...');
      
      const authResponse = await fetch(PERFECTCORP_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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
          if (errorData.error === 'Invalid client_id or invalid id_token or key expired') {
            errorMessage = `Perfect Corp Authentication Error:
- Status: ${authResponse.status}
- Error: ${errorData.error}
- Error Code: ${errorData.error_code}

This suggests either:
1. The credentials don't match what's registered with Perfect Corp
2. The timestamp format is incorrect
3. The RSA encryption method doesn't match their requirements

Since Postman works, please verify the exact format Postman uses.`;
          } else {
            errorMessage = responseText;
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
