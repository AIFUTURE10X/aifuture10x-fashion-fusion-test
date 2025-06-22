
import { AuthResult } from './types.ts';

const PERFECTCORP_BASE_URL = 'https://yce.perfectcorp.com';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('Running in mock mode - using test token');
    return { accessToken: 'mock_token_for_testing' };
  }
  
  // Use API key directly as Bearer token
  console.log('Using API key as access token');
  return { accessToken: apiKey };
}

export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo...');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  const uploadUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/upload`;
  
  try {
    const formData = new FormData();
    formData.append('file', new Blob([userPhotoData], { type: 'image/jpeg' }), 'user_photo.jpg');
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    console.log(`Upload response status: ${uploadResponse.status}`);

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      const fileId = uploadData.file_id || uploadData.id;
      if (fileId) {
        console.log('Photo uploaded, file_id:', fileId);
        return fileId;
      }
    }
    
    const errorText = await uploadResponse.text();
    console.error('Upload failed:', uploadResponse.status, errorText);
    throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`File upload failed: ${error.message}`);
  }
}

export async function startTryOnTask(
  accessToken: string, 
  fileId: string, 
  clothingImage: string, 
  isCustomClothing?: boolean, 
  perfectCorpRefId?: string,
  garmentCategory: string = 'upper_body'
): Promise<string> {
  console.log('Step 3: Starting try-on task...');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating try-on task');
    return 'mock_task_id_67890';
  }
  
  const tryOnUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/task/clothes-tryon`;
  
  let requestBody: any = {
    file_id: fileId,
    garment_category: garmentCategory, // "full_body", "lower_body", or "upper_body"
  };

  if (isCustomClothing && perfectCorpRefId) {
    requestBody.ref_ids = [perfectCorpRefId];
    console.log('Using custom clothing with ref_ids:', perfectCorpRefId);
  } else {
    requestBody.style_id = clothingImage;
    console.log('Using style_id:', clothingImage);
  }

  try {
    console.log('Sending request to:', tryOnUrl);
    console.log('Request body:', JSON.stringify(requestBody));
    
    const tryOnResponse = await fetch(tryOnUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`Try-on response status: ${tryOnResponse.status}`);

    if (tryOnResponse.ok) {
      const tryOnData = await tryOnResponse.json();
      const taskId = tryOnData.task_id || tryOnData.id;
      if (taskId) {
        console.log('Try-on task started, task_id:', taskId);
        return taskId;
      }
    }
    
    const errorText = await tryOnResponse.text();
    console.error('Try-on failed:', tryOnResponse.status, errorText);
    throw new Error(`Try-on failed: ${tryOnResponse.status} - ${errorText}`);
    
  } catch (error) {
    console.error('Try-on error:', error);
    throw new Error(`Try-on task failed: ${error.message}`);
  }
}

export async function pollTaskCompletion(accessToken: string, taskId: string): Promise<any> {
  console.log('Step 4: Polling for task completion...');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating completed task');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      status: 'completed',
      result_image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      processing_time: 2
    };
  }
  
  const statusUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/task/${taskId}`;
  const maxAttempts = 60;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const statusResponse = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          console.log('Task completed successfully');
          return statusData;
        } else if (statusData.status === 'failed') {
          throw new Error(`Task failed: ${statusData.error || 'Unknown error'}`);
        }
        
        console.log(`Attempt ${attempt + 1}, status: ${statusData.status}`);
      } else {
        console.log(`Status check failed: ${statusResponse.status}`);
      }
    } catch (error) {
      console.log(`Status check error:`, error.message);
    }
  }

  throw new Error('Task timed out');
}

export async function downloadResultImage(resultImageUrl: string): Promise<ArrayBuffer> {
  console.log('Step 5: Downloading result image...');
  
  if (resultImageUrl.startsWith('data:')) {
    console.log('Mock mode: Using mock image data');
    // Convert data URL to ArrayBuffer for mock mode
    const base64 = resultImageUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  try {
    const response = await fetch(resultImageUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(`Image download failed: ${error.message}`);
  }
}
