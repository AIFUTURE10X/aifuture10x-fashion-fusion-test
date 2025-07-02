
import { JSEncrypt } from 'https://esm.sh/jsencrypt@3.3.2';

export async function rsaEncrypt(payload: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 [RSA] Starting Perfect Corp RSA encryption with JSEncrypt...');
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
    
    console.log('🔧 [RSA] Using JSEncrypt for PKCS1 RSA encryption (Perfect Corp compatible)');
    
    // Create JSEncrypt instance exactly like Perfect Corp's reference
    const encrypt = new JSEncrypt();
    
    // Set the public key directly on the encrypt object
    encrypt.setPublicKey(cleanKey);
    
    console.log('✅ [RSA] JSEncrypt instance created and public key set');
    console.log('📝 [RSA] Encrypting payload with JSEncrypt...');
    
    // Direct encryption call that returns the encrypted string
    const encrypted = encrypt.encrypt(payload);
    
    if (!encrypted) {
      console.error('❌ [RSA] JSEncrypt encryption failed - no result returned');
      throw new Error('JSEncrypt encryption failed: No encrypted result returned');
    }
    
    console.log('✅ [RSA] JSEncrypt encryption successful');
    console.log('🎫 [RSA] Token length:', encrypted.length);
    console.log('🎫 [RSA] Token preview (first 50):', encrypted.substring(0, 50) + '...');
    console.log('🎫 [RSA] Token preview (last 50):', '...' + encrypted.substring(encrypted.length - 50));
    
    // Additional validation
    if (encrypted.length < 50) {
      console.warn('⚠️ [RSA] Warning: Encrypted token seems unusually short');
    }
    
    return encrypted;
    
  } catch (error) {
    console.error('❌ [RSA] JSEncrypt encryption failed:', error);
    
    // Provide helpful debugging information
    const debugInfo = {
      keyLength: publicKeyPem?.length || 0,
      hasBeginMarker: publicKeyPem?.includes('BEGIN') || false,
      hasEndMarker: publicKeyPem?.includes('END') || false,
      payloadLength: payload?.length || 0,
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
      encryptionMethod: 'JSEncrypt (PKCS1)'
    };
    
    console.error('🔍 [RSA] Debug info:', JSON.stringify(debugInfo, null, 2));
    
    throw new Error(`JSEncrypt RSA encryption failed: ${error.message}. Key length: ${debugInfo.keyLength}, Has markers: ${debugInfo.hasBeginMarker && debugInfo.hasEndMarker}`);
  }
}
