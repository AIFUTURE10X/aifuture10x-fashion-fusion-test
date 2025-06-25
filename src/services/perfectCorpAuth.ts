
interface AuthResponse {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}

class PerfectCorpAuthService {
  private supabaseUrl = "https://bpjlxtjbrunzibehbyrk.supabase.co";
  private supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamx4dGpicnVuemliZWhieXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjE1NTcsImV4cCI6MjA2NTUzNzU1N30.w3_oTurN_UesG_DpwNU67f216flzYmOnDo-lrEMLYDw";

  async authenticate(apiKey: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Authenticating with Perfect Corp using RSA encryption...');
      
      const authUrl = `${this.supabaseUrl}/functions/v1/perfectcorp-auth`;
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey
        }),
      });

      console.log('🌐 Auth response status:', response.status);

      if (!response.ok) {
        let errorMessage = `Authentication failed with status ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      const result: AuthResponse = await response.json();
      
      if (result.success) {
        console.log('✅ Perfect Corp authentication successful');
        console.log('🕒 Token expires in:', result.expiresIn, 'seconds');
      } else {
        console.error('❌ Authentication failed:', result.error);
      }

      return result;

    } catch (error) {
      console.error('❌ Perfect Corp authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async testAuthentication(): Promise<void> {
    // This method can be used to test the authentication endpoint
    const testApiKey = 'test_api_key'; // Replace with actual test key
    const result = await this.authenticate(testApiKey);
    
    if (result.success) {
      console.log('🎉 Authentication test successful!');
      console.log('Access token length:', result.accessToken?.length);
    } else {
      console.log('❌ Authentication test failed:', result.error);
    }
  }
}

export const perfectCorpAuth = new PerfectCorpAuthService();
