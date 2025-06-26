
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

// Enhanced RSA encryption with proper error handling and multiple methods
async function encryptWithRSA(data: string, publicKey: string): Promise<string> {
  try {
    console.log('🔐 [Proxy] Starting RSA encryption...');
    console.log('📊 [Proxy] Data:', data);
    console.log('📏 [Proxy] Data length:', data.length);
    
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
    
    console.log('🧹 [Proxy] Cleaned key length:', cleanKey.length);
    
    if (!cleanKey || cleanKey.length < 100) {
      throw new Error('RSA public key too short');
    }
    
    // Convert to binary
    const binaryString = atob(cleanKey);
    const keyBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      keyBuffer[i] = binaryString.charCodeAt(i);
    }
    
    console.log('📦 [Proxy] Key buffer length:', keyBuffer.length);
    
    // Try encryption methods
    const methods = [
      { name: 'RSA-OAEP', hash: 'SHA-1' },
      { name: 'RSA-OAEP', hash: 'SHA-256' },
    ];
    
    for (const method of methods) {
      try {
        console.log(`🔧 [Proxy] Trying ${method.name} with ${method.hash}...`);
        
        const cryptoKey = await crypto.subtle.importKey(
          'spki',
          keyBuffer,
          { name: method.name, hash: method.hash },
          false,
          ['encrypt']
        );
        
        console.log(`✅ [Proxy] Key imported successfully`);
        
        const encodedData = new TextEncoder().encode(data);
        const encryptedData = await crypto.subtle.encrypt(
          { name: method.name },
          cryptoKey,
          encodedData
        );
        
        console.log('🎯 [Proxy] Encryption successful, length:', encryptedData.byteLength);
        
        const encryptedArray = new Uint8Array(encryptedData);
        const base64Result = btoa(String.fromCharCode(...encryptedArray));
        
        console.log('📊 [Proxy] Final encrypted length:', base64Result.length);
        console.log('🎉 [Proxy] Encryption completed with', method.name, method.hash);
        
        return base64Result;
        
      } catch (error) {
        console.log(`❌ [Proxy] ${method.name}-${method.hash} failed:`, error.message);
      }
    }
    
    throw new Error('All RSA encryption methods failed');
    
  } catch (error) {
    console.error('💥 [Proxy] RSA encryption error:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string, supabase: any): Promise<AuthResult> {
  console.log('🔐 [Proxy] Authenticating with Perfect Corp...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('🧪 [Proxy] Mock mode enabled');
    return { accessToken: 'mock_token_for_testing' };
  }

  // Check for cached token
  try {
    const { data: tokenData, error: tokenError } = await supabase.rpc('get_valid_perfect_corp_token');
    
    if (tokenError) {
      console.warn('⚠️ [Proxy] Token check error:', tokenError);
    } else if (tokenData && tokenData.length > 0) {
      const token = tokenData[0];
      console.log(`✅ [Proxy] Using cached token, expires in ${token.seconds_until_expiry}s`);
      return { accessToken: token.access_token };
    }
  } catch (error) {
    console.warn('⚠️ [Proxy] Token check failed:', error);
  }
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    console.log('🚀 [Proxy] Starting authentication');
    console.log('🔑 [Proxy] API Key length:', apiKey?.length || 0);
    console.log('🗝️ [Proxy] Secret Key length:', apiSecret?.length || 0);
    
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid API key');
    }
    
    if (!apiSecret || apiSecret.length < 100) {
      throw new Error('Invalid API secret');
    }
    
    // Create authentication data
    const timestamp = Date.now();
    const dataToEncrypt = `client_id=${apiKey}&timestamp=${timestamp}`;
    
    console.log('📝 [Proxy] Auth data:', dataToEncrypt);
    console.log('⏰ [Proxy] Timestamp:', timestamp);
    
    let encryptedToken: string;
    try {
      encryptedToken = await encryptWithRSA(dataToEncrypt, apiSecret);
    } catch (encryptError) {
      console.error('❌ [Proxy] Encryption failed:', encryptError);
      throw new Error(`Encryption failed: ${encryptError.message}`);
    }
    
    const requestBody = {
      client_id: apiKey,
      id_token: encryptedToken
    };
    
    console.log('📤 [Proxy] Making auth request...');
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📥 [Proxy] Response: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('📊 [Proxy] Response keys:', Object.keys(authData));
      
      let accessToken: string | null = null;
      let expiresIn: number = 7200;
      
      if (authData.result?.access_token) {
        accessToken = authData.result.access_token;
      } else if (authData.access_token) {
        accessToken = authData.access_token;
      }
      
      if (accessToken) {
        console.log('🎉 [Proxy] Authentication successful!');
        
        // Cache token
        try {
          const expiresAt = new Date(Date.now() + ((expiresIn - 60) * 1000)).toISOString();
          
          await supabase.rpc('cleanup_expired_perfect_corp_tokens');
          
          const { error: insertError } = await supabase
            .from('perfect_corp_tokens')
            .insert({
              access_token: accessToken,
              expires_at: expiresAt
            });
            
          if (insertError) {
            console.warn('⚠️ [Proxy] Failed to store token:', insertError);
          } else {
            console.log('💾 [Proxy] Token cached successfully');
          }
        } catch (storeError) {
          console.warn('⚠️ [Proxy] Token storage error:', storeError);
        }
        
        return { accessToken };
      } else {
        console.error('❌ [Proxy] No access token in response');
        throw new Error('No access token received');
      }
    }
    
    const errorText = await authResponse.text();
    console.error('❌ [Proxy] Auth failed:', authResponse.status, errorText);
    
    let errorMessage = 'Authentication failed';
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error_code === 'InvalidParameters') {
        errorMessage = 'Invalid request parameters';
      } else if (errorData.error_code === 'InvalidAuthentication') {
        errorMessage = 'Authentication failed - verify credentials';
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (parseError) {
      // Use default message
    }
    
    throw new Error(errorMessage);
    
  } catch (error) {
    console.error('❌ [Proxy] Authentication error:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
