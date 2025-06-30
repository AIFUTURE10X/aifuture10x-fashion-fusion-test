
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface AddClothingButtonProps {
  onAddCustomClothing: () => void;
}

export const AddClothingButton: React.FC<AddClothingButtonProps> = ({ onAddCustomClothing }) => {
  return (
    <div className="flex justify-center">
      <Button
        onClick={onAddCustomClothing}
        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
      >
        <Upload className="w-5 h-5 mr-2" />
        Add Custom Clothing
      </Button>
    </div>
  );
};
