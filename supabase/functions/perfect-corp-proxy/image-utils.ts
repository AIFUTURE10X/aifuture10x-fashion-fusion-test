
export async function getUserPhotoData(
  userPhoto?: string,
  userPhotoStoragePath?: string,
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<ArrayBuffer> {
  console.log('Getting user photo data...');
  
  if (userPhotoStoragePath && supabaseUrl && supabaseServiceKey) {
    console.log('Using Supabase storage path:', userPhotoStoragePath);
    
    try {
      // Construct the full Supabase storage URL
      const storageUrl = `${supabaseUrl}/storage/v1/object/public/${userPhotoStoragePath}`;
      console.log('Fetching from storage URL:', storageUrl);
      
      const response = await fetch(storageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch from storage: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Successfully fetched ${arrayBuffer.byteLength} bytes from Supabase storage`);
      
      // Validate the image data
      if (arrayBuffer.byteLength < 100) {
        throw new Error(`Image data too small: ${arrayBuffer.byteLength} bytes`);
      }
      
      // Check if it looks like valid image data (basic magic number check)
      const firstBytes = new Uint8Array(arrayBuffer.slice(0, 4));
      const isJPEG = firstBytes[0] === 0xFF && firstBytes[1] === 0xD8;
      const isPNG = firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47;
      const isWebP = firstBytes[0] === 0x52 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x46;
      
      if (!isJPEG && !isPNG && !isWebP) {
        console.warn('Image format might not be standard, first 4 bytes:', Array.from(firstBytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      } else {
        console.log('Image format validated:', isJPEG ? 'JPEG' : isPNG ? 'PNG' : 'WebP');
      }
      
      return arrayBuffer;
    } catch (error) {
      console.error('Failed to fetch from Supabase storage:', error);
      // Fall back to direct URL if storage fetch fails
    }
  }
  
  // Fallback to direct URL
  if (userPhoto) {
    console.log('Using direct photo URL:', userPhoto);
    
    try {
      const response = await fetch(userPhoto);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      // Check if it's actually an image
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}. Expected image.`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Successfully fetched ${arrayBuffer.byteLength} bytes from URL`);
      
      // Validate minimum file size (avoid empty or corrupted files)
      if (arrayBuffer.byteLength < 100) {
        throw new Error(`Image too small: ${arrayBuffer.byteLength} bytes. Minimum 100 bytes required.`);
      }
      
      return arrayBuffer;
    } catch (error) {
      console.error('Failed to fetch from URL:', error);
      throw new Error(`Image fetch failed: ${error.message}`);
    }
  }
  
  throw new Error('No valid image source provided (neither userPhoto URL nor userPhotoStoragePath)');
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  console.log(`Converting ${buffer.byteLength} bytes to base64...`);
  
  try {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    // Process in chunks to avoid stack overflow for large files
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64 = btoa(binary);
    console.log(`Base64 conversion complete: ${base64.length} characters`);
    return base64;
  } catch (error) {
    console.error('Base64 conversion failed:', error);
    throw new Error(`Base64 conversion failed: ${error.message}`);
  }
}
