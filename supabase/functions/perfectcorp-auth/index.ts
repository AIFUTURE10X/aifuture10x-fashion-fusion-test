
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

interface AuthRequest {
  apiKey?: string;
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

// Enhanced RSA encryption with proper PKCS#1 padding
async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    console.log('🔐 Starting RSA encryption for Perfect Corp...');
    console.log('📊 Data to encrypt:', data);
    console.log('📏 Data length:', data.length);
    
    // Clean the RSA public key
    let cleanKey = publicKey.trim();
    console.log('🔑 Key length:', cleanKey.length);
    
    // Remove PEM headers if present
    if (cleanKey.includes('-----BEGIN')) {
      cleanKey = cleanKey
        .replace(/-----BEGIN[^-]+-----/g, '')
        .replace(/-----END[^-]+-----/g, '')
        .replace(/\s+/g, '')
        .trim();
    } else {
      cleanKey = cleanKey.replace(/\s+/g, '');
    }
    
    console.log('🧹 Cleaned key length:', cleanKey.length);
    
    if (!cleanKey || cleanKey.length < 100) {
      throw new Error('RSA public key is too short');
    }
    
    // Convert base64 to binary
    const binaryString = atob(cleanKey);
    const keyBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      keyBuffer[i] = binaryString.charCodeAt(i);
    }
    
    console.log('📦 Key buffer length:', keyBuffer.length);
    
    // Try different RSA configurations
    const configs = [
      { name: 'RSA-OAEP', hash: 'SHA-1' },
      { name: 'RSA-OAEP', hash: 'SHA-256' },
    ];
    
    for (const config of configs) {
      try {
        console.log(`🔧 Trying ${config.name} with ${config.hash}...`);
        
        const cryptoKey = await crypto.subtle.importKey(
          'spki',
          keyBuffer,
          { name: config.name, hash: config.hash },
          false,
          ['encrypt']
        );
        
        console.log(`✅ Key imported with ${config.name}-${config.hash}`);
        
        // Encode data and encrypt
        const encodedData = new TextEncoder().encode(data);
        console.log('📝 Encoded data length:', encodedData.length);
        
        const encryptedData = await crypto.subtle.encrypt(
          { name: config.name },
          cryptoKey,
          encodedData
        );
        
        console.log('🎯 Encryption successful, length:', encryptedData.byteLength);
        
        // Convert to base64
        const encryptedArray = new Uint8Array(encryptedData);
        const base64Result = btoa(String.fromCharCode(...encryptedArray));
        
        console.log('📊 Final token length:', base64Result.length);
        console.log('🎉 RSA encryption completed with', config.name, config.hash);
        
        return base64Result;
        
      } catch (error) {
        console.log(`❌ ${config.name}-${config.hash} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('Failed to encrypt with any RSA configuration');
    
  } catch (error) {
    console.error('💥 RSA encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

async function authenticateWithPerfectCorp(): Promise<AuthResponse> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for cached token
    const { data: existingTokenData } = await supabase.rpc('get_valid_perfect_corp_token');

    if (existingTokenData && existingTokenData.length > 0) {
      const token = existingTokenData[0];
      console.log('✅ Using cached token, expires in', token.seconds_until_expiry, 'seconds');
      return {
        success: true,
        accessToken: token.access_token,
        expiresIn: Math.max(token.seconds_until_expiry, 0)
      };
    }

    console.log('🔄 Generating new Perfect Corp access token...');
    
    const clientId = Deno.env.get('PERFECTCORP_API_KEY');
    const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
    
    if (!clientId || clientId.length < 10) {
      return {
        success: false,
        error: 'PERFECTCORP_API_KEY is not configured properly'
      };
    }
    
    if (!clientSecret || clientSecret.length < 100) {
      return {
        success: false,
        error: 'PERFECTCORP_API_SECRET is not configured properly'
      };
    }

    // Create exact data format for Perfect Corp
    const timestamp = Date.now();
    const dataToEncrypt = `client_id=${clientId}&timestamp=${timestamp}`;
    
    console.log('📝 Encrypting:', dataToEncrypt);
    
    let encryptedToken: string;
    try {
      encryptedToken = await encryptWithRSA(dataToEncrypt, clientSecret);
    } catch (encryptError) {
      console.error('❌ Encryption failed:', encryptError);
      return {
        success: false,
        error: `RSA encryption failed: ${encryptError.message}`
      };
    }

    const requestBody = {
      client_id: clientId,
      id_token: encryptedToken
    };

    console.log('🚀 Making auth request to Perfect Corp...');
    
    const authResponse = await fetch(PERFECTCORP_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📥 Response: ${authResponse.status} ${authResponse.statusText}`);

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('❌ Auth failed:', errorText);
      return {
        success: false,
        error: `Authentication failed: ${authResponse.status} ${errorText}`
      };
    }

    const authData: PerfectCorpAuthResponse = await authResponse.json();
    console.log('📦 Auth response received');

    if (authData.result?.access_token) {
      const accessToken = authData.result.access_token;
      const expiresIn = 7200; // 2 hours
      
      console.log('🎉 Authentication successful!');

      // Cache the token
      try {
        const expiresAt = new Date(Date.now() + ((expiresIn - 60) * 1000));
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
      console.error('❌ No access token in response');
      return {
        success: false,
        error: 'No access token received from Perfect Corp API'
      };
    }

  } catch (error) {
    console.error('💥 Authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

serve(async (req) => {
  console.log(`🌐 ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Test endpoint
  if (req.url.endsWith('/test')) {
    console.log('🧪 Configuration test endpoint');
    const clientId = Deno.env.get('PERFECTCORP_API_KEY');
    const clientSecret = Deno.env.get('PERFECTCORP_API_SECRET');
    
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
        ? '✅ Configuration ready for authentication' 
        : '❌ Fix encryption error before proceeding'
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
    console.log('🔐 Processing authentication request...');
    const result = await authenticateWithPerfectCorp();

    const statusCode = result.success ? 200 : 400;
    console.log(`📤 Returning: ${statusCode} - Success: ${result.success}`);
    
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
