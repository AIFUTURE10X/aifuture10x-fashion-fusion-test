
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
      console.log('Sending try-on request to Perfect Corp API...');
      
      // Convert image URLs to base64 if needed
      const userPhotoBase64 = await this.imageUrlToBase64(request.userPhoto);
      const clothingImageBase64 = await this.imageUrlToBase64(request.clothingImage);

      // Use the correct Perfect Corp API endpoint from documentation
      const response = await fetch(`${this.baseUrl}/ai-clothes/virtual-tryon`, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          person_img: userPhotoBase64,
          clothes_img: clothingImageBase64,
          clothes_type: this.mapCategoryToClothesType(request.clothingCategory)
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.log('Error response data:', errorData);
        } catch (e) {
          console.log('Could not parse error response as JSON');
        }
        
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

      // Based on the API docs, the response should contain the result image
      if (data && data.result_img) {
        return {
          success: true,
          resultImage: data.result_img,
          processingTime: data.processing_time
        };
      } else {
        throw new Error('Invalid response format from API');
      }

    } catch (error) {
      console.error('Perfect Corp API error:', error);
      
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

  private mapCategoryToClothesType(category: string): string {
    // Map our internal categories to Perfect Corp's clothes_type values
    const categoryMap: { [key: string]: string } = {
      'tops': 'upper_body',
      'dresses': 'dresses',
      'outerwear': 'upper_body',
      'bottoms': 'lower_body',
      'shoes': 'shoes'
    };
    
    return categoryMap[category.toLowerCase()] || 'upper_body';
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
          // Return the full data URL as Perfect Corp expects it
          resolve(result);
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
