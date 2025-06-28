
export function validateCredentials(apiKey: string, apiSecret: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!apiKey || apiKey.length < 10) {
    issues.push('Invalid API key - must be at least 10 characters');
  }
  
  if (!apiSecret || apiSecret.length < 100) {
    issues.push('Invalid API secret - RSA key must be at least 100 characters');
  }
  
  // Additional validation for RSA key format
  if (apiSecret && !apiSecret.includes('BEGIN') && !apiSecret.match(/^[A-Za-z0-9+/=\s\n\r-]+$/)) {
    issues.push('API secret does not appear to be a valid RSA key format');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}
