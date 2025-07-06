
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadSection } from './ImageUploadSection';
import { ClothingFormFields } from './ClothingFormFields';
import { StyleSelectionSection } from './StyleSelectionSection';

interface ClothingUploadFormProps {
  uploadedPhoto: string | null;
  filePreview: string | null;
  isProcessing: boolean;
  isSubmitting: boolean;
  error: string | null;
  garmentCategory: string;
  clothingName: string;
  clothingBrand: string;
  clothingPrice: string;
  selectedStyle: string[];
  editingItem: any;
  onDrop: (acceptedFiles: File[]) => void;
  onRemoveImage: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  setGarmentCategory: (value: string) => void;
  setClothingName: (value: string) => void;
  setClothingBrand: (value: string) => void;
  setClothingPrice: (value: string) => void;
  setSelectedStyle: (styles: string[]) => void;
  handleUrlImageSelect?: (imageUrl: string, metadata?: any) => void;
  extractedImageData?: { url: string; metadata?: any; } | null;
}

export const ClothingUploadForm: React.FC<ClothingUploadFormProps> = ({
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
  editingItem,
  onDrop,
  onRemoveImage,
  onSubmit,
  onClose,
  setGarmentCategory,
  setClothingName,
  setClothingBrand,
  setClothingPrice,
  setSelectedStyle,
  handleUrlImageSelect,
  extractedImageData
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <ImageUploadSection
        uploadedPhoto={uploadedPhoto}
        filePreview={filePreview}
        isProcessing={isProcessing}
        onDrop={onDrop}
        onRemoveImage={onRemoveImage}
        onUrlImageSelect={handleUrlImageSelect}
        extractedImageData={extractedImageData}
      />

      <StyleSelectionSection
        selectedStyle={selectedStyle}
        onStyleChange={setSelectedStyle}
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 text-sm py-2"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm py-2"
          disabled={!uploadedPhoto || !garmentCategory || !clothingName || isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
              {editingItem ? 'Updating...' : 'Adding...'}
            </div>
          ) : (
            <>
              <Check className="w-3 h-3 mr-1" />
              {editingItem ? 'Update Clothing' : 'Add to Catalog'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
