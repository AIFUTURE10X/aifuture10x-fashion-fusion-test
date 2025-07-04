// Request validation and parsing utilities

export interface RequestData {
  userPhoto: string;
  clothingImage: string;
  clothingCategory?: string;
  isCustomClothing?: boolean;
  perfectCorpRefId?: string;
}

export async function parseRequestBody(req: Request): Promise<RequestData> {
  try {
    const body = await req.text();
    console.log('📄 Raw request body length:', body.length);
    return JSON.parse(body);
  } catch (parseError) {
    console.error('❌ Failed to parse request body:', parseError);
    throw new Error('Invalid JSON in request body');
  }
}

export function validateRequestData(requestData: any): void {
  if (!requestData.userPhoto) {
    console.error('❌ Missing userPhoto in request');
    throw new Error('userPhoto is required');
  }

  if (!requestData.clothingImage) {
    console.error('❌ Missing clothingImage in request');
    throw new Error('clothingImage is required');
  }
}

export function validateCredentials(apiKey?: string, apiSecret?: string): void {
  console.log('🔍 [Credentials] Checking Perfect Corp API credentials...');
  console.log('🔑 [Credentials] API Key present:', !!apiKey);
  console.log('🔑 [Credentials] API Key length:', apiKey?.length || 0);
  console.log('🔐 [Credentials] API Secret present:', !!apiSecret);
  console.log('🔐 [Credentials] API Secret length:', apiSecret?.length || 0);
  console.log('🔐 [Credentials] API Secret format:', apiSecret?.includes('BEGIN') ? 'PEM' : 'Raw Base64');

  if (!apiKey || !apiSecret || apiKey === 'test_key' || apiSecret === 'test_secret') {
    console.error('❌ [Credentials] Perfect Corp API credentials not configured properly');
    console.error('📋 [Credentials] Credential status:', {
      hasApiKey: !!apiKey,
      apiKeyValid: apiKey && apiKey !== 'test_key',
      hasApiSecret: !!apiSecret,
      apiSecretValid: apiSecret && apiSecret !== 'test_secret',
      apiKeyLength: apiKey?.length || 0,
      apiSecretLength: apiSecret?.length || 0
    });
    
    throw new Error('Perfect Corp API credentials not configured. Please configure PERFECTCORP_API_KEY and PERFECTCORP_API_SECRET in Supabase Edge Function secrets.');
  }

  console.log('✅ [Credentials] Perfect Corp API credentials validated successfully');
}