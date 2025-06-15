
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

      const response = await fetch(`${this.baseUrl}/virtual-tryon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_image: userPhotoBase64,
          garment_image: clothingImageBase64,
          category: request.clothingCategory,
          output_format: 'base64'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Perfect Corp API response received');

      return {
        success: true,
        resultImage: data.result_image,
        processingTime: data.processing_time
      };

    } catch (error) {
      console.error('Perfect Corp API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async imageUrlToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just the base64 data
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
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
