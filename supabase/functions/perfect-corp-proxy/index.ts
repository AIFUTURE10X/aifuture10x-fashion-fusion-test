
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { TryOnRequest } from './types.ts';
import { processWithAccessToken } from './processor.ts';
import { authenticateWithPerfectCorp } from './auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      userPhoto, 
      userPhotoStoragePath, 
      clothingImage, 
      clothingCategory,
      isCustomClothing,
      perfectCorpRefId
    }: TryOnRequest = await req.json();
    
    // Use real API with S2S endpoints
    const mockMode = false;
    const apiKey = Deno.env.get('PERFECTCORP_API_KEY');
    const apiSecret = Deno.env.get('PERFECTCORP_API_SECRET');
    
    console.log('Perfect Corp S2S virtual try-on request:', {
      category: clothingCategory,
      userPhotoStoragePath,
      userPhotoLength: userPhoto?.length,
      isCustomClothing,
      perfectCorpRefId,
      styleId: isCustomClothing ? undefined : clothingImage,
      mockMode: mockMode,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key missing in edge function env');
    }

    let accessToken: string;

    if (mockMode) {
      console.log('Running in mock mode - using test token');
      accessToken = 'mock_token_for_testing';
    } else {
      if (!apiKey || !apiSecret) {
        throw new Error('Perfect Corp API credentials not configured. Please set PERFECTCORP_API_KEY and PERFECTCORP_API_SECRET in your Supabase secrets.');
      }
      
      console.log('Authenticating with Perfect Corp S2S API...');
      try {
        const authResult = await authenticateWithPerfectCorp(apiKey, apiSecret);
        accessToken = authResult.accessToken;
        console.log('Perfect Corp S2S authentication successful');
      } catch (authError) {
        console.error('Perfect Corp S2S authentication failed:', authError);
        throw new Error(`Perfect Corp S2S API authentication failed: ${authError.message}`);
      }
    }

    return await processWithAccessToken(accessToken, {
      userPhoto,
      userPhotoStoragePath,
      clothingImage,
      clothingCategory,
      isCustomClothing,
      perfectCorpRefId,
      supabaseUrl,
      supabaseServiceKey
    });

  } catch (error) {
    console.error('Perfect Corp S2S virtual try-on error:', error);
    
    let errorMessage = error.message || 'Unknown error occurred';
    
    // Enhanced error messages for S2S API specific cases
    if (errorMessage.includes('exceed_max_filesize')) {
      errorMessage = 'Image file size exceeds the maximum limit (10MB)';
    } else if (errorMessage.includes('error_no_face')) {
      errorMessage = 'No face detected in the uploaded image';
    } else if (errorMessage.includes('error_multiple_people')) {
      errorMessage = 'Multiple people detected in the image. Please use a photo with only one person';
    } else if (errorMessage.includes('error_no_shoulder')) {
      errorMessage = 'Shoulders are not visible in the image. Please use a full-body photo';
    } else if (errorMessage.includes('error_large_face_angle')) {
      errorMessage = 'The face angle in the image is too large. Please use a front-facing photo';
    } else if (errorMessage.includes('invalid_parameter')) {
      errorMessage = 'Invalid parameter provided to the S2S API';
    } else if (errorMessage.includes('Authentication failed') || errorMessage.includes('API credentials not configured')) {
      errorMessage = errorMessage; // Keep S2S auth errors as-is
    } else if (errorMessage.includes('error sending request') || errorMessage.includes('network')) {
      errorMessage = 'Network connectivity issue with S2S API. Please try again in a moment';
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
