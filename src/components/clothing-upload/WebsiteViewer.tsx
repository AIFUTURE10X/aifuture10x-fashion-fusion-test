import React, { useState } from 'react';
import { X, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WebsiteViewerProps {
  url: string;
  onClose: () => void;
  onImageSelect?: (imageUrl: string) => void;
}

export const WebsiteViewer: React.FC<WebsiteViewerProps> = ({
  url,
  onClose,
  onImageSelect
}) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="text-sm text-gray-600 truncate max-w-md">
              {url}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              className="text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Open in New Tab
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading website...</p>
            </div>
          </div>
        )}

        {/* Website Iframe */}
        <div className="flex-1 relative">
          <iframe
            src={url}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            title="Website Viewer"
          />
        </div>

        {/* Instructions */}
        <div className="p-4 bg-gray-50 border-t">
          <p className="text-sm text-gray-600 text-center">
            Browse the website above and right-click on clothing images to copy their URLs, 
            then paste them in the "From Website" section to extract them.
          </p>
        </div>
      </div>
    </div>
  );
};