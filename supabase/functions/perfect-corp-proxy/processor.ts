
import { ProcessParams } from './types.ts';
import { getUserPhotoData, arrayBufferToBase64 } from './image-utils.ts';
import { uploadUserPhoto } from './file-upload.ts';
import { startTryOnTask } from './try-on.ts';
import { pollTaskCompletion } from './polling.ts';
import { downloadResultImage } from './download.ts';
import { corsHeaders } from '../_shared/cors.ts';

export async function processTryOnRequest(requestData: any, accessToken: string): Promise<any> {
  const startTime = Date.now();
  console.log('=== Starting Perfect Corp S2S try-on process ===');
  console.log('Request data:', {
    hasUserPhoto: !!requestData.userPhoto,
    hasUserPhotoStoragePath: !!requestData.userPhotoStoragePath,
    clothingCategory: requestData.clothingCategory,
    isCustomClothing: requestData.isCustomClothing
  });

  try {
    // Step 2: Get user photo data with enhanced error handling
    console.log('Getting user photo data for S2S API...');
    
    // Extract storage path from userPhotoStoragePath if it exists
    let storagePath = requestData.userPhotoStoragePath;
    if (storagePath && storagePath.includes('/storage/v1/object/public/')) {
      // Extract just the bucket/path part
      storagePath = storagePath.split('/storage/v1/object/public/')[1];
      console.log('Extracted storage path:', storagePath);
    }
    
    const userPhotoData = await getUserPhotoData(
      requestData.userPhoto, 
      storagePath,
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    console.log(`User photo data size for S2S: ${userPhotoData.byteLength} bytes`);

    // Validate photo data
    if (userPhotoData.byteLength === 0) {
      throw new Error('User photo data is empty');
    }

    // Additional validation for minimum file size (avoid corrupted images)
    if (userPhotoData.byteLength < 1000) {
      throw new Error(`User photo data too small: ${userPhotoData.byteLength} bytes. This might indicate a corrupted or invalid image.`);
    }

    // Step 3: Upload user photo to Perfect Corp S2S API using two-step process
    console.log('Uploading user photo to Perfect Corp S2S API using correct two-step process...');
    const fileId = await uploadUserPhoto(accessToken, userPhotoData);
    console.log(`File uploaded to S2S API with ID: ${fileId}`);

    // Validate file_id format
    if (!fileId || typeof fileId !== 'string' || fileId.trim().length === 0) {
      throw new Error(`Invalid file_id received from S2S upload: ${fileId}`);
    }

    // Step 4: Run clothes try-on task with S2S API
    console.log('Starting S2S try-on task...');
    const taskId = await startTryOnTask(
      accessToken, 
      fileId, 
      requestData.clothingImage, 
      requestData.isCustomClothing, 
      requestData.perfectCorpRefId,
      requestData.clothingCategory
    );
    console.log(`S2S Try-on task started with ID: ${taskId}`);

    // Step 5: Poll for task completion from S2S API
    console.log('Polling for S2S task completion...');
    const result = await pollTaskCompletion(accessToken, taskId);
    console.log('S2S Task completed successfully');

    // Step 6: Download and convert result image from S2S API
    const resultImageUrl = result.result?.output_url || 
                           result.result?.result_image_url || 
                           result.output_url || 
                           result.result_image_url;

    if (!resultImageUrl) {
      console.error('No result image URL found in S2S response:', JSON.stringify(result, null, 2));
      throw new Error('No result image URL found in Perfect Corp S2S response');
    }

    console.log('Downloading result image from S2S API...');
    const resultImageData = await downloadResultImage(resultImageUrl);
    const resultImageBase64 = arrayBufferToBase64(resultImageData);

    const totalTime = Date.now() - startTime;
    console.log(`=== S2S Try-on process completed successfully in ${totalTime}ms ===`);
    console.log(`Result image base64 length: ${resultImageBase64.length} characters`);

    return {
      success: true,
      result_img: resultImageBase64,
      processing_time: result.processing_time || Math.round(totalTime / 1000),
      message: requestData.isCustomClothing 
        ? "Virtual try-on completed successfully using your custom clothing with S2S API"
        : "Virtual try-on completed successfully using Perfect Corp S2S AI"
    };

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`=== S2S Try-on process failed after ${totalTime}ms ===`);
    console.error('S2S Error details:', error);
    
    // Enhanced error context for debugging
    if (error.message && error.message.includes('S2S File upload failed')) {
      console.error('File upload specific error - check Perfect Corp S2S API endpoint and format');
    }
    
    // Re-throw the error to be handled by the main function
    throw error;
  }
}
