// Image upload to Perfect Corp File API

import { validateAndProcessImage } from './image-validation.ts';
import { uploadUserPhoto } from './file-upload.ts';

export async function uploadImageToFileAPI(accessToken: string, imageUrl: string, fileName: string): Promise<string> {
  console.log('📤 Uploading image to Perfect Corp File API...');
  console.log('🖼️ Image URL type:', imageUrl.startsWith('data:') ? 'Base64 Data URL' : 'HTTP URL');
  console.log('🖼️ Image URL length:', imageUrl.length);
  
  try {
    let imageData: ArrayBuffer;
    
    if (imageUrl.startsWith('data:image/')) {
      console.log('🔄 Processing base64 data URL...');
      // Base64 data URL
      const validation = await validateAndProcessImage(imageUrl);
      if (!validation.valid) {
        throw new Error(validation.error || 'Image validation failed');
      }
      imageData = validation.processedData!;
      console.log('✅ Base64 data processed successfully, size:', imageData.byteLength, 'bytes');
      
    } else if (imageUrl.startsWith('http')) {
      console.log('🔄 Fetching image from URL...');
      
      // Enhanced URL fetching with timeout and retry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const response = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Perfect-Corp-Proxy/1.0',
            'Accept': 'image/*',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log('📋 Response content-type:', contentType);
        console.log('📊 Response content-length:', response.headers.get('content-length'));
        
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error(`Invalid content type: ${contentType}. Expected image/*`);
        }
        
        imageData = await response.arrayBuffer();
        console.log('✅ Image fetched successfully from URL, size:', imageData.byteLength, 'bytes');
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Image fetch timeout: URL took too long to respond');
        }
        throw fetchError;
      }
      
    } else {
      throw new Error('Invalid image format. Expected data URL (data:image/*) or HTTP URL (http/https).');
    }
    
    // Validate image size
    if (imageData.byteLength === 0) {
      throw new Error('Image data is empty');
    }
    
    if (imageData.byteLength > 10 * 1024 * 1024) {
      throw new Error(`Image too large: ${(imageData.byteLength / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`);
    }
    
    if (imageData.byteLength < 1024) {
      throw new Error(`Image too small: ${imageData.byteLength} bytes. Minimum size is 1KB.`);
    }
    
    console.log('📊 Final image data size:', imageData.byteLength, 'bytes');
    console.log('📋 File name for upload:', fileName);
    
    // Upload using the enhanced file upload strategy with retry logic
    const fileId = await uploadUserPhoto(accessToken, imageData);
    console.log('✅ Image uploaded successfully to Perfect Corp, file_id:', fileId);
    
    return fileId;
    
  } catch (error) {
    console.error('❌ Image upload process failed:', error);
    console.error('📋 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    // Enhanced error categorization
    let errorMessage = error.message;
    if (errorMessage.includes('fetch')) {
      errorMessage = `Network error while fetching image: ${errorMessage}`;
    } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      errorMessage = `Request timeout: ${errorMessage}`;
    } else if (errorMessage.includes('validation')) {
      errorMessage = `Image validation failed: ${errorMessage}`;
    }
    
    throw new Error(`Image upload failed: ${errorMessage}`);
  }
}