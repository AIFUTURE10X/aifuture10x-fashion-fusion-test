import { PERFECTCORP_BASE_URL } from './constants.ts';
import { fetchWithTimeout } from './network-utils.ts';
import { retryWithBackoff } from './retry-utils.ts';

// Strategy 3: Enhanced minimal headers approach with retry logic
export async function tryMinimalUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Trying enhanced minimal headers upload...');
  console.log('📊 Image data size:', userPhotoData.byteLength, 'bytes');
  
  const uploadRequestUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/user-photo`;
  
  return await retryWithBackoff(async () => {
    // Step 1: Request upload URL with minimal headers
    const uploadRequestResponse = await fetchWithTimeout(uploadRequestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: [{
          content_type: 'image/jpeg',
          file_name: 'photo.jpg'
        }]
      }),
    }, 15000, 'minimal upload request');

    if (!uploadRequestResponse.ok) {
      const errorText = await uploadRequestResponse.text();
      throw new Error(`Minimal upload request failed: ${uploadRequestResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadRequestResponse.json();
    const uploadUrl = uploadData.result?.files?.[0]?.url;
    const fileId = uploadData.result?.files?.[0]?.file_id;

    if (!uploadUrl || !fileId) {
      throw new Error('Missing upload URL or file_id in minimal response');
    }

    // Step 2: Upload with minimal headers
    const imageResponse = await fetchWithTimeout(uploadUrl, {
      method: 'PUT',
      body: userPhotoData,
    }, 25000, 'minimal image upload');

    if (!imageResponse.ok) {
      throw new Error(`Minimal image upload failed: ${imageResponse.status}`);
    }

    console.log('🎉 Minimal upload successful, file_id:', fileId);
    return fileId;
  }, 3, 1500, 'minimal upload');
}