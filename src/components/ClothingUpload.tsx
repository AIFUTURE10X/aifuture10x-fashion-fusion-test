
import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, Shirt, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { uploadPhotoToSupabase } from '@/lib/supabase-upload';
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

interface ClothingUploadProps {
  onClothingAdd: (clothing: ClothingItem) => void;
  onClose: () => void;
  editingItem?: ClothingItem | null;
}

const garmentCategories = [
  { value: 'upper_body', label: 'Upper Body', icon: Shirt, description: 'Shirts, tops, jackets, dresses' },
  { value: 'lower_body', label: 'Lower Body', icon: User, description: 'Pants, shorts, skirts' },
  { value: 'full_body', label: 'Full Body', icon: Package, description: 'Dresses, jumpsuits, full outfits' }
];

export const ClothingUpload: React.FC<ClothingUploadProps> = ({ onClothingAdd, onClose, editingItem }) => {
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [garmentCategory, setGarmentCategory] = useState<string>('');
  const [clothingName, setClothingName] = useState('');
  const [clothingBrand, setClothingBrand] = useState('');
  const [clothingPrice, setClothingPrice] = useState('');
  const [perfectCorpStatus, setPerfectCorpStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [perfectCorpRefId, setPerfectCorpRefId] = useState<string | null>(null);
  const { toast } = useToast();

  // Pre-populate form when editing
  useEffect(() => {
    if (editingItem) {
      setClothingName(editingItem.name);
      setClothingBrand(editingItem.brand);
      setClothingPrice(editingItem.price.toString());
      setGarmentCategory(editingItem.category);
      setUploadedPhoto(editingItem.image);
      setFilePreview(editingItem.image);
      setPerfectCorpRefId(editingItem.perfect_corp_ref_id || null);
      setPerfectCorpStatus(editingItem.perfect_corp_ref_id ? 'success' : 'idle');
    }
  }, [editingItem]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    if (file) {
      setIsProcessing(true);
      try {
        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);

        // Upload image to Supabase Storage
        const publicUrl = await uploadPhotoToSupabase(file, 'clothing-references');
        setUploadedPhoto(publicUrl);
        
        // Reset Perfect Corp status when new image is uploaded
        setPerfectCorpStatus('idle');
        setPerfectCorpRefId(null);
        
        toast({
          title: "Image uploaded!",
          description: "Ready to process with Perfect Corp AI"
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed. Please try again."
        );
        setFilePreview(null);
        setUploadedPhoto(null);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handlePerfectCorpUpload = async () => {
    if (!uploadedPhoto || !garmentCategory || !clothingName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setPerfectCorpStatus('uploading');
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('perfect-corp-reference-upload', {
        body: {
          imageUrl: uploadedPhoto,
          garmentCategory: garmentCategory,
          clothingName: clothingName.trim()
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Perfect Corp upload failed');
      }

      setPerfectCorpRefId(data.ref_id);
      setPerfectCorpStatus('success');
      
      toast({
        title: "Perfect Corp Upload Complete!",
        description: "Your clothing reference is ready for try-on"
      });
    } catch (err) {
      setPerfectCorpStatus('error');
      setError(err instanceof Error ? err.message : 'Perfect Corp upload failed');
      toast({
        title: "Upload Failed",
        description: "Failed to process with Perfect Corp AI. You can still add the item without AI processing.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedPhoto || !garmentCategory || !clothingName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (isSubmitting) {
      return; // Prevent double submission
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Starting form submission...', {
        editingItem: !!editingItem,
        clothingName,
        garmentCategory,
        uploadedPhoto
      });

      if (editingItem) {
        // Update existing item
        const { data, error: dbError } = await supabase
          .from('clothing_items')
          .update({
            name: clothingName.trim(),
            brand: clothingBrand.trim() || 'Custom',
            price: clothingPrice ? parseFloat(clothingPrice) : 0,
            garment_category: garmentCategory,
            supabase_image_url: uploadedPhoto,
            perfect_corp_ref_id: perfectCorpRefId,
            colors: ['custom']
          })
          .eq('id', editingItem.id)
          .select()
          .single();

        if (dbError) {
          throw new Error(dbError.message);
        }

        if (data) {
          const updatedClothing: ClothingItem = {
            id: data.id || '',
            name: data.name || '',
            brand: data.brand || 'Custom',
            price: data.price || 0,
            image: data.supabase_image_url || '',
            category: data.garment_category || 'upper_body',
            rating: 4.5,
            colors: data.colors || ['custom'],
            perfect_corp_ref_id: data.perfect_corp_ref_id
          };

          console.log('Updated clothing item:', updatedClothing);
          onClothingAdd(updatedClothing);
        }
      } else {
        // Create new item
        const { data, error: dbError } = await supabase
          .from('clothing_items')
          .insert({
            name: clothingName.trim(),
            brand: clothingBrand.trim() || 'Custom',
            price: clothingPrice ? parseFloat(clothingPrice) : 0,
            garment_category: garmentCategory,
            supabase_image_url: uploadedPhoto,
            perfect_corp_ref_id: perfectCorpRefId,
            colors: ['custom']
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(dbError.message);
        }

        if (data) {
          const newClothing: ClothingItem = {
            id: data.id || '',
            name: data.name || '',
            brand: data.brand || 'Custom',
            price: data.price || 0,
            image: data.supabase_image_url || '',
            category: data.garment_category || 'upper_body',
            rating: 4.5,
            colors: data.colors || ['custom'],
            perfect_corp_ref_id: data.perfect_corp_ref_id
          };

          console.log('Created new clothing item:', newClothing);
          onClothingAdd(newClothing);
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save clothing item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingItem ? 'Edit Clothing' : 'Add Custom Clothing'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Section */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Reference Image *
              </Label>
              {uploadedPhoto ? (
                <div className="relative">
                  <img
                    src={filePreview || uploadedPhoto}
                    alt="Uploaded clothing"
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedPhoto(null);
                      setFilePreview(null);
                      setPerfectCorpStatus('idle');
                      setPerfectCorpRefId(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-purple-400",
                    isDragActive && "border-purple-500 bg-purple-50",
                    isProcessing && "pointer-events-none opacity-75"
                  )}
                >
                  <input {...getInputProps()} />
                  
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Upload className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    
                    {isProcessing ? (
                      <p className="text-gray-600">Uploading...</p>
                    ) : isDragActive ? (
                      <p className="text-purple-600 font-medium">Drop the image here</p>
                    ) : (
                      <>
                        <p className="text-gray-900 font-medium mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-gray-500 text-sm">PNG, JPG, WebP up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields */}
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

            {/* Perfect Corp Processing */}
            {uploadedPhoto && garmentCategory && clothingName && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-purple-900">Perfect Corp AI Processing</h4>
                  {perfectCorpStatus === 'success' && <Check className="w-5 h-5 text-green-600" />}
                </div>
                
                {perfectCorpStatus === 'idle' && (
                  <div>
                    <p className="text-purple-700 text-sm mb-3">
                      Process your clothing with Perfect Corp AI for realistic try-on results. (Optional)
                    </p>
                    <Button
                      type="button"
                      onClick={handlePerfectCorpUpload}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Process with AI
                    </Button>
                  </div>
                )}
                
                {perfectCorpStatus === 'uploading' && (
                  <div className="flex items-center space-x-2 text-purple-700">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Processing with Perfect Corp AI...</span>
                  </div>
                )}
                
                {perfectCorpStatus === 'success' && (
                  <p className="text-green-700 text-sm">
                    ✅ Successfully processed! Ready for virtual try-on.
                  </p>
                )}
                
                {perfectCorpStatus === 'error' && (
                  <div>
                    <p className="text-red-700 text-sm mb-2">Failed to process with Perfect Corp AI</p>
                    <Button
                      type="button"
                      onClick={handlePerfectCorpUpload}
                      size="sm"
                      variant="outline"
                    >
                      Retry Processing
                    </Button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={!uploadedPhoto || !garmentCategory || !clothingName || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {editingItem ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {editingItem ? 'Update Clothing' : 'Add to Catalog'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
