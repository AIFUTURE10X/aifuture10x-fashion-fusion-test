
import React from 'react';
import { ClothingGrid } from './ClothingGrid';
import { ClothingEmptyState } from './ClothingEmptyState';
import { type ClothingItem } from './ClothingData';

interface ClothingCatalogContentProps {
  filteredClothing: ClothingItem[];
  customClothing: ClothingItem[];
  onClothingSelect: (clothing: any) => void;
  onEdit: (item: ClothingItem) => void;
  onDelete: (item: ClothingItem) => void;
  onAddCustomClothing: () => void;
}

export const ClothingCatalogContent: React.FC<ClothingCatalogContentProps> = ({
  filteredClothing,
  customClothing,
  onClothingSelect,
  onEdit,
  onDelete,
  onAddCustomClothing
}) => {
  if (filteredClothing.length > 0) {
    return (
      <ClothingGrid
        customClothing={filteredClothing}
        predefinedClothing={[]}
        onClothingSelect={onClothingSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        onPredefinedEdit={() => {}}
        onPredefinedDelete={() => {}}
      />
    );
  }

  if (customClothing.length > 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white text-lg mb-4">No items found for the selected style categories</p>
        <p className="text-gray-300">Try selecting different styles or add more clothing items</p>
      </div>
    );
  }

  return <ClothingEmptyState onAddCustomClothing={onAddCustomClothing} />;
};
