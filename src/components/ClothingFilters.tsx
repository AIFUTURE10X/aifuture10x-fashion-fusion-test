
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface ClothingFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
}

export function ClothingFilters({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  priceRange,
  setPriceRange
}: ClothingFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Input
        type="text"
        placeholder="Search clothing..."
        className="bg-white/10 border-white/20 text-white placeholder-gray-300"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Category Filter */}
      <div>
        <Label className="text-sm text-gray-300 block mb-2">Category</Label>
        <select
          className="bg-gray-800 border border-gray-600 text-white rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            backgroundColor: '#374151',
            color: 'white'
          }}
        >
          <option value="all" className="bg-gray-800 text-white">All Categories</option>
          <option value="upper_body" className="bg-gray-800 text-white">Upper Body</option>
          <option value="lower_body" className="bg-gray-800 text-white">Lower Body</option>
          <option value="full_body" className="bg-gray-800 text-white">Full Body</option>
        </select>
      </div>

      {/* Price Range Filter */}
      <div>
        <Label className="text-sm text-gray-300 block mb-2">Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
        <Slider
          value={priceRange}
          max={5000}
          step={10}
          onValueChange={(value) => setPriceRange(value)}
          className="w-full"
        />
      </div>
    </div>
  );
}
