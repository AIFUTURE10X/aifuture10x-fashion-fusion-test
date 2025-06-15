
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface TryOnRequest {
  userPhoto: string;
  clothingImage: string;
  clothingCategory: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userPhoto, clothingImage, clothingCategory }: TryOnRequest = await req.json()
    
    // Get API key from environment variables
    const apiKey = Deno.env.get('PERFECTCORP_API_KEY')
    if (!apiKey) {
      throw new Error('Perfect Corp API key not configured')
    }

    console.log('Perfect Corp proxy request:', {
      category: clothingCategory,
      userPhotoLength: userPhoto.length,
      clothingImageLength: clothingImage.length
    })

    // Convert image URLs to base64
    const userPhotoBase64 = await imageUrlToBase64(userPhoto)
    const clothingImageBase64 = await imageUrlToBase64(clothingImage)

    const requestBody = {
      person_img: userPhotoBase64,
      clothes_img: clothingImageBase64,
      clothes_type: mapCategoryToClothesType(clothingCategory)
    }

    console.log('Making request to Perfect Corp API...')
    
    const response = await fetch('https://yce.perfectcorp.com/ai-clothes/virtual-tryon', {
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
})

async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    return base64
  } catch (error) {
    throw new Error(`Image conversion failed: ${error.message}`)
  }
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
