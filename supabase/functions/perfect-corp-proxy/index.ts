
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
    
    // Get Replicate API key from environment variables
    const apiKey = Deno.env.get('REPLICATE_API_KEY')
    if (!apiKey) {
      throw new Error('Replicate API key not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key missing in edge function env')
    }

    // Just for safety, do not allow empty clothing image
    if (!clothingImage) throw new Error('clothingImage is required')

    console.log('Replicate virtual try-on request:', {
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

    // Use Replicate's OOTDiffusion model (a working virtual try-on model)
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "951545c864e4b67bd4439d1fe85ed523c2d9521c1ad5581c92b1de9b5c21a8bb", // OOTDiffusion model
        input: {
          model_type: "hd",
          garm_img: clothingImage,
          human_img: userPhotoUrl,
          garment_des: `A ${clothingCategory} for virtual try-on`,
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 20,
          seed: 42
        }
      }),
    })

    if (!replicateResponse.ok) {
      const errorData = await replicateResponse.text()
      console.error('Replicate API error:', errorData)
      throw new Error(`Replicate API request failed: ${replicateResponse.status} - ${errorData}`)
    }

    const prediction = await replicateResponse.json()
    console.log('Replicate prediction created:', prediction.id)

    // Poll for completion
    let result = prediction
    let attempts = 0
    const maxAttempts = 60 // Wait up to 60 seconds

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${apiKey}`,
        },
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to check prediction status: ${statusResponse.status}`)
      }

      result = await statusResponse.json()
      attempts++
      console.log(`Prediction status: ${result.status} (attempt ${attempts})`)
    }

    if (result.status === 'failed') {
      throw new Error(`Virtual try-on failed: ${result.error || 'Unknown error'}`)
    }

    if (result.status !== 'succeeded') {
      throw new Error('Virtual try-on timed out')
    }

    // Convert result image to base64
    let resultImageBase64: string
    if (result.output && result.output.length > 0) {
      const imageUrl = result.output[0] // Replicate returns array of URLs
      resultImageBase64 = await imageUrlToBase64(imageUrl)
    } else {
      throw new Error('No output image received from virtual try-on')
    }

    const response = {
      success: true,
      result_img: resultImageBase64,
      processing_time: (Date.now() - new Date(result.created_at).getTime()) / 1000,
      message: "Virtual try-on completed successfully using Replicate AI"
    }

    console.log('Virtual try-on completed successfully')

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

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

function mapCategoryToClothesType(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'tops': 'upper_body',
    'dresses': 'dresses',
    'outerwear': 'upper_body',
    'bottoms': 'lower_body',
    'shoes': 'shoes'
  }
  return categoryMap[category.toLowerCase()] || 'upper_body'
}
