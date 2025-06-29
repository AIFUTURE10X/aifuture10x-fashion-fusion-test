
export async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting Perfect Corp RSA encryption...');
    console.log('🔐 [RSA] Payload:', payload);
    console.log('🔐 [RSA] Key preview:', publicKeyPem.substring(0, 50) + '...');
    
    // Clean and format the public key properly
    let cleanKey = publicKeyPem.trim();
    
    // Handle different key formats
    if (!cleanKey.includes('-----BEGIN')) {
      // If it's raw base64, wrap it
      cleanKey = `-----BEGIN PUBLIC KEY-----\n${cleanKey}\n-----END PUBLIC KEY-----`;
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
    
    if (base64Key.length < 100) {
      throw new Error('RSA key appears to be too short - please verify the complete key is provided');
    }
    
    // Convert to binary with better error handling
    let keyData: Uint8Array;
    try {
      keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    } catch (error) {
      throw new Error('Invalid base64 encoding in RSA key');
    }
    
    console.log('🔧 [RSA] Key data byte length:', keyData.length);
    
    // Try multiple RSA import/encrypt approaches
    const approaches = [
      // Approach 1: RSA-OAEP with SHA-256 (most common)
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
        description: 'RSA-OAEP with SHA-256'
      },
      // Approach 2: RSA-OAEP with SHA-1 (legacy but still used)
      {
        name: 'RSA-OAEP',
        hash: 'SHA-1',
        description: 'RSA-OAEP with SHA-1'
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
          ['encrypt']
        );
        
        console.log(`✅ [RSA] Key imported successfully with ${approach.description}`);
        
        // Encrypt the payload
        const encoder = new TextEncoder();
        const payloadBytes = encoder.encode(payload);
        
        console.log('📏 [RSA] Payload byte size:', payloadBytes.length);
        
        const encrypted = await crypto.subtle.encrypt(
          {
            name: approach.name
          },
          publicKey,
          payloadBytes
        );
        
        // Convert to base64
        const result = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        
        console.log(`✅ [RSA] Encryption successful with ${approach.description}`);
        console.log('🎫 [RSA] Token length:', result.length);
        
        return result;
        
      } catch (encryptError) {
        console.log(`❌ [RSA] ${approach.description} failed:`, encryptError.message);
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
      errorMessage: error.message
    };
    
    console.error('🔍 [RSA] Debug info:', debugInfo);
    
    throw new Error(`RSA encryption failed: ${error.message}. Key length: ${debugInfo.keyLength}, Has markers: ${debugInfo.hasBeginMarker && debugInfo.hasEndMarker}`);
  }
}
