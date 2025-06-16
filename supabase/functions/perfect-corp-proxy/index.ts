
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
      clothingImageLength: clothingImage.length
    })

    // Step 1: Authenticate with Perfect Corp API
    console.log('Step 1: Authenticating with Perfect Corp API...')
    const authResponse = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/client/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        id_token: generateIdToken(apiKey, apiSecret)
      }),
    })

    if (!authResponse.ok) {
      const authError = await authResponse.text()
      console.error('Perfect Corp authentication failed:', authError)
      throw new Error(`Authentication failed: ${authResponse.status} - ${authError}`)
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    if (!accessToken) {
      throw new Error('No access token received from authentication')
    }

    console.log('Authentication successful')

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
    const uploadUrl = uploadData.files[0].upload_url
    const fileId = uploadData.files[0].file_id

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
    const tryOnResponse = await fetch('https://yce-api-01.perfectcorp.com/s2s/v1.0/task/clothes-tryon', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileId,
        style_id: clothingImage, // Assuming clothingImage is the style/outfit ID
        // You might need additional parameters based on the actual API requirements
      }),
    })

    if (!tryOnResponse.ok) {
      const tryOnError = await tryOnResponse.text()
      console.error('Perfect Corp try-on task failed:', tryOnError)
      throw new Error(`Try-on task failed: ${tryOnResponse.status} - ${tryOnError}`)
    }

    const tryOnData = await tryOnResponse.json()
    const taskId = tryOnData.task_id

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
      
      if (statusData.status === 'success') {
        result = statusData
        break
      } else if (statusData.status === 'failed') {
        throw new Error(`Try-on task failed: ${statusData.error || 'Unknown error'}`)
      }
      
      attempts++
      console.log(`Polling attempt ${attempts}, status: ${statusData.status}`)
    }

    if (!result) {
      throw new Error('Try-on task timed out')
    }

    // Step 6: Download and convert result image
    console.log('Step 5: Downloading result image...')
    const resultImageUrl = result.download_url
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
      message: "Virtual try-on completed successfully using Perfect Corp AI"
    }), {
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

// Generate ID token for authentication (this is a simplified version)
function generateIdToken(apiKey: string, apiSecret: string): string {
  // In a real implementation, you would generate a proper JWT token
  // For now, we'll use a simple base64 encoding of the secret
  return btoa(`${apiKey}:${apiSecret}`)
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
