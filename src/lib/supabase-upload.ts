
import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads a file to the "user-photos" bucket in Supabase and returns the public URL.
 * The returned URL is always public (bucket is public).
 * Throws error on failure.
 */
export async function uploadPhotoToSupabase(file: File): Promise<string> {
  // Use a unique file name to avoid collisions
  const fileExt = file.name.split('.').pop();
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const filePath = `uploads/${uniqueId}.${fileExt}`;

  // Upload file
  const { error } = await supabase.storage
    .from("user-photos")
    .upload(filePath, file, { upsert: true });

  if (error) throw new Error(error.message);

  // Get public URL
  const { data } = supabase.storage
    .from("user-photos")
    .getPublicUrl(filePath);

  if (!data || !data.publicUrl) {
    throw new Error("Could not retrieve uploaded image URL.");
  }

  return data.publicUrl;
}
