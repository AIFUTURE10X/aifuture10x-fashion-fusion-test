
export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo...');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  const uploadUrl = 'https://openapi.perfectcorp.com/v1/files/upload';
  
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

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      const fileId = uploadData.file_id || uploadData.id;

      if (fileId) {
        console.log('User photo uploaded successfully, file_id:', fileId);
        return fileId;
      }
    }
    
    const errorText = await uploadResponse.text();
    console.error('Upload failed:', uploadResponse.status, errorText);
    throw new Error('File upload failed');
    
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`File upload to Perfect Corp failed: ${error.message}`);
  }
}

export async function startTryOnTask(
  accessToken: string, 
  fileId: string, 
  clothingImage: string, 
  isCustomClothing?: boolean, 
  perfectCorpRefId?: string
): Promise<string> {
  console.log('Step 3: Starting try-on task...');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating try-on task');
    return 'mock_task_id_67890';
  }
  
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

  const tryOnUrl = 'https://openapi.perfectcorp.com/v1/virtual-tryon';
  
  try {
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
        console.log('Try-on task started successfully, task_id:', taskId);
        return taskId;
      }
    }
    
    const errorText = await tryOnResponse.text();
    console.error('Try-on failed:', tryOnResponse.status, errorText);
    throw new Error('Virtual try-on task initiation failed');
    
  } catch (error) {
    console.error('Try-on error:', error);
    throw new Error(`Virtual try-on task initiation failed: ${error.message}`);
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
  
  const statusUrl = `https://openapi.perfectcorp.com/v1/virtual-tryon/${taskId}`;
  let attempts = 0;
  const maxAttempts = 60;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
          console.log('Task completed successfully');
          return statusData;
        } else if (statusData.status === 'failed') {
          throw new Error(`Try-on task failed: ${statusData.error || 'Unknown error'}`);
        }
        
        console.log(`Polling attempt ${attempts}, status: ${statusData.status}`);
      } else {
        console.log(`Status check failed: ${statusResponse.status}`);
      }
    } catch (error) {
      console.log(`Status check error:`, error.message);
    }
    
    attempts++;
  }

  throw new Error('Try-on task timed out');
}

export async function downloadResultImage(resultImageUrl: string): Promise<ArrayBuffer> {
  console.log('Step 5: Downloading result image...');
  
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
