
import React from 'react';
import { Button } from '@/components/ui/button';
import { Package, Upload } from 'lucide-react';

interface ClothingEmptyStateProps {
  onAddCustomClothing: () => void;
}

export function ClothingEmptyState({ onAddCustomClothing }: ClothingEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Package className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No clothing found</h3>
      <p className="text-gray-300 mb-4">
        Try adjusting your search or category filter, or add your own custom clothing.
      </p>
      <Button
        onClick={onAddCustomClothing}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        <Upload className="w-4 h-4 mr-2" />
        Add Custom Clothing
      </Button>
    </div>
  );
}
