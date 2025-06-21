
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0"

interface ReferenceUploadRequest {
  imageUrl: string;
  garmentCategory: string;
  clothingName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, garmentCategory, clothingName }: ReferenceUploadRequest = await req.json()
    
    // Get Perfect Corp API credentials from environment variables
    const apiKey = Deno.env.get('PERFECTCORP_API_KEY')
    const apiSecret = Deno.env.get('PERFECTCORP_API_SECRET')
    
    if (!apiKey || !apiSecret) {
      throw new Error('Perfect Corp API credentials not configured')
    }

    console.log('Perfect Corp reference upload request:', {
      garmentCategory,
      clothingName,
      imageUrlLength: imageUrl?.length
    })

    // Step 1: Generate id_token and authenticate with Perfect Corp API
    console.log('Step 1: Generating id_token and authenticating...')
    const timestamp = Date.now()
    const idTokenData = `client_id=${apiKey}&timestamp=${timestamp}`
    
    // For now, use base64 encoding as a placeholder for RSA encryption
    // In production, you should implement proper RSA X.509 encryption
    const idToken = btoa(idTokenData)
    
    const authResponse = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/client/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        id_token: idToken
      }),
    })

    if (!authResponse.ok) {
      const authError = await authResponse.text()
      console.error('Perfect Corp authentication failed:', authError)
      throw new Error(`Authentication failed: ${authResponse.status} - ${authError}`)
    }

    const authData = await authResponse.json()
    const accessToken = authData.result?.access_token || authData.access_token

    if (!accessToken) {
      console.error('Auth response:', authData)
      throw new Error('No access token received from authentication')
    }

    console.log('Authentication successful')

    // Step 2: Get reference image data
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }
    const imageData = await imageResponse.arrayBuffer()

    // Step 3: Upload reference image to Perfect Corp
    console.log('Step 2: Uploading reference image...')
    const uploadResponse = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/file/clothes-tryon', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: [
          {
            content_type: 'image/jpeg',
            file_name: `${clothingName.replace(/\s+/g, '_')}.jpg`
          }
        ]
      }),
    })

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text()
      console.error('Perfect Corp upload request failed:', uploadError)
      throw new Error(`Upload request failed: ${uploadResponse.status} - ${uploadError}`)
    }

    const uploadData = await uploadResponse.json()
    const uploadResult = uploadData.result || uploadData
    const uploadUrl = uploadResult.files[0].url
    const fileId = uploadResult.files[0].file_id

    // Upload the actual image data
    const imageUploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: imageData,
    })

    if (!imageUploadResponse.ok) {
      throw new Error(`Image upload failed: ${imageUploadResponse.status}`)
    }

    console.log('Reference image uploaded successfully, file_id:', fileId)

    // Step 4: Create reference for clothing try-on
    console.log('Step 3: Creating clothing reference...')
    const refResponse = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/reference/clothes-tryon', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileId,
        garment_category: garmentCategory,
        name: clothingName
      }),
    })

    if (!refResponse.ok) {
      const refError = await refResponse.text()
      console.error('Perfect Corp reference creation failed:', refError)
      throw new Error(`Reference creation failed: ${refResponse.status} - ${refError}`)
    }

    const refData = await refResponse.json()
    const refResult = refData.result || refData
    const refId = refResult.ref_id

    console.log('Reference created successfully, ref_id:', refId)

    return new Response(JSON.stringify({
      success: true,
      file_id: fileId,
      ref_id: refId,
      message: "Reference image uploaded and processed successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Reference upload error:', error)
    
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
