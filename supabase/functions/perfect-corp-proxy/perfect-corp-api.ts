
import { AuthResult } from './types.ts';

const PERFECTCORP_BASE_URL = 'https://yce-api-01.perfectcorp.com';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('Running in mock mode - using test token');
    return { accessToken: 'mock_token_for_testing' };
  }
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    console.log('Attempting Perfect Corp authentication...');
    
    // Perfect Corp uses RSA encryption for authentication
    // For now, we'll try a simplified approach and handle the response
    const timestamp = Date.now();
    
    // This is a simplified approach - in production you'd need proper RSA encryption
    const idToken = btoa(`client_id=${apiKey}&timestamp=${timestamp}`);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        id_token: idToken
      }),
    });

    console.log(`Auth response status: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Auth response data keys:', Object.keys(authData));
      
      if (authData.result?.access_token) {
        console.log('Authentication successful with access_token');
        return { accessToken: authData.result.access_token };
      }
    }
    
    const errorText = await authResponse.text();
    console.error('Auth failed response:', authResponse.status, errorText);
    
    // If standard auth fails, try using API key as bearer token (fallback)
    console.log('Falling back to using API key as Bearer token');
    return { accessToken: apiKey };
    
  } catch (error) {
    console.error('Auth error:', error);
    throw new Error(`Perfect Corp API authentication failed: ${error.message}`);
  }
}

export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo...');
  console.log('Photo data size:', userPhotoData.byteLength, 'bytes');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  const uploadUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/clothes`;
  
  try {
    const formData = new FormData();
    formData.append('file', new Blob([userPhotoData], { type: 'image/jpeg' }), 'user_photo.jpg');
    
    console.log('Uploading to:', uploadUrl);
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
      console.log('Upload response data:', uploadData);
      
      const fileId = uploadData.result?.file_id || uploadData.file_id || uploadData.id;
      if (fileId) {
        console.log('Photo uploaded successfully, file_id:', fileId);
        return fileId;
      } else {
        console.error('No file_id found in upload response');
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
  
  const tryOnUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/task/clothes`;
  
  let requestBody: any = {
    file_id: fileId,
    garment_category: garmentCategory,
  };

  if (isCustomClothing && perfectCorpRefId) {
    requestBody.ref_ids = [perfectCorpRefId];
    console.log('Using custom clothing with ref_ids:', perfectCorpRefId);
  } else {
    requestBody.style_id = clothingImage;
    console.log('Using style_id:', clothingImage);
  }

  try {
    console.log('Sending try-on request to:', tryOnUrl);
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
      console.log('Try-on response data:', tryOnData);
      
      const taskId = tryOnData.result?.task_id || tryOnData.task_id || tryOnData.id;
      if (taskId) {
        console.log('Try-on task started successfully, task_id:', taskId);
        return taskId;
      } else {
        console.error('No task_id found in try-on response');
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
    console.log('Mock mode: Simulating completed task with realistic delay');
    // Simulate realistic processing time (13-20 seconds)
    const processingTime = 15000 + Math.random() * 5000; // 15-20 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Return a proper mock response with a complete valid base64 image
    // This is a simple 1x1 red pixel PNG for testing
    const validMockImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hRny4QAAAAABJRU5ErkJggg=';
    
    return {
      status: 'success',
      result: {
        output_url: `data:image/png;base64,${validMockImage}`,
        result_image_url: `data:image/png;base64,${validMockImage}`
      },
      processing_time: Math.round(processingTime / 1000)
    };
  }
  
  const statusUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/task/clothes/${taskId}`;
  const maxAttempts = 60; // 60 attempts
  const pollingInterval = 1000; // 1 second intervals
  
  console.log(`Starting polling for task ${taskId}, max ${maxAttempts} attempts`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
    
    try {
      console.log(`Polling attempt ${attempt + 1}/${maxAttempts}`);
      
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log(`Status response: ${statusResponse.status}`);

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`Status data:`, JSON.stringify(statusData, null, 2));
        
        const status = statusData.result?.status || statusData.status;
        
        if (status === 'success') {
          console.log('Task completed successfully');
          return statusData;
        } else if (status === 'error' || status === 'failed') {
          const errorMsg = statusData.result?.error || statusData.error || 'Unknown error';
          console.error(`Task failed with status: ${status}, error: ${errorMsg}`);
          throw new Error(`Task failed: ${errorMsg}`);
        } else if (status === 'running') {
          console.log(`Task still running (attempt ${attempt + 1})`);
        } else {
          console.log(`Unknown status: ${status}, continuing to poll`);
        }
      } else {
        const errorText = await statusResponse.text();
        console.error(`Status check failed: ${statusResponse.status} - ${errorText}`);
        
        if (statusResponse.status === 404) {
          throw new Error('Task not found - it may have timed out or been cancelled');
        }
        
        // For other HTTP errors, continue polling for a few more attempts
        if (attempt > maxAttempts - 5) {
          throw new Error(`Status check consistently failing: ${statusResponse.status}`);
        }
      }
    } catch (error) {
      console.error(`Status check error on attempt ${attempt + 1}:`, error);
      
      // If it's our custom error (task failed/not found), don't retry
      if (error.message.includes('Task failed') || error.message.includes('Task not found')) {
        throw error;
      }
      
      // For network errors, retry a few more times
      if (attempt > maxAttempts - 5) {
        throw new Error(`Polling failed after ${attempt + 1} attempts: ${error.message}`);
      }
    }
  }

  throw new Error(`Task timed out after ${maxAttempts} seconds`);
}

export async function downloadResultImage(resultImageUrl: string): Promise<ArrayBuffer> {
  console.log('Step 5: Downloading result image...');
  console.log('Result image URL:', resultImageUrl.substring(0, 100) + '...');
  
  if (resultImageUrl.startsWith('data:')) {
    console.log('Mock mode: Converting data URL to ArrayBuffer');
    const base64 = resultImageUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  try {
    console.log('Downloading image from URL...');
    const response = await fetch(resultImageUrl);
    console.log(`Download response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log(`Downloaded image size: ${arrayBuffer.byteLength} bytes`);
    return arrayBuffer;
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(`Image download failed: ${error.message}`);
  }
}
