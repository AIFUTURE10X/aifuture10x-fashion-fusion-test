import { PERFECTCORP_FILE_API_URL } from './constants.ts';
import { testNetworkConnectivity, fetchWithTimeout } from './network-utils.ts';
import { retryWithBackoff } from './retry-utils.ts';

// Strategy 1: Enhanced reference upload pattern with retry logic
export async function tryReferenceUploadPattern(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Using enhanced reference upload pattern for user photo...');
  console.log('📊 Image data size:', userPhotoData.byteLength, 'bytes');
  
  // Pre-flight connectivity check
  const networkOk = await testNetworkConnectivity();
  if (!networkOk) {
    throw new Error('Network connectivity test failed. Please check your internet connection and try again.');
  }
  
  const uploadRequestUrl = PERFECTCORP_FILE_API_URL;
  
  console.log('🔗 Upload request endpoint:', uploadRequestUrl);
  console.log('🔑 Token preview:', accessToken.substring(0, 15) + '...');
  console.log('📋 Request body preview:', JSON.stringify({
    files: [{
      content_type: 'image/jpeg',
      file_name: 'user_photo.jpg'
    }]
  }, null, 2));
  
  // Step 1: Request upload URL with retry logic
  const uploadCredentials = await retryWithBackoff(async () => {
    console.log('📋 Requesting upload credentials from Perfect Corp...');
    
    const uploadRequestResponse = await fetchWithTimeout(uploadRequestUrl, {
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
          file_name: 'user_photo.jpg'
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

    const uploadRequestData = await uploadRequestResponse.json();
    console.log('📦 Upload request response data:', uploadRequestData);
    
    const uploadResult = uploadRequestData.result || uploadRequestData;
    const files = uploadResult.files || uploadResult;
    const firstFile = Array.isArray(files) ? files[0] : files;
    const uploadUrl = firstFile.url;
    const fileId = firstFile.file_id;

    if (!uploadUrl || !fileId) {
      console.error('❌ Missing upload URL or file_id:', uploadRequestData);
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