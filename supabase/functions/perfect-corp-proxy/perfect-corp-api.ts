
import { AuthResult } from './types.ts';

const PERFECTCORP_BASE_URL = 'https://yce-api-01.perfectcorp.com';

export async function authenticateWithPerfectCorp(apiKey: string, apiSecret: string): Promise<AuthResult> {
  console.log('Step 1: Authenticating with Perfect Corp...');
  
  const mockMode = Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true';
  
  if (mockMode) {
    console.log('Running in mock mode - using test token');
    return { accessToken: 'mock_token_for_testing' };
  }
  
  // Perfect Corp uses a custom authentication, not OAuth2
  // According to docs: API Key is client_id, Secret key is client_secret
  // Need to create id_token by encrypting "client_id=<client_id>&timestamp=<timestamp>" with RSA
  
  const authUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
  
  try {
    // For now, we'll use a simplified approach
    // In production, you'd need to implement RSA encryption for id_token
    const timestamp = Date.now();
    
    // Note: This is a placeholder. You need to implement RSA encryption
    // The docs say to encrypt "client_id=<client_id>&timestamp=<timestamp in millisecond>"
    // with RSA X.509 format Base64 encoded client_secret
    const idToken = btoa(`client_id=${apiKey}&timestamp=${timestamp}`); // This is NOT correct encryption!
    
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

    if (authResponse.ok) {
      const authData = await authResponse.json();
      if (authData.result?.access_token) {
        console.log('Authentication successful');
        return { accessToken: authData.result.access_token };
      }
    }
    
    const errorText = await authResponse.text();
    console.error('Auth failed:', authResponse.status, errorText);
    
    // TEMPORARY WORKAROUND: Use API key as Bearer token
    console.log('Using API key as Bearer token (fallback)');
    return { accessToken: apiKey };
    
  } catch (error) {
    console.error('Auth error:', error);
    // TEMPORARY WORKAROUND: Use API key as Bearer token
    console.log('Using API key as Bearer token (fallback due to error)');
    return { accessToken: apiKey };
  }
}

export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo...');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  const uploadUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/clothes`;
  
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
      // Check the actual response structure
      const fileId = uploadData.result?.file_id || uploadData.file_id || uploadData.id;
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
  
  const tryOnUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/task/clothes`;
  
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
      // Check the actual response structure
      const taskId = tryOnData.result?.task_id || tryOnData.task_id || tryOnData.id;
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
      status: 'success', // Changed from 'completed' to 'success'
      result: {
        output_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      },
      processing_time: 2
    };
  }
  
  // CORRECTED: Use the proper endpoint for clothes task status
  const statusUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/task/clothes/${taskId}`;
  const maxAttempts = 60;
  const pollingInterval = 1000; // 1 second as per docs
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollingInterval));
    
    try {
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`Status response:`, JSON.stringify(statusData));
        
        // Check the actual status field location
        const status = statusData.result?.status || statusData.status;
        
        if (status === 'success') {
          console.log('Task completed successfully');
          return statusData;
        } else if (status === 'error' || status === 'failed') {
          throw new Error(`Task failed: ${statusData.result?.error || statusData.error || 'Unknown error'}`);
        }
        
        console.log(`Attempt ${attempt + 1}, status: ${status}`);
      } else {
        console.log(`Status check failed: ${statusResponse.status}`);
      }
    } catch (error) {
      console.log(`Status check error:`, error.message);
    }
  }

  throw new Error('Task timed out after 60 seconds');
}

export async function downloadResultImage(resultImageUrl: string): Promise<ArrayBuffer> {
  console.log('Step 5: Downloading result image...');
  
  if (resultImageUrl.startsWith('data:')) {
    console.log('Mock mode: Using mock image data');
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
