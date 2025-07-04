
// Image utility functions for Perfect Corp API integration

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function validateImageFormat(arrayBuffer: ArrayBuffer): { valid: boolean; format?: string; error?: string } {
  const bytes = new Uint8Array(arrayBuffer);
  
  // Check for JPEG
  if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xD8) {
    return { valid: true, format: 'jpeg' };
  }
  
  // Check for PNG
  if (bytes.length >= 8 && 
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
      bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
    return { valid: true, format: 'png' };
  }
  
  // Check for WebP
  if (bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return { valid: true, format: 'webp' };
  }
  
  return { valid: false, error: 'Unsupported image format. Please use JPEG, PNG, or WebP.' };
}

export function ensureDataUrlFormat(imageData: string, mimeType: string = 'image/jpeg'): string {
  // If it's already a data URL, return as is
  if (imageData.startsWith('data:image/')) {
    return imageData;
  }
  
  // If it's raw base64, add the proper prefix
  return `data:${mimeType};base64,${imageData}`;
}

export function extractBase64FromDataUrl(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/')) {
    const base64Part = dataUrl.split(',')[1];
    return base64Part || dataUrl;
  }
  return dataUrl;
}

export function detectImageMimeTypeFromBase64(base64Data: string): string {
  try {
    const arrayBuffer = base64ToArrayBuffer(base64Data);
    const validation = validateImageFormat(arrayBuffer);
    
    if (validation.valid && validation.format) {
      switch (validation.format) {
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'webp':
          return 'image/webp';
        default:
          return 'image/jpeg';
      }
    }
  } catch (error) {
    console.warn('Failed to detect image MIME type:', error);
  }
  
  // Default fallback
  return 'image/jpeg';
}
