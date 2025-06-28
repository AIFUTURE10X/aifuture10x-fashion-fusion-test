
export function validateCredentials(apiKey: string, apiSecret: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!apiKey || apiKey.length < 10) {
    issues.push('Invalid API key - must be at least 10 characters');
  }
  
  if (!apiSecret || apiSecret.length < 50) {
    issues.push('Invalid API secret - must be at least 50 characters');
  }
  
  // Enhanced validation for RSA key format
  if (apiSecret) {
    const hasBeginMarker = apiSecret.includes('BEGIN');
    const hasEndMarker = apiSecret.includes('END');
    const isBase64Only = !hasBeginMarker && !hasEndMarker && apiSecret.match(/^[A-Za-z0-9+/=\s\n\r-]+$/);
    
    if (!hasBeginMarker && !isBase64Only) {
      issues.push('API secret must be either a PEM format RSA key (with BEGIN/END markers) or pure base64');
    }
    
    // Check for common RSA key indicators
    if (hasBeginMarker && !apiSecret.includes('PUBLIC KEY')) {
      issues.push('RSA key should contain "PUBLIC KEY" markers');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}
