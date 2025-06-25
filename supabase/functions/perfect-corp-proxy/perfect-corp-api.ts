
import { AuthResult } from './types.ts';

const PERFECTCORP_BASE_URL = 'https://yce-api-01.perfectcorp.com';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp S2S API...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('Running in mock mode - using test token');
    return { accessToken: 'mock_token_for_testing' };
  }
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    console.log('Attempting Perfect Corp S2S authentication...');
    console.log('Auth URL:', authUrl);
    
    const timestamp = Date.now();
    const idToken = btoa(`client_id=${apiKey}&timestamp=${timestamp}`);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        id_token: idToken
      }),
    });

    console.log(`S2S Auth response status: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('S2S Auth response data keys:', Object.keys(authData));
      
      if (authData.result?.access_token) {
        console.log('S2S Authentication successful with access_token');
        return { accessToken: authData.result.access_token };
      } else if (authData.access_token) {
        console.log('S2S Authentication successful with direct access_token');
        return { accessToken: authData.access_token };
      }
    }
    
    const errorText = await authResponse.text();
    console.error('S2S Auth failed response:', authResponse.status, errorText);
    
    console.log('Falling back to using API key as Bearer token');
    return { accessToken: apiKey };
    
  } catch (error) {
    console.error('S2S Auth error:', error);
    throw new Error(`Perfect Corp S2S API authentication failed: ${error.message}`);
  }
}

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
    console.log('Using direct binary upload with application/octet-stream');
    
    // Try direct binary upload with octet-stream content type
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': userPhotoData.byteLength.toString(),
      },
      body: userPhotoData,
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
    
    // If octet-stream fails, try with image/jpeg
    if (uploadResponse.status === 415) {
      console.log('Retrying with image/jpeg content type...');
      
      const retryResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'image/jpeg',
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

export async function startTryOnTask(
  accessToken: string, 
  fileId: string, 
  clothingImage: string, 
  isCustomClothing?: boolean, 
  perfectCorpRefId?: string,
  garmentCategory: string = 'upper_body'
): Promise<string> {
  console.log('Step 3: Starting try-on task with S2S API...');
  
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
    console.log('Using custom clothing with ref_ids for S2S API:', perfectCorpRefId);
  } else {
    requestBody.style_id = clothingImage;
    console.log('Using style_id for S2S API:', clothingImage);
  }

  try {
    console.log('Sending try-on request to S2S endpoint:', tryOnUrl);
    console.log('S2S Request body:', JSON.stringify(requestBody));
    
    const tryOnResponse = await fetch(tryOnUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`S2S Try-on response status: ${tryOnResponse.status}`);

    if (tryOnResponse.ok) {
      const tryOnData = await tryOnResponse.json();
      console.log('S2S Try-on response data:', tryOnData);
      
      const taskId = tryOnData.result?.task_id || tryOnData.task_id || tryOnData.id;
      if (taskId) {
        console.log('S2S Try-on task started successfully, task_id:', taskId);
        return taskId;
      } else {
        console.error('No task_id found in S2S try-on response');
      }
    }
    
    const errorText = await tryOnResponse.text();
    console.error('S2S Try-on failed:', tryOnResponse.status, errorText);
    throw new Error(`S2S Try-on failed: ${tryOnResponse.status} - ${errorText}`);
    
  } catch (error) {
    console.error('S2S Try-on error:', error);
    throw new Error(`S2S Try-on task failed: ${error.message}`);
  }
}

export async function pollTaskCompletion(accessToken: string, taskId: string): Promise<any> {
  console.log('Step 4: Polling for task completion with S2S API...');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating completed task with realistic delay');
    const processingTime = 15000 + Math.random() * 5000;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
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
  const maxAttempts = 60;
  const pollingInterval = 1000;
  
  console.log(`Starting S2S polling for task ${taskId}, max ${maxAttempts} attempts`);
  console.log('S2S Status URL:', statusUrl);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
    
    try {
      console.log(`S2S Polling attempt ${attempt + 1}/${maxAttempts}`);
      
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log(`S2S Status response: ${statusResponse.status}`);

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`S2S Status data:`, JSON.stringify(statusData, null, 2));
        
        const status = statusData.result?.status || statusData.status;
        
        if (status === 'success') {
          console.log('S2S Task completed successfully');
          return statusData;
        } else if (status === 'error' || status === 'failed') {
          const errorMsg = statusData.result?.error || statusData.error || 'Unknown error';
          console.error(`S2S Task failed with status: ${status}, error: ${errorMsg}`);
          throw new Error(`S2S Task failed: ${errorMsg}`);
        } else if (status === 'running') {
          console.log(`S2S Task still running (attempt ${attempt + 1})`);
        } else {
          console.log(`S2S Unknown status: ${status}, continuing to poll`);
        }
      } else {
        const errorText = await statusResponse.text();
        console.error(`S2S Status check failed: ${statusResponse.status} - ${errorText}`);
        
        if (statusResponse.status === 404) {
          throw new Error('S2S Task not found - it may have timed out or been cancelled');
        }
        
        if (attempt > maxAttempts - 5) {
          throw new Error(`S2S Status check consistently failing: ${statusResponse.status}`);
        }
      }
    } catch (error) {
      console.error(`S2S Status check error on attempt ${attempt + 1}:`, error);
      
      if (error.message.includes('Task failed') || error.message.includes('Task not found')) {
        throw error;
      }
      
      if (attempt > maxAttempts - 5) {
        throw new Error(`S2S Polling failed after ${attempt + 1} attempts: ${error.message}`);
      }
    }
  }

  throw new Error(`S2S Task timed out after ${maxAttempts} seconds`);
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
    console.log('Downloading image from S2S result URL...');
    const response = await fetch(resultImageUrl);
    console.log(`S2S Download response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`S2S Download failed: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log(`Downloaded S2S image size: ${arrayBuffer.byteLength} bytes`);
    return arrayBuffer;
  } catch (error) {
    console.error('S2S Download error:', error);
    throw new Error(`S2S Image download failed: ${error.message}`);
  }
}
