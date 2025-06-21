
export interface TryOnRequest {
  userPhoto?: string; // legacy: public URL
  userPhotoStoragePath?: string; // new: storage path
  clothingImage: string; // This will be either style_id OR ref_id
  clothingCategory: string;
  isCustomClothing?: boolean; // new: indicates if using custom clothing
  perfectCorpRefId?: string; // new: Perfect Corp reference ID
}

export interface AuthResult {
  accessToken: string;
}

export interface ProcessParams {
  userPhoto?: string;
  userPhotoStoragePath?: string;
  clothingImage: string;
  clothingCategory: string;
  isCustomClothing?: boolean;
  perfectCorpRefId?: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
}
