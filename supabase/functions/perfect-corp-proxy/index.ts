
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
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Create a proper mock result image (using a real base64 image)
    const mockImageBase64 = createMockTryOnImage();
    
    console.log('✅ Mock try-on completed successfully');
    console.log('📊 Mock result image length:', mockImageBase64.length);

    const response = {
      success: true,
      result_img: mockImageBase64,
      processing_time: 8,
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

// Create a simple mock try-on result image as a base64 data URL
function createMockTryOnImage(): string {
  // This is a valid 1x1 pixel transparent PNG encoded as base64
  // We'll create a slightly larger mock image for better visibility
  
  // A simple 400x600 colored rectangle as a mock try-on result
  // This is a valid PNG image encoded in base64
  const mockPngBase64 = `iVBORw0KGgoAAAANSUhEUgAAAZAAAAJYCAYAAAB5k1hGAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKQElEQVR4nO3dQW7jMAwF0HS6qO5/5e6iXQQoAhiCLVI/7yVAF3ESS/6PpOTa7/f7BQD85b91AwA4kwABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAkAkQACIBAgAkQABIBIgAEQCBIBIgAAQCRAAIgECQCRAAIgECACRAAEgEiAARAIEgEiAABAJEAAiAQJAJEAAiAQIAJEAASASIABEAgSASIAAEAkQACIBAr/7B+5xRqGf8rUoAAAAAElFTkSuQmCC`;
  
  return `data:image/png;base64,${mockPngBase64}`;
}
