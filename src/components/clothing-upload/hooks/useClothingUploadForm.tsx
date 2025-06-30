
import { useState, useEffect, useCallback } from 'react';
import { uploadPhotoToSupabase } from '@/lib/supabase-upload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClothingItem } from '../types';

export const useClothingUploadForm = (editingItem?: ClothingItem | null) => {
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [garmentCategory, setGarmentCategory] = useState<string>('');
  const [clothingName, setClothingName] = useState('');
  const [clothingBrand, setClothingBrand] = useState('');
  const [clothingPrice, setClothingPrice] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('HOT');
  const { toast } = useToast();

  // Pre-populate form when editing
  useEffect(() => {
    if (editingItem) {
      setClothingName(editingItem.name);
      setClothingBrand(editingItem.brand);
      setClothingPrice(editingItem.price.toString());
      setGarmentCategory(editingItem.category);
      setUploadedPhoto(editingItem.image);
      setFilePreview(editingItem.image);
      // Set a default style for editing items
      setSelectedStyle('HOT');
    }
  }, [editingItem]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    if (file) {
      setIsProcessing(true);
      try {
        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);

        // Upload image to Supabase Storage
        const publicUrl = await uploadPhotoToSupabase(file, 'clothing-references');
        setUploadedPhoto(publicUrl);
        
        toast({
          title: "Image uploaded!",
          description: "Ready to add to your catalog"
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed. Please try again."
        );
        setFilePreview(null);
        setUploadedPhoto(null);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [toast]);

  const handleRemoveImage = () => {
    setUploadedPhoto(null);
    setFilePreview(null);
  };

  const handleSubmit = async (onClothingAdd: (clothing: ClothingItem) => void) => {
    if (!uploadedPhoto || !garmentCategory || !clothingName.trim()) {
      setError('Please fill in all required fields');
      return false;
    }

    if (isSubmitting) {
      return false; // Prevent double submission
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Starting form submission...', {
        editingItem: !!editingItem,
        clothingName,
        garmentCategory,
        uploadedPhoto,
        selectedStyle
      });

      const itemData = {
        name: clothingName.trim(),
        brand: clothingBrand.trim() || 'Custom',
        price: clothingPrice ? parseFloat(clothingPrice) : 0,
        garment_category: garmentCategory,
        supabase_image_url: uploadedPhoto,
        colors: ['custom'],
        style_category: selectedStyle
      };

      console.log('Item data to be saved:', itemData);

      if (editingItem) {
        // Update existing item
        const { data, error: dbError } = await supabase
          .from('clothing_items')
          .update(itemData)
          .eq('id', editingItem.id)
          .select()
          .single();

        if (dbError) {
          console.error('Database update error:', dbError);
          throw new Error(dbError.message);
        }

        if (data) {
          const updatedClothing: ClothingItem = {
            id: data.id || '',
            name: data.name || '',
            brand: data.brand || 'Custom',
            price: data.price || 0,
            image: data.supabase_image_url || '',
            category: data.garment_category || 'upper_body',
            rating: 4.5,
            colors: data.colors || ['custom']
          };

          console.log('Updated clothing item:', updatedClothing);
          onClothingAdd(updatedClothing);
        }
      } else {
        // Create new item
        const { data, error: dbError } = await supabase
          .from('clothing_items')
          .insert(itemData)
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          throw new Error(dbError.message);
        }

        if (data) {
          const newClothing: ClothingItem = {
            id: data.id || '',
            name: data.name || '',
            brand: data.brand || 'Custom',
            price: data.price || 0,
            image: data.supabase_image_url || '',
            category: data.garment_category || 'upper_body',
            rating: 4.5,
            colors: data.colors || ['custom']
          };

          console.log('Created new clothing item:', newClothing);
          onClothingAdd(newClothing);
        }
      }
      return true;
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save clothing item');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // State
    uploadedPhoto,
    filePreview,
    isProcessing,
    isSubmitting,
    error,
    garmentCategory,
    clothingName,
    clothingBrand,
    clothingPrice,
    selectedStyle,
    
    // Setters
    setGarmentCategory,
    setClothingName,
    setClothingBrand,
    setClothingPrice,
    setSelectedStyle,
    
    // Handlers
    onDrop,
    handleRemoveImage,
    handleSubmit
  };
};
