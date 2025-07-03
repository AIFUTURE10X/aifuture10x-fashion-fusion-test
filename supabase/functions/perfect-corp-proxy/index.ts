
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handlePerfectCorpRequest } from './request-handler.ts';

console.log("Perfect Corp Proxy function loaded successfully");

serve(async (req) => {
  return await handlePerfectCorpRequest(req);
});
