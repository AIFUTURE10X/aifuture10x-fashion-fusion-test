
export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo...');
  
  // Try multiple API base URLs
  const apiUrls = [
    'https://api.perfectcorp.com/v2/files',
    'https://openapi.perfectcorp.com/v2/files',
    'https://api.perfectcorp.com/v1/files',
    'https://openapi.perfectcorp.com/v1/files'
  ];
  
  for (const uploadUrl of apiUrls) {
    try {
      console.log(`Attempting file upload to: ${uploadUrl}`);
      
      // First, get upload URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          file_type: 'image/jpeg',
          file_name: 'user_photo.jpg'
        }),
      });

      if (!uploadResponse.ok) {
        console.log(`Upload request failed for ${uploadUrl}:`, uploadResponse.status);
        continue;
      }

      const uploadData = await uploadResponse.json();
      const uploadTargetUrl = uploadData.upload_url;
      const fileId = uploadData.file_id;

      if (!uploadTargetUrl || !fileId) {
        console.log(`Invalid upload response from ${uploadUrl}:`, uploadData);
        continue;
      }

      // Upload the actual image data to the pre-signed URL
      const imageUploadResponse = await fetch(uploadTargetUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
        },
        body: userPhotoData,
      });

      if (!imageUploadResponse.ok) {
        console.log(`Image upload failed for ${uploadUrl}:`, imageUploadResponse.status);
        continue;
      }

      console.log('User photo uploaded successfully, file_id:', fileId);
      return fileId;
    } catch (error) {
      console.log(`Upload error for ${uploadUrl}:`, error.message);
      continue;
    }
  }
  
  throw new Error('All Perfect Corp file upload endpoints failed');
}

export async function startTryOnTask(
  accessToken: string, 
  fileId: string, 
  clothingImage: string, 
  isCustomClothing?: boolean, 
  perfectCorpRefId?: string
): Promise<string> {
  console.log('Step 3: Running clothes try-on task...');
  
  // Try multiple try-on endpoints
  const tryOnUrls = [
    'https://api.perfectcorp.com/v2/virtual-tryon',
    'https://openapi.perfectcorp.com/v2/virtual-tryon',
    'https://api.perfectcorp.com/v1/virtual-tryon',
    'https://openapi.perfectcorp.com/v1/virtual-tryon'
  ];
  
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
  
  for (const tryOnUrl of tryOnUrls) {
    try {
      console.log(`Attempting try-on request to: ${tryOnUrl}`);
      
      const tryOnResponse = await fetch(tryOnUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(tryOnRequestBody),
      });

      if (!tryOnResponse.ok) {
        console.log(`Try-on request failed for ${tryOnUrl}:`, tryOnResponse.status);
        continue;
      }

      const tryOnData = await tryOnResponse.json();
      const taskId = tryOnData.task_id;

      if (!taskId) {
        console.log(`No task_id in response from ${tryOnUrl}:`, tryOnData);
        continue;
      }

      console.log('Try-on task started, task_id:', taskId);
      return taskId;
    } catch (error) {
      console.log(`Try-on error for ${tryOnUrl}:`, error.message);
      continue;
    }
  }
  
  throw new Error('All Perfect Corp try-on endpoints failed');
}

export async function pollTaskCompletion(accessToken: string, taskId: string): Promise<any> {
  console.log('Step 4: Polling for task completion...');
  let result;
  let attempts = 0;
  const maxAttempts = 60;
  
  // Try multiple status endpoints
  const statusUrls = [
    `https://api.perfectcorp.com/v2/virtual-tryon/${taskId}`,
    `https://openapi.perfectcorp.com/v2/virtual-tryon/${taskId}`,
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

        if (!statusResponse.ok) {
          continue; // Try next URL
        }

        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          result = statusData;
          break;
        } else if (statusData.status === 'failed') {
          throw new Error(`Try-on task failed: ${statusData.error || 'Unknown error'}`);
        }
        
        console.log(`Polling attempt ${attempts}, status: ${statusData.status}`);
        break; // Found working endpoint, exit inner loop
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
