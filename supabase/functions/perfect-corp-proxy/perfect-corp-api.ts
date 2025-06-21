
export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('Step 2: Uploading user photo...');
  
  // Try the main API endpoint first
  let uploadResponse = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/file/clothes-tryon', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: [
        {
          content_type: 'image/jpeg',
          file_name: 'user_photo.jpg'
        }
      ]
    }),
  });

  // If the main endpoint fails, try alternative endpoint
  if (!uploadResponse.ok) {
    console.log('Primary upload endpoint failed, trying alternative...');
    uploadResponse = await fetch('https://api.perfectcorp.com/v1/file/upload', {
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
  }

  if (!uploadResponse.ok) {
    const uploadError = await uploadResponse.text();
    console.error('Perfect Corp upload request failed:', uploadError);
    throw new Error(`Upload request failed: ${uploadResponse.status} - ${uploadError}`);
  }

  const uploadData = await uploadResponse.json();
  const uploadResult = uploadData.result || uploadData;
  const uploadUrl = uploadResult.files?.[0]?.url || uploadResult.upload_url;
  const fileId = uploadResult.files?.[0]?.file_id || uploadResult.file_id;

  // Upload the actual image data
  const imageUploadResponse = await fetch(uploadUrl, {
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
}

export async function startTryOnTask(
  accessToken: string, 
  fileId: string, 
  clothingImage: string, 
  isCustomClothing?: boolean, 
  perfectCorpRefId?: string
): Promise<string> {
  console.log('Step 3: Running clothes try-on task...');
  
  // Build request body based on clothing type
  let tryOnRequestBody: any = {
    file_id: fileId
  };

  if (isCustomClothing && perfectCorpRefId) {
    // Use ref_ids for custom clothing
    tryOnRequestBody.ref_ids = [perfectCorpRefId];
    console.log('Using custom clothing with ref_id:', perfectCorpRefId);
  } else {
    // Use style_id for predefined styles
    tryOnRequestBody.style_id = clothingImage;
    console.log('Using predefined style with style_id:', clothingImage);
  }
  
  // Try main endpoint first
  let tryOnResponse = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/task/clothes-tryon', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tryOnRequestBody),
  });

  // If main endpoint fails, try alternative
  if (!tryOnResponse.ok) {
    console.log('Primary try-on endpoint failed, trying alternative...');
    tryOnResponse = await fetch('https://api.perfectcorp.com/v1/tryon/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tryOnRequestBody),
    });
  }

  if (!tryOnResponse.ok) {
    const tryOnError = await tryOnResponse.text();
    console.error('Perfect Corp try-on task failed:', tryOnError);
    throw new Error(`Try-on task failed: ${tryOnResponse.status} - ${tryOnError}`);
  }

  const tryOnData = await tryOnResponse.json();
  const tryOnResult = tryOnData.result || tryOnData;
  const taskId = tryOnResult.task_id;

  console.log('Try-on task started, task_id:', taskId);
  return taskId;
}

export async function pollTaskCompletion(accessToken: string, taskId: string): Promise<any> {
  console.log('Step 4: Polling for task completion...');
  let result;
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds timeout
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    // Try main endpoint first
    let statusResponse = await fetch(`https://yce-api-01.perfectcorp.com/s2s/v1.0/task/clothes-tryon?task_id=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // If main endpoint fails, try alternative
    if (!statusResponse.ok) {
      console.log('Primary status endpoint failed, trying alternative...');
      statusResponse = await fetch(`https://api.perfectcorp.com/v1/tryon/status/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    }

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    const statusResult = statusData.result || statusData;
    
    if (statusResult.status === 'success') {
      result = statusResult;
      break;
    } else if (statusResult.status === 'failed') {
      throw new Error(`Try-on task failed: ${statusResult.error || 'Unknown error'}`);
    }
    
    attempts++;
    console.log(`Polling attempt ${attempts}, status: ${statusResult.status}`);
  }

  if (!result) {
    throw new Error('Try-on task timed out');
  }

  return result;
}

export async function downloadResultImage(resultImageUrl: string): Promise<ArrayBuffer> {
  console.log('Step 5: Downloading result image...');
  const resultImageResponse = await fetch(resultImageUrl);
  
  if (!resultImageResponse.ok) {
    throw new Error(`Failed to download result image: ${resultImageResponse.status}`);
  }

  return await resultImageResponse.arrayBuffer();
}
