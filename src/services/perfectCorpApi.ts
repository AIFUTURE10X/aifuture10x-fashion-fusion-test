
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
      console.log('Starting Perfect Corp API request...');
      console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
      
      // Convert image URLs to base64 - get just the base64 data without data URL prefix
      const userPhotoBase64 = await this.imageUrlToBase64(request.userPhoto);
      const clothingImageBase64 = await this.imageUrlToBase64(request.clothingImage);

      console.log('Images converted to base64');
      console.log('User photo base64 length:', userPhotoBase64.length);
      console.log('Clothing image base64 length:', clothingImageBase64.length);

      const requestBody = {
        person_img: userPhotoBase64,
        clothes_img: clothingImageBase64,
        clothes_type: this.mapCategoryToClothesType(request.clothingCategory)
      };

      console.log('Request body prepared:', {
        ...requestBody,
        person_img: `[base64 data ${userPhotoBase64.length} chars]`,
        clothes_img: `[base64 data ${clothingImageBase64.length} chars]`
      });

      const response = await fetch(`${this.baseUrl}/ai-clothes/virtual-tryon`, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response received - Status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        
        try {
          const errorText = await response.text();
          console.log('Error response body:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
          } catch (e) {
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.log('Could not read error response body');
        }
        
        if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please verify your Perfect Corp API access and endpoint.';
        } else if (response.status === 401) {
          errorMessage = 'Invalid API key. Please check your Perfect Corp API key.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. Please verify your API key has virtual try-on permissions.';
        } else if (response.status === 400) {
          errorMessage = 'Bad request. Please check the image format and try again.';
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log('Raw response body:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid JSON response from API');
      }

      console.log('Parsed response data:', data);

      // Handle the response based on Perfect Corp's API format
      if (data && data.result_img) {
        return {
          success: true,
          resultImage: data.result_img,
          processingTime: data.processing_time
        };
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        console.log('Unexpected response format:', data);
        throw new Error('Unexpected response format from API');
      }

    } catch (error) {
      console.error('Perfect Corp API error details:', error);
      
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
      console.log('Image blob size:', blob.size, 'type:', blob.type);
      
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
