
import React from 'react';
import { ClothingCard } from './ClothingCard';

interface ClothingItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  colors: string[];
  perfect_corp_ref_id?: string;
}

interface ClothingGridProps {
  customClothing: ClothingItem[];
  predefinedClothing: ClothingItem[];
  onClothingSelect: (clothing: any) => void;
  onEdit: (item: ClothingItem) => void;
  onDelete: (item: ClothingItem) => void;
  onPredefinedEdit: (item: ClothingItem) => void;
  onPredefinedDelete: (item: ClothingItem) => void;
}

export function ClothingGrid({
  customClothing,
  predefinedClothing,
  onClothingSelect,
  onEdit,
  onDelete,
  onPredefinedEdit,
  onPredefinedDelete
}: ClothingGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
      {/* Custom Clothing */}
      {customClothing.map((item) => (
        <ClothingCard
          key={`custom-${item.id}`}
          clothing={item}
          onSelect={() => onClothingSelect(item)}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
          isCustom={true}
        />
      ))}
      
      {/* Predefined Clothing */}
      {predefinedClothing.map((item) => (
        <ClothingCard
          key={`predefined-${item.id}`}
          clothing={item}
          onSelect={() => onClothingSelect(item)}
          onEdit={() => onPredefinedEdit(item)}
          onDelete={() => onPredefinedDelete(item)}
          isCustom={false}
        />
      ))}
    </div>
  );
}
