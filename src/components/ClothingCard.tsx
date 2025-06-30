
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Star } from 'lucide-react';

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

interface ClothingCardProps {
  clothing: ClothingItem;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isCustom: boolean;
}

export function ClothingCard({
  clothing,
  onSelect,
  onEdit,
  onDelete,
  isCustom
}: ClothingCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit clicked for:', clothing.name, 'isCustom:', isCustom);
    if (onEdit) {
      onEdit();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete clicked for:', clothing.name, 'isCustom:', isCustom);
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="group relative bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-200 cursor-pointer">
      <div onClick={onSelect} className="block">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={clothing.image}
            alt={clothing.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        <div className="p-2 space-y-1">
          <h3 className="text-sm font-medium text-white truncate">{clothing.name}</h3>
          <p className="text-xs text-gray-300 truncate">{clothing.brand}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">${clothing.price}</span>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs text-gray-300">{clothing.rating}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit/delete buttons - now visible for all clothing items */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex space-x-1 opacity-100">
          {onEdit && (
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 p-0 bg-white/20 hover:bg-white/30 border-0"
              onClick={handleEdit}
              type="button"
            >
              <Edit className="w-3 h-3 text-white" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              className="h-6 w-6 p-0 bg-red-500/20 hover:bg-red-500/30 border-0"
              onClick={handleDelete}
              type="button"
            >
              <Trash2 className="w-3 h-3 text-white" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
