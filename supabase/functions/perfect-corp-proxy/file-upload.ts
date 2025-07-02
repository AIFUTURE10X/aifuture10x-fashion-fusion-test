
import { PERFECTCORP_BASE_URL } from './constants.ts';

export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo to S2S API...');
  console.log('Photo data size:', userPhotoData.byteLength, 'bytes');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  // Validate token before upload
  if (!accessToken || accessToken.length < 10) {
    throw new Error('Invalid access token for file upload');
  }
  
  console.log('Token validation passed, proceeding with upload...');
  
  // Primary strategy: Use standard file upload endpoint for user photos
  try {
    console.log('🎯 Attempting primary strategy: Standard file upload endpoint');
    return await tryStandardFileUpload(accessToken, userPhotoData);
  } catch (primaryError) {
    console.log('❌ Primary strategy failed:', primaryError.message);
    
    // Secondary strategy: Try clothes-tryon endpoint (what works for reference uploads)
    try {
      console.log('🔄 Attempting secondary strategy: Clothes-tryon endpoint');
      return await tryClothingTryOnUpload(accessToken, userPhotoData);
    } catch (secondaryError) {
      console.log('❌ Secondary strategy failed:', secondaryError.message);
      
      // Tertiary strategy: Direct FormData upload
      try {
        console.log('🔄 Attempting tertiary strategy: Direct FormData upload');
        return await tryDirectUpload(accessToken, userPhotoData);
      } catch (tertiaryError) {
        console.log('❌ All upload strategies failed');
        console.error('Primary error:', primaryError.message);
        console.error('Secondary error:', secondaryError.message);
        console.error('Tertiary error:', tertiaryError.message);
        
        throw new Error(`All upload methods failed. Last error: ${tertiaryError.message}`);
      }
    }
  }
}

// Primary strategy: Standard file upload (recommended for user photos)
async function tryStandardFileUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Using standard file upload endpoint for user photo...');
  
  const uploadRequestUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file`;
  
  console.log('🔗 Upload request endpoint:', uploadRequestUrl);
  console.log('🔑 Token preview:', accessToken.substring(0, 20) + '...');
  
  const uploadRequestResponse = await fetch(uploadRequestUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Perfect-Corp-S2S-Client/1.0',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      files: [
        {
          content_type: 'image/jpeg',
          file_name: 'user_photo.jpg'
        }
      ]
    }),
  });

  console.log(`📥 Standard upload request response: ${uploadRequestResponse.status} ${uploadRequestResponse.statusText}`);
  console.log('📋 Response headers:', Object.fromEntries(uploadRequestResponse.headers.entries()));

  if (!uploadRequestResponse.ok) {
    const errorText = await uploadRequestResponse.text();
    console.error('❌ Standard upload request failed:', uploadRequestResponse.status, errorText);
    throw new Error(`Standard upload request failed: ${uploadRequestResponse.status} - ${errorText}`);
  }

  const uploadRequestData = await uploadRequestResponse.json();
  console.log('📦 Standard upload request response data:', uploadRequestData);
  
  const uploadResult = uploadRequestData.result || uploadRequestData;
  const uploadUrl = uploadResult.files?.[0]?.url;
  const fileId = uploadResult.files?.[0]?.file_id;

  if (!uploadUrl || !fileId) {
    console.error('❌ Missing upload URL or file_id in standard response:', uploadRequestData);
    throw new Error('No upload URL or file_id received from standard endpoint');
  }

  console.log('✅ Received upload URL and file_id:', { fileId, uploadUrlLength: uploadUrl.length });

  // Upload actual image data to the signed URL
  console.log('📤 Uploading image data to signed URL...');
  
  const imageUploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/jpeg',
    },
    body: userPhotoData,
  });

  console.log(`📥 Standard image upload response: ${imageUploadResponse.status}`);

  if (!imageUploadResponse.ok) {
    const errorText = await imageUploadResponse.text();
    console.error('❌ Standard image upload failed:', imageUploadResponse.status, errorText);
    throw new Error(`Standard image upload failed: ${imageUploadResponse.status} - ${errorText}`);
  }

  console.log('🎉 Standard photo uploaded successfully, file_id:', fileId);
  return fileId;
}

// Secondary strategy: Clothes-tryon endpoint (mirrors working reference upload)
async function tryClothingTryOnUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Using clothes-tryon endpoint (mirroring reference upload pattern)...');
  
  const uploadRequestUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/clothes-tryon`;
  
  const uploadRequestResponse = await fetch(uploadRequestUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Perfect-Corp-S2S-Client/1.0',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      files: [
        {
          content_type: 'image/jpeg',
          file_name: 'user_photo.jpg'
        }
      ]
    }),
  });

  console.log(`📥 Clothes-tryon upload request response: ${uploadRequestResponse.status}`);

  if (!uploadRequestResponse.ok) {
    const errorText = await uploadRequestResponse.text();
    console.error('❌ Clothes-tryon upload request failed:', uploadRequestResponse.status, errorText);
    throw new Error(`Clothes-tryon upload request failed: ${uploadRequestResponse.status} - ${errorText}`);
  }

  const uploadRequestData = await uploadRequestResponse.json();
  console.log('📦 Clothes-tryon upload request response data:', uploadRequestData);
  
  const uploadResult = uploadRequestData.result || uploadRequestData;
  const uploadUrl = uploadResult.files?.[0]?.url;
  const fileId = uploadResult.files?.[0]?.file_id;

  if (!uploadUrl || !fileId) {
    console.error('❌ Missing upload URL or file_id in clothes-tryon response:', uploadRequestData);
    throw new Error('No upload URL or file_id received from clothes-tryon endpoint');
  }

  // Upload actual image data
  const imageUploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/jpeg',
    },
    body: userPhotoData,
  });

  console.log(`📥 Clothes-tryon image upload response: ${imageUploadResponse.status}`);

  if (!imageUploadResponse.ok) {
    const errorText = await imageUploadResponse.text();
    console.error('❌ Clothes-tryon image upload failed:', imageUploadResponse.status, errorText);
    throw new Error(`Clothes-tryon image upload failed: ${imageUploadResponse.status} - ${errorText}`);
  }

  console.log('🎉 Clothes-tryon photo uploaded successfully, file_id:', fileId);
  return fileId;
}

// Tertiary strategy: Direct FormData upload (last resort)
async function tryDirectUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Using direct FormData upload (last resort)...');
  
  const uploadUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/upload`;
  
  const formData = new FormData();
  formData.append('file', new Blob([userPhotoData], { type: 'image/jpeg' }), 'user_photo.jpg');
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Perfect-Corp-S2S-Client/1.0'
    },
    body: formData,
  });

  console.log(`📥 Direct upload response: ${uploadResponse.status}`);

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('❌ Direct upload failed:', uploadResponse.status, errorText);
    throw new Error(`Direct upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  const uploadResult = await uploadResponse.json();
  console.log('📦 Direct upload response data:', uploadResult);
  
  const fileId = uploadResult.file_id || uploadResult.result?.file_id || uploadResult.id;
  
  if (!fileId) {
    console.error('❌ No file_id in direct upload response:', uploadResult);
    throw new Error('No file_id received from direct upload');
  }

  console.log('🎉 Direct upload successful, file_id:', fileId);
  return fileId;
}
