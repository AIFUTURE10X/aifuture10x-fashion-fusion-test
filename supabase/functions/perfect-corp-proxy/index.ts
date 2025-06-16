
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

// Import supabase-js for edge functions
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
    
    // Get API key from environment variables - using the new key
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

    console.log('Perfect Corp proxy request:', {
      category: clothingCategory,
      userPhotoStoragePath,
      userPhotoLength: userPhoto?.length,
      clothingImageLength: clothingImage.length
    })

    // --- Fetch the user photo as base64 ---
    let userPhotoBase64: string | null = null

    if (userPhotoStoragePath) {
      // Use Supabase client with admin secret to download the file instantly
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      // .from(bucket).download(path)
      const { data, error } = await supabase.storage.from('fashionfusion').download(userPhotoStoragePath)
      if (error || !data) {
        throw new Error(`Failed to fetch image from storage: ${error?.message || 'No data'}`)
      }
      // Read blob and convert to base64
      const arrayBuffer = await data.arrayBuffer()
      const base64 = arrayBufferToBase64(arrayBuffer)
      userPhotoBase64 = base64
      console.log('Fetched user photo from Supabase Storage and converted to base64 (length: ' + base64.length + ')')
    } else if (userPhoto) {
      // Fallback/legacy behaviour: fetch from public URL
      userPhotoBase64 = await imageUrlToBase64(userPhoto)
      console.log('Fetched user photo from public URL as fallback.')
    } else {
      throw new Error('Neither userPhotoStoragePath nor userPhoto public url provided.')
    }

    // Clothing image: always fetch from public url
    const clothingImageBase64 = await imageUrlToBase64(clothingImage)

    const requestBody = {
      person_img: userPhotoBase64,
      clothes_img: clothingImageBase64,
      clothes_type: mapCategoryToClothesType(clothingCategory)
    }

    console.log('Making request to Perfect Corp API...')
    // Updated API endpoint - using the correct Perfect Corp API URL
    const response = await fetch('https://api.perfectcorp.com/v1/virtual-tryon', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('Perfect Corp API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Perfect Corp API error:', errorText)
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Perfect Corp API success, result keys:', Object.keys(data))

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Perfect Corp proxy error:', error)
    
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
