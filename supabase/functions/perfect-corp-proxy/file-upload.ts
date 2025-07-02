
import { PERFECTCORP_BASE_URL } from './constants.ts';

export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('=== User Photo Upload to Perfect Corp S2S API ===');
  console.log('📊 Photo data size:', userPhotoData.byteLength, 'bytes');
  console.log('🔑 Access token length:', accessToken.length);
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('🎭 Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  // Enhanced token validation
  if (!accessToken || accessToken.length < 10 || accessToken === 'undefined') {
    throw new Error('Invalid or missing access token for user photo upload');
  }
  
  console.log('✅ Token validation passed, proceeding with user photo upload...');
  
  // Strategy 1: Use the exact same endpoint that works for reference uploads
  try {
    console.log('🎯 Strategy 1: Using reference upload pattern (/s2s/v1.0/file)');
    return await tryReferenceUploadPattern(accessToken, userPhotoData);
  } catch (primaryError) {
    console.log('❌ Strategy 1 failed:', primaryError.message);
    
    // Strategy 2: Try with different content type
    try {
      console.log('🔄 Strategy 2: Trying with multipart/form-data');
      return await tryMultipartUpload(accessToken, userPhotoData);
    } catch (secondaryError) {
      console.log('❌ Strategy 2 failed:', secondaryError.message);
      
      // Strategy 3: Last resort with minimal headers
      try {
        console.log('🔄 Strategy 3: Minimal headers approach');
        return await tryMinimalUpload(accessToken, userPhotoData);
      } catch (tertiaryError) {
        console.log('❌ All upload strategies failed');
        console.error('Strategy 1 error:', primaryError.message);
        console.error('Strategy 2 error:', secondaryError.message);
        console.error('Strategy 3 error:', tertiaryError.message);
        
        throw new Error(`All upload methods failed. Last error: ${tertiaryError.message}`);
      }
    }
  }
}

// Strategy 1: Mirror the exact pattern that works for reference uploads
async function tryReferenceUploadPattern(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Using exact reference upload pattern for user photo...');
  
  const uploadRequestUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file`;
  
  console.log('🔗 Upload request endpoint:', uploadRequestUrl);
  console.log('🔑 Token preview:', accessToken.substring(0, 15) + '...');
  
  // Step 1: Request upload URL (exactly like reference upload)
  const uploadRequestResponse = await fetch(uploadRequestUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Perfect-Corp-S2S-Client/1.0'
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

  console.log(`📥 Upload request response: ${uploadRequestResponse.status} ${uploadRequestResponse.statusText}`);
  
  if (!uploadRequestResponse.ok) {
    const errorText = await uploadRequestResponse.text();
    console.error('❌ Upload request failed:', uploadRequestResponse.status, errorText);
    
    // Try to parse error details
    try {
      const errorData = JSON.parse(errorText);
      console.error('🔍 Parsed error:', errorData);
    } catch (e) {
      console.error('🔍 Raw error text:', errorText);
    }
    
    throw new Error(`Upload request failed: ${uploadRequestResponse.status} - ${errorText}`);
  }

  const uploadRequestData = await uploadRequestResponse.json();
  console.log('📦 Upload request response data:', uploadRequestData);
  
  const uploadResult = uploadRequestData.result || uploadRequestData;
  const uploadUrl = uploadResult.files?.[0]?.url;
  const fileId = uploadResult.files?.[0]?.file_id;

  if (!uploadUrl || !fileId) {
    console.error('❌ Missing upload URL or file_id:', uploadRequestData);
    throw new Error('No upload URL or file_id received from Perfect Corp API');
  }

  console.log('✅ Received upload credentials:', { 
    fileId, 
    uploadUrlLength: uploadUrl.length,
    uploadUrlPreview: uploadUrl.substring(0, 50) + '...'
  });

  // Step 2: Upload actual image data to signed URL
  console.log('📤 Uploading image data to signed URL...');
  
  const imageUploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/jpeg',
    },
    body: userPhotoData,
  });

  console.log(`📥 Image upload response: ${imageUploadResponse.status} ${imageUploadResponse.statusText}`);

  if (!imageUploadResponse.ok) {
    const errorText = await imageUploadResponse.text();
    console.error('❌ Image upload to signed URL failed:', imageUploadResponse.status, errorText);
    throw new Error(`Image upload failed: ${imageUploadResponse.status} - ${errorText}`);
  }

  console.log('🎉 User photo uploaded successfully using reference pattern, file_id:', fileId);
  return fileId;
}

// Strategy 2: Try multipart form data approach
async function tryMultipartUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Trying multipart form data upload...');
  
  const uploadUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/upload`;
  
  const formData = new FormData();
  formData.append('file', new Blob([userPhotoData], { type: 'image/jpeg' }), 'user_photo.jpg');
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    },
    body: formData,
  });

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
}

// Strategy 3: Minimal headers approach
async function tryMinimalUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Trying minimal headers upload...');
  
  const uploadRequestUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file`;
  
  // Minimal request - just the essentials
  const uploadRequestResponse = await fetch(uploadRequestUrl, {
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
  });

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

  // Upload with minimal headers
  const imageResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: userPhotoData,
  });

  if (!imageResponse.ok) {
    throw new Error(`Minimal image upload failed: ${imageResponse.status}`);
  }

  console.log('🎉 Minimal upload successful, file_id:', fileId);
  return fileId;
}
