
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

// Enhanced RSA encryption with better key format handling
async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting encryption process...');
    console.log('🔐 [RSA] Payload to encrypt:', payload);
    console.log('🔐 [RSA] Public key length:', publicKeyPem.length);
    
    // Clean and format the public key
    let cleanKey = publicKeyPem.trim();
    
    // Remove any existing headers and whitespace
    cleanKey = cleanKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
      .replace(/-----END RSA PUBLIC KEY-----/g, '')
      .replace(/\s/g, '')
      .replace(/\n/g, '')
      .replace(/\r/g, '');

    console.log('🔐 [RSA] Cleaned key length:', cleanKey.length);
    console.log('🔐 [RSA] Cleaned key preview:', cleanKey.substring(0, 50) + '...');

    if (cleanKey.length === 0) {
      throw new Error('Empty key content after cleaning');
    }

    // Convert base64 to ArrayBuffer
    let keyData: Uint8Array;
    try {
      keyData = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));
      console.log('✅ [RSA] Successfully decoded base64, length:', keyData.length);
    } catch (decodeError) {
      console.error('❌ [RSA] Base64 decode failed:', decodeError);
      throw new Error(`Invalid base64 in RSA key: ${decodeError.message}`);
    }

    // Determine key size and max payload size
    const keySize = keyData.length;
    let maxPayloadSize: number;
    let keyType: string;
    
    if (keySize <= 162) { // RSA-1024
      maxPayloadSize = 86; // RSA-1024 with OAEP SHA-256 padding
      keyType = 'RSA-1024';
    } else if (keySize <= 294) { // RSA-2048
      maxPayloadSize = 190; // RSA-2048 with OAEP SHA-256 padding
      keyType = 'RSA-2048';
    } else {
      maxPayloadSize = 446; // RSA-4096 with OAEP SHA-256 padding
      keyType = 'RSA-4096';
    }
    
    console.log(`🔑 [RSA] Detected key type: ${keyType}, max payload: ${maxPayloadSize} bytes`);

    // Check payload size
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    console.log('🔐 [RSA] Payload encoded, length:', data.length);
    
    if (data.length > maxPayloadSize) {
      throw new Error(`Payload too large for ${keyType}: ${data.length} bytes (max ${maxPayloadSize} bytes)`);
    }

    // Try multiple encryption approaches
    const encryptionMethods = [
      { name: 'RSA-OAEP with SHA-256', hash: 'SHA-256' },
      { name: 'RSA-OAEP with SHA-1', hash: 'SHA-1' },
    ];

    for (const method of encryptionMethods) {
      try {
        console.log(`🔑 [RSA] Trying ${method.name}...`);
        
        // Import the public key
        const publicKey = await crypto.subtle.importKey(
          'spki',
          keyData,
          {
            name: 'RSA-OAEP',
            hash: method.hash,
          },
          false,
          ['encrypt']
        );
        
        console.log(`✅ [RSA] Successfully imported key with ${method.name}`);

        // Encrypt the payload
        const encrypted = await crypto.subtle.encrypt(
          {
            name: 'RSA-OAEP',
          },
          publicKey,
          data
        );
        
        console.log('✅ [RSA] Encryption successful, result length:', encrypted.byteLength);

        // Convert to base64
        const encryptedArray = new Uint8Array(encrypted);
        const result = btoa(String.fromCharCode(...encryptedArray));
        console.log('✅ [RSA] Final encrypted token length:', result.length);
        console.log('✅ [RSA] Encrypted token preview:', result.substring(0, 50) + '...');
        
        return result;
        
      } catch (methodError) {
        console.log(`⚠️ [RSA] ${method.name} failed:`, methodError.message);
        continue;
      }
    }
    
    throw new Error('All RSA encryption methods failed. The key may be invalid or incompatible.');
    
  } catch (error) {
    console.error('❌ [RSA] Complete encryption process failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

// Enhanced validation with better key format detection
function validateCredentials(apiKey: string, apiSecret: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!apiKey) {
    issues.push('API key is missing');
  } else if (apiKey.length < 10) {
    issues.push(`API key too short: ${apiKey.length} characters`);
  }
  
  if (!apiSecret) {
    issues.push('API secret is missing');
  } else {
    console.log('🔍 [Validation] Checking API secret format...');
    console.log('🔍 [Validation] Secret length:', apiSecret.length);
    console.log('🔍 [Validation] Secret preview:', apiSecret.substring(0, 100) + '...');
    
    // Clean the key for validation
    const cleanKey = apiSecret
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
      .replace(/-----END RSA PUBLIC KEY-----/g, '')
      .replace(/\s/g, '');
    
    const isLikelyBase64 = /^[A-Za-z0-9+/]+=*$/.test(cleanKey);
    
    console.log('🔍 [Validation] Cleaned key length:', cleanKey.length);
    console.log('🔍 [Validation] Is likely base64:', isLikelyBase64);
    
    if (!isLikelyBase64) {
      issues.push('API secret does not appear to be valid base64 (should be RSA public key)');
    }
    
    if (cleanKey.length < 100) {
      issues.push(`API secret too short: ${cleanKey.length} characters (RSA keys are typically 200+ characters)`);
    }
    
    // Additional validation for common key sizes
    try {
      const keyData = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));
      const keySize = keyData.length;
      
      if (keySize < 100) {
        issues.push(`RSA key data too small: ${keySize} bytes (expected 162+ for RSA-1024, 294+ for RSA-2048)`);
      } else if (keySize <= 162) {
        console.log('🔑 [Validation] Detected RSA-1024 key');
      } else if (keySize <= 294) {
        console.log('🔑 [Validation] Detected RSA-2048 key');
      } else {
        console.log('🔑 [Validation] Detected RSA-4096+ key');
      }
    } catch (validationError) {
      issues.push(`Key validation failed: ${validationError.message}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

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
        isPemFormat: clientSecret.includes('-----BEGIN PUBLIC KEY-----'),
        isLikelyBase64: /^[A-Za-z0-9+/\s\n\r=-]+$/.test(clientSecret),
        hasSpecialChars: /[^a-zA-Z0-9+/\s\n\r=-]/.test(clientSecret),
        preview: clientSecret.substring(0, 50) + '...'
      } : null,
    },
    networkConnectivity: {
      perfectCorpEndpoint: PERFECTCORP_AUTH_URL,
      canReach: false,
      responseTime: 0,
    },
    authenticationMethods: {
      rsaAuth: {
        attempted: false,
        successful: false,
        error: null,
        validationIssues: []
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
  
  // Test RSA authentication if we have credentials
  if (clientId && clientSecret) {
    diagnostics.authenticationMethods.rsaAuth.attempted = true;
    
    // First validate credentials
    const validation = validateCredentials(clientId, clientSecret);
    diagnostics.authenticationMethods.rsaAuth.validationIssues = validation.issues;
    
    if (validation.valid) {
      try {
        console.log('🔑 [Diagnostics] Testing RSA encryption...');
        const timestamp = Date.now();
        
        // FIXED: Use proper JSON format for the payload as Perfect Corp expects
        const payloadObj = {
          client_id: clientId,
          timestamp: timestamp.toString()
        };
        const payload = JSON.stringify(payloadObj);
        
        console.log('📝 [Diagnostics] Payload object:', payloadObj);
        console.log('📝 [Diagnostics] JSON payload:', payload);
        
        const idToken = await rsaEncrypt(payload, clientSecret);
        console.log('✅ [Diagnostics] RSA encryption successful');
        
        // FIXED: Send client_id as separate field alongside encrypted id_token
        const authBody = {
          client_id: clientId,
          id_token: idToken
        };
        
        const response = await fetch(PERFECTCORP_AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(authBody),
        });
        
        const responseText = await response.text();
        console.log('🧪 [Diagnostics] RSA auth response:', response.status, responseText);
        
        if (response.ok) {
          diagnostics.authenticationMethods.rsaAuth.successful = true;
          console.log('✅ [Diagnostics] RSA authentication successful');
        } else {
          diagnostics.authenticationMethods.rsaAuth.error = responseText;
        }
        
      } catch (error) {
        diagnostics.authenticationMethods.rsaAuth.error = error.message;
        console.log('❌ [Diagnostics] RSA auth test failed:', error.message);
      }
    } else {
      diagnostics.authenticationMethods.rsaAuth.error = `Validation failed: ${validation.issues.join(', ')}`;
    }
  }
  
  // Generate recommendations
  const recommendations = [];
  
  if (!diagnostics.credentials.hasClientId) {
    recommendations.push('❌ Add PERFECTCORP_API_KEY to Supabase secrets');
  }
  
  if (!diagnostics.credentials.hasClientSecret) {
    recommendations.push('❌ Add PERFECTCORP_API_SECRET (RSA public key) to Supabase secrets');
  } else if (diagnostics.authenticationMethods.rsaAuth.validationIssues.length > 0) {
    recommendations.push('⚠️ RSA public key format issues detected:');
    diagnostics.authenticationMethods.rsaAuth.validationIssues.forEach(issue => {
      recommendations.push(`  - ${issue}`);
    });
    recommendations.push('💡 Ensure PERFECTCORP_API_SECRET contains a valid RSA public key');
    recommendations.push('💡 Key should be in PEM format or valid base64 (minimum 300+ characters)');
  }
  
  if (!diagnostics.networkConnectivity.canReach) {
    recommendations.push('❌ Cannot reach Perfect Corp API - check network connectivity');
  }
  
  if (diagnostics.authenticationMethods.rsaAuth.successful) {
    recommendations.push('✅ RSA authentication works correctly');
  } else if (diagnostics.authenticationMethods.rsaAuth.attempted) {
    recommendations.push('❌ RSA authentication failed - check error details above');
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
    
    // Enhanced validation
    const validation = validateCredentials(clientId || '', clientSecret || '');
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid credentials: ${validation.issues.join(', ')}`
      };
    }

    console.log('🔑 [Auth] Using RSA encryption authentication method');
    console.log('📝 [Auth] Client ID:', clientId!.substring(0, 8) + '...');
    console.log('🔐 [Auth] RSA key length:', clientSecret!.length);

    try {
      // FIXED: Create proper JSON payload as Perfect Corp expects
      const timestamp = Date.now();
      const payloadObj = {
        client_id: clientId,
        timestamp: timestamp.toString()
      };
      const payload = JSON.stringify(payloadObj);
      
      console.log('📝 [Auth] Payload object:', payloadObj);
      console.log('📝 [Auth] JSON payload:', payload);
      console.log('🔒 [Auth] Encrypting payload with RSA...');
      
      const idToken = await rsaEncrypt(payload, clientSecret!);
      console.log('✅ [Auth] RSA encryption successful');
      console.log('🎫 [Auth] ID Token length:', idToken.length);
      
      // FIXED: Send client_id as separate field alongside encrypted id_token
      const requestBody = {
        client_id: clientId,
        id_token: idToken
      };
      
      console.log('📤 [Auth] Request body structure:', Object.keys(requestBody));
      
      const authResponse = await fetch(PERFECTCORP_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📥 [Auth] Response: ${authResponse.status} ${authResponse.statusText}`);

      const responseText = await authResponse.text();
      console.log(`📄 [Auth] Raw response:`, responseText);

      if (authResponse.ok) {
        const authData: PerfectCorpAuthResponse = JSON.parse(responseText);
        console.log(`📦 [Auth] Parsed response:`, authData);

        if (authData.result?.access_token) {
          const accessToken = authData.result.access_token;
          const expiresIn = 7200; // 2 hours
          
          console.log(`🎉 [Auth] Authentication successful!`);

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
          console.error('❌ [Auth] No access token in successful response');
          return {
            success: false,
            error: 'No access token returned from Perfect Corp API'
          };
        }
      } else {
        console.log(`❌ [Auth] Authentication failed:`, responseText);
        return {
          success: false,
          error: `Authentication failed: ${responseText}`
        };
      }
    } catch (error) {
      console.log(`❌ [Auth] RSA authentication error:`, error.message);
      return {
        success: false,
        error: `RSA authentication failed: ${error.message}`
      };
    }

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
