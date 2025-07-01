
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface StyleSelectionSectionProps {
  selectedStyle: string[];
  onStyleChange: (styles: string[]) => void;
}

export const StyleSelectionSection: React.FC<StyleSelectionSectionProps> = ({
  selectedStyle,
  onStyleChange
}) => {
  const styleOptions = [
    'HOT', 'Summer', 'Winter', 'Party', 'Trendy',
    'Smart Chic', 'Edgy', 'Daily', 'Casual',
    'Dresses', 'Outfits', 'Tops',
    'Pants', 'Sets'
  ];

  const handleStyleClick = (style: string) => {
    let newSelectedStyles: string[];
    
    if (selectedStyle.includes(style)) {
      // Remove style if already selected (but keep at least one)
      if (selectedStyle.length > 1) {
        newSelectedStyles = selectedStyle.filter(s => s !== style);
      } else {
        newSelectedStyles = selectedStyle; // Don't allow removing the last style
      }
    } else {
      // Add style to selection
      newSelectedStyles = [...selectedStyle, style];
    }
    
    onStyleChange(newSelectedStyles);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        Style Categories (Select Multiple)
      </Label>
      <div className="flex flex-wrap gap-2">
        {styleOptions.map((style) => (
          <Button
            key={style}
            type="button"
            onClick={() => handleStyleClick(style)}
            variant={selectedStyle.includes(style) ? "default" : "outline"}
            size="sm"
            className={`
              text-xs px-3 py-1 rounded-full transition-all duration-200
              ${selectedStyle.includes(style)
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            {style}
          </Button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Selected: {selectedStyle.join(', ')}
      </p>
    </div>
  );
};
