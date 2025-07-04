import { PERFECTCORP_BASE_URL } from './constants.ts';
import { fetchWithTimeout } from './network-utils.ts';
import { retryWithBackoff } from './retry-utils.ts';

// Strategy 2: Enhanced multipart form data approach with retry logic
export async function tryMultipartUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Trying enhanced multipart form data upload...');
  console.log('📊 Image data size:', userPhotoData.byteLength, 'bytes');
  
  const uploadUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/user-photo`;
  
  return await retryWithBackoff(async () => {
    const formData = new FormData();
    formData.append('file', new Blob([userPhotoData], { type: 'image/jpeg' }), 'user_photo.jpg');
    
    const uploadResponse = await fetchWithTimeout(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Perfect-Corp-S2S-Client/1.0'
      },
      body: formData,
    }, 25000, 'multipart upload');

    console.log(`📥 Multipart upload response: ${uploadResponse.status} ${uploadResponse.statusText}`);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Multipart upload failed:', uploadResponse.status, errorText);
      throw new Error(`Multipart upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('📦 Multipart upload response:', uploadResult);
    
    const fileId = uploadResult.file_id || uploadResult.result?.file_id || uploadResult.id;
    
    if (!fileId) {
      console.error('❌ No file_id in multipart response:', uploadResult);
      throw new Error('No file_id received from multipart upload');
    }

    console.log('🎉 Multipart upload successful, file_id:', fileId);
    return fileId;
  }, 3, 2000, 'multipart upload');
}