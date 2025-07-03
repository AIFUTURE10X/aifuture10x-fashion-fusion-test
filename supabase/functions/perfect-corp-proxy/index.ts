
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

console.log("Perfect Corp Proxy function loaded successfully");

serve(async (req) => {
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
      clothingImageType: requestData.clothingImage?.startsWith('http') ? 'URL' : 'base64'
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

    // Simulate processing time
    console.log('⏳ Simulating try-on processing...');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Create a proper mock result image - using a simple colored rectangle as JPEG base64
    const mockImageBase64 = createMockTryOnImage();
    
    console.log('✅ Mock try-on completed successfully');
    console.log('📊 Mock result image length:', mockImageBase64.length);

    const response = {
      success: true,
      result_img: mockImageBase64,
      processing_time: 4,
      message: "Mock try-on completed successfully"
    };

    console.log('📤 Sending successful response');
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

  } catch (error) {
    console.error('❌ Perfect Corp Proxy error:', error);
    console.error('🔥 Error stack:', error.stack);
    
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
});

// Create a proper mock try-on result image - a simple JPEG-like base64 image
function createMockTryOnImage(): string {
  // Create a simple 400x600 canvas with a gradient and text as base64 PNG
  const canvas = `
<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgb(255,182,193);stop-opacity:1" />
      <stop offset="50%" style="stop-color:rgb(135,206,250);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(144,238,144);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad1)" />
  
  <!-- Simulate a person silhouette -->
  <ellipse cx="200" cy="120" rx="60" ry="80" fill="rgba(255,255,255,0.3)" />
  <rect x="140" y="200" width="120" height="200" rx="20" fill="rgba(255,255,255,0.4)" />
  <rect x="160" y="400" width="80" height="150" rx="10" fill="rgba(255,255,255,0.3)" />
  
  <!-- Text overlay -->
  <text x="200" y="480" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" font-weight="bold">✨ Try-On Result ✨</text>
  <text x="200" y="510" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">Virtual clothing applied</text>
  <text x="200" y="535" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)" text-anchor="middle">Powered by AI</text>
</svg>`;
  
  // Convert SVG to base64 data URL
  const base64 = btoa(unescape(encodeURIComponent(canvas)));
  return `data:image/svg+xml;base64,${base64}`;
}
