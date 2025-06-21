
import { supabase } from "@/integrations/supabase/client";

export async function uploadPhotoToSupabase(
  file: File, 
  bucket: string = 'fashionfusion'
): Promise<string> {
  console.log(`Starting upload to ${bucket}...`);
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  console.log(`Generated filename: ${fileName}`);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error(`Upload error to ${bucket}:`, error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  console.log(`Upload successful to ${bucket}:`, data);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL');
  }

  console.log(`Public URL generated: ${urlData.publicUrl}`);
  return urlData.publicUrl;
}
