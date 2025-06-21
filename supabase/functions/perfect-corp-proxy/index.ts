
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0"

interface TryOnRequest {
  userPhoto?: string; // legacy: public URL
  userPhotoStoragePath?: string; // new: storage path
  clothingImage: string; // This will be either style_id OR ref_id
  clothingCategory: string;
  isCustomClothing?: boolean; // new: indicates if using custom clothing
  perfectCorpRefId?: string; // new: Perfect Corp reference ID
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      userPhoto, 
      userPhotoStoragePath, 
      clothingImage, 
      clothingCategory,
      isCustomClothing,
      perfectCorpRefId
    }: TryOnRequest = await req.json()
    
    // Get Perfect Corp API credentials from environment variables
    const apiKey = Deno.env.get('PERFECTCORP_API_KEY')
    const apiSecret = Deno.env.get('PERFECTCORP_API_SECRET')
    
    if (!apiKey || !apiSecret) {
      throw new Error('Perfect Corp API credentials not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key missing in edge function env')
    }

    console.log('Perfect Corp clothes try-on request:', {
      category: clothingCategory,
      userPhotoStoragePath,
      userPhotoLength: userPhoto?.length,
      isCustomClothing,
      perfectCorpRefId,
      styleId: isCustomClothing ? undefined : clothingImage
    })

    // Step 1: Generate id_token with proper structure for Perfect Corp
    console.log('Step 1: Generating id_token and authenticating...')
    const timestamp = Date.now()
    
    // Create a properly structured JWT-like payload
    const payload = {
      iss: apiKey,
      aud: 'https://yce-api-01.perfectcorp.com',
      iat: Math.floor(timestamp / 1000),
      exp: Math.floor(timestamp / 1000) + 3600, // 1 hour expiry
      client_id: apiKey
    }
    
    // For now, we'll use a simplified approach since we don't have RSA private key
    // In production, this should be properly signed with RSA private key
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    const payloadEncoded = btoa(JSON.stringify(payload))
    const idToken = `${header}.${payloadEncoded}.signature_placeholder`
    
    console.log('Using simplified authentication approach')
    
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
      
      // Try alternative authentication method with client_secret
      console.log('Trying alternative authentication with client_secret...')
      
      const altAuthResponse = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/client/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: apiKey,
          client_secret: apiSecret,
          grant_type: 'client_credentials'
        }),
      })

      if (!altAuthResponse.ok) {
        const altAuthError = await altAuthResponse.text()
        console.error('Alternative authentication also failed:', altAuthError)
        throw new Error(`Authentication failed: ${authResponse.status} - ${authError}`)
      }

      const altAuthData = await altAuthResponse.json()
      const accessToken = altAuthData.result?.access_token || altAuthData.access_token

      if (!accessToken) {
        console.error('Alt auth response:', altAuthData)
        throw new Error('No access token received from alternative authentication')
      }

      console.log('Alternative authentication successful')

      // Continue with the rest of the process using the access token
      return await processWithAccessToken(accessToken, {
        userPhoto,
        userPhotoStoragePath,
        clothingImage,
        clothingCategory,
        isCustomClothing,
        perfectCorpRefId,
        supabaseUrl,
        supabaseServiceKey
      })
    }

    const authData = await authResponse.json()
    const accessToken = authData.result?.access_token || authData.access_token

    if (!accessToken) {
      console.error('Auth response:', authData)
      throw new Error('No access token received from authentication')
    }

    console.log('Authentication successful')

    return await processWithAccessToken(accessToken, {
      userPhoto,
      userPhotoStoragePath,
      clothingImage,
      clothingCategory,
      isCustomClothing,
      perfectCorpRefId,
      supabaseUrl,
      supabaseServiceKey
    })

  } catch (error) {
    console.error('Virtual try-on error:', error)
    
    // Handle specific Perfect Corp error codes
    let errorMessage = error.message || 'Unknown error occurred'
    
    if (errorMessage.includes('exceed_max_filesize')) {
      errorMessage = 'Image file size exceeds the maximum limit (10MB)'
    } else if (errorMessage.includes('error_no_face')) {
      errorMessage = 'No face detected in the uploaded image'
    } else if (errorMessage.includes('error_multiple_people')) {
      errorMessage = 'Multiple people detected in the image. Please use a photo with only one person'
    } else if (errorMessage.includes('error_no_shoulder')) {
      errorMessage = 'Shoulders are not visible in the image. Please use a full-body photo'
    } else if (errorMessage.includes('error_large_face_angle')) {
      errorMessage = 'The face angle in the image is too large. Please use a front-facing photo'
    } else if (errorMessage.includes('invalid_parameter')) {
      errorMessage = 'Invalid parameter provided to the API'
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function processWithAccessToken(accessToken: string, params: any): Promise<Response> {
  const {
    userPhoto,
    userPhotoStoragePath,
    clothingImage,
    clothingCategory,
    isCustomClothing,
    perfectCorpRefId,
    supabaseUrl,
    supabaseServiceKey
  } = params

  // Step 2: Get user photo data
  let userPhotoData: ArrayBuffer
  
  if (userPhotoStoragePath) {
    // Use Supabase client with admin secret to get a signed URL
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data } = await supabase.storage.from('fashionfusion').createSignedUrl(userPhotoStoragePath, 3600)
    if (data?.signedUrl) {
      const photoResponse = await fetch(data.signedUrl)
      userPhotoData = await photoResponse.arrayBuffer()
      console.log('Fetched user photo from Supabase Storage')
    } else {
      throw new Error('Failed to generate signed URL for user photo')
    }
  } else if (userPhoto) {
    // Fallback: use public URL directly
    const photoResponse = await fetch(userPhoto)
    userPhotoData = await photoResponse.arrayBuffer()
    console.log('Fetched user photo from public URL')
  } else {
    throw new Error('Neither userPhotoStoragePath nor userPhoto public url provided.')
  }

  // Step 3: Upload user photo to Perfect Corp
  console.log('Step 2: Uploading user photo...')
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
          file_name: 'user_photo.jpg'
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
    body: userPhotoData,
  })

  if (!imageUploadResponse.ok) {
    throw new Error(`Image upload failed: ${imageUploadResponse.status}`)
  }

  console.log('User photo uploaded successfully, file_id:', fileId)

  // Step 4: Run clothes try-on task
  console.log('Step 3: Running clothes try-on task...')
  
  // Build request body based on clothing type
  let tryOnRequestBody: any = {
    file_id: fileId
  }

  if (isCustomClothing && perfectCorpRefId) {
    // Use ref_ids for custom clothing
    tryOnRequestBody.ref_ids = [perfectCorpRefId]
    console.log('Using custom clothing with ref_id:', perfectCorpRefId)
  } else {
    // Use style_id for predefined styles
    tryOnRequestBody.style_id = clothingImage
    console.log('Using predefined style with style_id:', clothingImage)
  }
  
  const tryOnResponse = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/task/clothes-tryon', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tryOnRequestBody),
  })

  if (!tryOnResponse.ok) {
    const tryOnError = await tryOnResponse.text()
    console.error('Perfect Corp try-on task failed:', tryOnError)
    throw new Error(`Try-on task failed: ${tryOnResponse.status} - ${tryOnError}`)
  }

  const tryOnData = await tryOnResponse.json()
  const tryOnResult = tryOnData.result || tryOnData
  const taskId = tryOnResult.task_id

  console.log('Try-on task started, task_id:', taskId)

  // Step 5: Poll for task completion
  console.log('Step 4: Polling for task completion...')
  let result
  let attempts = 0
  const maxAttempts = 30 // 30 seconds timeout
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    
    const statusResponse = await fetch(`https://yce-api-01.perfectcorp.com/s2s/v1.0/task/clothes-tryon?task_id=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`)
    }

    const statusData = await statusResponse.json()
    const statusResult = statusData.result || statusData
    
    if (statusResult.status === 'success') {
      result = statusResult
      break
    } else if (statusResult.status === 'failed') {
      throw new Error(`Try-on task failed: ${statusResult.error || 'Unknown error'}`)
    }
    
    attempts++
    console.log(`Polling attempt ${attempts}, status: ${statusResult.status}`)
  }

  if (!result) {
    throw new Error('Try-on task timed out')
  }

  // Step 6: Download and convert result image
  console.log('Step 5: Downloading result image...')
  const resultImageUrl = result.output_url
  const resultImageResponse = await fetch(resultImageUrl)
  
  if (!resultImageResponse.ok) {
    throw new Error(`Failed to download result image: ${resultImageResponse.status}`)
  }

  const resultImageData = await resultImageResponse.arrayBuffer()
  const resultImageBase64 = arrayBufferToBase64(resultImageData)

  console.log('Clothes try-on completed successfully')

  return new Response(JSON.stringify({
    success: true,
    result_img: resultImageBase64,
    processing_time: result.processing_time || null,
    message: isCustomClothing 
      ? "Virtual try-on completed successfully using your custom clothing"
      : "Virtual try-on completed successfully using Perfect Corp AI"
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Safe function for large ArrayBuffers
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
