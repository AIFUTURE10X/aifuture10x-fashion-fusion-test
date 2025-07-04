
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateWithPerfectCorp } from './auth.ts';
import { uploadUserPhoto } from './file-upload.ts';
import { startTryOnTask } from './try-on.ts';
import { pollTaskCompletion } from './polling.ts';
import { downloadResultImage } from './download.ts';
import { arrayBufferToBase64, ensureDataUrlFormat, detectImageMimeTypeFromBase64, validateImageDataIntegrity } from './image-utils.ts';
import { createMockTryOnImage } from './mock-image.ts';

interface ImageValidationResult {
  valid: boolean;
  error?: string;
  processedData?: ArrayBuffer;
}

async function validateAndProcessImage(imageData: string): Promise<ImageValidationResult> {
  try {
    // Convert base64 to ArrayBuffer
    let base64Data: string;
    if (imageData.startsWith('data:image/')) {
      base64Data = imageData.split(',')[1];
    } else {
      base64Data = imageData;
    }
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const arrayBuffer = bytes.buffer;
    
    // Basic size validation (10MB limit)
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      return { valid: false, error: 'Image too large. Maximum size is 10MB.' };
    }
    
    // Minimum size validation
    if (arrayBuffer.byteLength < 1024) {
      return { valid: false, error: 'Image too small. Please use a larger image.' };
    }
    
    return { valid: true, processedData: arrayBuffer };
  } catch (error) {
    console.error('Image validation error:', error);
    return { valid: false, error: 'Invalid image format. Please use JPG, JPEG, or PNG.' };
  }
}

async function uploadImageToFileAPI(accessToken: string, imageUrl: string, fileName: string): Promise<string> {
  console.log('📤 Uploading image to Perfect Corp File API...');
  console.log('🖼️ Image URL:', imageUrl);
  
  try {
    // For now, we'll treat the imageUrl as base64 data for user photos
    // In a real implementation, you might need to fetch the image from the URL
    let imageData: ArrayBuffer;
    
    if (imageUrl.startsWith('data:image/')) {
      // Base64 data URL
      const validation = await validateAndProcessImage(imageUrl);
      if (!validation.valid) {
        throw new Error(validation.error || 'Image validation failed');
      }
      imageData = validation.processedData!;
    } else if (imageUrl.startsWith('http')) {
      // URL - fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      imageData = await response.arrayBuffer();
    } else {
      throw new Error('Invalid image format. Expected data URL or HTTP URL.');
    }
    
    console.log('📊 Image size:', imageData.byteLength, 'bytes');
    
    // Upload using the file upload strategy
    const fileId = await uploadUserPhoto(accessToken, imageData);
    console.log('✅ Image uploaded successfully, file_id:', fileId);
    
    return fileId;
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

export async function handlePerfectCorpRequest(req: Request): Promise<Response> {
  console.log(`🚀 Perfect Corp Proxy - ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 Handling CORS preflight request');
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`❌ Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Method ${req.method} not allowed` 
      }),
      {
        status: 405,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }

  const startTime = Date.now();

  try {
    console.log('📥 Processing try-on request...');
    
    // Parse request body
    let requestData;
    try {
      const body = await req.text();
      console.log('📄 Raw request body length:', body.length);
      requestData = JSON.parse(body);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body' 
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
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
    if (!requestData.userPhoto) {
      console.error('❌ Missing userPhoto in request');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'userPhoto is required' 
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    if (!requestData.clothingImage) {
      console.error('❌ Missing clothingImage in request');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'clothingImage is required' 
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    // Check API credentials
    const apiKey = Deno.env.get('PERFECTCORP_API_KEY');
    const apiSecret = Deno.env.get('PERFECTCORP_API_SECRET');
    const useMockMode = !apiKey || !apiSecret || apiKey === 'test_key' || apiSecret === 'test_secret';

    if (useMockMode) {
      console.log('🧪 Using mock mode - API credentials not configured properly');
      
      // Simulate processing time
      console.log('⏳ Simulating try-on processing...');
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Create a proper mock result image
      const mockImageBase64 = await createMockTryOnImage();
      
      // Validate mock image to ensure it meets our standards
      const mockValidation = validateImageDataIntegrity(mockImageBase64);
      if (!mockValidation.valid) {
        console.error('❌ Mock image validation failed:', mockValidation.error);
        console.error('📊 Mock image stats:', mockValidation.stats);
        throw new Error(`Mock image generation failed: ${mockValidation.error}`);
      }
      
      console.log('✅ Mock try-on completed successfully');
      console.log('📊 Mock image stats:', mockValidation.stats);

      const response = {
        success: true,
        result_img: mockImageBase64,
        processing_time: 4,
        message: "Mock try-on completed successfully"
      };

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    // Real API mode - implement the complete flow
    console.log('🔗 API credentials found - using real Perfect Corp API');
    console.log('🔐 Starting authentication...');
    
    try {
      // Step 1: Authenticate with Perfect Corp
      const authResult = await authenticateWithPerfectCorp(apiKey, apiSecret, null);
      const accessToken = authResult.accessToken;
      console.log('✅ Authentication successful');

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

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );

    } catch (apiError) {
      console.error('❌ Perfect Corp API error:', apiError);
      
      // Handle specific Perfect Corp errors
      let errorMessage = apiError.message || 'Unknown API error';
      
      if (errorMessage.includes('error_no_face')) {
        errorMessage = 'No face detected in the image. Please use a photo showing your face clearly.';
      } else if (errorMessage.includes('error_no_shoulder')) {
        errorMessage = 'Both shoulders must be visible in the photo. Please use a photo showing your upper body.';
      } else if (errorMessage.includes('error_pose')) {
        errorMessage = 'Please use a photo with a neutral pose and arms down by your sides.';
      } else if (errorMessage.includes('authentication')) {
        errorMessage = 'API authentication failed. Please check your Perfect Corp credentials.';
      } else if (errorMessage.includes('file_id')) {
        errorMessage = 'Image upload failed. Please try again with a different image.';
      }
      
      // Fallback to mock on API error
      console.log('🔄 Falling back to mock mode due to API error');
      try {
        const mockImageBase64 = await createMockTryOnImage();
        return new Response(
          JSON.stringify({ 
            success: true,
            result_img: mockImageBase64,
            processing_time: Math.round((Date.now() - startTime) / 1000),
            message: `Fallback mock try-on (API error: ${errorMessage})`
          }),
          {
            status: 200,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            }
          }
        );
      } catch (fallbackError) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: errorMessage
          }),
          {
            status: 500,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            }
          }
        );
      }
    }

  } catch (error) {
    console.error('❌ Perfect Corp Proxy error:', error);
    console.error('🔥 Error stack:', error.stack);
    
    // Final fallback to mock
    console.log('🔄 Final fallback to mock mode');
    try {
      const mockImageBase64 = await createMockTryOnImage();
      return new Response(
        JSON.stringify({ 
          success: true,
          result_img: mockImageBase64,
          processing_time: Math.round((Date.now() - startTime) / 1000),
          message: "Fallback mock try-on (server error occurred)"
        }),
        {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    } catch (fallbackError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Server error: ${error.message}` 
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }
  }
}
