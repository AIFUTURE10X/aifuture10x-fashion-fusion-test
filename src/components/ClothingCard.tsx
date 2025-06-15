
import React from 'react';
import { Star, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ClothingCardProps {
  item: {
    id: string;
    name: string;
    brand: string;
    price: number;
    image: string;
    category: string;
    rating: number;
    colors: string[];
  };
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (item: any) => void;
}

export const ClothingCard: React.FC<ClothingCardProps> = ({
  item,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <div className="relative aspect-[3/4] bg-gray-100">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.style.backgroundColor = '#f3f4f6';
          }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
          className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-gray-900">
            Try On
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
              {item.name}
            </h3>
            <p className="text-sm text-gray-600">{item.brand}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">${item.price}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-600 ml-1">{item.rating}</span>
          </div>
          <div className="flex space-x-1">
            {item.colors.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: color === 'floral' ? '#f3f4f6' : color }}
              />
            ))}
            {item.colors.length > 3 && (
              <span className="text-xs text-gray-500 ml-1">+{item.colors.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
