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
    try {
      console.log('=== Perfect Corp Proxy Request Start ===');
      console.log('Using Supabase proxy at:', this.supabaseUrl);
      console.log('Category:', request.clothingCategory);
      
      const proxyUrl = `${this.supabaseUrl}/functions/v1/perfect-corp-proxy`;
      console.log('Making request to proxy:', proxyUrl);

      // send both for migration/backward-compat
      const payload: any = {
        clothingImage: request.clothingImage,
        clothingCategory: request.clothingCategory,
      };
      // If a storage path is present, use that, else use userPhoto
      if ('userPhotoStoragePath' in request && request.userPhotoStoragePath) {
        payload.userPhotoStoragePath = request.userPhotoStoragePath;
        payload.userPhoto = request.userPhoto; // still send for fallback
      } else {
        payload.userPhoto = request.userPhoto;
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `Proxy request failed with status ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('Error response:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.log('Could not parse error response');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Proxy response data keys:', Object.keys(data));

      // Handle the response based on Perfect Corp's API format
      if (data && data.result_img) {
        console.log('Success! Result image received from proxy');
        return {
          success: true,
          resultImage: data.result_img,
          processingTime: data.processing_time
        };
      } else if (data && data.error) {
        console.log('Proxy returned error:', data.error);
        throw new Error(data.error);
      } else {
        console.log('Unexpected proxy response format. Available fields:', Object.keys(data));
        throw new Error('Unexpected response format from proxy');
      }
    } catch (error) {
      console.error('=== Perfect Corp Proxy Error ===');
      console.error('Error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Keep the API key methods for backwards compatibility, but they won't be used
  setApiKey(key: string) {
    console.log('API key setting is now handled via Supabase secrets');
  }

  getApiKey(): string | null {
    console.log('API key is now managed via Supabase secrets');
    return null;
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    console.log('API key validation is now handled by Supabase Edge Function');
    return true;
  }
}

export const perfectCorpApi = new PerfectCorpApiService();
