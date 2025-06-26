
interface ConfigTestResult {
  status: string;
  timestamp: string;
  credentials: {
    hasClientId: boolean;
    clientIdLength: number;
    clientIdValid: boolean;
    hasClientSecret: boolean;
    secretLength: number;
    secretValid: boolean;
  };
  encryption: {
    success: boolean;
    error: string;
  };
  apiEndpoint: string;
  recommendation: string;
}

interface TestResult {
  configTest: ConfigTestResult;
  authTest: {
    status: string;
    hasToken: boolean;
    error: string | null;
  };
}

class PerfectCorpTestService {
  private supabaseUrl = "https://bpjlxtjbrunzibehbyrk.supabase.co";
  private supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamx4dGpicnVuemliZWhieXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjE1NTcsImV4cCI6MjA2NTUzNzU1N30.w3_oTurN_UesG_DpwNU67f216flzYmOnDo-lrEMLYDw";

  async testConfiguration(): Promise<TestResult> {
    try {
      console.log('🧪 Testing Perfect Corp configuration...');
      
      // Test the Edge Function test endpoint
      const testResponse = await fetch(
        `${this.supabaseUrl}/functions/v1/perfectcorp-auth/test`,
        {
          headers: {
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      const testData: ConfigTestResult = await testResponse.json();
      console.log('📋 Configuration test results:', testData);
      
      // Try actual authentication with a test API key
      const authResponse = await fetch(
        `${this.supabaseUrl}/functions/v1/perfectcorp-auth`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: 'test_api_key_for_validation'
          })
        }
      );
      
      const authData = await authResponse.json();
      console.log('🔐 Authentication test results:', authData);
      
      return {
        configTest: testData,
        authTest: {
          status: authResponse.ok ? 'success' : 'failed',
          hasToken: !!authData.accessToken,
          error: authData.error || null
        }
      };
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw new Error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async logConfigurationStatus(): Promise<void> {
    try {
      const result = await this.testConfiguration();
      
      console.log('=== Perfect Corp Configuration Test Results ===');
      console.log('📅 Timestamp:', result.configTest.timestamp);
      console.log('🔑 Has Client ID:', result.configTest.credentials.hasClientId ? '✅' : '❌');
      console.log('🔑 Client ID Valid:', result.configTest.credentials.clientIdValid ? '✅' : '❌');
      console.log('🔐 Has Client Secret:', result.configTest.credentials.hasClientSecret ? '✅' : '❌');
      console.log('🔐 Secret Length Valid:', result.configTest.credentials.secretValid ? '✅' : '❌');
      console.log('🔒 Encryption Test:', result.configTest.encryption.success ? '✅' : '❌');
      console.log('📝 Recommendation:', result.configTest.recommendation);
      console.log('🧪 Auth Test Status:', result.authTest.status);
      
      if (result.authTest.error) {
        console.log('⚠️ Auth Error:', result.authTest.error);
      }
      
      if (!result.configTest.encryption.success) {
        console.log('🔒 Encryption Error:', result.configTest.encryption.error);
      }
      
    } catch (error) {
      console.error('❌ Configuration test failed:', error);
    }
  }
}

export const perfectCorpTest = new PerfectCorpTestService();
