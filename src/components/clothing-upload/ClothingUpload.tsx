
import React from 'react';
import { ClothingUploadProps } from './types';
import { ClothingUploadModal } from './ClothingUploadModal';
import { ClothingUploadForm } from './ClothingUploadForm';
import { useClothingUploadForm } from './hooks/useClothingUploadForm';

export const ClothingUpload: React.FC<ClothingUploadProps> = ({ onClothingAdd, onClose, editingItem }) => {
  const {
    uploadedPhoto,
    filePreview,
    isProcessing,
    isSubmitting,
    error,
    garmentCategory,
    clothingName,
    clothingBrand,
    clothingPrice,
    setGarmentCategory,
    setClothingName,
    setClothingBrand,
    setClothingPrice,
    onDrop,
    handleRemoveImage,
    handleSubmit
  } = useClothingUploadForm(editingItem);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleSubmit(onClothingAdd);
    if (success) {
      onClose();
    }
  };

  return (
    <ClothingUploadModal
      title={editingItem ? 'Edit Clothing' : 'Add Custom Clothing'}
      onClose={onClose}
    >
      <ClothingUploadForm
        uploadedPhoto={uploadedPhoto}
        filePreview={filePreview}
        isProcessing={isProcessing}
        isSubmitting={isSubmitting}
        error={error}
        garmentCategory={garmentCategory}
        clothingName={clothingName}
        clothingBrand={clothingBrand}
        clothingPrice={clothingPrice}
        editingItem={editingItem}
        onDrop={onDrop}
        onRemoveImage={handleRemoveImage}
        onSubmit={handleFormSubmit}
        onClose={onClose}
        setGarmentCategory={setGarmentCategory}
        setClothingName={setClothingName}
        setClothingBrand={setClothingBrand}
        setClothingPrice={setClothingPrice}
      />
    </ClothingUploadModal>
  );
};
