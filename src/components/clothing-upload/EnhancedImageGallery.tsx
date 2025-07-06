import React, { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExtractedImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

interface EnhancedImageGalleryProps {
  images: ExtractedImage[];
  onImageSelect: (imageUrl: string) => void;
  selectedImage?: string;
}

export const EnhancedImageGallery: React.FC<EnhancedImageGalleryProps> = ({
  images,
  onImageSelect,
  selectedImage
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'large' | 'medium' | 'small'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Filter and search images
  const filteredImages = useMemo(() => {
    let filtered = images;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(img => 
        img.alt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply size filter
    if (sizeFilter !== 'all') {
      filtered = filtered.filter(img => {
        if (!img.width || !img.height) return true;
        const size = img.width * img.height;
        
        switch (sizeFilter) {
          case 'large': return size > 300000; // > 300k pixels
          case 'medium': return size >= 100000 && size <= 300000; // 100k-300k pixels  
          case 'small': return size < 100000; // < 100k pixels
          default: return true;
        }
      });
    }

    return filtered;
  }, [images, searchTerm, sizeFilter]);

  const getImageQualityScore = (img: ExtractedImage) => {
    let score = 0;
    
    // Size scoring
    if (img.width && img.height) {
      const pixels = img.width * img.height;
      if (pixels > 300000) score += 3;
      else if (pixels > 100000) score += 2;
      else score += 1;
    }
    
    // URL quality indicators
    const url = img.url.toLowerCase();
    if (url.includes('large') || url.includes('xl') || url.includes('high')) score += 2;
    if (url.includes('cdn') || url.includes('static')) score += 1;
    
    // Alt text quality
    if (img.alt) {
      const alt = img.alt.toLowerCase();
      if (alt.includes('product') || alt.includes('clothing')) score += 2;
      if (alt.includes('dress') || alt.includes('shirt') || alt.includes('pants')) score += 1;
    }
    
    return Math.min(score, 5);
  };

  const getQualityColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-100';
    if (score >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search images by description or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Button
            variant={sizeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSizeFilter('all')}
          >
            All
          </Button>
          <Button
            variant={sizeFilter === 'large' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSizeFilter('large')}
          >
            Large
          </Button>
          <Button
            variant={sizeFilter === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSizeFilter('medium')}
          >
            Medium
          </Button>
          <Button
            variant={sizeFilter === 'small' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSizeFilter('small')}
          >
            Small
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Found {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''}
        {filteredImages.length !== images.length && ` (filtered from ${images.length})`}
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
        {filteredImages.map((image, index) => {
          const qualityScore = getImageQualityScore(image);
          const isSelected = selectedImage === image.url;
          
          return (
            <div
              key={index}
              className={cn(
                "relative group bg-white border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md",
                isSelected ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200 hover:border-purple-300"
              )}
              onClick={() => onImageSelect(image.url)}
            >
              {/* Image */}
              <div className="aspect-square relative bg-gray-100">
                <img
                  src={image.url}
                  alt={image.alt || `Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = target.nextElementSibling as HTMLElement;
                    target.style.display = 'none';
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full hidden items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
                
                {/* Preview Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImage(image.url);
                  }}
                  className="absolute top-2 left-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                
                {/* Quality Score */}
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className={cn("text-xs", getQualityColor(qualityScore))}>
                    Quality: {qualityScore}/5
                  </Badge>
                </div>
              </div>
              
              {/* Image Info */}
              <div className="p-2">
                <div className="text-xs text-gray-600 truncate">
                  {image.alt || 'No description'}
                </div>
                {image.width && image.height && (
                  <div className="text-xs text-gray-500 mt-1">
                    {image.width} × {image.height}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredImages.length === 0 && (
        <div className="text-center py-8">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No images found matching your criteria</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter settings</p>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium">Image Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewImage(null)}
              >
                ×
              </Button>
            </div>
            <div className="p-4">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setPreviewImage(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  onImageSelect(previewImage);
                  setPreviewImage(null);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Select This Image
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};