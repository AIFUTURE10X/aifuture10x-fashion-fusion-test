import { PERFECTCORP_BASE_URLS, API_VERSIONS, getAuthUrl, getFileApiUrl, getTryOnUrl } from './constants.ts';
import { fetchWithTimeout } from './network-utils.ts';

export interface EndpointTest {
  baseUrl: string;
  version: string;
  authUrl: string;
  fileApiUrl: string;
  tryOnUrl: string;
  working: boolean;
  error?: string;
}

export interface WorkingEndpoints {
  auth: string;
  fileApi: string;
  tryOn: string;
  baseUrl: string;
  version: string;
}

// Test all combinations of base URLs and API versions
export async function discoverWorkingEndpoints(accessToken?: string): Promise<WorkingEndpoints | null> {
  console.log('🔍 [Endpoint Discovery] Testing Perfect Corp API endpoints...');
  
  const endpointsToTest: EndpointTest[] = [];
  
  // Generate all combinations
  for (const baseUrl of PERFECTCORP_BASE_URLS) {
    for (const version of API_VERSIONS) {
      endpointsToTest.push({
        baseUrl,
        version,
        authUrl: getAuthUrl(baseUrl, version),
        fileApiUrl: getFileApiUrl(baseUrl, version),
        tryOnUrl: getTryOnUrl(baseUrl, version),
        working: false
      });
    }
  }
  
  console.log(`🎯 [Endpoint Discovery] Testing ${endpointsToTest.length} endpoint combinations...`);
  
  // Test endpoints in parallel for speed
  const testResults = await Promise.allSettled(
    endpointsToTest.map(endpoint => testEndpoint(endpoint, accessToken))
  );
  
  // Find the first working endpoint
  for (let i = 0; i < testResults.length; i++) {
    const result = testResults[i];
    if (result.status === 'fulfilled' && result.value.working) {
      const workingEndpoint = result.value;
      console.log('✅ [Endpoint Discovery] Found working endpoints:', {
        baseUrl: workingEndpoint.baseUrl,
        version: workingEndpoint.version
      });
      
      return {
        auth: workingEndpoint.authUrl,
        fileApi: workingEndpoint.fileApiUrl,
        tryOn: workingEndpoint.tryOnUrl,
        baseUrl: workingEndpoint.baseUrl,
        version: workingEndpoint.version
      };
    }
  }
  
  console.error('❌ [Endpoint Discovery] No working endpoints found');
  logEndpointTestResults(testResults);
  
  return null;
}

async function testEndpoint(endpoint: EndpointTest, accessToken?: string): Promise<EndpointTest> {
  try {
    console.log(`🧪 [Endpoint Test] Testing ${endpoint.baseUrl} (${endpoint.version})`);
    
    // Test with a simple HEAD or OPTIONS request first
    const testResponse = await fetchWithTimeout(endpoint.authUrl, {
      method: 'OPTIONS',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Perfect-Corp-S2S-Client/1.0'
      }
    }, 5000, 'endpoint test');
    
    // If we get a response (even an error), the endpoint exists
    if (testResponse.status < 500) {
      endpoint.working = true;
      console.log(`✅ [Endpoint Test] ${endpoint.baseUrl} (${endpoint.version}) is reachable`);
    } else {
      endpoint.error = `Server error: ${testResponse.status}`;
      console.log(`❌ [Endpoint Test] ${endpoint.baseUrl} (${endpoint.version}) server error: ${testResponse.status}`);
    }
    
  } catch (error) {
    endpoint.error = error.message;
    console.log(`❌ [Endpoint Test] ${endpoint.baseUrl} (${endpoint.version}) failed: ${error.message}`);
  }
  
  return endpoint;
}

function logEndpointTestResults(testResults: PromiseSettledResult<EndpointTest>[]) {
  console.log('📊 [Endpoint Discovery] Test Results Summary:');
  
  testResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const endpoint = result.value;
      const status = endpoint.working ? '✅ WORKING' : '❌ FAILED';
      const error = endpoint.error ? ` (${endpoint.error})` : '';
      console.log(`  ${status} ${endpoint.baseUrl} (${endpoint.version})${error}`);
    } else {
      console.log(`  ❌ ERROR Test ${index}: ${result.reason}`);
    }
  });
}

// Quick connectivity test for any URL
export async function testConnectivity(url: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Perfect-Corp-S2S-Client/1.0' }
    }, 3000, 'connectivity test');
    
    return response.status < 500;
  } catch {
    return false;
  }
}