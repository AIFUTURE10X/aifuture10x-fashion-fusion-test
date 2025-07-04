
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
  console.log('🖼️ Image URL type:', imageUrl.startsWith('data:') ? 'Base64 Data URL' : 'HTTP URL');
  console.log('🖼️ Image URL length:', imageUrl.length);
  
  try {
    let imageData: ArrayBuffer;
    
    if (imageUrl.startsWith('data:image/')) {
      console.log('🔄 Processing base64 data URL...');
      // Base64 data URL
      const validation = await validateAndProcessImage(imageUrl);
      if (!validation.valid) {
        throw new Error(validation.error || 'Image validation failed');
      }
      imageData = validation.processedData!;
      console.log('✅ Base64 data processed successfully, size:', imageData.byteLength, 'bytes');
      
    } else if (imageUrl.startsWith('http')) {
      console.log('🔄 Fetching image from URL...');
      
      // Enhanced URL fetching with timeout and retry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const response = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Perfect-Corp-Proxy/1.0',
            'Accept': 'image/*',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log('📋 Response content-type:', contentType);
        console.log('📊 Response content-length:', response.headers.get('content-length'));
        
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error(`Invalid content type: ${contentType}. Expected image/*`);
        }
        
        imageData = await response.arrayBuffer();
        console.log('✅ Image fetched successfully from URL, size:', imageData.byteLength, 'bytes');
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Image fetch timeout: URL took too long to respond');
        }
        throw fetchError;
      }
      
    } else {
      throw new Error('Invalid image format. Expected data URL (data:image/*) or HTTP URL (http/https).');
    }
    
    // Validate image size
    if (imageData.byteLength === 0) {
      throw new Error('Image data is empty');
    }
    
    if (imageData.byteLength > 10 * 1024 * 1024) {
      throw new Error(`Image too large: ${(imageData.byteLength / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`);
    }
    
    if (imageData.byteLength < 1024) {
      throw new Error(`Image too small: ${imageData.byteLength} bytes. Minimum size is 1KB.`);
    }
    
    console.log('📊 Final image data size:', imageData.byteLength, 'bytes');
    console.log('📋 File name for upload:', fileName);
    
    // Upload using the enhanced file upload strategy with retry logic
    const fileId = await uploadUserPhoto(accessToken, imageData);
    console.log('✅ Image uploaded successfully to Perfect Corp, file_id:', fileId);
    
    return fileId;
    
  } catch (error) {
    console.error('❌ Image upload process failed:', error);
    console.error('📋 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    // Enhanced error categorization
    let errorMessage = error.message;
    if (errorMessage.includes('fetch')) {
      errorMessage = `Network error while fetching image: ${errorMessage}`;
    } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      errorMessage = `Request timeout: ${errorMessage}`;
    } else if (errorMessage.includes('validation')) {
      errorMessage = `Image validation failed: ${errorMessage}`;
    }
    
    throw new Error(`Image upload failed: ${errorMessage}`);
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

    // Check API credentials - REQUIRED for Perfect Corp API
    const apiKey = Deno.env.get('PERFECTCORP_API_KEY');
    const apiSecret = Deno.env.get('PERFECTCORP_API_SECRET');

    console.log('🔍 [Credentials] Checking Perfect Corp API credentials...');
    console.log('🔑 [Credentials] API Key present:', !!apiKey);
    console.log('🔑 [Credentials] API Key length:', apiKey?.length || 0);
    console.log('🔐 [Credentials] API Secret present:', !!apiSecret);
    console.log('🔐 [Credentials] API Secret length:', apiSecret?.length || 0);
    console.log('🔐 [Credentials] API Secret format:', apiSecret?.includes('BEGIN') ? 'PEM' : 'Raw Base64');

    // Validate credentials are properly configured
    if (!apiKey || !apiSecret || apiKey === 'test_key' || apiSecret === 'test_secret') {
      console.error('❌ [Credentials] Perfect Corp API credentials not configured properly');
      console.error('📋 [Credentials] Credential status:', {
        hasApiKey: !!apiKey,
        apiKeyValid: apiKey && apiKey !== 'test_key',
        hasApiSecret: !!apiSecret,
        apiSecretValid: apiSecret && apiSecret !== 'test_secret',
        apiKeyLength: apiKey?.length || 0,
        apiSecretLength: apiSecret?.length || 0
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Perfect Corp API credentials not configured. Please configure PERFECTCORP_API_KEY and PERFECTCORP_API_SECRET in Supabase Edge Function secrets.' 
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

    console.log('✅ [Credentials] Perfect Corp API credentials validated successfully');

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
      const authResult = await authenticateWithPerfectCorp(apiKey, apiSecret, supabase);
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
      
      // Return API error instead of falling back to mock
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

  } catch (error) {
    console.error('❌ Perfect Corp Proxy error:', error);
    console.error('🔥 Error stack:', error.stack);
    
    // Return server error instead of falling back to mock
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
