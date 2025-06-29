
export async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting Perfect Corp RSA encryption...');
    console.log('🔐 [RSA] Payload:', payload);
    console.log('🔐 [RSA] Payload length:', payload.length);
    console.log('🔐 [RSA] Key preview (first 50):', publicKeyPem.substring(0, 50) + '...');
    console.log('🔐 [RSA] Key preview (last 50):', '...' + publicKeyPem.substring(publicKeyPem.length - 50));
    console.log('🔐 [RSA] Full key length:', publicKeyPem.length);
    
    // Clean and format the public key properly
    let cleanKey = publicKeyPem.trim();
    
    // Handle different key formats
    if (!cleanKey.includes('-----BEGIN')) {
      // If it's raw base64, wrap it
      cleanKey = `-----BEGIN PUBLIC KEY-----\n${cleanKey}\n-----END PUBLIC KEY-----`;
      console.log('🔧 [RSA] Wrapped raw base64 key with PEM headers');
    }
    
    // Extract the base64 content more carefully
    const base64Key = cleanKey
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/, '')
      .replace(/-----END RSA PUBLIC KEY-----/, '')
      .replace(/\r/g, '')
      .replace(/\n/g, '')
      .replace(/\s/g, '');
    
    console.log('🔧 [RSA] Cleaned key length:', base64Key.length);
    console.log('🔧 [RSA] Base64 key preview:', base64Key.substring(0, 50) + '...');
    
    if (base64Key.length < 100) {
      throw new Error('RSA key appears to be too short - please verify the complete key is provided');
    }
    
    // Convert to binary with better error handling
    let keyData: Uint8Array;
    try {
      keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    } catch (error) {
      console.error('❌ [RSA] Base64 decode error:', error);
      throw new Error(`Invalid base64 encoding in RSA key: ${error.message}`);
    }
    
    console.log('🔧 [RSA] Key data byte length:', keyData.length);
    console.log('🔧 [RSA] Key data preview (hex):', Array.from(keyData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
    
    // Try multiple RSA algorithms that Perfect Corp might expect
    const approaches = [
      // Approach 1: RSASSA-PKCS1-v1_5 (often used for encryption in legacy systems)
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
        description: 'RSASSA-PKCS1-v1_5 with SHA-256',
        keyUsage: ['verify'] as KeyUsage[],
        useSign: true
      },
      // Approach 2: RSASSA-PKCS1-v1_5 with SHA-1 (legacy)
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-1',
        description: 'RSASSA-PKCS1-v1_5 with SHA-1',
        keyUsage: ['verify'] as KeyUsage[],
        useSign: true
      },
      // Approach 3: RSA-OAEP with SHA-1 (current working one)
      {
        name: 'RSA-OAEP',
        hash: 'SHA-1',
        description: 'RSA-OAEP with SHA-1',
        keyUsage: ['encrypt'] as KeyUsage[],
        useSign: false
      },
      // Approach 4: RSA-OAEP with SHA-256 (most modern)
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
        description: 'RSA-OAEP with SHA-256',
        keyUsage: ['encrypt'] as KeyUsage[],
        useSign: false
      }
    ];
    
    for (const approach of approaches) {
      try {
        console.log(`🧪 [RSA] Trying ${approach.description}...`);
        
        // Import the RSA public key
        const publicKey = await crypto.subtle.importKey(
          'spki',
          keyData,
          {
            name: approach.name,
            hash: approach.hash
          },
          false,
          approach.keyUsage
        );
        
        console.log(`✅ [RSA] Key imported successfully with ${approach.description}`);
        console.log(`🔍 [RSA] Key algorithm:`, publicKey.algorithm);
        
        // Encrypt the payload
        const encoder = new TextEncoder();
        const payloadBytes = encoder.encode(payload);
        
        console.log('📏 [RSA] Payload byte size:', payloadBytes.length);
        console.log('📏 [RSA] Payload bytes (hex):', Array.from(payloadBytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        
        let encrypted: ArrayBuffer;
        
        if (approach.useSign) {
          // For RSASSA-PKCS1-v1_5, we use sign instead of encrypt
          // This is a workaround for APIs that expect PKCS#1 v1.5 padding
          console.log('⚠️ [RSA] Using sign operation for PKCS#1 v1.5 (legacy workaround)');
          encrypted = await crypto.subtle.sign(
            {
              name: approach.name
            },
            publicKey,
            payloadBytes
          );
        } else {
          encrypted = await crypto.subtle.encrypt(
            {
              name: approach.name
            },
            publicKey,
            payloadBytes
          );
        }
        
        // Convert to base64
        const encryptedArray = new Uint8Array(encrypted);
        console.log('🔢 [RSA] Encrypted bytes length:', encryptedArray.length);
        console.log('🔢 [RSA] Encrypted bytes (hex preview):', Array.from(encryptedArray.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        
        const result = btoa(String.fromCharCode(...encryptedArray));
        
        console.log(`✅ [RSA] Encryption successful with ${approach.description}`);
        console.log('🎫 [RSA] Token length:', result.length);
        console.log('🎫 [RSA] Token preview (first 50):', result.substring(0, 50) + '...');
        console.log('🎫 [RSA] Token preview (last 50):', '...' + result.substring(result.length - 50));
        
        // Additional validation
        if (result.length < 50) {
          console.warn('⚠️ [RSA] Warning: Encrypted token seems unusually short');
        }
        
        return result;
        
      } catch (encryptError) {
        console.log(`❌ [RSA] ${approach.description} failed:`, encryptError.message);
        console.log(`🔍 [RSA] Error details:`, encryptError);
        // Continue to next approach
      }
    }
    
    // If all approaches failed, throw detailed error
    throw new Error('All RSA encryption approaches failed. Please verify your RSA public key format and ensure it\'s a valid SPKI format public key.');
    
  } catch (error) {
    console.error('❌ [RSA] Encryption failed:', error);
    
    // Provide helpful debugging information
    const debugInfo = {
      keyLength: publicKeyPem?.length || 0,
      hasBeginMarker: publicKeyPem?.includes('BEGIN') || false,
      hasEndMarker: publicKeyPem?.includes('END') || false,
      payloadLength: payload?.length || 0,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.error('🔍 [RSA] Debug info:', JSON.stringify(debugInfo, null, 2));
    
    throw new Error(`RSA encryption failed: ${error.message}. Key length: ${debugInfo.keyLength}, Has markers: ${debugInfo.hasBeginMarker && debugInfo.hasEndMarker}`);
  }
}
