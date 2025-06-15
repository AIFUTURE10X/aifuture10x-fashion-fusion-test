
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ClothingCard } from './ClothingCard';
import { CategoryFilter } from './CategoryFilter';
import { CatalogSearchBar } from './CatalogSearchBar';

interface ClothingItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  colors: string[];
}

interface ClothingCatalogProps {
  onClothingSelect: (clothing: ClothingItem) => void;
}

export const ClothingCatalog: React.FC<ClothingCatalogProps> = ({ onClothingSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Green Midi Dress added at the top
  const clothingItems: ClothingItem[] = [
    {
      id: 'dress-green-midi-1',
      name: "Solid Color V-Neck Cap Sleeve Side Knot Elegant Midi Dress",
      brand: "SHEIN Unity",
      price: 18.95,
      image: "/lovable-uploads/ba7e7b5d-f949-46ce-9579-303ac63565fb.png",
      category: "dresses",
      rating: 4.7,
      colors: ['#ffdde2', '#6c2728', '#2aa73b', '#191816'],
    },
    {
      id: '1',
      name: 'Elegant Silk Blouse',
      brand: 'Fashion Forward',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
      category: 'tops',
      rating: 4.5,
      colors: ['white', 'black', 'navy']
    },
    {
      id: '2',
      name: 'Classic Denim Jacket',
      brand: 'Urban Style',
      price: 129.99,
      image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400&h=500&fit=crop',
      category: 'outerwear',
      rating: 4.8,
      colors: ['blue', 'black', 'white']
    },
    {
      id: '3',
      name: 'Floral Summer Dress',
      brand: 'Bloom & Co',
      price: 159.99,
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop',
      category: 'dresses',
      rating: 4.6,
      colors: ['floral', 'navy', 'pink']
    },
    {
      id: '4',
      name: 'Cozy Knit Sweater',
      brand: 'Comfort Wear',
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop',
      category: 'tops',
      rating: 4.4,
      colors: ['cream', 'gray', 'burgundy']
    },
    {
      id: '5',
      name: 'Tailored Blazer',
      brand: 'Professional',
      price: 199.99,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
      category: 'outerwear',
      rating: 4.7,
      colors: ['black', 'navy', 'gray']
    },
    {
      id: '6',
      name: 'Casual T-Shirt',
      brand: 'Everyday',
      price: 29.99,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
      category: 'tops',
      rating: 4.2,
      colors: ['white', 'black', 'gray', 'navy']
    }
  ];

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'tops', label: 'Tops' },
    { id: 'dresses', label: 'Dresses' },
    { id: 'outerwear', label: 'Outerwear' },
    { id: 'bottoms', label: 'Bottoms' }
  ];

  const filteredItems = clothingItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <CatalogSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

      {/* Clothing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <ClothingCard
            key={item.id}
            item={item}
            isFavorite={favorites.has(item.id)}
            onToggleFavorite={toggleFavorite}
            onSelect={onClothingSelect}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};
