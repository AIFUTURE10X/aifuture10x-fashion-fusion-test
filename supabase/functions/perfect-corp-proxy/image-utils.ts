
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

export async function getUserPhotoData(
  userPhoto?: string, 
  userPhotoStoragePath?: string,
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<ArrayBuffer> {
  if (userPhotoStoragePath && supabaseUrl && supabaseServiceKey) {
    // Use Supabase client with admin secret to get a signed URL
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data } = await supabase.storage.from('fashionfusion').createSignedUrl(userPhotoStoragePath, 3600);
    if (data?.signedUrl) {
      const photoResponse = await fetch(data.signedUrl);
      const userData = await photoResponse.arrayBuffer();
      console.log('Fetched user photo from Supabase Storage');
      return userData;
    } else {
      throw new Error('Failed to generate signed URL for user photo');
    }
  } else if (userPhoto) {
    // Fallback: use public URL directly
    const photoResponse = await fetch(userPhoto);
    const userData = await photoResponse.arrayBuffer();
    console.log('Fetched user photo from public URL');
    return userData;
  } else {
    throw new Error('Neither userPhotoStoragePath nor userPhoto public url provided.');
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000; // 32KB per chunk is safe
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunkSize) as any
    );
  }
  return btoa(binary);
}
