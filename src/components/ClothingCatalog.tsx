import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Upload, Package, Edit, Trash2 } from 'lucide-react';
import { ClothingUpload } from '@/components/ClothingUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClothingItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  colors: string[];
  perfect_corp_ref_id?: string;
}

interface ClothingCatalogProps {
  onClothingSelect: (clothing: any) => void;
}

const clothingData: ClothingItem[] = [
  {
    id: '1',
    name: 'Classic White Tee',
    brand: 'Uniqlo',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop',
    category: 'upper_body',
    rating: 4.5,
    colors: ['white']
  },
  {
    id: '2',
    name: 'Slim Fit Jeans',
    brand: 'Levi\'s',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop',
    category: 'lower_body',
    rating: 4.2,
    colors: ['blue']
  },
  {
    id: '3',
    name: 'Summer Dress',
    brand: 'H&M',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop',
    category: 'full_body',
    rating: 4.0,
    colors: ['floral']
  },
  {
    id: '4',
    name: 'Leather Jacket',
    brand: 'Zara',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop',
    category: 'upper_body',
    rating: 4.7,
    colors: ['black']
  },
  {
    id: '5',
    name: 'Chino Shorts',
    brand: 'Gap',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=600&fit=crop',
    category: 'lower_body',
    rating: 4.3,
    colors: ['khaki']
  },
  {
    id: '6',
    name: 'Striped Shirt',
    brand: 'Banana Republic',
    price: 69.50,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=600&fit=crop',
    category: 'upper_body',
    rating: 4.1,
    colors: ['navy', 'white']
  },
  {
    id: '7',
    name: 'Denim Skirt',
    brand: 'Old Navy',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop',
    category: 'lower_body',
    rating: 4.4,
    colors: ['blue']
  },
  {
    id: '8',
    name: 'Pencil Dress',
    brand: 'Ann Taylor',
    price: 98.00,
    image: 'https://images.unsplash.com/photo-1566479179817-92e8b94be0f0?w=400&h=600&fit=crop',
    category: 'full_body',
    rating: 4.6,
    colors: ['red']
  },
  {
    id: '9',
    name: 'Bomber Jacket',
    brand: 'Adidas',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5c?w=400&h=600&fit=crop',
    category: 'upper_body',
    rating: 4.8,
    colors: ['green']
  },
  {
    id: '10',
    name: 'Cargo Pants',
    brand: 'REI',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1584701154663-7f6d85d8b3df?w=400&h=600&fit=crop',
    category: 'lower_body',
    rating: 4.0,
    colors: ['olive']
  },
];

function ClothingCard({ clothing, onSelect, onEdit, onDelete, isCustom }: { 
  clothing: ClothingItem, 
  onSelect: () => void,
  onEdit?: () => void,
  onDelete?: () => void,
  isCustom?: boolean
}) {
  return (
    <Card className="bg-white/5 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
      <CardContent className="p-3 relative">
        <div className="aspect-w-3 aspect-h-4 relative rounded-md overflow-hidden mb-3" onClick={onSelect}>
          <img
            src={clothing.image}
            alt={clothing.name}
            className="w-full h-48 object-cover rounded-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=600&fit=crop`;
            }}
          />
        </div>
        
        {/* Edit and Delete buttons for custom clothing */}
        {isCustom && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        <div onClick={onSelect}>
          <h3 className="text-md font-semibold text-white mb-1">{clothing.name}</h3>
          <p className="text-sm text-gray-300">{clothing.brand}</p>
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            ${clothing.price.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const ClothingCatalog: React.FC<ClothingCatalogProps> = ({ onClothingSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [customClothing, setCustomClothing] = useState<ClothingItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const { toast } = useToast();

  // Load custom clothing from database
  useEffect(() => {
    const loadCustomClothing = async () => {
      try {
        const { data, error } = await supabase
          .from('clothing_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading custom clothing:', error);
          return;
        }

        if (data) {
          const formattedClothing: ClothingItem[] = data.map((item: any) => ({
            id: item.id || '',
            name: item.name || '',
            brand: item.brand || 'Custom',
            price: item.price || 0,
            image: item.supabase_image_url || '',
            category: item.garment_category || 'upper_body',
            rating: 4.5,
            colors: item.colors || ['custom'],
            perfect_corp_ref_id: item.perfect_corp_ref_id
          }));

          setCustomClothing(formattedClothing);
        }
      } catch (err) {
        console.error('Failed to load custom clothing:', err);
      }
    };

    loadCustomClothing();
  }, []);

  const filteredClothing = clothingData.filter(item => {
    const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    const priceMatch = item.price >= priceRange[0] && item.price <= priceRange[1];
    return searchMatch && categoryMatch && priceMatch;
  });

  const filteredCustomClothing = customClothing.filter(item => {
    const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    const priceMatch = item.price >= priceRange[0] && item.price <= priceRange[1];
    return searchMatch && categoryMatch && priceMatch;
  });

  const handleCustomClothingAdd = (newClothing: ClothingItem) => {
    setCustomClothing(prev => [newClothing, ...prev]);
    setShowUploadModal(false);
    setEditingItem(null);
  };

  const handleEdit = (item: ClothingItem) => {
    setEditingItem(item);
    setShowUploadModal(true);
  };

  const handleDelete = async (item: ClothingItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', item.id);

      if (error) {
        throw new Error(error.message);
      }

      setCustomClothing(prev => prev.filter(clothing => clothing.id !== item.id));
      
      toast({
        title: "Clothing Deleted",
        description: `"${item.name}" has been removed from your catalog`
      });
    } catch (err) {
      console.error('Failed to delete clothing:', err);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the clothing item. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Combine predefined and custom clothing
  const allClothing = [...filteredCustomClothing, ...filteredClothing];

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
          className="bg-white/10 border-white/20 text-white rounded-md p-2 w-full"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="upper_body">Upper Body</option>
          <option value="lower_body">Lower Body</option>
          <option value="full_body">Full Body</option>
        </select>
      </div>

      {/* Price Range Filter */}
      <div>
        <Label className="text-sm text-gray-300 block mb-2">Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
        <Slider
          defaultValue={priceRange}
          max={100}
          step={1}
          onValueChange={(value) => setPriceRange(value)}
        />
      </div>

      {/* Add Custom Clothing Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Available Clothing</h3>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowUploadModal(true);
          }}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          Add Custom Clothing
        </Button>
      </div>

      {/* Clothing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Custom Clothing */}
        {filteredCustomClothing.map((item) => (
          <ClothingCard
            key={item.id}
            clothing={item}
            onSelect={() => onClothingSelect(item)}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
            isCustom={true}
          />
        ))}
        
        {/* Predefined Clothing */}
        {filteredClothing.map((item) => (
          <ClothingCard
            key={item.id}
            clothing={item}
            onSelect={() => onClothingSelect(item)}
            isCustom={false}
          />
        ))}
      </div>

      {allClothing.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No clothing found</h3>
          <p className="text-gray-300 mb-4">
            Try adjusting your search or category filter, or add your own custom clothing.
          </p>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Add Custom Clothing
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <ClothingUpload
          onClothingAdd={handleCustomClothingAdd}
          onClose={() => {
            setShowUploadModal(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
        />
      )}
    </div>
  );
};
