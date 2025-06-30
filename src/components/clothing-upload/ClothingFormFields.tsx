
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { garmentCategories } from './constants';

interface ClothingFormFieldsProps {
  clothingName: string;
  setClothingName: (value: string) => void;
  garmentCategory: string;
  setGarmentCategory: (value: string) => void;
  clothingBrand: string;
  setClothingBrand: (value: string) => void;
  clothingPrice: string;
  setClothingPrice: (value: string) => void;
}

export const ClothingFormFields: React.FC<ClothingFormFieldsProps> = ({
  clothingName,
  setClothingName,
  garmentCategory,
  setGarmentCategory,
  clothingBrand,
  setClothingBrand,
  clothingPrice,
  setClothingPrice
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="clothingName" className="text-sm font-medium text-gray-700">
          Clothing Name *
        </Label>
        <Input
          id="clothingName"
          value={clothingName}
          onChange={(e) => setClothingName(e.target.value)}
          placeholder="e.g., Blue Denim Jacket"
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="garmentCategory" className="text-sm font-medium text-gray-700">
          Garment Category *
        </Label>
        <Select value={garmentCategory} onValueChange={setGarmentCategory} required>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {garmentCategories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center space-x-2">
                  <category.icon className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{category.label}</div>
                    <div className="text-xs text-gray-500">{category.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clothingBrand" className="text-sm font-medium text-gray-700">
            Brand
          </Label>
          <Input
            id="clothingBrand"
            value={clothingBrand}
            onChange={(e) => setClothingBrand(e.target.value)}
            placeholder="e.g., Nike"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="clothingPrice" className="text-sm font-medium text-gray-700">
            Price ($)
          </Label>
          <Input
            id="clothingPrice"
            type="number"
            step="0.01"
            value={clothingPrice}
            onChange={(e) => setClothingPrice(e.target.value)}
            placeholder="0.00"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};
