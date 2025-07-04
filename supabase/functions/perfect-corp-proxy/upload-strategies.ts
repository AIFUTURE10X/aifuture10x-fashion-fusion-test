
import { PERFECTCORP_BASE_URL } from './constants.ts';

// Enhanced retry logic with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = 'operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [${context}] Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`❌ [${context}] Attempt ${attempt} failed:`, error.message);
      
      // Don't retry on certain types of errors
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('400')) {
        console.log(`🚫 [${context}] Not retrying due to client error`);
        break;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`⏱️ [${context}] Waiting ${Math.round(delay)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Enhanced fetch with timeout
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs: number = 30000,
  context: string = 'request'
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`⏰ [${context}] Request timeout after ${timeoutMs}ms`);
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout: ${context} took longer than ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Strategy 1: Enhanced reference upload pattern with retry logic
export async function tryReferenceUploadPattern(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Using enhanced reference upload pattern for user photo...');
  console.log('📊 Image data size:', userPhotoData.byteLength, 'bytes');
  
  const uploadRequestUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file`;
  
  console.log('🔗 Upload request endpoint:', uploadRequestUrl);
  console.log('🔑 Token preview:', accessToken.substring(0, 15) + '...');
  
  // Step 1: Request upload URL with retry logic
  const uploadCredentials = await retryWithBackoff(async () => {
    console.log('📋 Requesting upload credentials from Perfect Corp...');
    
    const uploadRequestResponse = await fetchWithTimeout(uploadRequestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Perfect-Corp-S2S-Client/1.0',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        files: [
          {
            content_type: 'image/jpeg',
            file_name: 'user_photo.jpg'
          }
        ]
      }),
    }, 15000, 'upload request');

    console.log(`📥 Upload request response: ${uploadRequestResponse.status} ${uploadRequestResponse.statusText}`);
    
    if (!uploadRequestResponse.ok) {
      const errorText = await uploadRequestResponse.text();
      console.error('❌ Upload request failed:', uploadRequestResponse.status, errorText);
      
      // Enhanced error parsing
      let errorMessage = `Upload request failed: ${uploadRequestResponse.status}`;
      try {
        const errorData = JSON.parse(errorText);
        console.error('🔍 Parsed error:', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        console.error('🔍 Raw error text:', errorText);
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const uploadRequestData = await uploadRequestResponse.json();
    console.log('📦 Upload request response data:', uploadRequestData);
    
    const uploadResult = uploadRequestData.result || uploadRequestData;
    const uploadUrl = uploadResult.files?.[0]?.url;
    const fileId = uploadResult.files?.[0]?.file_id;

    if (!uploadUrl || !fileId) {
      console.error('❌ Missing upload URL or file_id:', uploadRequestData);
      throw new Error('No upload URL or file_id received from Perfect Corp API');
    }

    console.log('✅ Received upload credentials:', { 
      fileId, 
      uploadUrlLength: uploadUrl.length,
      uploadUrlPreview: uploadUrl.substring(0, 50) + '...'
    });
    
    return { uploadUrl, fileId };
  }, 3, 2000, 'upload credentials');

  // Step 2: Upload actual image data to signed URL with retry logic
  await retryWithBackoff(async () => {
    console.log('📤 Uploading image data to signed URL...');
    
    const imageUploadResponse = await fetchWithTimeout(uploadCredentials.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': userPhotoData.byteLength.toString()
      },
      body: userPhotoData,
    }, 30000, 'image upload');

    console.log(`📥 Image upload response: ${imageUploadResponse.status} ${imageUploadResponse.statusText}`);

    if (!imageUploadResponse.ok) {
      const errorText = await imageUploadResponse.text();
      console.error('❌ Image upload to signed URL failed:', imageUploadResponse.status, errorText);
      throw new Error(`Image upload failed: ${imageUploadResponse.status} - ${errorText}`);
    }
    
    console.log('✅ Image data uploaded successfully to signed URL');
  }, 3, 1500, 'image upload');

  console.log('🎉 User photo uploaded successfully using enhanced reference pattern, file_id:', uploadCredentials.fileId);
  return uploadCredentials.fileId;
}

// Strategy 2: Enhanced multipart form data approach with retry logic
export async function tryMultipartUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Trying enhanced multipart form data upload...');
  console.log('📊 Image data size:', userPhotoData.byteLength, 'bytes');
  
  const uploadUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file/upload`;
  
  return await retryWithBackoff(async () => {
    const formData = new FormData();
    formData.append('file', new Blob([userPhotoData], { type: 'image/jpeg' }), 'user_photo.jpg');
    
    const uploadResponse = await fetchWithTimeout(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Perfect-Corp-S2S-Client/1.0'
      },
      body: formData,
    }, 25000, 'multipart upload');

    console.log(`📥 Multipart upload response: ${uploadResponse.status} ${uploadResponse.statusText}`);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Multipart upload failed:', uploadResponse.status, errorText);
      throw new Error(`Multipart upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('📦 Multipart upload response:', uploadResult);
    
    const fileId = uploadResult.file_id || uploadResult.result?.file_id || uploadResult.id;
    
    if (!fileId) {
      console.error('❌ No file_id in multipart response:', uploadResult);
      throw new Error('No file_id received from multipart upload');
    }

    console.log('🎉 Multipart upload successful, file_id:', fileId);
    return fileId;
  }, 3, 2000, 'multipart upload');
}

// Strategy 3: Enhanced minimal headers approach with retry logic
export async function tryMinimalUpload(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('📤 Trying enhanced minimal headers upload...');
  console.log('📊 Image data size:', userPhotoData.byteLength, 'bytes');
  
  const uploadRequestUrl = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file`;
  
  return await retryWithBackoff(async () => {
    // Step 1: Request upload URL with minimal headers
    const uploadRequestResponse = await fetchWithTimeout(uploadRequestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: [{
          content_type: 'image/jpeg',
          file_name: 'photo.jpg'
        }]
      }),
    }, 15000, 'minimal upload request');

    if (!uploadRequestResponse.ok) {
      const errorText = await uploadRequestResponse.text();
      throw new Error(`Minimal upload request failed: ${uploadRequestResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadRequestResponse.json();
    const uploadUrl = uploadData.result?.files?.[0]?.url;
    const fileId = uploadData.result?.files?.[0]?.file_id;

    if (!uploadUrl || !fileId) {
      throw new Error('Missing upload URL or file_id in minimal response');
    }

    // Step 2: Upload with minimal headers
    const imageResponse = await fetchWithTimeout(uploadUrl, {
      method: 'PUT',
      body: userPhotoData,
    }, 25000, 'minimal image upload');

    if (!imageResponse.ok) {
      throw new Error(`Minimal image upload failed: ${imageResponse.status}`);
    }

    console.log('🎉 Minimal upload successful, file_id:', fileId);
    return fileId;
  }, 3, 1500, 'minimal upload');
}
