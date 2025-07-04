// Main request handler - orchestrates the Perfect Corp API workflow

import { corsHeaders } from '../_shared/cors.ts';
import { authenticateWithPerfectCorp } from './auth.ts';
import { startTryOnTask } from './try-on.ts';
import { pollTaskCompletion } from './polling.ts';
import { downloadResultImage } from './download.ts';
import { arrayBufferToBase64, ensureDataUrlFormat, detectImageMimeTypeFromBase64, validateImageDataIntegrity } from './image-utils.ts';
import { parseRequestBody, validateRequestData, validateCredentials, RequestData } from './request-validation.ts';
import { uploadImageToFileAPI } from './image-upload.ts';
import { 
  createErrorResponse, 
  createSuccessResponse, 
  handleCorsPreflightRequest, 
  handleMethodNotAllowed,
  enhanceApiError 
} from './response-utils.ts';

export async function handlePerfectCorpRequest(req: Request): Promise<Response> {
  console.log(`🚀 Perfect Corp Proxy - ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return handleMethodNotAllowed(req.method);
  }

  const startTime = Date.now();

  try {
    console.log('📥 Processing try-on request...');
    
    // Parse and validate request body
    let requestData: RequestData;
    try {
      requestData = await parseRequestBody(req);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }

    console.log('📋 Request data received:', {
      hasUserPhoto: !!requestData.userPhoto,
      userPhotoLength: requestData.userPhoto?.length || 0,
      clothingCategory: requestData.clothingCategory,
      hasClothingImage: !!requestData.clothingImage,
      clothingImageType: requestData.clothingImage?.startsWith('http') ? 'URL' : 'base64',
      isCustomClothing: requestData.isCustomClothing,
      perfectCorpRefId: requestData.perfectCorpRefId
    });

    // Validate required fields
    try {
      validateRequestData(requestData);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }

    // Check and validate API credentials
    const apiKey = Deno.env.get('PERFECTCORP_API_KEY');
    const apiSecret = Deno.env.get('PERFECTCORP_API_SECRET');

    try {
      validateCredentials(apiKey, apiSecret);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }

    // Real API mode - implement the complete flow
    console.log('🔗 [Main] API credentials found - using real Perfect Corp API');
    console.log('🔐 [Main] Starting authentication...');
    
    try {
      // Create Supabase client for token caching
      console.log('🔗 [Main] Creating Supabase client...');
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      // Step 1: Authenticate with Perfect Corp
      console.log('🔐 [Main] Calling authenticateWithPerfectCorp...');
      const authResult = await authenticateWithPerfectCorp(apiKey!, apiSecret!, supabase);
      const accessToken = authResult.accessToken;
      console.log('✅ [Main] Authentication successful, token length:', accessToken?.length || 0);

      // Step 2: Upload user photo
      console.log('📤 Uploading user photo...');
      const userPhotoFileId = await uploadImageToFileAPI(
        accessToken,
        requestData.userPhoto,
        'user_photo.jpg'
      );
      console.log('✅ User photo uploaded, file_id:', userPhotoFileId);

      // Step 3: Upload clothing image (if needed)
      let clothingFileId: string;
      if (requestData.perfectCorpRefId) {
        console.log('🎨 Using existing Perfect Corp ref_id:', requestData.perfectCorpRefId);
        clothingFileId = requestData.perfectCorpRefId;
      } else {
        console.log('📤 Uploading clothing image...');
        clothingFileId = await uploadImageToFileAPI(
          accessToken,
          requestData.clothingImage,
          'clothing_reference.jpg'
        );
        console.log('✅ Clothing image uploaded, file_id:', clothingFileId);
      }

      // Step 4: Start try-on task
      console.log('🎽 Starting try-on task...');
      const taskId = await startTryOnTask(
        accessToken,
        userPhotoFileId,
        clothingFileId,
        true, // isCustomClothing
        clothingFileId, // perfectCorpRefId
        requestData.clothingCategory || 'upper_body'
      );
      console.log('🚀 Try-on task started, task_id:', taskId);

      // Step 5: Poll for completion
      console.log('⏳ Polling for task completion...');
      const result = await pollTaskCompletion(accessToken, taskId);
      console.log('✅ Task completed successfully');

      // Step 6: Download result image
      const resultImageUrl = result.result?.output_url || 
                             result.result?.result_image_url || 
                             result.output_url || 
                             result.result_image_url;

      if (!resultImageUrl) {
        console.error('❌ No result image URL found in response:', JSON.stringify(result, null, 2));
        throw new Error('No result image URL found in Perfect Corp response');
      }

      console.log('📥 Downloading result image from:', resultImageUrl);
      const resultImageData = await downloadResultImage(resultImageUrl);
      const resultImageBase64 = arrayBufferToBase64(resultImageData);

      console.log('🔍 Validating downloaded image data...');
      console.log('📊 Raw base64 length:', resultImageBase64.length);

      // Detect the actual image format and ensure proper data URL format
      const mimeType = detectImageMimeTypeFromBase64(resultImageBase64);
      const formattedImageData = ensureDataUrlFormat(resultImageBase64, mimeType);

      console.log('🖼️ Image formatted as:', mimeType);
      console.log('📏 Final data URL length:', formattedImageData.length);

      // Validate image data integrity
      const validation = validateImageDataIntegrity(formattedImageData);
      if (!validation.valid) {
        console.error('❌ Downloaded image failed validation:', validation.error);
        console.error('📊 Image stats:', validation.stats);
        throw new Error(`Downloaded image is corrupted or incomplete: ${validation.error}`);
      }

      console.log('✅ Image validation passed:', validation.stats);

      const totalTime = Date.now() - startTime;
      console.log(`🎉 Try-on process completed successfully in ${totalTime}ms`);

      const response = {
        success: true,
        result_img: formattedImageData,
        processing_time: Math.round(totalTime / 1000),
        message: "Virtual try-on completed successfully using Perfect Corp API"
      };

      return createSuccessResponse(response);

    } catch (apiError) {
      console.error('❌ Perfect Corp API error:', apiError);
      
      // Handle specific Perfect Corp errors
      const errorMessage = enhanceApiError(apiError.message || 'Unknown API error');
      
      // Return API error instead of falling back to mock
      return createErrorResponse(errorMessage, 500);
    }

  } catch (error) {
    console.error('❌ Perfect Corp Proxy error:', error);
    console.error('🔥 Error stack:', error.stack);
    
    // Return server error instead of falling back to mock
    return createErrorResponse(`Server error: ${error.message}`, 500);
  }
}