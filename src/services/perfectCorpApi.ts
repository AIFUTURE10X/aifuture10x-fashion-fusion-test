
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
  private apiKey: string | null = null;
  private baseUrl = 'https://yce.perfectcorp.com';

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('perfectcorp_api_key', key);
  }

  getApiKey(): string | null {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('perfectcorp_api_key');
    }
    return this.apiKey;
  }

  async tryOnClothing(request: TryOnRequest): Promise<TryOnResponse> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not provided. Please enter your Perfect Corp API key.'
      };
    }

    try {
      console.log('=== Perfect Corp API Request Start ===');
      console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
      console.log('Base URL:', this.baseUrl);
      console.log('Category:', request.clothingCategory);
      
      // Convert image URLs to base64
      console.log('Converting user photo to base64...');
      const userPhotoBase64 = await this.imageUrlToBase64(request.userPhoto);
      console.log('User photo base64 length:', userPhotoBase64.length);
      
      console.log('Converting clothing image to base64...');
      const clothingImageBase64 = await this.imageUrlToBase64(request.clothingImage);
      console.log('Clothing image base64 length:', clothingImageBase64.length);

      const requestBody = {
        person_img: userPhotoBase64,
        clothes_img: clothingImageBase64,
        clothes_type: this.mapCategoryToClothesType(request.clothingCategory)
      };

      console.log('Request body prepared with clothes_type:', requestBody.clothes_type);

      const apiUrl = `${this.baseUrl}/ai-clothes/virtual-tryon`;
      console.log('Making request to:', apiUrl);

      // Add timeout and additional headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('=== Response Details ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}: ${response.statusText}`;
        
        try {
          const errorText = await response.text();
          console.log('Error response body:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            console.log('Parsed error data:', errorData);
            errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
          } catch (e) {
            console.log('Could not parse error response as JSON');
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.log('Could not read error response body');
        }
        
        // Provide more specific error messages
        if (response.status === 0) {
          errorMessage = 'Network request blocked. This might be a CORS issue or the API server is unreachable.';
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found. The virtual try-on service may not be available.';
        } else if (response.status === 401) {
          errorMessage = 'Invalid API key. Please verify your Perfect Corp API key is correct.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. Your API key may not have virtual try-on permissions.';
        } else if (response.status === 400) {
          errorMessage = 'Bad request. Please check the image format and category.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. The Perfect Corp service may be temporarily unavailable.';
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log('Raw response body (first 200 chars):', responseText.substring(0, 200));

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data keys:', Object.keys(data));
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid JSON response from API');
      }

      // Handle the response based on Perfect Corp's API format
      if (data && data.result_img) {
        console.log('Success! Result image received, length:', data.result_img.length);
        return {
          success: true,
          resultImage: data.result_img,
          processingTime: data.processing_time
        };
      } else if (data && data.error) {
        console.log('API returned error:', data.error);
        throw new Error(data.error);
      } else {
        console.log('Unexpected response format. Available fields:', Object.keys(data));
        throw new Error('Unexpected response format from API');
      }

    } catch (error) {
      console.error('=== Perfect Corp API Error ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout: The API took too long to respond. Please try again.'
        };
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error: Could not connect to Perfect Corp API. This might be due to CORS restrictions or network connectivity issues.'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private mapCategoryToClothesType(category: string): string {
    // Map our internal categories to Perfect Corp's clothes_type values
    const categoryMap: { [key: string]: string } = {
      'tops': 'upper_body',
      'dresses': 'dresses',
      'outerwear': 'upper_body',
      'bottoms': 'lower_body',
      'shoes': 'shoes'
    };
    
    const mapped = categoryMap[category.toLowerCase()] || 'upper_body';
    console.log(`Mapped category "${category}" to "${mapped}"`);
    return mapped;
  }

  private async imageUrlToBase64(imageUrl: string): Promise<string> {
    try {
      console.log('Fetching image from:', imageUrl);
      
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Image blob - size:', blob.size, 'type:', blob.type);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract just the base64 data without the data URL prefix
          const base64Data = result.split(',')[1];
          console.log('Base64 conversion complete, length:', base64Data.length);
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('Failed to convert image to base64'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error(`Image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Validating API key...');
      // For now, we'll skip validation and assume the key is valid
      // The real validation will happen when we make the actual API call
      console.log('API key validation skipped - will validate during actual API call');
      return true;
    } catch {
      return false;
    }
  }
}

export const perfectCorpApi = new PerfectCorpApiService();
