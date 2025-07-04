// Network connectivity testing and enhanced fetch utilities

// Network connectivity testing
export async function testNetworkConnectivity(): Promise<boolean> {
  try {
    console.log('🔍 Testing network connectivity to Perfect Corp...');
    
    // Test basic DNS resolution first
    const dnsTest = await fetch('https://dns.google/resolve?name=api.perfectcorp.com&type=A', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!dnsTest.ok) {
      console.error('❌ DNS resolution failed for Perfect Corp domain');
      return false;
    }
    
    const dnsResult = await dnsTest.json();
    console.log('✅ DNS resolution successful:', dnsResult.Answer?.length || 0, 'records');
    
    // Test basic HTTPS connectivity
    const connectTest = await fetch('https://api.perfectcorp.com', {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Perfect-Corp-S2S-Client/1.0',
        'Accept': '*/*'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log('✅ Network connectivity test completed:', connectTest.status);
    return true;
    
  } catch (error) {
    console.error('❌ Network connectivity test failed:', error.message);
    return false;
  }
}

// Enhanced fetch with timeout and better network handling
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs: number = 30000,
  context: string = 'request'
): Promise<Response> {
  console.log(`🌐 [${context}] Making request to: ${url}`);
  console.log(`🔧 [${context}] Request options:`, {
    method: options.method,
    headers: Object.keys(options.headers || {}),
    bodyType: options.body ? typeof options.body : 'none',
    timeout: timeoutMs
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`⏰ [${context}] Request timeout after ${timeoutMs}ms`);
    controller.abort();
  }, timeoutMs);

  try {
    // Enhanced request configuration for Deno environment
    const enhancedOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Perfect-Corp-S2S-Client/1.0',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        ...options.headers
      },
      // Add explicit SSL/TLS settings
      keepalive: true
    };

    const response = await fetch(url, enhancedOptions);
    clearTimeout(timeoutId);
    
    console.log(`📥 [${context}] Response received:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`🚨 [${context}] Network error details:`, {
      name: error.name,
      message: error.message,
      cause: error.cause,
      stack: error.stack?.substring(0, 200)
    });
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout: ${context} took longer than ${timeoutMs}ms`);
    }
    
    // Enhanced error classification
    if (error.message.includes('ENOTFOUND') || error.message.includes('DNS')) {
      throw new Error(`DNS resolution failed for ${url}: ${error.message}`);
    }
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connection refused')) {
      throw new Error(`Connection refused by ${url}: ${error.message}`);
    }
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      throw new Error(`SSL/TLS error connecting to ${url}: ${error.message}`);
    }
    
    throw new Error(`Network error connecting to ${url}: ${error.message}`);
  }
}