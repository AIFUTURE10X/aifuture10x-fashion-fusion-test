export async function downloadResultImage(imageUrl: string, maxRetries: number = 3): Promise<ArrayBuffer> {
  console.log('📥 Downloading result image from URL:', imageUrl);
  
  // If it's already a data URL, extract the base64 data
  if (imageUrl.startsWith('data:image/')) {
    console.log('🔄 Converting data URL to ArrayBuffer');
    const base64Data = imageUrl.split(',')[1];
    
    // Validate base64 data length
    console.log('📊 Base64 data length:', base64Data.length);
    if (base64Data.length < 1000) {
      throw new Error(`Data URL contains suspiciously short base64 data: ${base64Data.length} characters`);
    }
    
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('✅ Data URL converted to ArrayBuffer, size:', bytes.buffer.byteLength, 'bytes');
      return bytes.buffer;
    } catch (error) {
      throw new Error(`Failed to decode base64 data: ${error.message}`);
    }
  }
  
  // Otherwise, fetch the image from the URL with retry logic
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 Attempt ${attempt}/${maxRetries} - Fetching image from URL`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Perfect-Corp-Proxy/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      console.log('📏 Expected content length:', contentLength ? `${contentLength} bytes` : 'unknown');
      
      // Use a stream reader to ensure we get all the data
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response body reader');
      }
      
      const chunks: Uint8Array[] = [];
      let totalLength = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        totalLength += value.length;
        
        // Log progress for large downloads
        if (totalLength % 100000 === 0) {
          console.log(`📥 Downloaded ${totalLength} bytes...`);
        }
      }
      
      // Combine all chunks into a single ArrayBuffer
      const arrayBuffer = new ArrayBuffer(totalLength);
      const uint8Array = new Uint8Array(arrayBuffer);
      let offset = 0;
      
      for (const chunk of chunks) {
        uint8Array.set(chunk, offset);
        offset += chunk.length;
      }
      
      console.log('✅ Image downloaded successfully');
      console.log('📊 Final image size:', arrayBuffer.byteLength, 'bytes');
      
      // Validate minimum size
      if (arrayBuffer.byteLength < 10000) {
        throw new Error(`Downloaded image is too small: ${arrayBuffer.byteLength} bytes`);
      }
      
      return arrayBuffer;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('❌ All download attempts failed');
  throw new Error(`Failed to download result image after ${maxRetries} attempts: ${lastError?.message}`);
}
