
export function validateAccessToken(accessToken: string): void {
  if (!accessToken || accessToken.length < 10 || accessToken === 'undefined') {
    throw new Error('Invalid or missing access token for user photo upload');
  }
  console.log('✅ Token validation passed, proceeding with user photo upload...');
}

export function logUploadStart(accessToken: string, userPhotoData: ArrayBuffer): void {
  console.log('=== User Photo Upload to Perfect Corp S2S API ===');
  console.log('📊 Photo data size:', userPhotoData.byteLength, 'bytes');
  console.log('🔑 Access token length:', accessToken.length);
}
