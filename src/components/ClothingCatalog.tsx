
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { ClothingUpload } from '@/components/clothing-upload/ClothingUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClothingGrid } from './ClothingGrid';
import { ClothingEmptyState } from './ClothingEmptyState';
import { type ClothingItem } from './ClothingData';

interface ClothingCatalogProps {
  onClothingSelect: (clothing: any) => void;
}

export const ClothingCatalog: React.FC<ClothingCatalogProps> = ({ onClothingSelect }) => {
  const [customClothing, setCustomClothing] = useState<ClothingItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const { toast } = useToast();

  // Load custom clothing from database
  useEffect(() => {
    const loadCustomClothing = async () => {
      try {
        console.log('Loading custom clothing from database...');
        const { data, error } = await supabase
          .from('clothing_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading custom clothing:', error);
          return;
        }

        if (data) {
          console.log('Loaded custom clothing:', data);
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

  const handleCustomClothingAdd = (newClothing: ClothingItem) => {
    console.log('Adding new clothing:', newClothing);
    setCustomClothing(prev => [newClothing, ...prev]);
    setShowUploadModal(false);
    setEditingItem(null);
    
    toast({
      title: "Success!",
      description: editingItem ? "Clothing item updated successfully" : "Custom clothing added to catalog"
    });
  };

  const handleEdit = (item: ClothingItem) => {
    console.log('Editing custom item:', item);
    setEditingItem(item);
    setShowUploadModal(true);
  };

  const handleDelete = async (item: ClothingItem) => {
    console.log('Deleting custom item:', item);
    
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
    console.log('Opening upload modal for new clothing');
    setEditingItem(null);
    setShowUploadModal(true);
  };

  console.log('Total clothing items:', customClothing.length, 'Custom:', customClothing.length);

  return (
    <div className="space-y-6">
      {/* Add Custom Clothing Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleAddCustomClothing}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
        >
          <Upload className="w-5 h-5 mr-2" />
          Add Custom Clothing
        </Button>
      </div>

      {/* Clothing Grid */}
      {customClothing.length > 0 ? (
        <ClothingGrid
          customClothing={customClothing}
          predefinedClothing={[]}
          onClothingSelect={onClothingSelect}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPredefinedEdit={() => {}}
          onPredefinedDelete={() => {}}
        />
      ) : (
        <ClothingEmptyState onAddCustomClothing={handleAddCustomClothing} />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <ClothingUpload
          onClothingAdd={handleCustomClothingAdd}
          onClose={() => {
            console.log('Closing upload modal');
            setShowUploadModal(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
        />
      )}
    </div>
  );
};
