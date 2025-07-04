import { fetchWithTimeout } from './network-utils.ts';
import { discoverWorkingEndpoints } from './endpoint-discovery.ts';

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  tokenInfo?: {
    length: number;
    expiresIn?: number;
    scope?: string;
  };
}

export async function validateAccessToken(accessToken: string): Promise<TokenValidationResult> {
  console.log('🔐 [Token Validation] Validating Perfect Corp access token...');
  console.log('🔍 [Token Validation] Token preview:', accessToken.substring(0, 20) + '...');
  
  if (!accessToken || accessToken.length < 10) {
    return {
      isValid: false,
      error: 'Access token is too short or invalid'
    };
  }
  
  try {
    // Find working endpoints first
    const endpoints = await discoverWorkingEndpoints(accessToken);
    if (!endpoints) {
      return {
        isValid: false,
        error: 'No working Perfect Corp endpoints found'
      };
    }
    
    // Test token with a simple API call
    console.log('🧪 [Token Validation] Testing token with File API...');
    
    const testResponse = await fetchWithTimeout(endpoints.fileApi, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Perfect-Corp-S2S-Client/1.0'
      },
      body: JSON.stringify({
        files: [{
          content_type: 'image/jpeg',
          file_name: 'test_validation.jpg',
          file_size: 1024
        }]
      })
    }, 10000, 'token validation');
    
    console.log('📊 [Token Validation] Validation response:', testResponse.status, testResponse.statusText);
    
    if (testResponse.status === 401) {
      return {
        isValid: false,
        error: 'Access token is invalid or expired'
      };
    }
    
    if (testResponse.status === 403) {
      return {
        isValid: false,
        error: 'Access token does not have required permissions'
      };
    }
    
    if (testResponse.status >= 200 && testResponse.status < 500) {
      console.log('✅ [Token Validation] Access token is valid');
      
      // Try to extract token information
      const responseData = await testResponse.json().catch(() => ({}));
      
      return {
        isValid: true,
        tokenInfo: {
          length: accessToken.length,
          expiresIn: responseData.expires_in,
          scope: responseData.scope
        }
      };
    }
    
    return {
      isValid: false,
      error: `Unexpected response: ${testResponse.status} ${testResponse.statusText}`
    };
    
  } catch (error) {
    console.error('❌ [Token Validation] Token validation failed:', error);
    return {
      isValid: false,
      error: `Token validation error: ${error.message}`
    };
  }
}

export function logTokenInfo(accessToken: string) {
  console.log('🔑 [Token Info] Access token analysis:');
  console.log('  Length:', accessToken.length);
  console.log('  Preview:', accessToken.substring(0, 15) + '...' + accessToken.substring(accessToken.length - 5));
  console.log('  Format:', accessToken.includes('.') ? 'JWT-like' : 'Opaque token');
  
  if (accessToken.includes('.')) {
    try {
      const parts = accessToken.split('.');
      console.log('  JWT parts:', parts.length);
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('  JWT payload preview:', {
          iss: payload.iss,
          exp: payload.exp,
          iat: payload.iat,
          scope: payload.scope
        });
      }
    } catch (e) {
      console.log('  JWT parsing failed:', e.message);
    }
  }
}