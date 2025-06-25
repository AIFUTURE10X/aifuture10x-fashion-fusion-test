
export async function downloadResultImage(resultImageUrl: string): Promise<ArrayBuffer> {
  console.log('Step 5: Downloading result image...');
  console.log('Result image URL:', resultImageUrl.substring(0, 100) + '...');
  
  if (resultImageUrl.startsWith('data:')) {
    console.log('Mock mode: Converting data URL to ArrayBuffer');
    const base64 = resultImageUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  try {
    console.log('Downloading image from S2S result URL...');
    const response = await fetch(resultImageUrl);
    console.log(`S2S Download response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`S2S Download failed: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log(`Downloaded S2S image size: ${arrayBuffer.byteLength} bytes`);
    return arrayBuffer;
  } catch (error) {
    console.error('S2S Download error:', error);
    throw new Error(`S2S Image download failed: ${error.message}`);
  }
}
