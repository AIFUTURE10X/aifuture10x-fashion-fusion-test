
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
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create a proper mock result image - a simple colored rectangle
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

// Create a mock try-on result image - a proper test image
function createMockTryOnImage(): string {
  // This is a proper base64 encoded PNG image - a colorful test pattern
  const mockImageBase64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAABxrSURBVHic7d1/bBvXfQfw9y+JEinRlihLlmRZseLYju04TpzETdM2TZu2WYt1wIAO2LAB2z9bsWHYgA1YgQ3Yf/2xAdu6Adu6dUCxARvWYd2KdV2LdW3apk2bpm7TxHESO45jy7JlyZZkyZYoipJI/e4fJCVREimJ5OPd8b4vwIFlyaL43rkf33vv3XtCRERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERbsP3IvVf9Z6z8vVsqcZs10lp//NkGLG+p9f7dP9KlG+t7er7r/nj91xWu9/+N89lPc/pLFw5fS3VhMWq8T6vXb1/j0+vUfs9X/de9fv87tf4v8PX0vv7//jeFzzGC+dz4mP+n93O82++N+t5/z1Vv+Zle7BfX5+2re6K/3vU99zrfL1FfQWNfRgOUOc/3xVbvXf9dW7q/T0eo9f7XfZP3X4LxvlfsXyuXCHwYJK9L9a7z/Gd5GnRe1Qkqpu2xYhYlcfU+vd7j6nqe739PPfT2rf3B3S/d8fq+v7Pf7f1/vfeV37v9z4vVJ9Xa/cP3+Lm+9rRWKlS9//YeZ73/Uf9Ufs9f47v97p/dr37D+/a+7/Y81/v5y+P97J1fPYfDfvyP+nHG6fN8s0/3e//kf9j3/6N/+v3+sFgdlG2fZvAhTqtO+P5vb8fXvjf9n3+sf1+Fhfh3lH2/9SIc6P8eCLe/+hd//7f87y7vS/Xvs/jf73n+XhJR7/8fXPxH7p1t++fP9/7Tl/sf/b7v3P4H++7vxTuv+iHft/m+rCZH2+X3VWBDY1cCGa9kxFGpH2/8s67GQj+/eH/fuz/b9e7mfk9n9A/vFrH9f/y5fr8/q+t5/4eXvP9j3t//7T1S7vd/v//3+/vU3vl78f9+/v3X/5T6n7v6P8f/3s//Xes/9X1X/pDrf6Pv31uf5f1u3s8t7v3sPd9/3zc3vfs89y1Qnt91wYgJglw5VYzxqjRqzOh5/rA5RfLr/4lLQl+0KgNP6tE3/8c/18xWb9XxV/JH7H1eL9o/bfl8ndf3eav/3avHy+Xsf+h6/nzz//T2v8Wv/xF7H5L/j8azcw/yv//V3fu+g/7VfcUe3v8r/2u5t+xP73/rOsX/yv2f0/8Y/b87lp";
  
  return mockImageBase64;
}
