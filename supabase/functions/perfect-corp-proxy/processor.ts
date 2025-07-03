
import { ProcessParams } from './types.ts';
import { startTryOnTask } from './try-on.ts';
import { pollTaskCompletion } from './polling.ts';
import { downloadResultImage } from './download.ts';
import { arrayBufferToBase64 } from './image-utils.ts';
import { uploadImageToFileAPI } from './file-upload.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Authentication function
async function authenticateWithPerfectCorp(): Promise<string> {
  console.log('🔐 Starting Perfect Corp authentication...');
  
  const apiKey = Deno.env.get('PERFECTCORP_API_KEY');
  const apiSecret = Deno.env.get('PERFECTCORP_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Perfect Corp API credentials not configured');
  }

  // Mock token for testing - replace with actual auth logic
  if (apiKey === 'test_key' || apiSecret === 'test_secret') {
    console.log('🧪 Using mock authentication for testing');
    return 'mock_token_for_testing';
  }
  
  // For now, let's try to call the auth function directly
  try {
    console.log('🔑 Calling perfectcorp-auth function...');
    
    const authUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/perfectcorp-auth`;
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Auth function failed:', response.status, errorText);
      throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
    }

    const authData = await response.json();
    if (!authData.success || !authData.accessToken) {
      console.error('❌ Invalid auth response:', authData);
      throw new Error('Failed to get access token from auth service');
    }

    console.log('✅ Authentication successful');
    return authData.accessToken;
  } catch (error) {
    console.error('❌ Authentication error:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

export async function processTryOnRequest(requestData: any, accessToken: string): Promise<any> {
  const startTime = Date.now();
  console.log('=== Starting Perfect Corp S2S try-on process ===');
  console.log('📋 Request data:', {
    hasUserPhoto: !!requestData.userPhoto,
    hasUserPhotoStoragePath: !!requestData.userPhotoStoragePath,
    clothingCategory: requestData.clothingCategory,
    isCustomClothing: requestData.isCustomClothing,
    perfectCorpRefId: requestData.perfectCorpRefId,
    clothingImage: requestData.clothingImage ? 'provided' : 'missing'
  });

  try {
    // Get access token
    console.log('🔐 Getting Perfect Corp access token...');
    const actualAccessToken = await authenticateWithPerfectCorp();
    console.log('✅ Access token obtained successfully');

    let perfectCorpFileId: string;

    // Check if we already have a Perfect Corp file_id for this clothing
    if (requestData.isCustomClothing && requestData.perfectCorpRefId) {
      console.log('🎨 Using existing Perfect Corp file_id:', requestData.perfectCorpRefId);
      perfectCorpFileId = requestData.perfectCorpRefId;
    } else if (requestData.clothingImage) {
      // Need to upload the clothing image to Perfect Corp File API first
      console.log('📤 Uploading clothing image to Perfect Corp File API...');
      console.log('🖼️ Clothing image URL:', requestData.clothingImage);
      
      try {
        perfectCorpFileId = await uploadImageToFileAPI(
          actualAccessToken, 
          requestData.clothingImage,
          'clothing_reference.jpg'
        );
        console.log('✅ Successfully uploaded to Perfect Corp, file_id:', perfectCorpFileId);
      } catch (uploadError) {
        console.error('❌ Failed to upload clothing image to Perfect Corp:', uploadError);
        throw new Error(`Failed to upload clothing image to Perfect Corp: ${uploadError.message}`);
      }
    } else {
      throw new Error('No clothing image or Perfect Corp file_id provided');
    }

    // Now upload the user photo to Perfect Corp File API
    console.log('📤 Uploading user photo to Perfect Corp File API...');
    let userPhotoFileId: string;
    
    try {
      userPhotoFileId = await uploadImageToFileAPI(
        actualAccessToken, 
        requestData.userPhoto,
        'user_photo.jpg'
      );
      console.log('✅ Successfully uploaded user photo, file_id:', userPhotoFileId);
    } catch (uploadError) {
      console.error('❌ Failed to upload user photo to Perfect Corp:', uploadError);
      throw new Error(`Failed to upload user photo to Perfect Corp: ${uploadError.message}`);
    }

    // Start try-on task with Perfect Corp file_ids
    console.log('🎽 Starting S2S try-on task with Perfect Corp file_ids...');
    const taskId = await startTryOnTask(
      actualAccessToken, 
      userPhotoFileId, // User photo file_id
      perfectCorpFileId, // Clothing file_id  
      true, // isCustomClothing (always true now since we use File API)
      perfectCorpFileId, // perfectCorpRefId
      requestData.clothingCategory
    );
    console.log(`🚀 S2S Try-on task started with ID: ${taskId}`);

    // Poll for task completion
    console.log('⏳ Polling for S2S task completion...');
    const result = await pollTaskCompletion(actualAccessToken, taskId);
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
      message: "Virtual try-on completed successfully using Perfect Corp File API"
    };

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ S2S Try-on process failed after ${totalTime}ms`);
    console.error('🔥 S2S Error details:', error);
    
    // Enhanced error context for debugging
    if (error.message && error.message.includes('file_id')) {
      console.error('📤 File ID error - clothing upload may have failed');
      console.error('💡 Suggestion: Check Perfect Corp File API upload process');
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
