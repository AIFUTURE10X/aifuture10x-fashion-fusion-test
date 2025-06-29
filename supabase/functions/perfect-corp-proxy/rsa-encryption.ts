
// Enhanced RSA encryption with Perfect Corp specific handling
export async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting Perfect Corp RSA encryption...');
    console.log('🔐 [RSA] Payload length:', payload.length, 'bytes');
    console.log('🔐 [RSA] Raw key length:', publicKeyPem.length);
    
    // Clean and prepare the public key
    let cleanKey = publicKeyPem.trim();
    
    // Handle different key formats
    const isPemFormat = cleanKey.includes('BEGIN') && cleanKey.includes('END');
    
    if (isPemFormat) {
      console.log('📝 [RSA] Processing PEM format key');
      // Remove PEM headers/footers and clean whitespace
      cleanKey = cleanKey
        .replace(/-----BEGIN (?:RSA )?PUBLIC KEY-----/g, '')
        .replace(/-----END (?:RSA )?PUBLIC KEY-----/g, '')
        .replace(/\r?\n/g, '')
        .replace(/\s+/g, '')
        .trim();
    } else {
      console.log('📝 [RSA] Processing raw base64 key');
      // Already base64, just clean whitespace
      cleanKey = cleanKey.replace(/\s+/g, '');
    }

    console.log('🔧 [RSA] Cleaned key length:', cleanKey.length);

    if (cleanKey.length === 0) {
      throw new Error('Empty key content after cleaning');
    }

    // Validate base64 format
    try {
      atob(cleanKey);
    } catch {
      throw new Error('Invalid base64 format in RSA key');
    }

    const keyData = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));
    console.log('✅ [RSA] Key decoded successfully, byte length:', keyData.length);

    // Check payload size (RSA-1024 = ~117 bytes max, RSA-2048 = ~245 bytes max with OAEP-SHA256)
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payload);
    console.log('📏 [RSA] Payload byte size:', payloadBytes.length);
    
    if (payloadBytes.length > 200) {
      throw new Error(`Payload too large for RSA encryption: ${payloadBytes.length} bytes (max ~200)`);
    }

    // Try multiple encryption approaches with PKCS#1 v1.5 as priority
    const approaches = [
      // Perfect Corp uses PKCS#1 v1.5 padding (not OAEP)
      {
        name: 'SPKI-PKCS1-v1_5',
        format: 'spki' as KeyFormat,
        algorithm: {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256'
        },
        canEncrypt: false // This is for signing, not encryption
      },
      // Try RSA-OAEP as fallback
      {
        name: 'SPKI-SHA1-OAEP',
        format: 'spki' as KeyFormat,
        algorithm: {
          name: 'RSA-OAEP',
          hash: 'SHA-1'
        },
        canEncrypt: true
      },
      // Alternative OAEP approach
      {
        name: 'SPKI-SHA256-OAEP',
        format: 'spki' as KeyFormat,
        algorithm: {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        canEncrypt: true
      }
    ];

    let lastError: Error | null = null;

    for (const approach of approaches) {
      try {
        console.log(`🔄 [RSA] Trying approach: ${approach.name}`);
        
        // Import the key
        let publicKey;
        try {
          const keyUsages = approach.canEncrypt ? ['encrypt'] : ['verify'];
          publicKey = await crypto.subtle.importKey(
            approach.format,
            keyData,
            approach.algorithm,
            false,
            keyUsages
          );
          console.log(`✅ [RSA] Key imported successfully with ${approach.name}`);
        } catch (importError) {
          console.log(`❌ [RSA] Key import failed with ${approach.name}:`, importError.message);
          lastError = importError as Error;
          continue;
        }
        
        // Try encryption (only for OAEP algorithms)
        if (approach.canEncrypt) {
          try {
            const encryptedData = await crypto.subtle.encrypt(
              approach.algorithm,
              publicKey,
              payloadBytes
            );
            
            const result = btoa(String.fromCharChar(...new Uint8Array(encryptedData)));
            console.log(`✅ [RSA] Encryption successful with ${approach.name}`);
            console.log('🎉 [RSA] Final encrypted token length:', result.length);
            console.log('🎫 [RSA] Token preview:', result.substring(0, 50) + '...');
            
            return result;
            
          } catch (encryptError) {
            console.log(`❌ [RSA] Encryption failed with ${approach.name}:`, encryptError.message);
            lastError = encryptError as Error;
            continue;
          }
        } else {
          console.log(`⏭️ [RSA] Skipping ${approach.name} - not for encryption`);
          continue;
        }
        
      } catch (error) {
        console.log(`❌ [RSA] Approach ${approach.name} failed:`, error.message);
        lastError = error as Error;
        continue;
      }
    }
    
    // If all approaches failed, provide detailed error
    const errorMsg = `All RSA encryption approaches failed. Last error: ${lastError?.message || 'Unknown error'}`;
    console.error('❌ [RSA] Complete failure:', errorMsg);
    
    // Add troubleshooting information
    console.log('📋 [RSA] Troubleshooting info:');
    console.log('  - Key byte length:', keyData.length);
    console.log('  - Payload byte length:', payloadBytes.length);
    console.log('  - Key preview:', cleanKey.substring(0, 100) + '...');
    
    throw new Error(errorMsg);
    
  } catch (error) {
    console.error('❌ [RSA] Complete encryption failure:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}
