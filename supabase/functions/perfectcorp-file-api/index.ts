import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface FileUploadRequest {
  fileName: string;
  contentType: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 [File API] Starting Perfect Corp File API request...');
    
    const { fileName, contentType }: FileUploadRequest = await req.json()
    
    // Get Perfect Corp API credentials from environment variables
    const apiKey = Deno.env.get('PERFECTCORP_API_KEY')
    const apiSecret = Deno.env.get('PERFECTCORP_API_SECRET')
    
    if (!apiKey || !apiSecret) {
      throw new Error('Perfect Corp API credentials not configured')
    }

    console.log('📝 [File API] Request details:', {
      fileName,
      contentType,
      apiKeyLength: apiKey.length
    });

    // Step 1: Authenticate with Perfect Corp API
    console.log('🔐 [File API] Step 1: Authenticating with Perfect Corp...');
    const timestamp = Date.now()
    const idTokenData = `client_id=${apiKey}&timestamp=${timestamp}`
    
    // For now, use base64 encoding as a placeholder for RSA encryption
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
      console.error('❌ [File API] Perfect Corp authentication failed:', authError)
      throw new Error(`Authentication failed: ${authResponse.status} - ${authError}`)
    }

    const authData = await authResponse.json()
    const accessToken = authData.result?.access_token || authData.access_token

    if (!accessToken) {
      console.error('❌ [File API] Auth response:', authData)
      throw new Error('No access token received from authentication')
    }

    console.log('✅ [File API] Authentication successful');

    // Step 2: Request upload URL from File API - Test multiple endpoints
    console.log('📤 [File API] Step 2: Requesting upload URL...');
    
    const endpoints = [
      'https://yce-api-01.perfectcorp.com/s2s/v1.0/file',
      'https://yce-api-01.perfectcorp.com/s2s/v1.1/file'
    ];

    let uploadResponse;
    let uploadData;
    let workingEndpoint;

    for (const endpoint of endpoints) {
      console.log(`🔗 [File API] Testing endpoint: ${endpoint}`);
      
      try {
        uploadResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: [{
              content_type: contentType,
              file_name: fileName,
              file_size: 1000000 // Default size estimate
            }]
          }),
        });

        console.log(`📊 [File API] Endpoint ${endpoint} response: ${uploadResponse.status}`);

        if (uploadResponse.ok) {
          uploadData = await uploadResponse.json();
          workingEndpoint = endpoint;
          console.log(`✅ [File API] Working endpoint found: ${endpoint}`);
          break;
        } else {
          const errorText = await uploadResponse.text();
          console.error(`❌ [File API] Endpoint ${endpoint} failed: ${uploadResponse.status} - ${errorText}`);
        }
      } catch (error) {
        console.error(`❌ [File API] Endpoint ${endpoint} error:`, error);
      }
    }

    if (!uploadData || !workingEndpoint) {
      throw new Error('All File API endpoints failed - service may be unavailable');
    }

    console.log('📦 [File API] Upload response:', JSON.stringify(uploadData, null, 2));

    // Parse response structure
    let uploadUrl: string | undefined;
    let fileId: string | undefined;
    
    if (uploadData.result) {
      const result = uploadData.result;
      if (result.files && Array.isArray(result.files) && result.files.length > 0) {
        uploadUrl = result.files[0].url;
        fileId = result.files[0].file_id;
      } else if (result.url && result.file_id) {
        uploadUrl = result.url;
        fileId = result.file_id;
      }
    } else if (uploadData.files && Array.isArray(uploadData.files)) {
      uploadUrl = uploadData.files[0]?.url;
      fileId = uploadData.files[0]?.file_id;
    } else if (uploadData.url && uploadData.file_id) {
      uploadUrl = uploadData.url;
      fileId = uploadData.file_id;
    }

    if (!uploadUrl || !fileId) {
      console.error('❌ [File API] Missing upload URL or file_id in response');
      throw new Error('Invalid response structure from Perfect Corp File API');
    }

    console.log('✅ [File API] Successfully obtained upload credentials:', { 
      fileId, 
      uploadUrlLength: uploadUrl.length,
      workingEndpoint 
    });

    return new Response(JSON.stringify({
      success: true,
      uploadUrl,
      fileId,
      workingEndpoint,
      message: "Upload URL obtained successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ [File API] Error:', error)
    
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