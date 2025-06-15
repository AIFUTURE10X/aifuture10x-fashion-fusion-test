
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
  private baseUrl = 'https://api.perfectcorp.com/v1';

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
      console.log('Sending try-on request to Perfect Corp API...');
      
      // Convert image URLs to base64 if needed
      const userPhotoBase64 = await this.imageUrlToBase64(request.userPhoto);
      const clothingImageBase64 = await this.imageUrlToBase64(request.clothingImage);

      // Try the correct Perfect Corp API endpoint
      const response = await fetch(`${this.baseUrl}/virtual-fitting`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          person_image: userPhotoBase64,
          garment_image: clothingImageBase64,
          category: request.clothingCategory,
          format: 'base64'
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.log('Error response data:', errorData);
        } catch (e) {
          console.log('Could not parse error response as JSON');
        }
        
        // If it's a 404, the endpoint might be wrong
        if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please check if you have the correct Perfect Corp API access.';
        } else if (response.status === 401) {
          errorMessage = 'Invalid API key. Please check your Perfect Corp API key.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. Please verify your API key has the required permissions.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Perfect Corp API response received:', data);

      return {
        success: true,
        resultImage: data.result_image || data.output_image,
        processingTime: data.processing_time || data.time_taken
      };

    } catch (error) {
      console.error('Perfect Corp API error:', error);
      
      // Handle network errors specifically
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error: Could not connect to Perfect Corp API. Please check your internet connection and API key.'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async imageUrlToBase64(imageUrl: string): Promise<string> {
    try {
      console.log('Converting image to base64:', imageUrl);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just the base64 data
          const base64 = result.split(',')[1];
          resolve(base64);
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
