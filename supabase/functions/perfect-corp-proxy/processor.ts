
import { ProcessParams } from './types.ts';
import { startTryOnTask } from './try-on.ts';
import { pollTaskCompletion } from './polling.ts';
import { downloadResultImage } from './download.ts';
import { arrayBufferToBase64 } from './image-utils.ts';
import { corsHeaders } from '../_shared/cors.ts';

export async function processTryOnRequest(requestData: any, accessToken: string): Promise<any> {
  const startTime = Date.now();
  console.log('=== Starting Perfect Corp S2S try-on process ===');
  console.log('🔑 Access token preview:', accessToken.substring(0, 20) + '...');
  console.log('📋 Request data:', {
    hasUserPhoto: !!requestData.userPhoto,
    hasUserPhotoStoragePath: !!requestData.userPhotoStoragePath,
    clothingCategory: requestData.clothingCategory,
    isCustomClothing: requestData.isCustomClothing,
    perfectCorpRefId: requestData.perfectCorpRefId
  });

  try {
    // Enhanced access token validation
    if (!accessToken || accessToken === 'undefined' || accessToken.length < 10) {
      throw new Error('Invalid or missing access token for Perfect Corp API');
    }
    
    // Additional token format validation
    if (!accessToken.includes('.') && accessToken !== 'mock_token_for_testing') {
      console.warn('⚠️ Access token format seems unusual - may be corrupted');
    }
    
    console.log('✅ Access token validation passed');

    // For custom clothing, we should already have the Perfect Corp file_id
    if (requestData.isCustomClothing && requestData.perfectCorpRefId) {
      console.log('🎨 Using custom clothing with existing Perfect Corp file_id:', requestData.perfectCorpRefId);
      
      // Start try-on task directly with the file_id
      console.log('🎽 Starting S2S try-on task with existing file_id...');
      const taskId = await startTryOnTask(
        accessToken, 
        requestData.perfectCorpRefId, // Use the Perfect Corp file_id directly
        requestData.clothingImage, 
        requestData.isCustomClothing, 
        requestData.perfectCorpRefId,
        requestData.clothingCategory
      );
      console.log(`🚀 S2S Try-on task started with ID: ${taskId}`);

      // Poll for task completion
      console.log('⏳ Polling for S2S task completion...');
      const result = await pollTaskCompletion(accessToken, taskId);
      console.log('✅ S2S Task completed successfully');

      // Download and process result
      const resultImageUrl = result.result?.output_url || 
                             result.result?.result_image_url || 
                             result.output_url || 
                             result.result_image_url;

      if (!resultImageUrl) {
        console.error('❌ No result image URL found in S2S response:', JSON.stringify(result, null, 2));
        throw new Error('No result image URL found in Perfect Corp S2S response');
      }

      console.log('📥 Downloading result image from S2S API...');
      const resultImageData = await downloadResultImage(resultImageUrl);
      const resultImageBase64 = arrayBufferToBase64(resultImageData);

      const totalTime = Date.now() - startTime;
      console.log(`🎉 S2S Try-on process completed successfully in ${totalTime}ms`);
      console.log(`📊 Result image base64 length: ${resultImageBase64.length} characters`);

      return {
        success: true,
        result_img: resultImageBase64,
        processing_time: result.processing_time || Math.round(totalTime / 1000),
        message: "Virtual try-on completed successfully using your custom clothing with Perfect Corp File API"
      };

    } else {
      throw new Error('Custom clothing requires Perfect Corp file_id. Please re-upload your clothing image.');
    }

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ S2S Try-on process failed after ${totalTime}ms`);
    console.error('🔥 S2S Error details:', error);
    
    // Enhanced error context for debugging
    if (error.message && error.message.includes('file_id')) {
      console.error('📤 File ID error - clothing may need to be re-uploaded with Perfect Corp File API');
      console.error('💡 Suggestion: Re-upload the clothing image to get a new Perfect Corp file_id');
    }
    
    if (error.message && error.message.includes('Invalid access token')) {
      console.error('🔑 Authentication error - token may be expired or invalid');
      console.error('💡 Suggestion: Check token generation and refresh logic');
    }

    if (error.message && error.message.includes('500')) {
      console.error('🔥 Server error from Perfect Corp - API may be experiencing issues');
      console.error('💡 Suggestion: Check Perfect Corp API status or contact support');
    }
    
    // Re-throw the error to be handled by the main function
    throw error;
  }
}
