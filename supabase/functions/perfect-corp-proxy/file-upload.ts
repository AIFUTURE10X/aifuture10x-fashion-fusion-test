
import { PERFECTCORP_BASE_URL } from './constants.ts';

export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo to S2S API...');
  console.log('Photo data size:', userPhotoData.byteLength, 'bytes');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  // Try the correct S2S file upload endpoint
  const uploadRequestUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file`;
  
  try {
    console.log('Step 1: Requesting upload URL from S2S API...');
    console.log('Upload request endpoint:', uploadRequestUrl);
    
    const uploadRequestResponse = await fetch(uploadRequestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
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

    console.log(`S2S Upload request response status: ${uploadRequestResponse.status}`);
    console.log('Response headers:', Object.fromEntries(uploadRequestResponse.headers.entries()));

    if (!uploadRequestResponse.ok) {
      const errorText = await uploadRequestResponse.text();
      console.error('S2S Upload request failed:', uploadRequestResponse.status, errorText);
      
      // If the /file endpoint fails, try the clothes-tryon specific endpoint
      if (uploadRequestResponse.status === 404) {
        console.log('Trying alternative clothes-tryon endpoint...');
        return await tryClothingTryOnUpload(accessToken, userPhotoData);
      }
      
      throw new Error(`S2S Upload request failed: ${uploadRequestResponse.status} - ${errorText}`);
    }

    const uploadRequestData = await uploadRequestResponse.json();
    console.log('S2S Upload request response data:', uploadRequestData);
    
    const uploadResult = uploadRequestData.result || uploadRequestData;
    const uploadUrl = uploadResult.files?.[0]?.url;
    const fileId = uploadResult.files?.[0]?.file_id;

    if (!uploadUrl || !fileId) {
      console.error('Missing upload URL or file_id in response:', uploadRequestData);
      
      // Try alternative approach if main endpoint doesn't return expected format
      return await tryDirectUpload(accessToken, userPhotoData);
    }

    console.log('Received upload URL and file_id:', { fileId, uploadUrlLength: uploadUrl.length });

    // Step 2: Upload actual image data to the signed URL
    console.log('Step 2: Uploading image data to signed URL...');
    
    const imageUploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: userPhotoData,
    });

    console.log(`S2S Image upload response status: ${imageUploadResponse.status}`);

    if (!imageUploadResponse.ok) {
      const errorText = await imageUploadResponse.text();
      console.error('S2S Image upload failed:', imageUploadResponse.status, errorText);
      throw new Error(`S2S Image upload failed: ${imageUploadResponse.status} - ${errorText}`);
    }

    console.log('S2S Photo uploaded successfully, file_id:', fileId);
    return fileId;
    
  } catch (error) {
    console.error('S2S Upload error:', error);
    throw new Error(`S2S File upload failed: ${error.message}`);
  }
}

// Alternative function to try clothes-tryon specific endpoint
async function tryClothingTryOnUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Trying clothes-tryon specific upload endpoint...');
  
  const uploadRequestUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/clothes-tryon`;
  
  const uploadRequestResponse = await fetch(uploadRequestUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
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

  console.log(`Clothes-tryon upload request response status: ${uploadRequestResponse.status}`);

  if (!uploadRequestResponse.ok) {
    const errorText = await uploadRequestResponse.text();
    console.error('Clothes-tryon upload request failed:', uploadRequestResponse.status, errorText);
    throw new Error(`Clothes-tryon upload request failed: ${uploadRequestResponse.status} - ${errorText}`);
  }

  const uploadRequestData = await uploadRequestResponse.json();
  console.log('Clothes-tryon upload request response data:', uploadRequestData);
  
  const uploadResult = uploadRequestData.result || uploadRequestData;
  const uploadUrl = uploadResult.files?.[0]?.url;
  const fileId = uploadResult.files?.[0]?.file_id;

  if (!uploadUrl || !fileId) {
    console.error('Missing upload URL or file_id in clothes-tryon response:', uploadRequestData);
    throw new Error('No upload URL or file_id received from clothes-tryon endpoint');
  }

  // Step 2: Upload actual image data
  const imageUploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/jpeg',
    },
    body: userPhotoData,
  });

  console.log(`Clothes-tryon image upload response status: ${imageUploadResponse.status}`);

  if (!imageUploadResponse.ok) {
    const errorText = await imageUploadResponse.text();
    console.error('Clothes-tryon image upload failed:', imageUploadResponse.status, errorText);
    throw new Error(`Clothes-tryon image upload failed: ${imageUploadResponse.status} - ${errorText}`);
  }

  console.log('Clothes-tryon photo uploaded successfully, file_id:', fileId);
  return fileId;
}

// Fallback function for direct upload approach
async function tryDirectUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Trying direct upload approach...');
  
  // Try a more basic upload approach that might work with Perfect Corp's API
  const uploadUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/upload`;
  
  const formData = new FormData();
  formData.append('file', new Blob([userPhotoData], { type: 'image/jpeg' }), 'user_photo.jpg');
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  });

  console.log(`Direct upload response status: ${uploadResponse.status}`);

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('Direct upload failed:', uploadResponse.status, errorText);
    throw new Error(`Direct upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  const uploadResult = await uploadResponse.json();
  console.log('Direct upload response data:', uploadResult);
  
  const fileId = uploadResult.file_id || uploadResult.result?.file_id || uploadResult.id;
  
  if (!fileId) {
    console.error('No file_id in direct upload response:', uploadResult);
    throw new Error('No file_id received from direct upload');
  }

  console.log('Direct upload successful, file_id:', fileId);
  return fileId;
}
