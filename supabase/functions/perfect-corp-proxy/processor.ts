
import { ProcessParams } from './types.ts';
import { getUserPhotoData, arrayBufferToBase64 } from './image-utils.ts';
import { uploadUserPhoto, startTryOnTask, pollTaskCompletion, downloadResultImage } from './perfect-corp-api.ts';
import { corsHeaders } from '../_shared/cors.ts';

export async function processWithAccessToken(accessToken: string, params: ProcessParams): Promise<Response> {
  const {
    userPhoto,
    userPhotoStoragePath,
    clothingImage,
    clothingCategory,
    isCustomClothing,
    perfectCorpRefId,
    supabaseUrl,
    supabaseServiceKey
  } = params;

  const startTime = Date.now();
  console.log('=== Starting Perfect Corp try-on process ===');

  try {
    // Step 2: Get user photo data
    console.log('Getting user photo data...');
    const userPhotoData = await getUserPhotoData(
      userPhoto, 
      userPhotoStoragePath, 
      supabaseUrl, 
      supabaseServiceKey
    );
    console.log(`User photo data size: ${userPhotoData.byteLength} bytes`);

    // Step 3: Upload user photo to Perfect Corp
    console.log('Uploading user photo to Perfect Corp...');
    const fileId = await uploadUserPhoto(accessToken, userPhotoData);
    console.log(`File uploaded with ID: ${fileId}`);

    // Step 4: Run clothes try-on task
    console.log('Starting try-on task...');
    const taskId = await startTryOnTask(
      accessToken, 
      fileId, 
      clothingImage, 
      isCustomClothing, 
      perfectCorpRefId,
      clothingCategory
    );
    console.log(`Try-on task started with ID: ${taskId}`);

    // Step 5: Poll for task completion
    console.log('Polling for task completion...');
    const result = await pollTaskCompletion(accessToken, taskId);
    console.log('Task completed successfully');

    // Step 6: Download and convert result image
    const resultImageUrl = result.result?.output_url || 
                           result.result?.result_image_url || 
                           result.output_url || 
                           result.result_image_url;

    if (!resultImageUrl) {
      console.error('No result image URL found in response:', JSON.stringify(result, null, 2));
      throw new Error('No result image URL found in Perfect Corp response');
    }

    console.log('Downloading result image...');
    const resultImageData = await downloadResultImage(resultImageUrl);
    const resultImageBase64 = arrayBufferToBase64(resultImageData);

    const totalTime = Date.now() - startTime;
    console.log(`=== Try-on process completed successfully in ${totalTime}ms ===`);
    console.log(`Result image base64 length: ${resultImageBase64.length} characters`);

    return new Response(JSON.stringify({
      success: true,
      result_img: resultImageBase64,
      processing_time: result.processing_time || Math.round(totalTime / 1000),
      message: isCustomClothing 
        ? "Virtual try-on completed successfully using your custom clothing"
        : "Virtual try-on completed successfully using Perfect Corp AI"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`=== Try-on process failed after ${totalTime}ms ===`);
    console.error('Error details:', error);
    
    // Re-throw the error to be handled by the main function
    throw error;
  }
}
