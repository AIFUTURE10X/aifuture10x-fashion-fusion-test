// Image validation and processing utilities

interface ImageValidationResult {
  valid: boolean;
  error?: string;
  processedData?: ArrayBuffer;
}

export async function validateAndProcessImage(imageData: string): Promise<ImageValidationResult> {
  try {
    // Convert base64 to ArrayBuffer
    let base64Data: string;
    if (imageData.startsWith('data:image/')) {
      base64Data = imageData.split(',')[1];
    } else {
      base64Data = imageData;
    }
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const arrayBuffer = bytes.buffer;
    
    // Basic size validation (10MB limit)
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      return { valid: false, error: 'Image too large. Maximum size is 10MB.' };
    }
    
    // Minimum size validation
    if (arrayBuffer.byteLength < 1024) {
      return { valid: false, error: 'Image too small. Please use a larger image.' };
    }
    
    return { valid: true, processedData: arrayBuffer };
  } catch (error) {
    console.error('Image validation error:', error);
    return { valid: false, error: 'Invalid image format. Please use JPG, JPEG, or PNG.' };
  }
}