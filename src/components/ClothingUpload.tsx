
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { uploadPhotoToSupabase } from '@/lib/supabase-upload';

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

interface ClothingUploadProps {
  onClothingAdd: (clothing: ClothingItem) => void;
  onClose: () => void;
}

export const ClothingUpload: React.FC<ClothingUploadProps> = ({ onClothingAdd, onClose }) => {
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    category: 'tops',
    colors: ['']
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    if (file) {
      setIsProcessing(true);
      try {
        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);

        // Upload image to Supabase Storage
        const publicUrl = await uploadPhotoToSupabase(file);
        setUploadedPhoto(publicUrl);
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
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedPhoto || !formData.name || !formData.brand || !formData.price) {
      setError('Please fill in all required fields and upload an image');
      return;
    }

    const newClothing: ClothingItem = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      brand: formData.brand,
      price: parseFloat(formData.price),
      image: uploadedPhoto,
      category: formData.category,
      rating: 4.5, // Default rating for uploaded items
      colors: formData.colors.filter(color => color.trim() !== '')
    };

    onClothingAdd(newClothing);
    onClose();
  };

  const addColorField = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, '']
    }));
  };

  const updateColor = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => i === index ? value : color)
    }));
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add New Clothing Item</h2>
            <button
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
                Clothing Image *
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
              
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                  Item Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Elegant Silk Blouse"
                  required
                />
              </div>

              <div>
                <Label htmlFor="brand" className="text-sm font-medium text-gray-700 mb-2 block">
                  Brand *
                </Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="e.g., Fashion Forward"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-sm font-medium text-gray-700 mb-2 block">
                  Price ($) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="89.99"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2 block">
                  Category *
                </Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="tops">Tops</option>
                  <option value="dresses">Dresses</option>
                  <option value="outerwear">Outerwear</option>
                  <option value="bottoms">Bottoms</option>
                </select>
              </div>
            </div>

            {/* Colors Section */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Available Colors
              </Label>
              <div className="space-y-2">
                {formData.colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={color}
                      onChange={(e) => updateColor(index, e.target.value)}
                      placeholder="e.g., navy, #FF5733, or rgb(255,87,51)"
                      className="flex-1"
                    />
                    {formData.colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addColorField}
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Color
                </button>
              </div>
            </div>

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
                disabled={!uploadedPhoto || isProcessing}
              >
                <Check className="w-4 h-4 mr-2" />
                Add to Catalog
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
