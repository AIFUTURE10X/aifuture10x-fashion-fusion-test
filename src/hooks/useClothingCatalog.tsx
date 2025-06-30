
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { type ClothingItem } from '@/components/ClothingData';

export const useClothingCatalog = (styleFilter: string[] = ['all']) => {
  const [customClothing, setCustomClothing] = useState<ClothingItem[]>([]);
  const [filteredClothing, setFilteredClothing] = useState<ClothingItem[]>([]);
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
          console.log('Loaded custom clothing with style categories:', data);
          const formattedClothing: ClothingItem[] = data.map((item: any) => ({
            id: item.id || '',
            name: item.name || '',
            brand: item.brand || 'Custom',
            price: item.price || 0,
            image: item.supabase_image_url || '',
            category: item.garment_category || 'upper_body',
            rating: 4.5,
            colors: item.colors || ['custom'],
            perfect_corp_ref_id: item.perfect_corp_ref_id,
            style_category: item.style_category || 'HOT'
          }));

          console.log('Formatted clothing with styles:', formattedClothing);
          setCustomClothing(formattedClothing);
        }
      } catch (err) {
        console.error('Failed to load custom clothing:', err);
      }
    };

    loadCustomClothing();
  }, []);

  // Filter clothing based on selected styles
  useEffect(() => {
    console.log('Filtering clothing by styles:', styleFilter);
    console.log('Available clothing items:', customClothing);
    
    if (styleFilter.includes('all') || styleFilter.length === 0) {
      // Show all clothing when "all" is selected
      setFilteredClothing(customClothing);
    } else {
      const filtered = customClothing.filter(item => {
        // Check if the item's style_category contains any of the selected styles
        if (item.style_category) {
          const itemStyles = item.style_category.split(',').map(s => s.trim().toLowerCase());
          const selectedStylesLower = styleFilter.map(s => s.toLowerCase());
          
          // Check for exact style matches
          const hasStyleMatch = selectedStylesLower.some(selectedStyle => 
            itemStyles.includes(selectedStyle)
          );
          
          if (hasStyleMatch) return true;
        }
        
        // Also check category matches for specific clothing types
        const categoryMatches = styleFilter.includes(item.category);
        return categoryMatches;
      });
      
      console.log('Filtered clothing:', filtered.length, 'items');
      setFilteredClothing(filtered);
    }
  }, [customClothing, styleFilter]);

  const handleCustomClothingAdd = (newClothing: ClothingItem, editingItem: ClothingItem | null) => {
    console.log('Adding new clothing with style category:', newClothing);
    
    if (editingItem) {
      // Update existing item in the list
      setCustomClothing(prev => prev.map(item => 
        item.id === editingItem.id ? newClothing : item
      ));
    } else {
      // Add new item to the list
      setCustomClothing(prev => [newClothing, ...prev]);
    }
    
    toast({
      title: "Success!",
      description: editingItem ? "Clothing item updated successfully" : "Custom clothing added to catalog"
    });
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

  console.log('Total clothing items:', customClothing.length, 'Filtered:', filteredClothing.length);

  return {
    customClothing,
    filteredClothing,
    handleCustomClothingAdd,
    handleDelete
  };
};
