
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handlePerfectCorpRequest } from './request-handler.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log("🚀 Perfect Corp Proxy function loading...");
console.log("🔧 Environment check - SUPABASE_URL:", !!Deno.env.get('SUPABASE_URL'));
console.log("🔧 Environment check - SUPABASE_SERVICE_ROLE_KEY:", !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
console.log("🔧 Environment check - PERFECTCORP_API_KEY:", !!Deno.env.get('PERFECTCORP_API_KEY'));
console.log("🔧 Environment check - PERFECTCORP_API_SECRET:", !!Deno.env.get('PERFECTCORP_API_SECRET'));
console.log("✅ Perfect Corp Proxy function loaded successfully");

serve(async (req) => {
  try {
    console.log(`🌐 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // Add basic health check endpoint
    const url = new URL(req.url);
    if (url.pathname.endsWith('/health')) {
      console.log("🩺 Health check requested");
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          environment: {
            hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
            hasSupabaseKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
            hasPerfectCorpApiKey: !!Deno.env.get('PERFECTCORP_API_KEY'),
            hasPerfectCorpSecret: !!Deno.env.get('PERFECTCORP_API_SECRET')
          }
        }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const response = await handlePerfectCorpRequest(req);
    console.log(`✅ [${new Date().toISOString()}] Request completed with status: ${response.status}`);
    return response;
    
  } catch (error) {
    console.error("💥 [CRITICAL] Edge function error:", error);
    console.error("💥 [CRITICAL] Error name:", error?.name);
    console.error("💥 [CRITICAL] Error message:", error?.message);
    console.error("💥 [CRITICAL] Error stack:", error?.stack);
    
    // Return a detailed error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Edge function error: ${error?.message || 'Unknown error'}`,
        details: {
          name: error?.name,
          message: error?.message,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});
