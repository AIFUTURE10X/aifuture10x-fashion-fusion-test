
import React, { useState } from 'react';
import { Search, Filter, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

  // Mock clothing data for MVP
  const clothingItems: ClothingItem[] = [
    {
      id: '1',
      name: 'Elegant Silk Blouse',
      brand: 'Fashion Forward',
      price: 89.99,
      image: '/placeholder.svg',
      category: 'tops',
      rating: 4.5,
      colors: ['white', 'black', 'navy']
    },
    {
      id: '2',
      name: 'Classic Denim Jacket',
      brand: 'Urban Style',
      price: 129.99,
      image: '/placeholder.svg',
      category: 'outerwear',
      rating: 4.8,
      colors: ['blue', 'black', 'white']
    },
    {
      id: '3',
      name: 'Floral Summer Dress',
      brand: 'Bloom & Co',
      price: 159.99,
      image: '/placeholder.svg',
      category: 'dresses',
      rating: 4.6,
      colors: ['floral', 'navy', 'pink']
    },
    {
      id: '4',
      name: 'Cozy Knit Sweater',
      brand: 'Comfort Wear',
      price: 79.99,
      image: '/placeholder.svg',
      category: 'tops',
      rating: 4.4,
      colors: ['cream', 'gray', 'burgundy']
    },
    {
      id: '5',
      name: 'Tailored Blazer',
      brand: 'Professional',
      price: 199.99,
      image: '/placeholder.svg',
      category: 'outerwear',
      rating: 4.7,
      colors: ['black', 'navy', 'gray']
    },
    {
      id: '6',
      name: 'Casual T-Shirt',
      brand: 'Everyday',
      price: 29.99,
      image: '/placeholder.svg',
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search clothing items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="shrink-0">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={selectedCategory === category.id ? 
                "bg-gradient-to-r from-purple-600 to-pink-600 border-none" : 
                ""
              }
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Clothing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer"
            onClick={() => onClothingSelect(item)}
          >
            <div className="relative aspect-[3/4] bg-gray-100">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item.id);
                }}
                className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
              >
                <Heart 
                  className={`w-4 h-4 ${favorites.has(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                />
              </button>
              <div className="absolute bottom-3 left-3">
                <Badge variant="secondary" className="bg-white/90 text-gray-900">
                  Try On
                </Badge>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600">{item.brand}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${item.price}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600 ml-1">{item.rating}</span>
                </div>
                <div className="flex space-x-1">
                  {item.colors.slice(0, 3).map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color === 'floral' ? '#f3f4f6' : color }}
                    />
                  ))}
                  {item.colors.length > 3 && (
                    <span className="text-xs text-gray-500 ml-1">+{item.colors.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
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
