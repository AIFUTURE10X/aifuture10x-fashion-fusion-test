
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
        isPemFormat: clientSecret.includes('-----BEGIN'),
        isBase64: /^[A-Za-z0-9+/=]+$/.test(clientSecret.replace(/\s/g, '')),
        hasWhitespace: /\s/.test(clientSecret),
        preview: clientSecret.substring(0, 50) + '...'
      } : null,
    },
    cryptoSupport: {
      cryptoSubtleAvailable: !!crypto.subtle,
      supportedAlgorithms: [],
    },
    networkConnectivity: {
      perfectCorpEndpoint: PERFECTCORP_AUTH_URL,
      canReach: false,
      responseTime: 0,
    },
    encryptionTest: {
      attempted: false,
      successful: false,
      method: null,
      error: null,
      encryptedLength: 0,
    }
  };
  
  // Test crypto support
  if (crypto.subtle) {
    try {
      // Test RSA key generation to verify crypto support
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 1024,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-1",
        },
        false,
        ["encrypt", "decrypt"]
      );
      diagnostics.cryptoSupport.supportedAlgorithms.push('RSA-OAEP');
    } catch (e) {
      console.log('RSA-OAEP not supported:', e.message);
    }
  }
  
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
  
  // Test encryption if we have credentials
  if (clientId && clientSecret) {
    diagnostics.encryptionTest.attempted = true;
    
    try {
      const timestamp = Date.now();
      const testData = `client_id=${clientId}&timestamp=${timestamp}`;
      
      // Clean the key
      let cleanKey = clientSecret.trim();
      if (cleanKey.includes('-----BEGIN')) {
        cleanKey = cleanKey
          .replace(/-----BEGIN[^-]+-----/g, '')
          .replace(/-----END[^-]+-----/g, '')
          .replace(/\s+/g, '');
      }
      
      const binaryString = atob(cleanKey);
      const keyBuffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        keyBuffer[i] = binaryString.charCodeAt(i);
      }
      
      const cryptoKey = await crypto.subtle.importKey(
        'spki',
        keyBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-1' },
        false,
        ['encrypt']
      );
      
      const encodedData = new TextEncoder().encode(testData);
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        cryptoKey,
        encodedData
      );
      
      const encryptedArray = new Uint8Array(encryptedData);
      const base64Result = btoa(String.fromCharCode(...encryptedArray));
      
      diagnostics.encryptionTest.successful = true;
      diagnostics.encryptionTest.method = 'RSA-OAEP-SHA1';
      diagnostics.encryptionTest.encryptedLength = base64Result.length;
      
      console.log('✅ [Diagnostics] Encryption test passed');
      
    } catch (error) {
      diagnostics.encryptionTest.error = error.message;
      console.log('❌ [Diagnostics] Encryption test failed:', error.message);
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
  } else if (diagnostics.credentials.clientSecretLength < 100) {
    recommendations.push('⚠️ API secret seems too short - should be an RSA public key');
  }
  
  if (!diagnostics.networkConnectivity.canReach) {
    recommendations.push('❌ Cannot reach Perfect Corp API - check network connectivity');
  }
  
  if (!diagnostics.encryptionTest.successful && diagnostics.encryptionTest.attempted) {
    recommendations.push('❌ RSA encryption failed - verify API secret format');
  }
  
  if (diagnostics.credentials.hasClientId && diagnostics.credentials.hasClientSecret && diagnostics.encryptionTest.successful && diagnostics.networkConnectivity.canReach) {
    recommendations.push('✅ All systems appear ready - authentication should work');
  }
  
  diagnostics.recommendations = recommendations;
  
  return diagnostics;
}

// Enhanced RSA encryption with multiple format support
async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    console.log('🔐 [Encrypt] Starting RSA encryption...');
    
    // Clean the key
    let cleanKey = publicKey.trim();
    
    if (cleanKey.includes('-----BEGIN')) {
      cleanKey = cleanKey
        .replace(/-----BEGIN[^-]+-----/g, '')
        .replace(/-----END[^-]+-----/g, '')
        .replace(/\s+/g, '');
    } else {
      cleanKey = cleanKey.replace(/\s+/g, '');
    }
    
    const binaryString = atob(cleanKey);
    const keyBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      keyBuffer[i] = binaryString.charCodeAt(i);
    }
    
    // Try different configurations
    const configs = [
      { name: 'RSA-OAEP', hash: 'SHA-1' },
      { name: 'RSA-OAEP', hash: 'SHA-256' },
    ];
    
    for (const config of configs) {
      try {
        const cryptoKey = await crypto.subtle.importKey(
          'spki',
          keyBuffer,
          { name: config.name, hash: config.hash },
          false,
          ['encrypt']
        );
        
        const encodedData = new TextEncoder().encode(data);
        const encryptedData = await crypto.subtle.encrypt(
          { name: config.name },
          cryptoKey,
          encodedData
        );
        
        const encryptedArray = new Uint8Array(encryptedData);
        const base64Result = btoa(String.fromCharCode(...encryptedArray));
        
        console.log('✅ [Encrypt] Success with', config.name, config.hash);
        return base64Result;
        
      } catch (error) {
        console.log(`❌ [Encrypt] ${config.name}-${config.hash} failed:`, error.message);
      }
    }
    
    throw new Error('All encryption methods failed');
    
  } catch (error) {
    console.error('💥 [Encrypt] RSA encryption failed:', error);
    throw error;
  }
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
    
    if (!clientSecret || clientSecret.length < 100) {
      return {
        success: false,
        error: 'PERFECTCORP_API_SECRET is not configured properly or appears to be a test value'
      };
    }

    // Create authentication data with current timestamp
    const timestamp = Date.now();
    const dataToEncrypt = `client_id=${clientId}&timestamp=${timestamp}`;
    
    console.log('📝 [Auth] Encrypting data:', dataToEncrypt);
    console.log('⏰ [Auth] Current timestamp:', timestamp, new Date(timestamp).toISOString());
    
    let encryptedToken: string;
    try {
      encryptedToken = await encryptWithRSA(dataToEncrypt, clientSecret);
    } catch (encryptError) {
      console.error('❌ [Auth] Encryption failed:', encryptError);
      return {
        success: false,
        error: `RSA encryption failed: ${encryptError.message}. Please verify the PERFECTCORP_API_SECRET format.`
      };
    }

    const requestBody = {
      client_id: clientId,
      id_token: encryptedToken
    };

    console.log('🚀 [Auth] Making auth request to Perfect Corp...');
    console.log('📤 [Auth] Request preview:', {
      client_id: clientId.substring(0, 8) + '...',
      id_token_length: encryptedToken.length
    });
    
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
    console.log('📄 [Auth] Raw response:', responseText);

    if (!authResponse.ok) {
      let errorMessage = `Authentication failed: ${authResponse.status}`;
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error_code === 'InvalidAuthentication') {
          errorMessage = 'Invalid authentication - please verify API credentials and ensure they are not test values';
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        errorMessage += ` - ${responseText}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    const authData: PerfectCorpAuthResponse = JSON.parse(responseText);
    console.log('📦 [Auth] Parsed response:', authData);

    if (authData.result?.access_token) {
      const accessToken = authData.result.access_token;
      const expiresIn = 7200; // 2 hours
      
      console.log('🎉 [Auth] Authentication successful!');

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
        error: 'No access token received from Perfect Corp API'
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
