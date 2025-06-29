
// Enhanced RSA encryption with Perfect Corp specific handling
export async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting RSA encryption...');
    console.log('🔐 [RSA] Payload length:', payload.length, 'bytes');
    console.log('🔐 [RSA] Raw key length:', publicKeyPem.length);
    
    // Clean and format the RSA public key
    let cleanKey = publicKeyPem.trim();
    
    // Handle different key formats
    if (!cleanKey.includes('BEGIN PUBLIC KEY')) {
      // If it's just base64 without headers, add them
      if (!cleanKey.includes('BEGIN')) {
        cleanKey = `-----BEGIN PUBLIC KEY-----\n${cleanKey}\n-----END PUBLIC KEY-----`;
      }
    }
    
    console.log('🔧 [RSA] Key format prepared');
    
    // Try multiple approaches for RSA encryption
    const approaches = [
      {
        name: 'RSA-OAEP-SHA256',
        algorithm: { name: 'RSA-OAEP', hash: 'SHA-256' }
      },
      {
        name: 'RSA-OAEP-SHA1', 
        algorithm: { name: 'RSA-OAEP', hash: 'SHA-1' }
      }
    ];
    
    for (const approach of approaches) {
      try {
        console.log(`🔄 [RSA] Trying ${approach.name}...`);
        
        const keyData = await importRSAKey(cleanKey, approach.algorithm);
        const encoder = new TextEncoder();
        const payloadBytes = encoder.encode(payload);
        
        console.log('📏 [RSA] Payload byte size:', payloadBytes.length);
        console.log('🔑 [RSA] Key imported successfully');
        
        const encrypted = await crypto.subtle.encrypt(
          approach.algorithm,
          keyData,
          payloadBytes
        );
        
        const result = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        console.log('✅ [RSA] Encryption successful with', approach.name);
        console.log('🎫 [RSA] Token length:', result.length);
        console.log('🎫 [RSA] Token preview:', result.substring(0, 50) + '...');
        
        return result;
        
      } catch (error) {
        console.log(`❌ [RSA] ${approach.name} failed:`, error.message);
        // Continue to next approach
      }
    }
    
    throw new Error('All RSA encryption approaches failed');
    
  } catch (error) {
    console.error('❌ [RSA] Complete encryption failure:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

async function importRSAKey(pemKey: string, algorithm: any) {
  try {
    // Extract the base64 content from PEM format
    const pemContents = pemKey
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\r/g, '')
      .replace(/\n/g, '')
      .replace(/\s/g, '');
    
    console.log('🔍 [RSA] Extracted base64 length:', pemContents.length);
    
    // Convert base64 to binary
    const keyData = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    console.log('🔍 [RSA] Binary key data length:', keyData.length);
    
    // Import the key with the specified algorithm
    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      keyData,
      algorithm,
      false,
      ['encrypt']
    );
    
    console.log('✅ [RSA] Key imported successfully');
    return cryptoKey;
    
  } catch (error) {
    console.error('❌ [RSA] Key import failed:', error);
    throw new Error(`RSA key import failed: ${error.message}`);
  }
}
