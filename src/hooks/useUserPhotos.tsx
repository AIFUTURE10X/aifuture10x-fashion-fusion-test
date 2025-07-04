import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserPhoto {
  id: string;
  original_image_url: string;
  perfect_corp_file_id: string | null;
  upload_status: string;
  created_at: string;
}

export const useUserPhotos = () => {
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('user_photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
      toast({
        title: "Error",
        description: "Failed to load photos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePhoto = async (imageUrl: string, perfectCorpFileId?: string) => {
    try {
      const { data, error } = await supabase
        .from('user_photos')
        .insert({
          original_image_url: imageUrl,
          perfect_corp_file_id: perfectCorpFileId || null,
          upload_status: perfectCorpFileId ? 'uploaded' : 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      setPhotos(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error saving photo:', error);
      toast({
        title: "Error",
        description: "Failed to save photo",
        variant: "destructive"
      });
      return null;
    }
  };

  const updatePhotoStatus = async (photoId: string, perfectCorpFileId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('user_photos')
        .update({
          perfect_corp_file_id: perfectCorpFileId,
          upload_status: status
        })
        .eq('id', photoId);

      if (error) throw error;
      
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId 
          ? { ...photo, perfect_corp_file_id: perfectCorpFileId, upload_status: status }
          : photo
      ));
    } catch (error) {
      console.error('Error updating photo status:', error);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  return {
    photos,
    isLoading,
    savePhoto,
    updatePhotoStatus,
    reloadPhotos: loadPhotos
  };
};