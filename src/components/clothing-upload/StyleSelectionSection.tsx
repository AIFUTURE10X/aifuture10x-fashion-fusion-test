
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface StyleSelectionSectionProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
}

export const StyleSelectionSection: React.FC<StyleSelectionSectionProps> = ({
  selectedStyle,
  onStyleChange
}) => {
  const styleOptions = [
    'HOT', 'Summer', 'Party', 'Trendy',
    'Smart Chic', 'Edgy', 'Daily', 'Casual',
    'Dresses', 'Outfits', 'Tops',
    'Bottoms', 'Sets'
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        Style Category
      </Label>
      <div className="flex flex-wrap gap-2">
        {styleOptions.map((style) => (
          <Button
            key={style}
            type="button"
            onClick={() => onStyleChange(style)}
            variant={selectedStyle === style ? "default" : "outline"}
            size="sm"
            className={`
              text-xs px-3 py-1 rounded-full transition-all duration-200
              ${selectedStyle === style 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            {style}
          </Button>
        ))}
      </div>
    </div>
  );
};
