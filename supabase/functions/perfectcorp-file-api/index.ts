
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { authenticateWithPerfectCorp } from '../perfect-corp-proxy/auth.ts'

console.log('Perfect Corp File API function loaded')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Perfect Corp File API request received')

    // Initialize Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Perfect Corp API credentials from environment
    const apiKey = Deno.env.get('PERFECTCORP_API_KEY')
    const apiSecret = Deno.env.get('PERFECTCORP_API_SECRET')

    if (!apiKey || !apiSecret) {
      throw new Error('Perfect Corp API credentials not configured. Please set PERFECTCORP_API_KEY and PERFECTCORP_API_SECRET in Supabase secrets.')
    }

    // Parse request body
    const requestData = await req.json()
    const { fileName = 'clothing_image.jpg', contentType = 'image/jpeg' } = requestData
    
    console.log('File API request:', { fileName, contentType })

    // Step 1: Authenticate with Perfect Corp
    const authResult = await authenticateWithPerfectCorp(apiKey, apiSecret, supabase)
    console.log('Perfect Corp authentication completed')

    // Step 2: Call Perfect Corp File API to get upload URL
    const fileApiUrl = 'https://api.perfectcorp.com/s2s/v1.0/file'
    
    const fileApiResponse = await fetch(fileApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authResult.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        files: [
          {
            content_type: contentType,
            file_name: fileName
          }
        ]
      }),
    })

    console.log(`File API response status: ${fileApiResponse.status}`)

    if (!fileApiResponse.ok) {
      const errorText = await fileApiResponse.text()
      console.error('File API request failed:', fileApiResponse.status, errorText)
      throw new Error(`File API request failed: ${fileApiResponse.status} - ${errorText}`)
    }

    const fileApiData = await fileApiResponse.json()
    console.log('File API response data:', fileApiData)
    
    const uploadResult = fileApiData.result || fileApiData
    const uploadInfo = uploadResult.files?.[0]
    
    if (!uploadInfo?.url || !uploadInfo?.file_id) {
      console.error('Missing upload URL or file_id:', fileApiData)
      throw new Error('No upload URL or file_id received from Perfect Corp File API')
    }

    console.log('File API success:', { 
      fileId: uploadInfo.file_id, 
      uploadUrlLength: uploadInfo.url.length 
    })
    
    return new Response(JSON.stringify({
      success: true,
      fileId: uploadInfo.file_id,
      uploadUrl: uploadInfo.url,
      message: 'Perfect Corp upload URL generated successfully'
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    })

  } catch (error) {
    console.error('Perfect Corp File API error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }), 
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})
