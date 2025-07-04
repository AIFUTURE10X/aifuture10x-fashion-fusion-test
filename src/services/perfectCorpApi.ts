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

  // Validate and normalize image data format
  private validateAndNormalizeImageData(imageData: string): { valid: boolean; normalizedData?: string; error?: string } {
    if (!imageData || typeof imageData !== 'string') {
      console.error('❌ Invalid image data: not a string or empty');
      return { valid: false, error: 'Invalid image data: not a string or empty' };
    }

    // Extract base64 data for validation
    let base64Data: string;
    let isDataUrl = false;
    
    if (imageData.startsWith('data:image/')) {
      if (!imageData.includes('base64,')) {
        return { valid: false, error: 'Invalid data URL: does not contain base64,' };
      }
      
      base64Data = imageData.split('base64,')[1];
      isDataUrl = true;
      console.log('🔍 Processing data URL format');
    } else {
      base64Data = imageData;
      console.log('🔍 Processing raw base64 format');
    }

    // Validate base64 data length and content
    if (!base64Data || base64Data.length < 1000) {
      const error = `Image data too short: ${base64Data?.length || 0} characters. This indicates corrupted or incomplete image data.`;
      console.error('❌', error);
      return { valid: false, error };
    }

    // Validate it's proper base64
    try {
      atob(base64Data);
      console.log('✅ Base64 decode test passed');
    } catch (decodeError) {
      console.error('❌ Base64 decode failed:', decodeError);
      return { valid: false, error: 'Invalid base64 encoding' };
    }

    // Check for minimum realistic image size (50KB = ~67,000 base64 chars)
    if (base64Data.length < 50000) {
      const warning = `Warning: Image data unusually short (${base64Data.length} chars). Expected at least 50,000 chars for realistic images.`;
      console.warn('⚠️', warning);
      // Don't fail here, but log the concern
    }

    // Return properly formatted data URL
    let normalizedData: string;
    if (isDataUrl) {
      normalizedData = imageData;
      console.log('✅ Data URL validation passed');
    } else {
      normalizedData = `data:image/jpeg;base64,${base64Data}`;
      console.log('✅ Raw base64 normalized to data URL');
    }

    console.log('📊 Final image validation stats:', {
      originalLength: imageData.length,
      base64Length: base64Data.length,
      normalizedLength: normalizedData.length,
      format: isDataUrl ? 'data-url' : 'raw-base64'
    });

    return { valid: true, normalizedData };
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
      
      console.log('📤 Request payload prepared');

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
        console.log('📋 Response structure:', {
          success: data.success,
          hasResultImg: !!data.result_img,
          resultImgLength: data.result_img?.length || 0,
          processingTime: data.processing_time,
          message: data.message
        });

        if (data && data.result_img) {
          console.log('🖼️ Result image received, validating...');
          console.log('🔍 Image preview:', data.result_img.substring(0, 100));
          
          // Validate and normalize the image data
          const validation = this.validateAndNormalizeImageData(data.result_img);
          if (!validation.valid) {
            console.error('❌ Invalid image data received:', validation.error);
            throw new Error(`Invalid image data received from server: ${validation.error}`);
          }
          
          console.log('✅ Image validation passed');
          console.log('📊 Final result image stats:', {
            length: data.result_img.length,
            format: data.result_img.substring(0, data.result_img.indexOf(';')) || 'unknown'
          });
          
          return {
            success: true,
            resultImage: validation.normalizedData || data.result_img,
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
