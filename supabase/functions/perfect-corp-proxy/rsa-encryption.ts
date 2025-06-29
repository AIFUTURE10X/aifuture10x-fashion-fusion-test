
export async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting Perfect Corp RSA encryption...');
    console.log('🔐 [RSA] Payload:', payload);
    
    // Clean and format the public key properly
    let cleanKey = publicKeyPem.trim();
    
    // Ensure proper PEM format
    if (!cleanKey.includes('-----BEGIN')) {
      cleanKey = `-----BEGIN PUBLIC KEY-----\n${cleanKey}\n-----END PUBLIC KEY-----`;
    }
    
    // Extract the base64 content
    const base64Key = cleanKey
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');
    
    console.log('🔧 [RSA] Cleaned key length:', base64Key.length);
    
    // Convert to binary
    const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    
    // Import the RSA public key
    const publicKey = await crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false,
      ['encrypt']
    );
    
    console.log('✅ [RSA] Key imported successfully');
    
    // Encrypt the payload
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payload);
    
    console.log('📏 [RSA] Payload byte size:', payloadBytes.length);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      payloadBytes
    );
    
    // Convert to base64
    const result = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    
    console.log('✅ [RSA] Encryption successful');
    console.log('🎫 [RSA] Token length:', result.length);
    
    return result;
    
  } catch (error) {
    console.error('❌ [RSA] Encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}
