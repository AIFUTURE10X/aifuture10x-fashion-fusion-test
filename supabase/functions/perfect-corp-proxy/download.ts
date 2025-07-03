export async function downloadResultImage(imageUrl: string): Promise<ArrayBuffer> {
  console.log('📥 Downloading result image from URL:', imageUrl);
  
  // If it's already a data URL, extract the base64 data
  if (imageUrl.startsWith('data:image/')) {
    console.log('🔄 Converting data URL to ArrayBuffer');
    const base64Data = imageUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  // Otherwise, fetch the image from the URL
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('✅ Image downloaded successfully, size:', arrayBuffer.byteLength, 'bytes');
    
    return arrayBuffer;
  } catch (error) {
    console.error('❌ Failed to download result image:', error);
    throw new Error(`Failed to download result image: ${error.message}`);
  }
}
