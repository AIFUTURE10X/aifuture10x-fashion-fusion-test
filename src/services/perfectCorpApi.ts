
export interface TryOnRequest {
  userPhoto: string;
  clothingImage: string;
  clothingCategory: string;
}

export interface TryOnResponse {
  success: boolean;
  resultImage?: string;
  error?: string;
  processingTime?: number;
}

class PerfectCorpApiService {
  // Lovable native: use project-wide constants for Supabase URL and Anon Key
  private supabaseUrl = "https://bpjlxtjbrunzibehbyrk.supabase.co";
  private supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamx4dGpicnVuemliZWhieXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjE1NTcsImV4cCI6MjA2NTUzNzU1N30.w3_oTurN_UesG_DpwNU67f216flzYmOnDo-lrEMLYDw";

  async tryOnClothing(request: TryOnRequest & { userPhotoStoragePath?: string }): Promise<TryOnResponse> {
    const requestStartTime = Date.now();
    
    try {
      console.log('🔗 Perfect Corp API Request Start');
      console.log('🌐 Using Supabase proxy at:', this.supabaseUrl);
      console.log('📂 Category:', request.clothingCategory);
      console.log('📸 User photo length:', request.userPhoto?.length || 'N/A');
      console.log('👕 Clothing image:', request.clothingImage);
      
      const proxyUrl = `${this.supabaseUrl}/functions/v1/perfect-corp-proxy`;
      console.log('📡 Making request to proxy:', proxyUrl);

      // send both for migration/backward-compat
      const payload: any = {
        clothingImage: request.clothingImage,
        clothingCategory: request.clothingCategory,
      };
      
      // If a storage path is present, use that, else use userPhoto
      if ('userPhotoStoragePath' in request && request.userPhotoStoragePath) {
        payload.userPhotoStoragePath = request.userPhotoStoragePath;
        payload.userPhoto = request.userPhoto; // still send for fallback
        console.log('📁 Using storage path:', request.userPhotoStoragePath);
      } else {
        payload.userPhoto = request.userPhoto;
        console.log('🔗 Using direct photo URL');
      }

      console.log('📤 Request payload size:', JSON.stringify(payload).length, 'characters');

      const fetchStartTime = Date.now();
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const networkTime = Date.now() - fetchStartTime;
      console.log('⏱️ Network request completed in:', networkTime, 'ms');
      console.log('📊 Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Proxy request failed with status ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('❌ Error response data:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('❌ Could not parse error response:', e);
          const errorText = await response.text();
          console.error('❌ Raw error response:', errorText);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const totalTime = Date.now() - requestStartTime;
      
      console.log('📥 Proxy response received in:', totalTime, 'ms');
      console.log('📋 Response data keys:', Object.keys(data));
      console.log('✅ Response success:', data.success);

      // Handle the response based on Perfect Corp's API format
      if (data && data.result_img) {
        console.log('🖼️ Success! Result image received from proxy');
        console.log('📏 Image data length:', data.result_img.length);
        
        // Validate base64 format
        if (data.result_img && !data.result_img.startsWith('data:image/')) {
          console.log('🔧 Raw base64 detected, will be prefixed in component');
        }
        
        return {
          success: true,
          resultImage: data.result_img,
          processingTime: data.processing_time
        };
      } else if (data && data.error) {
        console.error('❌ Proxy returned error:', data.error);
        throw new Error(data.error);
      } else {
        console.error('❌ Unexpected proxy response format');
        console.log('📋 Available fields:', Object.keys(data));
        console.log('📄 Full response:', JSON.stringify(data, null, 2));
        throw new Error('Unexpected response format from proxy');
      }
    } catch (error) {
      const totalTime = Date.now() - requestStartTime;
      console.error('❌ Perfect Corp API Error after', totalTime, 'ms');
      console.error('🔥 Error details:', error);

      // Network error detection
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error detected');
        return {
          success: false,
          error: 'Network error: Unable to connect to the try-on service. Please check your internet connection and try again.'
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Keep the API key methods for backwards compatibility, but they won't be used
  setApiKey(key: string) {
    console.log('ℹ️ API key setting is now handled via Supabase secrets');
  }

  getApiKey(): string | null {
    console.log('ℹ️ API key is now managed via Supabase secrets');
    return null;
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    console.log('ℹ️ API key validation is now handled by Supabase Edge Function');
    return true;
  }
}

export const perfectCorpApi = new PerfectCorpApiService();
