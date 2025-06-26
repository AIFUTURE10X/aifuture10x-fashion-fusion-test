
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

interface UpdateKeysRequest {
  apiKey: string;
  rsaKey: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { apiKey, rsaKey }: UpdateKeysRequest = await req.json();
    
    console.log('Received keys update request');
    console.log('API Key length:', apiKey?.length || 0);
    console.log('RSA Key length:', rsaKey?.length || 0);
    
    // Validate the keys format
    if (!apiKey || apiKey.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key - must be at least 10 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!rsaKey.includes('-----BEGIN PUBLIC KEY-----') || 
        !rsaKey.includes('-----END PUBLIC KEY-----')) {
      return new Response(
        JSON.stringify({ error: 'Invalid RSA key format - must be in PEM format with BEGIN/END headers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Additional RSA key validation
    if (rsaKey.length < 400) {
      return new Response(
        JSON.stringify({ error: 'RSA key appears too short - please verify it is complete' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In a real implementation, you would use Supabase Management API or CLI
    // For now, we'll return validation success and instructions
    console.log('Keys validated successfully');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Keys validated successfully',
        instructions: [
          '1. Go to Supabase Dashboard → Settings → Edge Functions',
          '2. Update PERFECTCORP_API_KEY with the provided API Key',
          '3. Update PERFECTCORP_API_SECRET with the provided RSA Key',
          '4. Make sure to preserve line breaks in the RSA key',
          '5. The Edge Functions will automatically use the new keys'
        ],
        validation: {
          apiKeyLength: apiKey.length,
          rsaKeyLength: rsaKey.length,
          hasBeginHeader: rsaKey.includes('-----BEGIN PUBLIC KEY-----'),
          hasEndHeader: rsaKey.includes('-----END PUBLIC KEY-----'),
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing keys update:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process keys update',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
