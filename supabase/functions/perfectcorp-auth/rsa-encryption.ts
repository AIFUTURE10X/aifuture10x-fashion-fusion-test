
// Enhanced RSA encryption with multiple fallback approaches
export async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting enhanced encryption...');
    console.log('🔐 [RSA] Payload length:', payload.length, 'bytes');
    console.log('🔐 [RSA] Raw key length:', publicKeyPem.length);
    
    // Clean the public key more aggressively
    let cleanKey = publicKeyPem.trim();
    
    // Remove all possible header/footer variations and whitespace
    cleanKey = cleanKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
      .replace(/-----END RSA PUBLIC KEY-----/g, '')
      .replace(/\r?\n/g, '')
      .replace(/\s+/g, '')
      .trim();

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

    // Check payload size limitations (RSA-2048 can encrypt max ~245 bytes with OAEP-SHA256)
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payload);
    console.log('📏 [RSA] Payload byte size:', payloadBytes.length);
    
    if (payloadBytes.length > 190) {
      console.warn('⚠️ [RSA] Payload might be too large for RSA encryption');
    }

    // Try multiple encryption approaches
    const approaches = [
      // Approach 1: SPKI format with SHA-256
      {
        name: 'SPKI-SHA256',
        format: 'spki' as KeyFormat,
        algorithm: { name: 'RSA-OAEP', hash: 'SHA-256' }
      },
      // Approach 2: SPKI format with SHA-1  
      {
        name: 'SPKI-SHA1',
        format: 'spki' as KeyFormat,
        algorithm: { name: 'RSA-OAEP', hash: 'SHA-1' }
      }
    ];

    let lastError: Error | null = null;

    for (const approach of approaches) {
      try {
        console.log(`🔄 [RSA] Trying approach: ${approach.name}`);
        
        const publicKey = await crypto.subtle.importKey(
          approach.format,
          keyData,
          approach.algorithm,
          false,
          ['encrypt']
        );
        
        console.log(`✅ [RSA] Key imported successfully with ${approach.name}`);
        
        // Try encryption with smaller chunks if needed
        let encryptedData: ArrayBuffer;
        
        try {
          encryptedData = await crypto.subtle.encrypt(
            approach.algorithm,
            publicKey,
            payloadBytes
          );
          console.log(`✅ [RSA] Encryption successful with ${approach.name}`);
        } catch (encryptError) {
          console.log(`❌ [RSA] Encryption failed with ${approach.name}:`, encryptError.message);
          lastError = encryptError as Error;
          continue;
        }

        const result = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
        console.log('🎉 [RSA] Final encrypted token length:', result.length);
        console.log('🎫 [RSA] Token preview:', result.substring(0, 50) + '...');
        
        return result;
        
      } catch (error) {
        console.log(`❌ [RSA] Approach ${approach.name} failed:`, error.message);
        lastError = error as Error;
        continue;
      }
    }
    
    // If all approaches failed, throw the last error
    throw new Error(`All RSA encryption approaches failed. Last error: ${lastError?.message || 'Unknown error'}`);
    
  } catch (error) {
    console.error('❌ [RSA] Complete encryption failure:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}
