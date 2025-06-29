
// Enhanced RSA encryption with Perfect Corp specific handling
export async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting RSA encryption...');
    console.log('🔐 [RSA] Payload length:', payload.length, 'bytes');
    console.log('🔐 [RSA] Raw key length:', publicKeyPem.length);
    
    // Clean the key
    let cleanKey = publicKeyPem.trim();
    if (!cleanKey.includes('BEGIN')) {
      cleanKey = `-----BEGIN PUBLIC KEY-----\n${cleanKey}\n-----END PUBLIC KEY-----`;
    }
    
    console.log('🔧 [RSA] Using cleaned key format');
    
    // Use a simple approach - call an external RSA encryption service
    // or implement using a proper RSA library
    
    // For now, let's try the basic Web Crypto approach with correct algorithm
    const keyData = await importRSAKey(cleanKey);
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payload);
    
    console.log('📏 [RSA] Payload byte size:', payloadBytes.length);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      keyData,
      payloadBytes
    );
    
    const result = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    console.log('✅ [RSA] Encryption successful, token length:', result.length);
    console.log('🎫 [RSA] Token preview:', result.substring(0, 50) + '...');
    
    return result;
    
  } catch (error) {
    console.error('❌ [RSA] Encryption failed:', error);
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
}

async function importRSAKey(pemKey: string) {
  // Convert PEM to binary
  const pemContents = pemKey
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  
  const keyData = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  return await crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
}
