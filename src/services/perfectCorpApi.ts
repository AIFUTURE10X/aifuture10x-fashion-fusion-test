
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

  // Validate if a string is a valid base64 data URL
  private isValidDataUrl(dataUrl: string): boolean {
    if (!dataUrl || typeof dataUrl !== 'string') {
      return false;
    }
    
    // Check if it starts with data:image
    if (!dataUrl.startsWith('data:image/')) {
      return false;
    }
    
    // Check if it contains base64 indicator
    if (!dataUrl.includes('base64,')) {
      return false;
    }
    
    // Extract base64 part
    const base64Part = dataUrl.split('base64,')[1];
    if (!base64Part || base64Part.length < 10) {
      return false;
    }
    
    return true;
  }

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

      const payload: any = {
        clothingImage: request.clothingImage,
        clothingCategory: request.clothingCategory,
        userPhoto: request.userPhoto
      };
      
      console.log('📤 Request payload:', JSON.stringify(payload, null, 2));

      const fetchStartTime = Date.now();
      
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const networkTime = Date.now() - fetchStartTime;
        console.log('⏱️ Network request completed in:', networkTime, 'ms');
        console.log('📊 Response status:', response.status, response.statusText);
        console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          let errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
          
          try {
            const errorData = await response.json();
            console.error('❌ Error response data:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error('❌ Could not parse error response:', e);
            const errorText = await response.text();
            console.error('❌ Raw error response:', errorText);
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const totalTime = Date.now() - requestStartTime;
        
        console.log('📥 Response received in:', totalTime, 'ms');
        console.log('📋 Response data:', data);

        if (data && data.result_img) {
          console.log('🖼️ Result image received, validating...');
          
          // Validate the image data
          if (!this.isValidDataUrl(data.result_img)) {
            console.error('❌ Invalid image data received:', {
              hasResultImg: !!data.result_img,
              length: data.result_img?.length || 0,
              startsWithData: data.result_img?.startsWith('data:'),
              preview: data.result_img?.substring(0, 50) || 'none'
            });
            throw new Error('Invalid image data received from server');
          }
          
          console.log('✅ Image validation passed');
          console.log('📊 Result image stats:', {
            length: data.result_img.length,
            format: data.result_img.substring(0, data.result_img.indexOf(';')) || 'unknown'
          });
          
          return {
            success: true,
            resultImage: data.result_img,
            processingTime: data.processing_time
          };
        } else if (data && data.error) {
          console.error('❌ API returned error:', data.error);
          throw new Error(data.error);
        } else {
          console.error('❌ Unexpected response format');
          console.log('📋 Available fields:', Object.keys(data));
          throw new Error('Unexpected response format from API');
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout: The try-on service took too long to respond. Please try again.');
        }
        
        throw fetchError;
      }
      
    } catch (error) {
      const totalTime = Date.now() - requestStartTime;
      console.error('❌ Perfect Corp API Error after', totalTime, 'ms');
      console.error('🔥 Error details:', error);

      // Enhanced error categorization
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network connectivity error');
        return {
          success: false,
          error: 'Unable to connect to the try-on service. Please check that the Edge Function is deployed and try again.'
        };
      }

      if (error.message.includes('timeout')) {
        return {
          success: false,
          error: 'The try-on service took too long to respond. Please try again.'
        };
      }

      if (error.message.includes('Invalid image data')) {
        return {
          success: false,
          error: 'The try-on result could not be processed. Please try again.'
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during try-on processing'
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
