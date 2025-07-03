
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Perfect Corp Proxy function starting...')

serve(async (req) => {
  console.log('=== Perfect Corp Proxy Request ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))
  
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
        error: 'Only POST requests are supported',
        success: false
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    let requestData
    try {
      const bodyText = await req.text()
      console.log('Raw request body:', bodyText)
      requestData = JSON.parse(bodyText)
      console.log('Parsed request data:', requestData)
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
    const { userPhoto, clothingImage, clothingCategory } = requestData
    
    if (!userPhoto) {
      console.error('Missing userPhoto')
      return new Response(JSON.stringify({
        error: 'userPhoto is required',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!clothingImage) {
      console.error('Missing clothingImage')
      return new Response(JSON.stringify({
        error: 'clothingImage is required',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!clothingCategory) {
      console.error('Missing clothingCategory')
      return new Response(JSON.stringify({
        error: 'clothingCategory is required',
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
        error: 'Perfect Corp API credentials not configured',
        success: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ All validations passed, processing try-on request...')

    // For now, return a mock response to test connectivity
    // TODO: Implement actual Perfect Corp API integration
    console.log('Returning mock response for testing...')
    
    return new Response(JSON.stringify({
      success: true,
      result_img: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      processing_time: 2,
      message: 'Mock try-on completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ Perfect Corp Proxy error:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(JSON.stringify({
      error: `Try-on processing failed: ${error.message}`,
      success: false,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
