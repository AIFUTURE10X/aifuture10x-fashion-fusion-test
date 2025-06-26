
interface AuthResponse {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}

class PerfectCorpAuthService {
  private supabaseUrl = "https://bpjlxtjbrunzibehbyrk.supabase.co";
  private supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamx4dGpicnVuemliZWhieXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjE1NTcsImV4cCI6MjA2NTUzNzU1N30.w3_oTurN_UesG_DpwNU67f216flzYmOnDo-lrEMLYDw";

  async authenticate(apiKey?: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Frontend: Starting Perfect Corp authentication...');
      
      const authUrl = `${this.supabaseUrl}/functions/v1/perfectcorp-auth`;
      console.log('🎯 Frontend: Making POST request to:', authUrl);
      
      const requestOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey || 'not_used_anymore'
        }),
      };

      console.log('📝 Frontend: Request method:', requestOptions.method);
      console.log('📋 Frontend: Request headers:', requestOptions.headers);

      const response = await fetch(authUrl, requestOptions);

      console.log('🌐 Frontend: Auth response status:', response.status);
      console.log('📥 Frontend: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `Authentication failed with status ${response.status}`;
        
        try {
          const errorData = await response.json();
          console.error('❌ Frontend: Error response:', errorData);
          errorMessage = errorData.error || errorMessage;
          
          if (response.status === 405) {
            console.error('🚨 Frontend: 405 Method Not Allowed detected');
            console.error('🔍 Frontend: This should not happen if we are making POST requests');
          }
        } catch (e) {
          console.error('❌ Frontend: Could not parse error response:', e);
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      const result: AuthResponse = await response.json();
      
      if (result.success) {
        console.log('✅ Frontend: Perfect Corp authentication successful');
        console.log('🕒 Frontend: Token expires in:', result.expiresIn, 'seconds');
      } else {
        console.error('❌ Frontend: Authentication failed:', result.error);
      }

      return result;

    } catch (error) {
      console.error('❌ Frontend: Perfect Corp authentication error:', error);
      
      // Check if it's a network error that might be causing method issues
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Frontend: Network error detected - could be related to CORS or redirects');
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async testAuthentication(): Promise<void> {
    console.log('🧪 Frontend: Testing Perfect Corp authentication...');
    const result = await this.authenticate();
    
    if (result.success) {
      console.log('🎉 Frontend: Authentication test successful!');
      console.log('🔑 Frontend: Access token length:', result.accessToken?.length);
    } else {
      console.log('❌ Frontend: Authentication test failed:', result.error);
    }
  }

  // Method to test the configuration endpoint
  async testConfiguration(): Promise<any> {
    const testUrl = `${this.supabaseUrl}/functions/v1/perfectcorp-auth/test`;
    console.log('🧪 Frontend: Testing configuration at:', testUrl);
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
      });

      const result = await response.json();
      console.log('📊 Frontend: Configuration test result:', result);
      return result;
    } catch (error) {
      console.error('❌ Frontend: Configuration test failed:', error);
      throw error;
    }
  }
}

export const perfectCorpAuth = new PerfectCorpAuthService();
