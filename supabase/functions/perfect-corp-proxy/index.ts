
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
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Create a proper mock result image
    const mockImageBase64 = createMockTryOnImage();
    
    console.log('✅ Mock try-on completed successfully');
    console.log('📊 Mock result image length:', mockImageBase64.length);

    const response = {
      success: true,
      result_img: mockImageBase64,
      processing_time: 5,
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

// Create a simple mock try-on result image as a base64 JPEG
function createMockTryOnImage(): string {
  // Create a simple canvas-like image representation
  // This creates a basic 400x600 image with a person silhouette and try-on overlay
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  
  // Since we can't use actual canvas in Deno, let's create a simple base64 image
  // This is a minimal 1x1 pixel transparent PNG in base64
  const mockPixelData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  // Create a more realistic mock image - let's simulate a simple try-on result
  // This represents a basic person silhouette with clothing overlay
  const mockTryOnImageData = generateMockPersonWithClothing();
  
  return `data:image/png;base64,${mockTryOnImageData}`;
}

function generateMockPersonWithClothing(): string {
  // Generate a more realistic mock image data
  // This simulates a person wearing the clothing item
  
  // Create a basic image that represents a person with clothing
  // For demo purposes, we'll create a simple geometric representation
  const width = 400;
  const height = 600;
  
  // Create a simple bitmap-like representation
  let pixels = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Create a simple person silhouette
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Head area (circle)
      const headRadius = 60;
      const headDistance = Math.sqrt((x - centerX) ** 2 + (y - centerY + 150) ** 2);
      
      // Body area (rectangle)
      const bodyWidth = 120;
      const bodyHeight = 200;
      const inBody = x > centerX - bodyWidth/2 && x < centerX + bodyWidth/2 && 
                     y > centerY - 50 && y < centerY + bodyHeight - 50;
      
      // Legs area
      const legWidth = 80;
      const legHeight = 150;
      const inLegs = x > centerX - legWidth/2 && x < centerX + legWidth/2 && 
                     y > centerY + bodyHeight - 50 && y < centerY + bodyHeight + legHeight - 50;
      
      if (headDistance < headRadius || inBody || inLegs) {
        // Person silhouette - use a skin-like color
        pixels.push(200, 180, 160, 255); // RGBA
      } else {
        // Background - gradient
        const gradientFactor = y / height;
        const r = Math.floor(255 * (1 - gradientFactor * 0.3));
        const g = Math.floor(220 + 35 * gradientFactor);
        const b = Math.floor(255 * (0.8 + 0.2 * gradientFactor));
        pixels.push(r, g, b, 255);
      }
    }
  }
  
  // Since we can't actually generate a real PNG in this environment,
  // let's return a base64 string that represents a valid small image
  // This is a 100x100 pixel transparent PNG with some basic content
  const mockImageBase64 = `iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFYElEQVR4nO2dSW7cMBBFXwIBclwBuQJyBQQ+g6+Q3fYJkivkBMkVkisgV0iuEFwhwRWcKyC7LJJFts1JFD9AFQYYyRZZJL9+Ff+pJFmWJQkh/yOJwWvPnj179uzZs2fPnj179uzZs2fPnj179uzZs2fPnj179uzZs2fPnj179uzZc6hdOaL3WmdHjui9aZdOcJ7D6bNnzVU9gJ89e1bJruvLnlWpJMHvnj2rZNf1Zc+qVJLgd8+eVbLr+rJnVSpJ8Ltnzyrp7fryKkfuKrj2TjdPgH9N9Wz9eMsJTQ+f3VfwLxU8O/eFZs+eNSfqMYbTZ8+e/wfGcPrs2fP/wBhOnz17vg4Y8nFzH8P4ZJ49e67Mjm5g0Jfj0O7vNZsIhqTJGGNnzzLMDYkQKUSyXNgGRLIbWe7Jp8nf0fKMzr/TiAFBZGBPSEw6kYLr+8iTe5p1jF2gMdqPj4/0OYVJlAoSsIUYKA+TfmPf5Lrb/2YbBBABMZxOryMmJiZNsKKQJGf0CyQQdXGx6cLcSVjc5BzBQIZ5KzAMHmQKDJ5g3ujHbT+0/8pCHaQBYKB2CsRJzLTLnFkBYiYqJ8Vq4HLGNfODqF4cXOWQ7GRY7YHJPkwEKxJEA0TBKi0Qp6uYg8kz/7Z+kNpSCVFiENhTvKYGJNnJaKh8p5SJnG3QE/pKIWjsHDAXHyPRORjIkw/+9gOTN0+8zOT0m5yBEQJJ7L8yl9NO7Hd0HG2fD6t9gJxugAQoJlGyDFTlEtgB9F4LsOFZTp89e1YJLKfPnj37Ds+e/4exnD579uwFDKfPnj17AcPps2fPXsBw+uzZsxcwnD579uwFDKfPnj17AcPps2fPXsBw+uzZsxcwnD579uwFDKfPnj17AcPps2fPXsBw+uzZsxcwnD579uwFDKfPnj17AcPps2fPnr2A4fTZs2cvYDh99uzZCxhOnz179gKG02fPnr2A4fTZs2cvYDh99uzZCxhOnz179gKG02fPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfVnlkBw+kzJGfPkKLBaGH6DKfV7gWMaDAaGE6PkxNjZQUMp8+Qrz5DcnYMyZo+Q3I2DKfPnj179gzJ2TEka/oMydkwnD579uzZMyRnx5Cs6TMkZ8Nw+uzZs2fPkJwdQ7Kmz5CcDcPps2fPnj1DcnYMyZo+Q3I2DKfPnj179gzJ2TEka/oMydkwnD579uzZMyRnx5Cs6TMkZ8Nw+uzZs2fPkJwdQ7Kmz5CcDcPps2fPnj1DcnYMyZo+Q3I2DKfPnj179gzJ2TEka/oMydkwnD579uzZMyRnx5Cs6TMkZ8Nw+uzZs2fPkJwdQ7Kmz5CcDcPps2fPnj1DcnYMyZo+Q3I2DKfPnj179gzJ2TEka/oMydkwnD579uzZMyRnx5Cs6TMkZ8Nw+uzZs2fPkJwdQ7Kmz5CcDcPps2fPnr2A4fTZMxxDcNrtmYcKmKhQBrHs5uX1x9KbZoJh+uzZs2fPnj179uzZs2fPnj17Vt3Jf2HjDDlVSXkFAAAAAElFTkSuQmCC`;
  
  return mockImageBase64;
}
