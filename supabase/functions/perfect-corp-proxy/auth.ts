
import { AuthResult } from './types.ts';
import { PERFECTCORP_BASE_URL } from './constants.ts';

// Validate credentials format
function validateCredentials(apiKey: string, apiSecret: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!apiKey) {
    issues.push('API key is missing');
  } else if (apiKey.length < 10) {
    issues.push(`API key too short: ${apiKey.length} characters`);
  } else if (apiKey.includes('test') || apiKey.includes('demo') || apiKey.includes('placeholder')) {
    issues.push('API key appears to be a test/placeholder value');
  }
  
  if (!apiSecret) {
    issues.push('API secret is missing');
  } else if (apiSecret.length < 10) {
    issues.push(`API secret too short: ${apiSecret.length} characters`);
  } else if (apiSecret.includes('test') || apiSecret.includes('demo') || apiSecret.includes('placeholder')) {
    issues.push('API secret appears to be a test/placeholder value');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string, supabase: any): Promise<AuthResult> {
  console.log('🔐 [Auth] Starting Perfect Corp authentication...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('🧪 [Auth] Mock mode enabled - returning test token');
    return { accessToken: 'mock_token_for_testing' };
  }

  // Validate credentials first
  const validation = validateCredentials(apiKey, apiSecret);
  if (!validation.valid) {
    console.error('❌ [Auth] Credential validation failed:');
    validation.issues.forEach(issue => console.error('  -', issue));
    throw new Error(`Invalid credentials: ${validation.issues.join(', ')}`);
  }
  
  console.log('✅ [Auth] Credential validation passed');

  // Check for cached token
  try {
    const { data: tokenData, error: tokenError } = await supabase.rpc('get_valid_perfect_corp_token');
    
    if (tokenError) {
      console.warn('⚠️ [Auth] Token check error:', tokenError);
    } else if (tokenData && tokenData.length > 0) {
      const token = tokenData[0];
      console.log(`✅ [Auth] Using cached token, expires in ${token.seconds_until_expiry}s`);
      return { accessToken: token.access_token };
    }
  } catch (error) {
    console.warn('⚠️ [Auth] Token check failed:', error);
  }
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    console.log('🚀 [Auth] Starting fresh authentication');
    console.log('🔑 [Auth] API Key:', apiKey.substring(0, 8) + '...');
    console.log('🗝️ [Auth] Secret length:', apiSecret.length);
    console.log('🌐 [Auth] Auth URL:', authUrl);

    // Try multiple authentication methods based on Perfect Corp's current requirements
    const authMethods = [
      // Method 1: Simple client_id + client_secret (most common)
      {
        name: 'Simple Auth',
        body: {
          client_id: apiKey,
          client_secret: apiSecret
        }
      },
      // Method 2: client_id + token (if secret is meant to be a token)
      {
        name: 'Token Auth',
        body: {
          client_id: apiKey,
          token: apiSecret
        }
      },
      // Method 3: client_id + api_secret
      {
        name: 'API Secret Auth',
        body: {
          client_id: apiKey,
          api_secret: apiSecret
        }
      },
      // Method 4: Timestamp-based (if they require timestamp)
      {
        name: 'Timestamp Auth',
        body: {
          client_id: apiKey,
          client_secret: apiSecret,
          timestamp: Date.now()
        }
      }
    ];

    for (const method of authMethods) {
      try {
        console.log(`🧪 [Auth] Trying ${method.name}...`);
        
        const authResponse = await fetch(authUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Supabase-Edge-Function/1.0',
          },
          body: JSON.stringify(method.body),
        });

        console.log(`📥 [Auth] ${method.name} Response: ${authResponse.status} ${authResponse.statusText}`);
        console.log(`📋 [Auth] ${method.name} Response headers:`, Object.fromEntries(authResponse.headers.entries()));
        
        const responseText = await authResponse.text();
        console.log(`📄 [Auth] ${method.name} Raw response:`, responseText);
        
        if (authResponse.ok) {
          let authData;
          try {
            authData = JSON.parse(responseText);
          } catch (parseError) {
            console.error(`❌ [Auth] ${method.name} Failed to parse response as JSON:`, parseError);
            continue; // Try next method
          }
          
          console.log(`📊 [Auth] ${method.name} Parsed response:`, authData);
          
          let accessToken: string | null = null;
          let expiresIn: number = 7200;
          
          // Handle different response formats
          if (authData.result?.access_token) {
            accessToken = authData.result.access_token;
            expiresIn = authData.result.expires_in || 7200;
          } else if (authData.access_token) {
            accessToken = authData.access_token;
            expiresIn = authData.expires_in || 7200;
          } else if (authData.token) {
            accessToken = authData.token;
            expiresIn = authData.expires_in || 7200;
          }
          
          if (accessToken) {
            console.log(`🎉 [Auth] ${method.name} Authentication successful!`);
            console.log('⏱️ [Auth] Token expires in:', expiresIn, 'seconds');
            
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
                console.warn('⚠️ [Auth] Failed to store token:', insertError);
              } else {
                console.log('💾 [Auth] Token cached successfully');
              }
            } catch (storeError) {
              console.warn('⚠️ [Auth] Token storage error:', storeError);
            }
            
            return { accessToken };
          } else {
            console.error(`❌ [Auth] ${method.name} No access token in successful response`);
            console.log(`🔍 [Auth] ${method.name} Available fields:`, Object.keys(authData));
          }
        } else {
          console.log(`❌ [Auth] ${method.name} failed with status ${authResponse.status}:`, responseText);
        }
      } catch (error) {
        console.log(`❌ [Auth] ${method.name} error:`, error.message);
      }
    }
    
    // If all methods failed, throw error with helpful message
    throw new Error('All authentication methods failed. Please verify your Perfect Corp credentials are correct and contact Perfect Corp support for the current authentication format.');
    
  } catch (error) {
    console.error('❌ [Auth] Authentication error:', error);
    
    // Provide detailed error context
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Perfect Corp API. Check internet connection and API endpoint.');
    }
    
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
