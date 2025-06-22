
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

  // Step 2: Get user photo data
  const userPhotoData = await getUserPhotoData(
    userPhoto, 
    userPhotoStoragePath, 
    supabaseUrl, 
    supabaseServiceKey
  );

  // Step 3: Upload user photo to Perfect Corp
  const fileId = await uploadUserPhoto(accessToken, userPhotoData);

  // Step 4: Run clothes try-on task
  const taskId = await startTryOnTask(
    accessToken, 
    fileId, 
    clothingImage, 
    isCustomClothing, 
    perfectCorpRefId,
    clothingCategory
  );

  // Step 5: Poll for task completion
  const result = await pollTaskCompletion(accessToken, taskId);

  // Step 6: Download and convert result image
  const resultImageUrl = result.result?.output_url || 
                         result.result?.result_image_url || 
                         result.output_url || 
                         result.result_image_url;

  if (!resultImageUrl) {
    throw new Error('No result image URL found in response');
  }

  const resultImageData = await downloadResultImage(resultImageUrl);
  const resultImageBase64 = arrayBufferToBase64(resultImageData);

  console.log('Clothes try-on completed successfully');

  return new Response(JSON.stringify({
    success: true,
    result_img: resultImageBase64,
    processing_time: result.processing_time || null,
    message: isCustomClothing 
      ? "Virtual try-on completed successfully using your custom clothing"
      : "Virtual try-on completed successfully using Perfect Corp AI"
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
