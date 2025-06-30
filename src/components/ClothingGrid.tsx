
import React from 'react';
import { ClothingCardComponent } from './ClothingCard';

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
}

export function ClothingGrid({
  customClothing,
  predefinedClothing,
  onClothingSelect,
  onEdit,
  onDelete
}: ClothingGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
      {/* Custom Clothing */}
      {customClothing.map((item) => (
        <ClothingCardComponent
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
        <ClothingCardComponent
          key={`predefined-${item.id}`}
          clothing={item}
          onSelect={() => onClothingSelect(item)}
          isCustom={false}
        />
      ))}
    </div>
  );
}
