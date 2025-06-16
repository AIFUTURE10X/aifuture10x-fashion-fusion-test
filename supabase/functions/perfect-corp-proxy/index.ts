
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0"

interface TryOnRequest {
  userPhoto?: string; // legacy: public URL
  userPhotoStoragePath?: string; // new: storage path
  clothingImage: string;
  clothingCategory: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userPhoto, userPhotoStoragePath, clothingImage, clothingCategory }: TryOnRequest = await req.json()
    
    // Get Perfect Corp API key from environment variables
    const apiKey = Deno.env.get('PERFECTCORP_API_KEY_NEW')
    if (!apiKey) {
      throw new Error('Perfect Corp API key not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key missing in edge function env')
    }

    // Just for safety, do not allow empty clothing image
    if (!clothingImage) throw new Error('clothingImage is required')

    console.log('Perfect Corp virtual try-on request:', {
      category: clothingCategory,
      userPhotoStoragePath,
      userPhotoLength: userPhoto?.length,
      clothingImageLength: clothingImage.length
    })

    // --- Fetch the user photo as base64 ---
    let userPhotoUrl: string | null = null

    if (userPhotoStoragePath) {
      // Use Supabase client with admin secret to get a signed URL
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data } = await supabase.storage.from('fashionfusion').createSignedUrl(userPhotoStoragePath, 3600)
      if (data?.signedUrl) {
        userPhotoUrl = data.signedUrl
        console.log('Generated signed URL for user photo from Supabase Storage')
      } else {
        throw new Error('Failed to generate signed URL for user photo')
      }
    } else if (userPhoto) {
      // Fallback/legacy behaviour: use public URL directly
      userPhotoUrl = userPhoto
      console.log('Using user photo public URL as fallback.')
    } else {
      throw new Error('Neither userPhotoStoragePath nor userPhoto public url provided.')
    }

    console.log('API Key configured, starting virtual try-on...')

    // Use Perfect Corp's correct API endpoint and format
    // Note: Perfect Corp's actual API endpoint might be different
    // Let's try their documented endpoint format
    const perfectCorpResponse = await fetch('https://api.perfectcorp.com/api/v2/virtual-try-on', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        person_image_url: userPhotoUrl,
        garment_image_url: clothingImage,
        category: mapCategoryToApiFormat(clothingCategory),
        options: {
          quality: 'high',
          background_removal: true,
          pose_preservation: true
        }
      }),
    })

    if (!perfectCorpResponse.ok) {
      const errorData = await perfectCorpResponse.text()
      console.error('Perfect Corp API error:', errorData)
      
      // If the v2 endpoint fails, try the v1 endpoint with different format
      console.log('Trying v1 endpoint as fallback...')
      const fallbackResponse = await fetch('https://api.perfectcorp.com/v1/virtual-tryon', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_image: userPhotoUrl,
          garment_image: clothingImage,
          garment_type: mapCategoryToApiFormat(clothingCategory)
        }),
      })

      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text()
        console.error('Perfect Corp fallback API error:', fallbackError)
        throw new Error(`Perfect Corp API request failed: ${perfectCorpResponse.status} - ${errorData}`)
      }

      const fallbackResult = await fallbackResponse.json()
      console.log('Perfect Corp fallback response received:', fallbackResult.status || 'unknown status')

      if (fallbackResult.success && fallbackResult.result_image) {
        let resultImageBase64: string
        if (fallbackResult.result_image.startsWith('http')) {
          resultImageBase64 = await imageUrlToBase64(fallbackResult.result_image)
        } else {
          resultImageBase64 = fallbackResult.result_image
        }

        return new Response(JSON.stringify({
          success: true,
          result_img: resultImageBase64,
          processing_time: fallbackResult.processing_time || null,
          message: "Virtual try-on completed successfully using Perfect Corp AI"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        throw new Error(`Virtual try-on failed: ${fallbackResult.error || fallbackResult.message || 'Unknown error'}`)
      }
    }

    const result = await perfectCorpResponse.json()
    console.log('Perfect Corp response received:', result.status || 'unknown status')

    // Handle Perfect Corp's response format
    if (result.success && result.result_image) {
      // Convert result image to base64 if it's a URL
      let resultImageBase64: string
      if (result.result_image.startsWith('http')) {
        resultImageBase64 = await imageUrlToBase64(result.result_image)
      } else {
        // Assume it's already base64
        resultImageBase64 = result.result_image
      }

      const response = {
        success: true,
        result_img: resultImageBase64,
        processing_time: result.processing_time || null,
        message: "Virtual try-on completed successfully using Perfect Corp AI"
      }

      console.log('Virtual try-on completed successfully')

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      throw new Error(`Virtual try-on failed: ${result.error || result.message || 'Unknown error'}`)
    }

  } catch (error) {
    console.error('Virtual try-on error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
});

// Utility to fetch any public URL and convert to base64
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)
    return base64
  } catch (error) {
    throw new Error(`Image conversion failed: ${error.message}`)
  }
}

// New safe function for large ArrayBuffers!
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000; // 32KB per chunk is safe
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunkSize) as any
    );
  }
  return btoa(binary);
}

function mapCategoryToApiFormat(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'tops': 'top',
    'dresses': 'dress', 
    'outerwear': 'jacket',
    'bottoms': 'bottom',
    'shoes': 'shoes'
  }
  return categoryMap[category.toLowerCase()] || 'top'
}
