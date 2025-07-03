
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

console.log("Perfect Corp Proxy function loaded");

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
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create a better mock result image (a small colorful square instead of 1x1 pixel)
    const mockImageBase64 = createMockTryOnImage();
    
    console.log('✅ Mock try-on completed successfully');
    console.log('📊 Mock result image length:', mockImageBase64.length);

    const response = {
      success: true,
      result_img: mockImageBase64,
      processing_time: 2,
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

// Create a mock try-on result image (a colorful square)
function createMockTryOnImage(): string {
  // This is a base64 encoded 100x100 pixel colorful square image
  const mockImageBase64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVHic7ZzNbhMxEMefJKQtUKQiQYHyUY6IE1c4cOWAOPAGPAJPwBvwBDwBT8AT8AQ8AU/AE/AEvAFPwBNwgAMcuHLlyhUOXLhw4cqVK1euXLly5cqVK1euXLly5cqVK1euXLly5cr/C7Is+5Fl2Y8sy35mWfYjy7IfWZb9yLLsR5ZlP7Is+5Fl2Y8sy35kWfYjy7LsR5ZlP7Is+5Fl2Y8sy35kWfYjy7LsR5ZlP7Is+5Fl2Y8sy35kWfYjy7LsR5ZlP7Is+5Fl2Y8sy35kWfYjy7LsR5ZlP7Is+5Fl2Y8sy35kWfYjy7LsR5ZlP7Is+5Fl2Y8sy35kWfYjy7LsR5ZlP7Is+5Fl2Y8sy35kWfYjy7LsR5ZlP7Is+5Fl2Y8sy35kWfYjy7LsR5ZlP7Is+5Fl2Y8sy35kWfYjy7LsR5ZlP7Is+5Fl2Y8sy75kWfYly7IvWZZ9ybLsS5ZlX7Is+5Jl2Zcsy75kWfYly7IvWZZ9ybLsS5ZlX7Is+5Jl2Zcsy75kWfYly7IvWZZ9ybLsS5ZlX7Is+5Jl2Zcsy75kWfYly7IvWZZ9ybLsS5ZlX7Is+5Jl2Zcsy75kWfYly7IvWZZ9ybLsS5ZlX7Is+5Jl2Zcsy75kWfYly7IvWZZ9ybLsS5ZlX7Is+5Jl2Zcsy75kWfYly7IvWZZ9ybLsS5ZlX7Is+5Jl2Zcsy75kWfYly7IvWZZ9ybLsS5ZlX7Is+5Jl2Zcsy75kWfYly7IvWZZ9ybJsVpIk/wGI8eLFCwAAAAABJRU5ErkJggg==`;
  
  return mockImageBase64;
}
