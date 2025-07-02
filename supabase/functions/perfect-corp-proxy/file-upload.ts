
import { PERFECTCORP_BASE_URL } from './constants.ts';

export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo to S2S API...');
  console.log('Photo data size:', userPhotoData.byteLength, 'bytes');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  const uploadUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/clothes`;
  
  try {
    console.log('Uploading to S2S endpoint:', uploadUrl);
    
    // Try direct binary upload first (this is often what APIs expect)
    console.log('Attempting direct binary upload...');
    
    const binaryResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': userPhotoData.byteLength.toString(),
      },
      body: userPhotoData,
    });

    console.log(`S2S Binary upload response status: ${binaryResponse.status}`);
    console.log('Response headers:', Object.fromEntries(binaryResponse.headers.entries()));

    if (binaryResponse.ok) {
      const binaryData = await binaryResponse.json();
      console.log('S2S Binary upload response data:', binaryData);
      
      const fileId = binaryData.result?.file_id || binaryData.file_id || binaryData.id;
      if (fileId) {
        console.log('Photo uploaded successfully with binary approach, file_id:', fileId);
        return fileId;
      }
    }
    
    // If binary upload fails, try multipart form data
    console.log('Binary upload failed, trying multipart form...');
    
    const formData = new FormData();
    const blob = new Blob([userPhotoData], { type: 'image/jpeg' });
    formData.append('file', blob, 'photo.jpg');
    
    const multipartResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
      body: formData,
    });

    console.log(`S2S Multipart upload response status: ${multipartResponse.status}`);

    if (multipartResponse.ok) {
      const multipartData = await multipartResponse.json();
      console.log('S2S Multipart upload response data:', multipartData);
      
      const fileId = multipartData.result?.file_id || multipartData.file_id || multipartData.id;
      if (fileId) {
        console.log('Photo uploaded successfully with multipart approach, file_id:', fileId);
        return fileId;
      }
    }

    // If both methods fail, try with image/jpeg content type
    console.log('Multipart upload failed, trying with image/jpeg content type...');
    
    const imageResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'image/jpeg',
      },
      body: userPhotoData,
    });

    console.log(`S2S Image upload response status: ${imageResponse.status}`);

    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      console.log('S2S Image upload response data:', imageData);
      
      const fileId = imageData.result?.file_id || imageData.file_id || imageData.id;
      if (fileId) {
        console.log('Photo uploaded successfully with image/jpeg approach, file_id:', fileId);
        return fileId;
      }
    }

    // Get detailed error information from the last response
    const errorText = await imageResponse.text();
    console.error('All S2S upload methods failed. Last error:', imageResponse.status, errorText);
    
    // Log response headers for debugging
    console.error('Last response headers:', Object.fromEntries(imageResponse.headers.entries()));
    
    throw new Error(`S2S Upload failed: ${imageResponse.status} - ${errorText}`);
    
  } catch (error) {
    console.error('S2S Upload error:', error);
    throw new Error(`S2S File upload failed: ${error.message}`);
  }
}
