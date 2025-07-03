
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { processTryOnRequest } from './processor.ts'

console.log('Perfect Corp Proxy function loaded and ready')

serve(async (req) => {
  console.log('=== Perfect Corp Proxy Request Received ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method)
      return new Response(JSON.stringify({
        error: 'Method not allowed. Only POST requests are supported.',
        success: false
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    let requestData
    try {
      requestData = await req.json()
      console.log('Request data received:', {
        hasUserPhoto: !!requestData.userPhoto,
        hasUserPhotoStoragePath: !!requestData.userPhotoStoragePath,
        clothingCategory: requestData.clothingCategory,
        clothingImage: requestData.clothingImage ? 'provided' : 'missing'
      })
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError)
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate required fields
    if (!requestData.userPhoto) {
      console.error('Missing userPhoto in request')
      return new Response(JSON.stringify({
        error: 'userPhoto is required',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!requestData.clothingImage && !requestData.perfectCorpRefId) {
      console.error('Missing both clothingImage and perfectCorpRefId')
      return new Response(JSON.stringify({
        error: 'Either clothingImage or perfectCorpRefId is required',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get Perfect Corp API credentials
    const apiKey = Deno.env.get('PERFECTCORP_API_KEY')
    const apiSecret = Deno.env.get('PERFECTCORP_API_SECRET')

    if (!apiKey || !apiSecret) {
      console.error('Perfect Corp API credentials not configured')
      return new Response(JSON.stringify({
        error: 'Perfect Corp API credentials not configured. Please contact support.',
        success: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ All validations passed, starting try-on process...')

    // Process the try-on request
    const result = await processTryOnRequest(requestData, 'will_be_obtained_in_processor')
    
    console.log('✅ Try-on process completed successfully')
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ Perfect Corp Proxy error:', error)
    
    // Enhanced error response with more details
    const errorResponse = {
      error: error.message || 'An unexpected error occurred during try-on processing',
      success: false,
      timestamp: new Date().toISOString(),
      details: error.name || 'UnknownError'
    }
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
