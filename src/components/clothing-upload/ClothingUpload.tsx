import React, { useCallback, useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadPhotoToSupabase } from '@/lib/supabase-upload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClothingUploadProps, ClothingItem } from './types';
import { ImageUploadSection } from './ImageUploadSection';
import { ClothingFormFields } from './ClothingFormFields';
import { PerfectCorpSection } from './PerfectCorpSection';

export const ClothingUpload: React.FC<ClothingUploadProps> = ({ onClothingAdd, onClose, editingItem }) => {
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [garmentCategory, setGarmentCategory] = useState<string>('');
  const [clothingName, setClothingName] = useState('');
  const [clothingBrand, setClothingBrand] = useState('');
  const [clothingPrice, setClothingPrice] = useState('');
  const [perfectCorpStatus, setPerfectCorpStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [perfectCorpRefId, setPerfectCorpRefId] = useState<string | null>(null);
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
      setPerfectCorpRefId(editingItem.perfect_corp_ref_id || null);
      setPerfectCorpStatus(editingItem.perfect_corp_ref_id ? 'success' : 'idle');
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
        
        // Reset Perfect Corp status when new image is uploaded
        setPerfectCorpStatus('idle');
        setPerfectCorpRefId(null);
        
        toast({
          title: "Image uploaded!",
          description: "Ready to process with Perfect Corp AI"
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
    setPerfectCorpStatus('idle');
    setPerfectCorpRefId(null);
  };

  const handlePerfectCorpUpload = async () => {
    if (!uploadedPhoto || !garmentCategory || !clothingName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setPerfectCorpStatus('uploading');
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('perfect-corp-reference-upload', {
        body: {
          imageUrl: uploadedPhoto,
          garmentCategory: garmentCategory,
          clothingName: clothingName.trim()
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Perfect Corp upload failed');
      }

      setPerfectCorpRefId(data.ref_id);
      setPerfectCorpStatus('success');
      
      toast({
        title: "Perfect Corp Upload Complete!",
        description: "Your clothing reference is ready for try-on"
      });
    } catch (err) {
      setPerfectCorpStatus('error');
      setError(err instanceof Error ? err.message : 'Perfect Corp upload failed');
      toast({
        title: "Upload Failed",
        description: "Failed to process with Perfect Corp AI. You can still add the item without AI processing.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedPhoto || !garmentCategory || !clothingName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (isSubmitting) {
      return; // Prevent double submission
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Starting form submission...', {
        editingItem: !!editingItem,
        clothingName,
        garmentCategory,
        uploadedPhoto
      });

      if (editingItem) {
        // Update existing item
        const { data, error: dbError } = await supabase
          .from('clothing_items')
          .update({
            name: clothingName.trim(),
            brand: clothingBrand.trim() || 'Custom',
            price: clothingPrice ? parseFloat(clothingPrice) : 0,
            garment_category: garmentCategory,
            supabase_image_url: uploadedPhoto,
            perfect_corp_ref_id: perfectCorpRefId,
            colors: ['custom']
          })
          .eq('id', editingItem.id)
          .select()
          .single();

        if (dbError) {
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
            perfect_corp_ref_id: data.perfect_corp_ref_id
          };

          console.log('Updated clothing item:', updatedClothing);
          onClothingAdd(updatedClothing);
        }
      } else {
        // Create new item
        const { data, error: dbError } = await supabase
          .from('clothing_items')
          .insert({
            name: clothingName.trim(),
            brand: clothingBrand.trim() || 'Custom',
            price: clothingPrice ? parseFloat(clothingPrice) : 0,
            garment_category: garmentCategory,
            supabase_image_url: uploadedPhoto,
            perfect_corp_ref_id: perfectCorpRefId,
            colors: ['custom']
          })
          .select()
          .single();

        if (dbError) {
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
            perfect_corp_ref_id: data.perfect_corp_ref_id
          };

          console.log('Created new clothing item:', newClothing);
          onClothingAdd(newClothing);
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save clothing item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto relative">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingItem ? 'Edit Clothing' : 'Add Custom Clothing'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUploadSection
              uploadedPhoto={uploadedPhoto}
              filePreview={filePreview}
              isProcessing={isProcessing}
              onDrop={onDrop}
              onRemoveImage={handleRemoveImage}
            />

            <ClothingFormFields
              clothingName={clothingName}
              setClothingName={setClothingName}
              garmentCategory={garmentCategory}
              setGarmentCategory={setGarmentCategory}
              clothingBrand={clothingBrand}
              setClothingBrand={setClothingBrand}
              clothingPrice={clothingPrice}
              setClothingPrice={setClothingPrice}
            />

            <PerfectCorpSection
              uploadedPhoto={uploadedPhoto}
              garmentCategory={garmentCategory}
              clothingName={clothingName}
              perfectCorpStatus={perfectCorpStatus}
              onPerfectCorpUpload={handlePerfectCorpUpload}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={!uploadedPhoto || !garmentCategory || !clothingName || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {editingItem ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {editingItem ? 'Update Clothing' : 'Add to Catalog'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
