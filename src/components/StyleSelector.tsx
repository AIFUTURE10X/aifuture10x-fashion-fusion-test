import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface StyleSelectorProps {
  onStyleChange?: (styles: string[]) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ onStyleChange }) => {
  const [activeStyles, setActiveStyles] = useState<string[]>(['All']);

  const styleOptions = [
    'All', 'HOT', 'Summer', 'Party', 'Trendy',
    'Smart Chic', 'Edgy', 'Daily', 'Casual',
    'Dresses', 'Outfits', 'Tops',
    'Bottoms', 'Sets'
  ];

  // Map style selections to clothing categories
  const getClothingCategories = (styles: string[]): string[] => {
    // If "All" is selected, return ['all'] to show everything
    if (styles.includes('All')) {
      return ['all'];
    }
    
    const categories: string[] = [];
    
    styles.forEach(style => {
      switch (style.toLowerCase()) {
        case 'dresses':
          if (!categories.includes('full_body')) categories.push('full_body');
          break;
        case 'tops':
          if (!categories.includes('upper_body')) categories.push('upper_body');
          break;
        case 'bottoms':
          if (!categories.includes('lower_body')) categories.push('lower_body');
          break;
        case 'sets':
          if (!categories.includes('full_body')) categories.push('full_body');
          break;
        default:
          // For general styles like HOT, Summer, etc., we pass the style name directly for filtering
          if (!categories.includes(style)) categories.push(style);
          break;
      }
    });
    
    return categories;
  };

  const handleStyleClick = (style: string) => {
    let newActiveStyles: string[];
    
    if (style === 'All') {
      // If "All" is clicked, select only "All"
      newActiveStyles = ['All'];
    } else {
      // Remove "All" if it was selected and add the new style
      const filteredStyles = activeStyles.filter(s => s !== 'All');
      
      if (filteredStyles.includes(style)) {
        // Remove style if already selected (but keep at least one)
        if (filteredStyles.length > 1) {
          newActiveStyles = filteredStyles.filter(s => s !== style);
        } else {
          newActiveStyles = ['All']; // If removing the last style, default to "All"
        }
      } else {
        // Add style to selection
        newActiveStyles = [...filteredStyles, style];
      }
    }
    
    setActiveStyles(newActiveStyles);
    const categories = getClothingCategories(newActiveStyles);
    console.log('Selected styles:', newActiveStyles, 'Category filters:', categories);
    onStyleChange?.(categories);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg mb-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Select Styles</h3>
        <p className="text-gray-200">Choose multiple styles to filter your clothing collection</p>
        <p className="text-sm text-gray-300 mt-1">
          Selected: {activeStyles.join(', ')}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-3 justify-center">
        {styleOptions.map((style) => (
          <Button
            key={style}
            onClick={() => handleStyleClick(style)}
            variant={activeStyles.includes(style) ? "default" : "outline"}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${activeStyles.includes(style)
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
