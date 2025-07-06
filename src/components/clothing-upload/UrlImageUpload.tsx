import React, { useState } from 'react';
import { Search, ExternalLink, AlertCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUrlImageExtraction } from './hooks/useUrlImageExtraction';
import { WebsiteViewer } from './WebsiteViewer';
import { EnhancedImageGallery } from './EnhancedImageGallery';

interface UrlImageUploadProps {
  onImageSelect: (imageUrl: string, metadata?: any) => void;
  isProcessing?: boolean;
}

export const UrlImageUpload: React.FC<UrlImageUploadProps> = ({
  onImageSelect,
  isProcessing = false
}) => {
  const [url, setUrl] = useState('');
  const [showWebsiteViewer, setShowWebsiteViewer] = useState(false);
  const { extractImages, isExtracting, error, extractedData } = useUrlImageExtraction();

  const handleExtract = async () => {
    if (!url.trim()) return;
    
    await extractImages(url.trim());
    // Don't auto-select - let user choose from enhanced gallery
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Product Page URL *
        </Label>
        <p className="text-xs text-gray-600 mb-3">
          Paste a link from any clothing website (Zara, H&M, ASOS, etc.)
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://www.zara.com/product/..."
            value={url}
            onChange={handleUrlChange}
            className="flex-1"
            disabled={isExtracting || isProcessing}
          />
          <Button
            type="button"
            onClick={handleExtract}
            disabled={!url.trim() || !isValidUrl(url.trim()) || isExtracting || isProcessing}
            className="bg-purple-600 hover:bg-purple-700 px-4"
          >
            {isExtracting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="button"
            onClick={() => setShowWebsiteViewer(true)}
            disabled={!url.trim() || !isValidUrl(url.trim()) || isExtracting || isProcessing}
            variant="outline"
            className="px-4"
          >
            <Globe className="w-4 h-4" />
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-red-600 text-sm">
              <p className="font-medium">Extraction failed</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {extractedData && extractedData.images && extractedData.images.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Enhanced Image Selection
              </span>
            </div>
            
            <EnhancedImageGallery
              images={extractedData.images}
              onImageSelect={(imageUrl) => onImageSelect(imageUrl, extractedData.metadata)}
              selectedImage={undefined}
            />

            {extractedData.metadata && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Auto-detected: {extractedData.metadata.title && (
                    <span className="font-medium">{extractedData.metadata.title.substring(0, 50)}...</span>
                  )}
                  {extractedData.metadata.brand && (
                    <span className="ml-2 text-purple-600">{extractedData.metadata.brand}</span>
                  )}
                  {extractedData.metadata.price && (
                    <span className="ml-2 font-medium">{extractedData.metadata.price}</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showWebsiteViewer && (
        <WebsiteViewer
          url={url}
          onClose={() => setShowWebsiteViewer(false)}
          onImageSelect={onImageSelect}
        />
      )}
    </div>
  );
};