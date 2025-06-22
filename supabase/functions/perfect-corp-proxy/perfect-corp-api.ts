
export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo...');
  
  // Check if we're in mock mode
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  // Try the most likely correct upload endpoint
  const primaryUploadUrl = 'https://openapi.perfectcorp.com/api/v1/files/upload';
  
  try {
    console.log(`Attempting primary file upload to: ${primaryUploadUrl}`);
    
    const formData = new FormData();
    formData.append('file', new Blob([userPhotoData], { type: 'image/jpeg' }), 'user_photo.jpg');
    
    const uploadResponse = await fetch(primaryUploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      const fileId = uploadData.file_id || uploadData.id;

      if (fileId) {
        console.log('User photo uploaded successfully, file_id:', fileId);
        return fileId;
      }
    }

    console.log(`Primary upload failed:`, uploadResponse.status);
  } catch (error) {
    console.log(`Primary upload error:`, error.message);
  }

  // Try alternative upload approaches
  const alternativeUploadUrls = [
    'https://api.perfectcorp.com/v1/files/upload',
    'https://openapi.perfectcorp.com/v1/files/upload'
  ];
  
  for (const uploadUrl of alternativeUploadUrls) {
    try {
      console.log(`Attempting alternative file upload to: ${uploadUrl}`);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_data: Buffer.from(userPhotoData).toString('base64'),
          file_type: 'image/jpeg',
          file_name: 'user_photo.jpg'
        }),
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        const fileId = uploadData.file_id || uploadData.id;

        if (fileId) {
          console.log('User photo uploaded successfully with alternative method, file_id:', fileId);
          return fileId;
        }
      }

      console.log(`Alternative upload failed for ${uploadUrl}:`, uploadResponse.status);
    } catch (error) {
      console.log(`Alternative upload error for ${uploadUrl}:`, error.message);
    }
  }
  
  throw new Error('All Perfect Corp file upload methods failed');
}

export async function startTryOnTask(
  accessToken: string, 
  fileId: string, 
  clothingImage: string, 
  isCustomClothing?: boolean, 
  perfectCorpRefId?: string
): Promise<string> {
  console.log('Step 3: Running clothes try-on task...');
  
  // Check if we're in mock mode
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating try-on task');
    return 'mock_task_id_67890';
  }
  
  // Build request body based on clothing type
  let tryOnRequestBody: any = {
    user_image_file_id: fileId,
    category: 'outfit'
  };

  if (isCustomClothing && perfectCorpRefId) {
    tryOnRequestBody.garment_ref_id = perfectCorpRefId;
    console.log('Using custom clothing with ref_id:', perfectCorpRefId);
  } else {
    tryOnRequestBody.garment_image_url = clothingImage;
    console.log('Using garment image URL:', clothingImage);
  }

  // Try the most likely correct try-on endpoint
  const primaryTryOnUrl = 'https://openapi.perfectcorp.com/api/v1/virtual-tryon';
  
  try {
    console.log(`Attempting primary try-on request to: ${primaryTryOnUrl}`);
    
    const tryOnResponse = await fetch(primaryTryOnUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(tryOnRequestBody),
    });

    if (tryOnResponse.ok) {
      const tryOnData = await tryOnResponse.json();
      const taskId = tryOnData.task_id || tryOnData.id;

      if (taskId) {
        console.log('Try-on task started with primary endpoint, task_id:', taskId);
        return taskId;
      }
    }

    console.log(`Primary try-on failed:`, tryOnResponse.status);
  } catch (error) {
    console.log(`Primary try-on error:`, error.message);
  }

  // Try alternative try-on endpoints
  const alternativeTryOnUrls = [
    'https://api.perfectcorp.com/v1/virtual-tryon',
    'https://openapi.perfectcorp.com/v1/virtual-tryon'
  ];
  
  for (const tryOnUrl of alternativeTryOnUrls) {
    try {
      console.log(`Attempting alternative try-on request to: ${tryOnUrl}`);
      
      const tryOnResponse = await fetch(tryOnUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(tryOnRequestBody),
      });

      if (tryOnResponse.ok) {
        const tryOnData = await tryOnResponse.json();
        const taskId = tryOnData.task_id || tryOnData.id;

        if (taskId) {
          console.log('Try-on task started with alternative endpoint, task_id:', taskId);
          return taskId;
        }
      }

      console.log(`Alternative try-on failed for ${tryOnUrl}:`, tryOnResponse.status);
    } catch (error) {
      console.log(`Alternative try-on error for ${tryOnUrl}:`, error.message);
    }
  }
  
  throw new Error('All Perfect Corp try-on endpoints failed');
}

export async function pollTaskCompletion(accessToken: string, taskId: string): Promise<any> {
  console.log('Step 4: Polling for task completion...');
  
  // Check if we're in mock mode
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating completed task');
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      status: 'completed',
      result_image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      processing_time: 2
    };
  }
  
  let result;
  let attempts = 0;
  const maxAttempts = 60;
  
  // Try multiple status endpoints
  const statusUrls = [
    `https://openapi.perfectcorp.com/api/v1/virtual-tryon/${taskId}`,
    `https://api.perfectcorp.com/v1/virtual-tryon/${taskId}`,
    `https://openapi.perfectcorp.com/v1/virtual-tryon/${taskId}`
  ];
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    for (const statusUrl of statusUrls) {
      try {
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'completed') {
            result = statusData;
            break;
          } else if (statusData.status === 'failed') {
            throw new Error(`Try-on task failed: ${statusData.error || 'Unknown error'}`);
          }
          
          console.log(`Polling attempt ${attempts}, status: ${statusData.status}`);
          break; // Found working endpoint, exit inner loop
        }
      } catch (error) {
        console.log(`Status check error for ${statusUrl}:`, error.message);
        continue;
      }
    }
    
    if (result) break;
    attempts++;
  }

  if (!result) {
    throw new Error('Try-on task timed out');
  }

  return result;
}

export async function downloadResultImage(resultImageUrl: string): Promise<ArrayBuffer> {
  console.log('Step 5: Downloading result image...');
  
  // If it's already a data URL (mock mode), return mock data
  if (resultImageUrl.startsWith('data:')) {
    console.log('Mock mode: Using mock image data');
    return new ArrayBuffer(1);
  }
  
  try {
    const resultImageResponse = await fetch(resultImageUrl);
    
    if (!resultImageResponse.ok) {
      throw new Error(`Failed to download result image: ${resultImageResponse.status}`);
    }

    return await resultImageResponse.arrayBuffer();
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}
