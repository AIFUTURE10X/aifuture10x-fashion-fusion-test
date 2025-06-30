
import React, { useState } from 'react';
import { ClothingUpload } from '@/components/clothing-upload/ClothingUpload';
import { type ClothingItem } from './ClothingData';
import { useClothingCatalog } from '@/hooks/useClothingCatalog';
import { AddClothingButton } from './AddClothingButton';
import { ClothingCatalogContent } from './ClothingCatalogContent';

interface ClothingCatalogProps {
  onClothingSelect: (clothing: any) => void;
  styleFilter?: string[];
}

export const ClothingCatalog: React.FC<ClothingCatalogProps> = ({ 
  onClothingSelect, 
  styleFilter = ['all'] 
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);

  const {
    customClothing,
    filteredClothing,
    handleCustomClothingAdd,
    handleDelete
  } = useClothingCatalog(styleFilter);

  const handleEdit = (item: ClothingItem) => {
    console.log('Editing custom item:', item);
    setEditingItem(item);
    setShowUploadModal(true);
  };

  const handleAddCustomClothing = () => {
    console.log('Opening upload modal for new clothing');
    setEditingItem(null);
    setShowUploadModal(true);
  };

  const handleClothingAdd = (newClothing: ClothingItem) => {
    handleCustomClothingAdd(newClothing, editingItem);
    setShowUploadModal(false);
    setEditingItem(null);
  };

  const handleCloseModal = () => {
    console.log('Closing upload modal');
    setShowUploadModal(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <AddClothingButton onAddCustomClothing={handleAddCustomClothing} />

      <ClothingCatalogContent
        filteredClothing={filteredClothing}
        customClothing={customClothing}
        onClothingSelect={onClothingSelect}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddCustomClothing={handleAddCustomClothing}
      />

      {showUploadModal && (
        <ClothingUpload
          onClothingAdd={handleClothingAdd}
          onClose={handleCloseModal}
          editingItem={editingItem}
        />
      )}
    </div>
  );
};
