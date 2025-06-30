import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface StyleSelectorProps {
  onStyleChange?: (styles: string[]) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ onStyleChange }) => {
  const [activeStyle, setActiveStyle] = useState<string>('');

  const styleOptions = [
    'All', 'HOT', 'Summer', 'Party', 'Trendy',
    'Smart Chic', 'Edgy', 'Daily', 'Casual',
    'Dresses', 'Outfits', 'Tops', 'Pants'
  ];

  // Map style selections to clothing categories
  const getClothingCategories = (style: string): string[] => {
    // If no style is selected or "All" is selected, return ['all'] to show everything
    if (style === 'All' || style === '') {
      return ['all'];
    }
    
    const categories: string[] = [];
    
    switch (style.toLowerCase()) {
      case 'outfits':
        // Outfits should map to full_body category and also pass the style name
        categories.push('full_body');
        categories.push('Outfits');
        break;
      case 'dresses':
        categories.push('full_body');
        categories.push('Dresses');
        break;
      case 'tops':
        categories.push('upper_body');
        categories.push('Tops');
        break;
      case 'pants':
        categories.push('lower_body');
        categories.push('Pants');
        break;
      default:
        // For general styles like HOT, Summer, etc., we pass the style name directly for filtering
        categories.push(style);
        break;
    }
    
    return categories;
  };

  const handleStyleClick = (style: string) => {
    console.log('Style clicked:', style, 'Previous active style:', activeStyle);
    setActiveStyle(style);
    const categories = getClothingCategories(style);
    console.log('Selected style:', style, 'Category filters:', categories);
    onStyleChange?.(categories);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg mb-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Select Styles</h3>
        <p className="text-gray-200">Choose a style to filter your clothing collection</p>
        <p className="text-sm text-gray-300 mt-1">
          Selected: {activeStyle || 'None'}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-3 justify-center">
        {styleOptions.map((style) => (
          <Button
            key={style}
            onClick={() => handleStyleClick(style)}
            variant={activeStyle === style ? "default" : "outline"}
          >
            {style}
          </Button>
        ))}
      </div>
    </div>
  );
};
