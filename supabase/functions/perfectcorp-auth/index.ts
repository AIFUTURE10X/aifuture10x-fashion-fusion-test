
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

// Comprehensive diagnostics function
async function runDiagnostics(): Promise<any> {
  console.log('🔍 [Diagnostics] Running comprehensive Perfect Corp diagnostics...');
  
  const clientId = Deno.env.get('PERFECTCORP_API_KEY');
  const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      denoVersion: Deno.version.deno,
      v8Version: Deno.version.v8,
      typescriptVersion: Deno.version.typescript,
    },
    credentials: {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      clientIdFormat: clientId ? {
        startsWithLetter: /^[a-zA-Z]/.test(clientId),
        containsSpecialChars: /[^a-zA-Z0-9]/.test(clientId),
        isAlphanumeric: /^[a-zA-Z0-9]+$/.test(clientId),
        preview: clientId.substring(0, 8) + '...'
      } : null,
      hasClientSecret: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0,
      clientSecretFormat: clientSecret ? {
        isPlainText: !clientSecret.includes('-----BEGIN'),
        isAlphanumeric: /^[a-zA-Z0-9]+$/.test(clientSecret),
        hasSpecialChars: /[^a-zA-Z0-9]/.test(clientSecret),
        preview: clientSecret.substring(0, 20) + '...'
      } : null,
    },
    networkConnectivity: {
      perfectCorpEndpoint: PERFECTCORP_AUTH_URL,
      canReach: false,
      responseTime: 0,
    },
    authenticationMethods: {
      simpleAuth: {
        attempted: false,
        successful: false,
        error: null
      },
      hmacAuth: {
        attempted: false,
        successful: false,
        error: null
      }
    }
  };
  
  // Test network connectivity
  const networkStart = Date.now();
  try {
    const response = await fetch(PERFECTCORP_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });
    
    diagnostics.networkConnectivity.canReach = true;
    diagnostics.networkConnectivity.responseTime = Date.now() - networkStart;
    diagnostics.networkConnectivity.status = response.status;
    
    console.log('✅ [Diagnostics] Network connectivity test passed');
  } catch (error) {
    diagnostics.networkConnectivity.error = error.message;
    console.log('❌ [Diagnostics] Network connectivity test failed:', error.message);
  }
  
  // Test simple authentication methods if we have credentials
  if (clientId && clientSecret) {
    // Method 1: Simple client_id + client_secret
    try {
      diagnostics.authenticationMethods.simpleAuth.attempted = true;
      
      const simpleAuthBody = {
        client_id: clientId,
        client_secret: clientSecret
      };
      
      const response = await fetch(PERFECTCORP_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(simpleAuthBody),
      });
      
      const responseText = await response.text();
      console.log('🧪 [Diagnostics] Simple auth response:', response.status, responseText);
      
      if (response.ok) {
        diagnostics.authenticationMethods.simpleAuth.successful = true;
        console.log('✅ [Diagnostics] Simple authentication successful');
      } else {
        diagnostics.authenticationMethods.simpleAuth.error = responseText;
      }
      
    } catch (error) {
      diagnostics.authenticationMethods.simpleAuth.error = error.message;
      console.log('❌ [Diagnostics] Simple auth test failed:', error.message);
    }
    
    // Method 2: HMAC or timestamp-based authentication
    try {
      diagnostics.authenticationMethods.hmacAuth.attempted = true;
      
      const timestamp = Date.now();
      const hmacAuthBody = {
        client_id: clientId,
        timestamp: timestamp,
        signature: clientSecret // Try using secret as signature
      };
      
      const response = await fetch(PERFECTCORP_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(hmacAuthBody),
      });
      
      const responseText = await response.text();
      console.log('🧪 [Diagnostics] HMAC auth response:', response.status, responseText);
      
      if (response.ok) {
        diagnostics.authenticationMethods.hmacAuth.successful = true;
        console.log('✅ [Diagnostics] HMAC authentication successful');
      } else {
        diagnostics.authenticationMethods.hmacAuth.error = responseText;
      }
      
    } catch (error) {
      diagnostics.authenticationMethods.hmacAuth.error = error.message;
      console.log('❌ [Diagnostics] HMAC auth test failed:', error.message);
    }
  }
  
  // Generate recommendations
  const recommendations = [];
  
  if (!diagnostics.credentials.hasClientId) {
    recommendations.push('❌ Add PERFECTCORP_API_KEY to Supabase secrets');
  } else if (diagnostics.credentials.clientIdLength < 10) {
    recommendations.push('⚠️ API key seems too short - verify it\'s not a test value');
  }
  
  if (!diagnostics.credentials.hasClientSecret) {
    recommendations.push('❌ Add PERFECTCORP_API_SECRET to Supabase secrets');
  } else if (diagnostics.credentials.clientSecretLength < 10) {
    recommendations.push('⚠️ API secret seems too short - verify it\'s not a test value');
  }
  
  if (!diagnostics.networkConnectivity.canReach) {
    recommendations.push('❌ Cannot reach Perfect Corp API - check network connectivity');
  }
  
  if (diagnostics.authenticationMethods.simpleAuth.successful) {
    recommendations.push('✅ Simple authentication works - use client_id + client_secret method');
  } else if (diagnostics.authenticationMethods.hmacAuth.successful) {
    recommendations.push('✅ HMAC authentication works - use timestamp + signature method');
  } else {
    recommendations.push('❌ No authentication method succeeded - verify credentials with Perfect Corp');
    recommendations.push('💡 Contact Perfect Corp support for current authentication requirements');
  }
  
  diagnostics.recommendations = recommendations;
  
  return diagnostics;
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
    
    if (!clientId || clientId.length < 10) {
      return {
        success: false,
        error: 'PERFECTCORP_API_KEY is not configured properly or appears to be a test value'
      };
    }
    
    if (!clientSecret || clientSecret.length < 10) {
      return {
        success: false,
        error: 'PERFECTCORP_API_SECRET is not configured properly or appears to be a test value'
      };
    }

    console.log('🔑 [Auth] Using simplified authentication method');
    console.log('📝 [Auth] Client ID:', clientId.substring(0, 8) + '...');
    console.log('🔐 [Auth] Secret length:', clientSecret.length);

    // Try multiple authentication methods based on Perfect Corp's current requirements
    const authMethods = [
      // Method 1: Simple client_id + client_secret (most common)
      {
        name: 'Simple Auth',
        body: {
          client_id: clientId,
          client_secret: clientSecret
        }
      },
      // Method 2: client_id + token (if secret is meant to be a token)
      {
        name: 'Token Auth',
        body: {
          client_id: clientId,
          token: clientSecret
        }
      },
      // Method 3: client_id + api_secret
      {
        name: 'API Secret Auth',
        body: {
          client_id: clientId,
          api_secret: clientSecret
        }
      },
      // Method 4: Timestamp-based (if they require timestamp)
      {
        name: 'Timestamp Auth',
        body: {
          client_id: clientId,
          client_secret: clientSecret,
          timestamp: Date.now()
        }
      }
    ];

    for (const method of authMethods) {
      try {
        console.log(`🧪 [Auth] Trying ${method.name}...`);
        
        const authResponse = await fetch(PERFECTCORP_AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Supabase-Edge-Function/1.0',
          },
          body: JSON.stringify(method.body),
        });

        console.log(`📥 [Auth] ${method.name} Response: ${authResponse.status} ${authResponse.statusText}`);

        const responseText = await authResponse.text();
        console.log(`📄 [Auth] ${method.name} Raw response:`, responseText);

        if (authResponse.ok) {
          const authData: PerfectCorpAuthResponse = JSON.parse(responseText);
          console.log(`📦 [Auth] ${method.name} Parsed response:`, authData);

          if (authData.result?.access_token) {
            const accessToken = authData.result.access_token;
            const expiresIn = 7200; // 2 hours
            
            console.log(`🎉 [Auth] ${method.name} Authentication successful!`);

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
          }
        } else {
          console.log(`❌ [Auth] ${method.name} failed:`, responseText);
        }
      } catch (error) {
        console.log(`❌ [Auth] ${method.name} error:`, error.message);
      }
    }

    // If all methods failed, return error with helpful message
    return {
      success: false,
      error: 'All authentication methods failed. Please verify your Perfect Corp credentials and contact their support for the correct authentication format.'
    };

  } catch (error) {
    console.error('💥 [Auth] Authentication error:', error);
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

  // Enhanced diagnostics endpoint
  if (req.url.endsWith('/test') || req.url.endsWith('/diagnostics')) {
    console.log('🧪 [Server] Running diagnostics...');
    
    try {
      const diagnostics = await runDiagnostics();
      
      return new Response(
        JSON.stringify(diagnostics, null, 2),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Diagnostics failed', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }, null, 2),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('🔐 [Server] Processing authentication request...');
    
    // Check if this is a diagnostic request
    const body = await req.json();
    if (body.diagnosticMode) {
      const diagnostics = await runDiagnostics();
      const authResult = await authenticateWithPerfectCorp();
      
      return new Response(
        JSON.stringify({
          ...authResult,
          diagnostics
        }, null, 2),
        {
          status: authResult.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
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
