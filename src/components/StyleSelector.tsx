
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface StyleSelectorProps {
  onStyleChange?: (style: string) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ onStyleChange }) => {
  const [activeStyle, setActiveStyle] = useState('HOT');

  const styleOptions = [
    'HOT', 'Summer', 'Party', 'Trendy',
    'Smart Chic', 'Edgy', 'Daily', 'Casual',
    'Dresses', 'Outfits', 'Tops',
    'Bottoms', 'Sets'
  ];

  const handleStyleClick = (style: string) => {
    setActiveStyle(style);
    onStyleChange?.(style);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg mb-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Select a Style</h3>
        <p className="text-gray-200">Clothes will be transferred to selected style</p>
      </div>
      
      <div className="flex flex-wrap gap-3 justify-center">
        {styleOptions.map((style) => (
          <Button
            key={style}
            onClick={() => handleStyleClick(style)}
            variant={activeStyle === style ? "default" : "outline"}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${activeStyle === style 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                : 'bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white'
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
