
interface DiagnosticResult {
  timestamp: string;
  environment: any;
  credentials: any;
  cryptoSupport: any;
  networkConnectivity: any;
  encryptionTest: any;
  recommendations: string[];
}

interface AuthTestResult {
  success: boolean;
  accessToken?: string;
  error?: string;
  diagnostics?: DiagnosticResult;
}

class PerfectCorpDiagnosticsService {
  private supabaseUrl = "https://bpjlxtjbrunzibehbyrk.supabase.co";
  private supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamx4dGpicnVuemliZWhieXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjE1NTcsImV4cCI6MjA2NTUzNzU1N30.w3_oTurN_UesG_DpwNU67f216flzYmOnDo-lrEMLYDw";

  async runFullDiagnostics(): Promise<DiagnosticResult> {
    try {
      console.log('🔍 Frontend: Running full Perfect Corp diagnostics...');
      
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/perfectcorp-auth/diagnostics`,
        {
          headers: {
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Diagnostics request failed: ${response.status}`);
      }
      
      const diagnostics = await response.json();
      console.log('📊 Frontend: Diagnostics completed:', diagnostics);
      
      return diagnostics;
      
    } catch (error) {
      console.error('❌ Frontend: Diagnostics failed:', error);
      throw error;
    }
  }

  async testAuthenticationWithDiagnostics(): Promise<AuthTestResult> {
    try {
      console.log('🧪 Frontend: Testing authentication with diagnostics...');
      
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/perfectcorp-auth`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            diagnosticMode: true
          })
        }
      );
      
      const result = await response.json();
      
      console.log('📊 Frontend: Auth test completed:', {
        success: result.success,
        hasToken: !!result.accessToken,
        error: result.error,
        hasDiagnostics: !!result.diagnostics
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Frontend: Auth test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async analyzeAuthenticationFailure(): Promise<string[]> {
    const recommendations: string[] = [];
    
    try {
      const diagnostics = await this.runFullDiagnostics();
      
      // Analyze credentials
      if (!diagnostics.credentials.hasClientId) {
        recommendations.push('❌ CRITICAL: PERFECTCORP_API_KEY is missing from Supabase secrets');
      } else if (diagnostics.credentials.clientIdLength < 10) {
        recommendations.push('⚠️ WARNING: API key appears too short - may be a test/placeholder value');
      } else if (diagnostics.credentials.clientIdFormat && !diagnostics.credentials.clientIdFormat.isAlphanumeric) {
        recommendations.push('⚠️ WARNING: API key contains special characters - verify format');
      }
      
      if (!diagnostics.credentials.hasClientSecret) {
        recommendations.push('❌ CRITICAL: PERFECTCORP_API_SECRET is missing from Supabase secrets');
      } else if (diagnostics.credentials.clientSecretLength < 100) {
        recommendations.push('⚠️ WARNING: API secret appears too short - should be RSA public key (200+ chars)');
      } else if (diagnostics.credentials.clientSecretFormat && !diagnostics.credentials.clientSecretFormat.isBase64 && !diagnostics.credentials.clientSecretFormat.isPemFormat) {
        recommendations.push('⚠️ WARNING: API secret doesn\'t appear to be valid base64 or PEM format');
      }
      
      // Analyze encryption
      if (diagnostics.encryptionTest.attempted && !diagnostics.encryptionTest.successful) {
        recommendations.push('❌ CRITICAL: RSA encryption test failed - ' + diagnostics.encryptionTest.error);
        recommendations.push('🔧 SOLUTION: Verify API secret is a valid RSA public key from Perfect Corp');
      }
      
      // Analyze network
      if (!diagnostics.networkConnectivity.canReach) {
        recommendations.push('❌ CRITICAL: Cannot reach Perfect Corp API - check network connectivity');
      }
      
      // Add specific solutions
      if (recommendations.length === 0) {
        recommendations.push('✅ All diagnostics passed - authentication should work');
        recommendations.push('💡 If still failing, the issue may be with credential values (not test keys)');
      } else {
        recommendations.push('');
        recommendations.push('🔧 NEXT STEPS:');
        recommendations.push('1. Verify API credentials are real (not test) values from Perfect Corp dashboard');
        recommendations.push('2. Ensure RSA public key is copied exactly as provided by Perfect Corp');
        recommendations.push('3. Check that API key has proper permissions for authentication');
        recommendations.push('4. Contact Perfect Corp support if credentials are verified but still failing');
      }
      
    } catch (error) {
      recommendations.push('❌ CRITICAL: Unable to run diagnostics - ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    
    return recommendations;
  }

  async generateDetailedReport(): Promise<string> {
    try {
      const [diagnostics, authTest, recommendations] = await Promise.all([
        this.runFullDiagnostics(),
        this.testAuthenticationWithDiagnostics(),
        this.analyzeAuthenticationFailure()
      ]);
      
      const report = `
=== PERFECT CORP AUTHENTICATION DIAGNOSTIC REPORT ===
Generated: ${new Date().toISOString()}

ENVIRONMENT:
- Deno Version: ${diagnostics.environment?.denoVersion || 'Unknown'}
- V8 Version: ${diagnostics.environment?.v8Version || 'Unknown'}

CREDENTIALS STATUS:
- API Key Present: ${diagnostics.credentials.hasClientId ? '✅ YES' : '❌ NO'}
- API Key Length: ${diagnostics.credentials.clientIdLength} characters
- API Key Format: ${diagnostics.credentials.clientIdFormat?.isAlphanumeric ? '✅ Valid' : '⚠️ Contains special chars'}
- API Secret Present: ${diagnostics.credentials.hasClientSecret ? '✅ YES' : '❌ NO'}
- API Secret Length: ${diagnostics.credentials.clientSecretLength} characters
- API Secret Format: ${diagnostics.credentials.clientSecretFormat?.isBase64 || diagnostics.credentials.clientSecretFormat?.isPemFormat ? '✅ Valid' : '⚠️ Invalid format'}

ENCRYPTION TEST:
- RSA Encryption: ${diagnostics.encryptionTest.successful ? '✅ SUCCESS' : '❌ FAILED'}
- Method Used: ${diagnostics.encryptionTest.method || 'None'}
- Error: ${diagnostics.encryptionTest.error || 'None'}

NETWORK CONNECTIVITY:
- Perfect Corp API: ${diagnostics.networkConnectivity.canReach ? '✅ Reachable' : '❌ Unreachable'}
- Response Time: ${diagnostics.networkConnectivity.responseTime || 0}ms
- Status Code: ${diagnostics.networkConnectivity.status || 'N/A'}

AUTHENTICATION TEST:
- Overall Success: ${authTest.success ? '✅ SUCCESS' : '❌ FAILED'}
- Access Token Received: ${authTest.accessToken ? '✅ YES' : '❌ NO'}
- Error Message: ${authTest.error || 'None'}

RECOMMENDATIONS:
${recommendations.join('\n')}

=== END OF REPORT ===
      `;
      
      console.log(report);
      return report;
      
    } catch (error) {
      const errorReport = `
=== DIAGNOSTIC REPORT GENERATION FAILED ===
Error: ${error instanceof Error ? error.message : 'Unknown error'}
Time: ${new Date().toISOString()}

Please check network connectivity and Supabase configuration.
      `;
      
      console.error(errorReport);
      return errorReport;
    }
  }
}

export const perfectCorpDiagnostics = new PerfectCorpDiagnosticsService();
