import { fetchWithTimeout } from './network-utils.ts';
import { retryWithBackoff } from './retry-utils.ts';
import { discoverWorkingEndpoints, WorkingEndpoints } from './endpoint-discovery.ts';
import { validateAccessToken } from './auth-validation.ts';

// Strategy 2: Enhanced multipart form data approach with endpoint discovery
export async function tryMultipartUpload(accessToken: string, userPhotoData: ArrayBuffer, workingEndpoints?: WorkingEndpoints): Promise<string> {
  console.log('📤 [Multipart Upload] Starting multipart upload with endpoint discovery...');
  console.log('📊 [Multipart Upload] Image data size:', userPhotoData.byteLength, 'bytes');
  
  // Validate token first
  const tokenValidation = await validateAccessToken(accessToken);
  if (!tokenValidation.isValid) {
    throw new Error(`Token validation failed: ${tokenValidation.error}`);
  }
  
  // Use provided endpoints or discover them
  let endpoints = workingEndpoints;
  if (!endpoints) {
    console.log('🔍 [Multipart Upload] No endpoints provided, discovering...');
    endpoints = await discoverWorkingEndpoints(accessToken);
    if (!endpoints) {
      throw new Error('No working Perfect Corp API endpoints found for multipart upload');
    }
  }
  
  const fileApiUrl = endpoints.fileApi;
  console.log('🎯 [Multipart Upload] Using endpoint:', fileApiUrl.substring(0, 50) + '...');
  
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
    console.log('📦 [Multipart Upload] Full API response:', JSON.stringify(fileApiData, null, 2));
    
    // Enhanced response parsing with detailed logging
    console.log('🔍 [Multipart Upload] Parsing response structure...');
    
    let uploadUrl: string | undefined;
    let fileId: string | undefined;
    
    if (fileApiData.result) {
      console.log('📋 [Multipart Upload] Found result object');
      const result = fileApiData.result;
      
      if (result.files && Array.isArray(result.files) && result.files.length > 0) {
        console.log('📋 [Multipart Upload] Found files array in result');
        uploadUrl = result.files[0].url;
        fileId = result.files[0].file_id;
      } else if (result.url && result.file_id) {
        console.log('📋 [Multipart Upload] Found direct url/file_id in result');
        uploadUrl = result.url;
        fileId = result.file_id;
      }
    } else if (fileApiData.files && Array.isArray(fileApiData.files)) {
      console.log('📋 [Multipart Upload] Found files array at root level');
      uploadUrl = fileApiData.files[0]?.url;
      fileId = fileApiData.files[0]?.file_id;
    } else if (fileApiData.url && fileApiData.file_id) {
      console.log('📋 [Multipart Upload] Found direct url/file_id at root level');
      uploadUrl = fileApiData.url;
      fileId = fileApiData.file_id;
    }

    console.log('🔍 [Multipart Upload] Extracted values:', { uploadUrl: uploadUrl?.substring(0, 50) + '...', fileId });

    if (!uploadUrl || !fileId) {
      console.error('❌ [Multipart Upload] Missing upload URL or file_id in response');
      console.error('📋 [Multipart Upload] Response structure analysis:', {
        hasResult: !!fileApiData.result,
        hasFiles: !!fileApiData.files,
        hasDirectUrl: !!fileApiData.url,
        hasDirectFileId: !!fileApiData.file_id,
        responseKeys: Object.keys(fileApiData)
      });
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