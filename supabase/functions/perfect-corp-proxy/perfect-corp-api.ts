
export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo...');
  
  // Perfect Corp file upload endpoint
  const uploadUrl = 'https://openapi.perfectcorp.com/v1/files';
  
  try {
    // First, get upload URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_type: 'image/jpeg',
        file_name: 'user_photo.jpg'
      }),
    });

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      console.error('Perfect Corp upload request failed:', uploadError);
      throw new Error(`Upload request failed: ${uploadResponse.status} - ${uploadError}`);
    }

    const uploadData = await uploadResponse.json();
    const uploadTargetUrl = uploadData.upload_url;
    const fileId = uploadData.file_id;

    // Upload the actual image data to the pre-signed URL
    const imageUploadResponse = await fetch(uploadTargetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: userPhotoData,
    });

    if (!imageUploadResponse.ok) {
      throw new Error(`Image upload failed: ${imageUploadResponse.status}`);
    }

    console.log('User photo uploaded successfully, file_id:', fileId);
    return fileId;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export async function startTryOnTask(
  accessToken: string, 
  fileId: string, 
  clothingImage: string, 
  isCustomClothing?: boolean, 
  perfectCorpRefId?: string
): Promise<string> {
  console.log('Step 3: Running clothes try-on task...');
  
  // Perfect Corp try-on API endpoint
  const tryOnUrl = 'https://openapi.perfectcorp.com/v1/virtual-tryon';
  
  // Build request body based on clothing type
  let tryOnRequestBody: any = {
    user_image_file_id: fileId,
    category: 'outfit' // or appropriate category
  };

  if (isCustomClothing && perfectCorpRefId) {
    // Use ref_ids for custom clothing
    tryOnRequestBody.garment_ref_id = perfectCorpRefId;
    console.log('Using custom clothing with ref_id:', perfectCorpRefId);
  } else {
    // Use garment image URL for regular clothing
    tryOnRequestBody.garment_image_url = clothingImage;
    console.log('Using garment image URL:', clothingImage);
  }
  
  try {
    const tryOnResponse = await fetch(tryOnUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tryOnRequestBody),
    });

    if (!tryOnResponse.ok) {
      const tryOnError = await tryOnResponse.text();
      console.error('Perfect Corp try-on task failed:', tryOnError);
      throw new Error(`Try-on task failed: ${tryOnResponse.status} - ${tryOnError}`);
    }

    const tryOnData = await tryOnResponse.json();
    const taskId = tryOnData.task_id;

    console.log('Try-on task started, task_id:', taskId);
    return taskId;
  } catch (error) {
    console.error('Try-on error:', error);
    throw error;
  }
}

export async function pollTaskCompletion(accessToken: string, taskId: string): Promise<any> {
  console.log('Step 4: Polling for task completion...');
  let result;
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds timeout
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    // Perfect Corp task status endpoint
    const statusUrl = `https://openapi.perfectcorp.com/v1/virtual-tryon/${taskId}`;
    
    try {
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      
      if (statusData.status === 'completed') {
        result = statusData;
        break;
      } else if (statusData.status === 'failed') {
        throw new Error(`Try-on task failed: ${statusData.error || 'Unknown error'}`);
      }
      
      attempts++;
      console.log(`Polling attempt ${attempts}, status: ${statusData.status}`);
    } catch (error) {
      console.error('Status check error:', error);
      throw error;
    }
  }

  if (!result) {
    throw new Error('Try-on task timed out');
  }

  return result;
}

export async function downloadResultImage(resultImageUrl: string): Promise<ArrayBuffer> {
  console.log('Step 5: Downloading result image...');
  
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
