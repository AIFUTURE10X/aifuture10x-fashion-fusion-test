import { fetchWithTimeout } from './network-utils.ts';
import { retryWithBackoff } from './retry-utils.ts';
import { discoverWorkingEndpoints, WorkingEndpoints } from './endpoint-discovery.ts';
import { validateAccessToken } from './auth-validation.ts';

// Strategy 3: Enhanced minimal headers approach with endpoint discovery
export async function tryMinimalUpload(accessToken: string, userPhotoData: ArrayBuffer, workingEndpoints?: WorkingEndpoints): Promise<string> {
  console.log('📤 [Minimal Upload] Starting minimal upload with endpoint discovery...');
  console.log('📊 [Minimal Upload] Image data size:', userPhotoData.byteLength, 'bytes');
  
  // Validate token first
  const tokenValidation = await validateAccessToken(accessToken);
  if (!tokenValidation.isValid) {
    throw new Error(`Token validation failed: ${tokenValidation.error}`);
  }
  
  // Use provided endpoints or discover them
  let endpoints = workingEndpoints;
  if (!endpoints) {
    console.log('🔍 [Minimal Upload] No endpoints provided, discovering...');
    endpoints = await discoverWorkingEndpoints(accessToken);
    if (!endpoints) {
      throw new Error('No working Perfect Corp API endpoints found for minimal upload');
    }
  }
  
  const uploadRequestUrl = endpoints.fileApi;
  console.log('🎯 [Minimal Upload] Using endpoint:', uploadRequestUrl.substring(0, 50) + '...');
  
  return await retryWithBackoff(async () => {
    // Step 1: Request upload URL from File API
    const uploadRequestResponse = await fetchWithTimeout(uploadRequestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: [{
          content_type: 'image/jpeg',
          file_name: 'photo.jpg',
          file_size: userPhotoData.byteLength
        }]
      }),
    }, 15000, 'file API request');

    if (!uploadRequestResponse.ok) {
      const errorText = await uploadRequestResponse.text();
      console.error('❌ Minimal upload request failed:', uploadRequestResponse.status, errorText);
      console.error('❌ Full request details:', {
        url: uploadRequestUrl,
        method: 'POST',
        headers: Object.fromEntries([
          ['Authorization', `Bearer ${accessToken.substring(0, 15)}...`],
          ['Content-Type', 'application/json']
        ])
      });
      throw new Error(`Minimal upload request failed: ${uploadRequestResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadRequestResponse.json();
    console.log('📦 [Minimal Upload] Full API response:', JSON.stringify(uploadData, null, 2));
    
    // Enhanced response parsing with detailed logging
    console.log('🔍 [Minimal Upload] Parsing response structure...');
    
    let uploadUrl: string | undefined;
    let fileId: string | undefined;
    
    if (uploadData.result) {
      console.log('📋 [Minimal Upload] Found result object');
      const result = uploadData.result;
      
      if (result.files && Array.isArray(result.files) && result.files.length > 0) {
        console.log('📋 [Minimal Upload] Found files array in result');
        uploadUrl = result.files[0].url;
        fileId = result.files[0].file_id;
      } else if (result.url && result.file_id) {
        console.log('📋 [Minimal Upload] Found direct url/file_id in result');
        uploadUrl = result.url;
        fileId = result.file_id;
      }
    } else if (uploadData.files && Array.isArray(uploadData.files)) {
      console.log('📋 [Minimal Upload] Found files array at root level');
      uploadUrl = uploadData.files[0]?.url;
      fileId = uploadData.files[0]?.file_id;
    } else if (uploadData.url && uploadData.file_id) {
      console.log('📋 [Minimal Upload] Found direct url/file_id at root level');
      uploadUrl = uploadData.url;
      fileId = uploadData.file_id;
    }

    console.log('🔍 [Minimal Upload] Extracted values:', { uploadUrl: uploadUrl?.substring(0, 50) + '...', fileId });

    if (!uploadUrl || !fileId) {
      console.error('❌ [Minimal Upload] Missing upload URL or file_id in response');
      console.error('📋 [Minimal Upload] Response structure analysis:', {
        hasResult: !!uploadData.result,
        hasFiles: !!uploadData.files,
        hasDirectUrl: !!uploadData.url,
        hasDirectFileId: !!uploadData.file_id,
        responseKeys: Object.keys(uploadData)
      });
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