
import { useState, useEffect, useCallback } from 'react';
import { uploadPhotoToSupabase } from '@/lib/supabase-upload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateFileUpload } from '@/utils/validation';
import { usePerfectCorpUpload } from '@/hooks/usePerfectCorpUpload';
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
  const [selectedStyle, setSelectedStyle] = useState<string[]>(['HOT']);
  const [perfectCorpFileId, setPerfectCorpFileId] = useState<string | null>(null);
  const [extractedImageData, setExtractedImageData] = useState<{
    url: string;
    metadata?: any;
  } | null>(null);
  const { toast } = useToast();
  const { uploadToPerfectCorp, isUploading } = usePerfectCorpUpload();

  // Pre-populate form when editing
  useEffect(() => {
    if (editingItem) {
      setClothingName(editingItem.name);
      setClothingBrand(editingItem.brand);
      setClothingPrice(editingItem.price.toString());
      setGarmentCategory(editingItem.category);
      setUploadedPhoto(editingItem.image);
      setFilePreview(editingItem.image);
      setPerfectCorpFileId(editingItem.perfect_corp_ref_id || null);
      
      // Parse style_category from the editing item if it exists
      if (editingItem.style_category) {
        const styles = editingItem.style_category.split(',').map(s => s.trim()).filter(s => s.length > 0);
        setSelectedStyle(styles.length > 0 ? styles : ['HOT']);
      } else {
        setSelectedStyle(['HOT']);
      }
    }
  }, [editingItem]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    if (file) {
      // Validate file before processing
      const validationErrors = validateFileUpload(file);
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        return;
      }

      setIsProcessing(true);
      try {
        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);

        // Upload to both Supabase (for display) and Perfect Corp (for AI processing)
        const [supabaseUrl, perfectCorpResult] = await Promise.all([
          uploadPhotoToSupabase(file, 'clothing-references'),
          uploadToPerfectCorp(file)
        ]);

        if (!perfectCorpResult?.success) {
          throw new Error('Failed to upload to Perfect Corp - required for AI processing');
        }

        setUploadedPhoto(supabaseUrl);
        setPerfectCorpFileId(perfectCorpResult.fileId);
        
        toast({
          title: "Image uploaded successfully!",
          description: file.type.includes('jpeg') || file.type.includes('jpg') 
            ? "JPG format - perfect for AI processing!" 
            : "Image converted to JPG format for optimal AI processing"
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed. Please try again with a JPG image if possible."
        );
        setFilePreview(null);
        setUploadedPhoto(null);
        setPerfectCorpFileId(null);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [toast, uploadToPerfectCorp]);

  const handleRemoveImage = () => {
    setUploadedPhoto(null);
    setFilePreview(null);
    setPerfectCorpFileId(null);
    setExtractedImageData(null);
  };

  const handleUrlImageSelect = async (imageUrl: string, metadata?: any) => {
    setError(null);
    try {
      console.log('🔗 Processing URL image:', imageUrl);
      
      // Auto-populate form fields from extracted metadata
      if (metadata) {
        if (metadata.title && !clothingName) {
          // Extract clothing name from title (remove brand and common e-commerce suffixes)
          let cleanTitle = metadata.title
            .replace(/\s*-\s*[^-]*$/g, '') // Remove " - Brand" suffix
            .replace(/\s*\|\s*[^|]*$/g, '') // Remove " | Store" suffix
            .replace(/^\w+\s+/, '') // Remove leading brand word if present
            .trim();
          setClothingName(cleanTitle.substring(0, 50)); // Limit length
        }
        
        if (metadata.brand && !clothingBrand) {
          setClothingBrand(metadata.brand);
        }
        
        if (metadata.price && !clothingPrice) {
          // Extract numeric price
          const priceMatch = metadata.price.match(/[\d.,]+/);
          if (priceMatch) {
            setClothingPrice(priceMatch[0].replace(',', ''));
          }
        }
      }

      // Store the extracted image data
      setExtractedImageData({ url: imageUrl, metadata });
      
      // Convert URL image to blob and upload it
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image from URL');
      }
      
      const blob = await response.blob();
      const file = new File([blob], 'extracted-image.jpg', { type: 'image/jpeg' });
      
      // Upload to both Supabase and Perfect Corp
      const [supabaseUrl, perfectCorpResult] = await Promise.all([
        uploadPhotoToSupabase(file, 'clothing-references'),
        uploadToPerfectCorp(file)
      ]);

      if (!perfectCorpResult?.success) {
        throw new Error('Failed to upload to Perfect Corp - required for AI processing');
      }

      setUploadedPhoto(supabaseUrl);
      setPerfectCorpFileId(perfectCorpResult.fileId);
      
      toast({
        title: "Image extracted and uploaded successfully!",
        description: metadata?.title ? `"${metadata.title.substring(0, 40)}..."` : "Ready for AI processing"
      });
      
    } catch (err) {
      console.error('❌ URL image processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image from URL');
      setExtractedImageData(null);
    }
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
        perfectCorpFileId,
        selectedStyle
      });

      const itemData = {
        name: clothingName.trim(),
        brand: clothingBrand.trim() || 'Custom',
        price: clothingPrice ? parseFloat(clothingPrice) : 0,
        garment_category: garmentCategory,
        supabase_image_url: uploadedPhoto,
        perfect_corp_ref_id: perfectCorpFileId, // Store Perfect Corp file_id
        colors: ['custom'],
        style_category: selectedStyle.join(',') // Store as comma-separated string
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
            colors: data.colors || ['custom'],
            style_category: data.style_category,
            perfect_corp_ref_id: data.perfect_corp_ref_id
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
            colors: data.colors || ['custom'],
            style_category: data.style_category,
            perfect_corp_ref_id: data.perfect_corp_ref_id
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
    isProcessing: isProcessing || isUploading,
    isSubmitting,
    error,
    garmentCategory,
    clothingName,
    clothingBrand,
    clothingPrice,
    selectedStyle,
    perfectCorpFileId,
    extractedImageData,
    
    // Setters
    setGarmentCategory,
    setClothingName,
    setClothingBrand,
    setClothingPrice,
    setSelectedStyle,
    
    // Handlers
    onDrop,
    handleRemoveImage,
    handleSubmit,
    handleUrlImageSelect
  };
};
