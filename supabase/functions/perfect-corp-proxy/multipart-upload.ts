import { PERFECTCORP_FILE_API_URL } from './constants.ts';
import { fetchWithTimeout } from './network-utils.ts';
import { retryWithBackoff } from './retry-utils.ts';

// Strategy 2: Enhanced multipart form data approach with retry logic
export async function tryMultipartUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Trying File API v1.1 upload...');
  console.log('📊 Image data size:', userPhotoData.byteLength, 'bytes');
  
  const fileApiUrl = PERFECTCORP_FILE_API_URL;
  
  return await retryWithBackoff(async () => {
    // Step 1: Get upload URL from File API
    const fileApiResponse = await fetchWithTimeout(fileApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: [{
          content_type: 'image/jpeg',
          file_name: 'user_photo.jpg',
          file_size: userPhotoData.byteLength
        }]
      }),
    }, 15000, 'file API request');

    if (!fileApiResponse.ok) {
      const errorText = await fileApiResponse.text();
      console.error('❌ File API request failed:', fileApiResponse.status, errorText);
      throw new Error(`File API request failed: ${fileApiResponse.status} - ${errorText}`);
    }

    const fileApiData = await fileApiResponse.json();
    const uploadResult = fileApiData.result || fileApiData;
    const files = uploadResult.files || uploadResult;
    const firstFile = Array.isArray(files) ? files[0] : files;
    const uploadUrl = firstFile.url;
    const fileId = firstFile.file_id;

    if (!uploadUrl || !fileId) {
      throw new Error('Missing upload URL or file_id in File API response');
    }

    // Step 2: Upload file to the provided URL
    const uploadResponse = await fetchWithTimeout(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: userPhotoData,
    }, 25000, 'file upload to signed URL');

    console.log(`📥 File upload response: ${uploadResponse.status} ${uploadResponse.statusText}`);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ File upload failed:', uploadResponse.status, errorText);
      throw new Error(`File upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    console.log('🎉 File uploaded successfully, file_id:', fileId);
    return fileId;
  }, 3, 2000, 'multipart upload');
}