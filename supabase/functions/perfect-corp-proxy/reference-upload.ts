import { PERFECTCORP_FILE_API_URL } from './constants.ts';
import { testNetworkConnectivity, fetchWithTimeout } from './network-utils.ts';
import { retryWithBackoff } from './retry-utils.ts';
import { discoverWorkingEndpoints, WorkingEndpoints } from './endpoint-discovery.ts';
import { validateAccessToken, logTokenInfo } from './auth-validation.ts';

// Strategy 1: Enhanced reference upload pattern with endpoint discovery and authentication validation
export async function tryReferenceUploadPattern(accessToken: string, userPhotoData: ArrayBuffer, workingEndpoints?: WorkingEndpoints): Promise<string> {
  console.log('📤 [Reference Upload] Starting enhanced reference upload pattern...');
  console.log('📊 [Reference Upload] Image data size:', userPhotoData.byteLength, 'bytes');
  console.log('🏷️ [Reference Upload] Image type: ArrayBuffer');
  
  // Step 0: Validate access token first
  console.log('🔐 [Reference Upload] Validating access token...');
  logTokenInfo(accessToken);
  
  const tokenValidation = await validateAccessToken(accessToken);
  if (!tokenValidation.isValid) {
    throw new Error(`Token validation failed: ${tokenValidation.error}`);
  }
  console.log('✅ [Reference Upload] Access token validated successfully');
  
  // Use provided endpoints or discover them
  let endpoints = workingEndpoints;
  if (!endpoints) {
    console.log('🔍 [Reference Upload] No endpoints provided, discovering working API endpoints...');
    endpoints = await discoverWorkingEndpoints(accessToken);
    if (!endpoints) {
      throw new Error('No working Perfect Corp API endpoints found. The service may be unavailable.');
    }
  }
  
  console.log('✅ [Reference Upload] Using endpoints:', {
    baseUrl: endpoints.baseUrl,
    version: endpoints.version,
    fileApi: endpoints.fileApi.substring(0, 50) + '...'
  });
  
  // Skip network connectivity check since endpoint discovery handles this
  console.log('🔗 [Reference Upload] Network connectivity will be tested during endpoint discovery');
  
  const uploadRequestUrl = endpoints.fileApi;
  console.log('🎯 [Reference Upload] Using working File API URL:', uploadRequestUrl);
  
  console.log('🔗 Upload request endpoint:', uploadRequestUrl);
  console.log('🔑 Token preview:', accessToken.substring(0, 15) + '...');
  console.log('📋 Request body preview:', JSON.stringify({
    files: [{
      content_type: 'image/jpeg',
      file_name: 'user_photo.jpg'
    }]
  }, null, 2));
  
    // Step 1: Request upload URL with retry logic - Enhanced with endpoint testing
    const uploadCredentials = await retryWithBackoff(async () => {
      console.log('📋 Requesting upload credentials from Perfect Corp...');
      console.log('🔗 Testing primary endpoint:', uploadRequestUrl);
      
      let uploadRequestResponse;
      
      try {
        uploadRequestResponse = await fetchWithTimeout(uploadRequestUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            'User-Agent': 'Perfect-Corp-S2S-Client/1.0',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          },
          body: JSON.stringify({
            files: [{
              content_type: 'image/jpeg',
              file_name: 'user_photo.jpg',
              file_size: userPhotoData.byteLength
            }]
          }),
        }, 20000, 'upload request');

        console.log(`📥 Upload request response: ${uploadRequestResponse.status} ${uploadRequestResponse.statusText}`);
        console.log('📋 Response headers:', Object.fromEntries(uploadRequestResponse.headers.entries()));
        
        if (!uploadRequestResponse.ok) {
          const errorText = await uploadRequestResponse.text();
          console.error('❌ Upload request failed:', uploadRequestResponse.status, errorText);
          console.error('❌ Full request details:', {
            url: uploadRequestUrl,
            method: 'POST',
            headers: Object.fromEntries([
              ['Authorization', `Bearer ${accessToken.substring(0, 15)}...`],
              ['Content-Type', 'application/json'],
              ['Accept', 'application/json'],
              ['User-Agent', 'Perfect-Corp-S2S-Client/1.0']
            ])
          });
          
          // Enhanced error parsing
          let errorMessage = `Upload request failed: ${uploadRequestResponse.status}`;
          try {
            const errorData = JSON.parse(errorText);
            console.error('🔍 Parsed error:', errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            console.error('🔍 Raw error text:', errorText);
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
      } catch (primaryError) {
        console.error('❌ Primary endpoint failed, testing alternative endpoint...');
        
        // Try alternative endpoint from our working endpoints
        const altUploadRequestUrl = endpoints.fileApi.replace(`/${endpoints.version}/`, '/v1.1/');
        console.log('🔗 Testing alternative endpoint:', altUploadRequestUrl);
        
        try {
          uploadRequestResponse = await fetchWithTimeout(altUploadRequestUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'Perfect-Corp-S2S-Client/1.0'
            },
            body: JSON.stringify({
              files: [{
                content_type: 'image/jpeg',
                file_name: 'user_photo.jpg',
                file_size: userPhotoData.byteLength
              }]
            }),
          }, 20000, 'alternative upload request');

          if (!uploadRequestResponse.ok) {
            const altErrorText = await uploadRequestResponse.text();
            console.error('❌ Alternative endpoint also failed:', uploadRequestResponse.status, altErrorText);
            throw new Error(`Both v1.0 and v1.1 endpoints failed. Primary: ${primaryError.message}, Alt: ${uploadRequestResponse.status} - ${altErrorText}`);
          }
          
          console.log('✅ Alternative endpoint succeeded');
        } catch (altError) {
          console.error('❌ All endpoints failed');
          throw new Error(`Both v1.0 and v1.1 endpoints failed. Primary: ${primaryError.message}, Alt: ${altError.message}`);
        }
      }

      const uploadRequestData = await uploadRequestResponse.json();
    console.log('📦 [Reference Upload] Full API response:', JSON.stringify(uploadRequestData, null, 2));
    
    // Enhanced response parsing with detailed logging
    console.log('🔍 [Reference Upload] Parsing response structure...');
    
    // Try multiple response structure patterns for API v1.1
    let uploadUrl: string | undefined;
    let fileId: string | undefined;
    
    if (uploadRequestData.result) {
      console.log('📋 [Reference Upload] Found result object');
      const result = uploadRequestData.result;
      
      if (result.files && Array.isArray(result.files) && result.files.length > 0) {
        console.log('📋 [Reference Upload] Found files array in result');
        uploadUrl = result.files[0].url;
        fileId = result.files[0].file_id;
      } else if (result.url && result.file_id) {
        console.log('📋 [Reference Upload] Found direct url/file_id in result');
        uploadUrl = result.url;
        fileId = result.file_id;
      }
    } else if (uploadRequestData.files && Array.isArray(uploadRequestData.files)) {
      console.log('📋 [Reference Upload] Found files array at root level');
      uploadUrl = uploadRequestData.files[0]?.url;
      fileId = uploadRequestData.files[0]?.file_id;
    } else if (uploadRequestData.url && uploadRequestData.file_id) {
      console.log('📋 [Reference Upload] Found direct url/file_id at root level');
      uploadUrl = uploadRequestData.url;
      fileId = uploadRequestData.file_id;
    }

    console.log('🔍 [Reference Upload] Extracted values:', { uploadUrl: uploadUrl?.substring(0, 50) + '...', fileId });

    if (!uploadUrl || !fileId) {
      console.error('❌ [Reference Upload] Missing upload URL or file_id in response');
      console.error('📋 [Reference Upload] Response structure analysis:', {
        hasResult: !!uploadRequestData.result,
        hasFiles: !!uploadRequestData.files,
        hasDirectUrl: !!uploadRequestData.url,
        hasDirectFileId: !!uploadRequestData.file_id,
        responseKeys: Object.keys(uploadRequestData)
      });
      throw new Error('No upload URL or file_id received from Perfect Corp API');
    }

    console.log('✅ Received upload credentials:', { 
      fileId, 
      uploadUrlLength: uploadUrl.length,
      uploadUrlPreview: uploadUrl.substring(0, 50) + '...'
    });
    
    return { uploadUrl, fileId };
  }, 3, 2000, 'upload credentials');

  // Step 2: Upload actual image data to signed URL with retry logic
  await retryWithBackoff(async () => {
    console.log('📤 Uploading image data to signed URL...');
    
    const imageUploadResponse = await fetchWithTimeout(uploadCredentials.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': userPhotoData.byteLength.toString(),
        'Accept': '*/*',
        'User-Agent': 'Perfect-Corp-S2S-Client/1.0'
      },
      body: userPhotoData,
    }, 45000, 'image upload');

    console.log(`📥 Image upload response: ${imageUploadResponse.status} ${imageUploadResponse.statusText}`);

    if (!imageUploadResponse.ok) {
      const errorText = await imageUploadResponse.text();
      console.error('❌ Image upload to signed URL failed:', imageUploadResponse.status, errorText);
      throw new Error(`Image upload failed: ${imageUploadResponse.status} - ${errorText}`);
    }
    
    console.log('✅ Image data uploaded successfully to signed URL');
  }, 3, 1500, 'image upload');

  console.log('🎉 User photo uploaded successfully using enhanced reference pattern, file_id:', uploadCredentials.fileId);
  return uploadCredentials.fileId;
}