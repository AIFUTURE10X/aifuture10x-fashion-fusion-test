
export interface ApiKeyValidation {
  provided: boolean;
  length: number;
  valid: boolean;
  format: boolean;
}

export interface RsaKeyValidation {
  provided: boolean;
  hasBeginHeader: boolean;
  hasEndHeader: boolean;
  length: number;
  lineBreaks: boolean;
  valid: boolean;
}

export interface ValidationResult {
  apiKey: ApiKeyValidation;
  rsaKey: RsaKeyValidation;
}

export const validateKeys = (apiKey: string, rsaKey: string): ValidationResult => {
  const cleanedKey = rsaKey.trim()
  
  return {
    apiKey: {
      provided: !!apiKey,
      length: apiKey.length,
      valid: apiKey.length > 10,
      format: /^[A-Za-z0-9]+$/.test(apiKey)
    },
    rsaKey: {
      provided: !!cleanedKey,
      hasBeginHeader: cleanedKey.includes('-----BEGIN PUBLIC KEY-----'),
      hasEndHeader: cleanedKey.includes('-----END PUBLIC KEY-----'),
      length: cleanedKey.length,
      lineBreaks: cleanedKey.includes('\n'),
      valid: cleanedKey.includes('-----BEGIN PUBLIC KEY-----') && 
             cleanedKey.includes('-----END PUBLIC KEY-----') &&
             cleanedKey.length > 400
    }
  }
}

export const formatRSAKey = (rsaKey: string): string => {
  let formatted = rsaKey.trim()
  
  // Remove any existing headers/footers to clean up
  formatted = formatted
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .trim()
  
  // Remove all whitespace and line breaks
  formatted = formatted.replace(/\s+/g, '')
  
  // Add proper headers with line breaks
  return `-----BEGIN PUBLIC KEY-----\n${formatted}\n-----END PUBLIC KEY-----`
}
