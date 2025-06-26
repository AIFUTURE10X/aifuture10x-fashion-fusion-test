
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { authenticateWithPerfectCorp } from './auth.ts'
import { processTryOnRequest } from './processor.ts'

console.log('Perfect Corp Proxy function loaded')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Perfect Corp S2S virtual try-on request received')

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
    
    console.log('Perfect Corp S2S virtual try-on request:', {
      category: requestData.clothingCategory,
      userPhotoStoragePath: requestData.userPhotoStoragePath,
      userPhotoLength: requestData.userPhoto?.length,
      isCustomClothing: requestData.isCustomClothing,
      perfectCorpRefId: requestData.perfectCorpRefId,
      styleId: requestData.clothingImage,
      mockMode: Deno.env.get('PERFECTCORP_MOCK_MODE') === 'true',
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret
    })

    // Step 1: Authenticate with Perfect Corp S2S API
    const authResult = await authenticateWithPerfectCorp(apiKey, apiSecret, supabase)
    console.log('Perfect Corp S2S authentication completed')

    // Step 2: Process the virtual try-on request
    const result = await processTryOnRequest(requestData, authResult.accessToken)
    
    console.log('Perfect Corp S2S virtual try-on completed successfully')
    
    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    })

  } catch (error) {
    console.error('Perfect Corp S2S virtual try-on error:', error)
    
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
