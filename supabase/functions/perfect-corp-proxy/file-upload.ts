
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
    console.log('Using multipart/form-data upload approach');
    
    // Create FormData for proper multipart upload
    const formData = new FormData();
    const blob = new Blob([userPhotoData], { type: 'image/jpeg' });
    formData.append('file', blob, 'user_photo.jpg');
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Don't set Content-Type, let the browser set it with boundary for FormData
      },
      body: formData,
    });

    console.log(`S2S Upload response status: ${uploadResponse.status}`);

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('S2S Upload response data:', uploadData);
      
      const fileId = uploadData.result?.file_id || uploadData.file_id || uploadData.id;
      if (fileId) {
        console.log('Photo uploaded successfully to S2S API, file_id:', fileId);
        return fileId;
      } else {
        console.error('No file_id found in S2S upload response');
      }
    }
    
    const errorText = await uploadResponse.text();
    console.error('S2S Upload failed:', uploadResponse.status, errorText);
    
    // If FormData fails, try with direct binary upload
    if (uploadResponse.status === 400 || uploadResponse.status === 415) {
      console.log('Retrying with direct binary upload...');
      
      const retryResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'image/jpeg',
          'Content-Length': userPhotoData.byteLength.toString(),
        },
        body: userPhotoData,
      });

      console.log(`S2S Retry upload response status: ${retryResponse.status}`);

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        console.log('S2S Retry upload response data:', retryData);
        
        const fileId = retryData.result?.file_id || retryData.file_id || retryData.id;
        if (fileId) {
          console.log('Photo uploaded successfully to S2S API on retry, file_id:', fileId);
          return fileId;
        }
      }
      
      const retryErrorText = await retryResponse.text();
      console.error('S2S Retry upload also failed:', retryResponse.status, retryErrorText);
    }
    
    throw new Error(`S2S Upload failed: ${uploadResponse.status} - ${errorText}`);
    
  } catch (error) {
    console.error('S2S Upload error:', error);
    throw new Error(`S2S File upload failed: ${error.message}`);
  }
}
