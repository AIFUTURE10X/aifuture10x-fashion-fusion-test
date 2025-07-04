// Error handling and response utilities

import { corsHeaders } from '../_shared/cors.ts';

export function createErrorResponse(error: string, status: number = 500): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: error
    }),
    {
      status: status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    }
  );
}

export function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    }
  );
}

export function handleCorsPreflightRequest(): Response {
  console.log('📋 Handling CORS preflight request');
  return new Response(null, { 
    headers: corsHeaders,
    status: 200
  });
}

export function handleMethodNotAllowed(method: string): Response {
  console.log(`❌ Method not allowed: ${method}`);
  return createErrorResponse(`Method ${method} not allowed`, 405);
}

export function enhanceApiError(errorMessage: string): string {
  if (errorMessage.includes('error_no_face')) {
    return 'No face detected in the image. Please use a photo showing your face clearly.';
  } else if (errorMessage.includes('error_no_shoulder')) {
    return 'Both shoulders must be visible in the photo. Please use a photo showing your upper body.';
  } else if (errorMessage.includes('error_pose')) {
    return 'Please use a photo with a neutral pose and arms down by your sides.';
  } else if (errorMessage.includes('authentication')) {
    return 'API authentication failed. Please check your Perfect Corp credentials.';
  } else if (errorMessage.includes('file_id')) {
    return 'Image upload failed. Please try again with a different image.';
  }
  
  return errorMessage;
}