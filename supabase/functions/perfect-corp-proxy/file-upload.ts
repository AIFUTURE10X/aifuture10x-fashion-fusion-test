
import { PERFECTCORP_BASE_URL } from './constants.ts';

export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo to S2S API using two-step process...');
  console.log('Photo data size:', userPhotoData.byteLength, 'bytes');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  // Step 1: Request upload URL and file_id from Perfect Corp S2S API
  const uploadRequestUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/clothes-tryon`;
  
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
      throw new Error(`S2S Upload request failed: ${uploadRequestResponse.status} - ${errorText}`);
    }

    const uploadRequestData = await uploadRequestResponse.json();
    console.log('S2S Upload request response data:', uploadRequestData);
    
    const uploadResult = uploadRequestData.result || uploadRequestData;
    const uploadUrl = uploadResult.files?.[0]?.url;
    const fileId = uploadResult.files?.[0]?.file_id;

    if (!uploadUrl || !fileId) {
      console.error('Missing upload URL or file_id in response:', uploadRequestData);
      throw new Error('No upload URL or file_id received from Perfect Corp S2S API');
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

    console.log('S2S Photo uploaded successfully using two-step process, file_id:', fileId);
    return fileId;
    
  } catch (error) {
    console.error('S2S Upload error:', error);
    throw new Error(`S2S File upload failed: ${error.message}`);
  }
}
