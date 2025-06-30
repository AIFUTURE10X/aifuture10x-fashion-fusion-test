
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { ClothingUpload } from '@/components/ClothingUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClothingFilters } from './ClothingFilters';
import { ClothingGrid } from './ClothingGrid';
import { ClothingEmptyState } from './ClothingEmptyState';
import { clothingData, type ClothingItem } from './ClothingData';

interface ClothingCatalogProps {
  onClothingSelect: (clothing: any) => void;
}

export const ClothingCatalog: React.FC<ClothingCatalogProps> = ({ onClothingSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 5000]);
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
    
    toast({
      title: "Success!",
      description: editingItem ? "Clothing item updated successfully" : "Custom clothing added to catalog"
    });
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

  const handleAddCustomClothing = () => {
    setEditingItem(null);
    setShowUploadModal(true);
  };

  // Combine predefined and custom clothing
  const allClothing = [...filteredCustomClothing, ...filteredClothing];

  return (
    <div className="space-y-6">
      <ClothingFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
      />

      {/* Add Custom Clothing Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Available Clothing</h3>
        <Button
          onClick={handleAddCustomClothing}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          Add Custom Clothing
        </Button>
      </div>

      {/* Clothing Grid */}
      {allClothing.length > 0 ? (
        <ClothingGrid
          customClothing={filteredCustomClothing}
          predefinedClothing={filteredClothing}
          onClothingSelect={onClothingSelect}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <ClothingEmptyState onAddCustomClothing={handleAddCustomClothing} />
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
