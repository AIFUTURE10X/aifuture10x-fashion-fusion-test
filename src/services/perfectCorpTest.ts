
import { perfectCorpDiagnostics } from './perfectCorpDiagnostics';

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
  authentication: {
    simpleAuth: {
      attempted: boolean;
      successful: boolean;
      error: string | null;
    };
    hmacAuth: {
      attempted: boolean;
      successful: boolean;
      error: string | null;
    };
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
  diagnostics?: any;
}

class PerfectCorpTestService {
  private supabaseUrl = "https://bpjlxtjbrunzibehbyrk.supabase.co";
  private supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamx4dGpicnVuemliZWhieXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjE1NTcsImV4cCI6MjA2NTUzNzU1N30.w3_oTurN_UesG_DpwNU67f216flzYmOnDo-lrEMLYDw";

  async testConfiguration(): Promise<TestResult> {
    try {
      console.log('🧪 Testing Perfect Corp configuration...');
      
      // Get basic configuration test
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
      
      // Run comprehensive diagnostics
      let diagnostics = null;
      try {
        diagnostics = await perfectCorpDiagnostics.runFullDiagnostics();
      } catch (diagError) {
        console.warn('⚠️ Failed to run full diagnostics:', diagError);
      }
      
      // Try actual authentication
      const authResponse = await fetch(
        `${this.supabaseUrl}/functions/v1/perfectcorp-auth`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: 'test_validation'
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
        },
        diagnostics
      };
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw new Error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async runComprehensiveTest(): Promise<void> {
    try {
      console.log('=== COMPREHENSIVE PERFECT CORP TEST ===');
      
      // Generate detailed diagnostic report
      const report = await perfectCorpDiagnostics.generateDetailedReport();
      console.log(report);
      
      // Get analysis and recommendations
      const recommendations = await perfectCorpDiagnostics.analyzeAuthenticationFailure();
      
      console.log('\n=== ACTIONABLE RECOMMENDATIONS ===');
      recommendations.forEach(rec => console.log(rec));
      
      // Test with enhanced diagnostics
      const authTest = await perfectCorpDiagnostics.testAuthenticationWithDiagnostics();
      
      console.log('\n=== AUTHENTICATION TEST SUMMARY ===');
      console.log('Success:', authTest.success ? '✅' : '❌');
      console.log('Has Token:', authTest.accessToken ? '✅' : '❌');
      console.log('Error:', authTest.error || 'None');
      
      if (authTest.success) {
        console.log('\n🎉 PERFECT CORP AUTHENTICATION IS WORKING!');
      } else {
        console.log('\n❌ PERFECT CORP AUTHENTICATION FAILED');
        console.log('Review the recommendations above to resolve the issues.');
      }
      
    } catch (error) {
      console.error('❌ Comprehensive test failed:', error);
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
      
      // Show authentication test results
      if (result.configTest.authentication) {
        console.log('🔒 Simple Auth:', result.configTest.authentication.simpleAuth.successful ? '✅' : '❌');
        console.log('🔐 HMAC Auth:', result.configTest.authentication.hmacAuth.successful ? '✅' : '❌');
      }
      
      console.log('📝 Recommendation:', result.configTest.recommendation);
      console.log('🧪 Auth Test Status:', result.authTest.status);
      
      if (result.authTest.error) {
        console.log('⚠️ Auth Error:', result.authTest.error);
      }

      // Additional diagnostics if available
      if (result.diagnostics) {
        console.log('\n=== DETAILED DIAGNOSTICS ===');
        console.log('Network Connectivity:', result.diagnostics.networkConnectivity.canReach ? '✅' : '❌');
        
        if (result.diagnostics.authenticationMethods) {
          console.log('Simple Auth Method:', result.diagnostics.authenticationMethods.simpleAuth.successful ? '✅' : '❌');
          console.log('HMAC Auth Method:', result.diagnostics.authenticationMethods.hmacAuth.successful ? '✅' : '❌');
        }
        
        if (result.diagnostics.recommendations.length > 0) {
          console.log('\n=== RECOMMENDATIONS ===');
          result.diagnostics.recommendations.forEach((rec: string) => console.log(rec));
        }
      }
      
    } catch (error) {
      console.error('❌ Configuration test failed:', error);
    }
  }

  // Quick method to check if everything is ready
  async isReadyForProduction(): Promise<boolean> {
    try {
      const authTest = await perfectCorpDiagnostics.testAuthenticationWithDiagnostics();
      return authTest.success && !!authTest.accessToken;
    } catch (error) {
      console.error('❌ Production readiness check failed:', error);
      return false;
    }
  }

  // New method to help users troubleshoot Perfect Corp setup
  async getSetupInstructions(): Promise<string[]> {
    const instructions = [
      '=== PERFECT CORP SETUP INSTRUCTIONS ===',
      '',
      '1. Get your Perfect Corp credentials:',
      '   - Log into your Perfect Corp developer dashboard',
      '   - Find your Client ID (PERFECTCORP_API_KEY)',
      '   - Find your Client Secret (PERFECTCORP_API_SECRET)',
      '   - Note: NO RSA public key is needed for current authentication',
      '',
      '2. Add credentials to Supabase:',
      '   - Go to your Supabase project settings',
      '   - Navigate to Edge Function secrets',
      '   - Add PERFECTCORP_API_KEY with your Client ID',
      '   - Add PERFECTCORP_API_SECRET with your Client Secret',
      '',
      '3. Test the authentication:',
      '   - Run perfectCorpTest.runComprehensiveTest()',
      '   - Check the console for detailed results',
      '   - Contact Perfect Corp support if authentication still fails',
      '',
      '4. Common issues:',
      '   - Make sure credentials are not test/demo values',
      '   - Verify your Perfect Corp account has API access enabled',
      '   - Check that your credentials match the current API format',
      '',
      '5. If you need help:',
      '   - Contact Perfect Corp support with your Client ID',
      '   - Ask them about their current authentication method',
      '   - Mention you\'re having trouble with S2S API authentication'
    ];
    
    return instructions;
  }
}

export const perfectCorpTest = new PerfectCorpTestService();
