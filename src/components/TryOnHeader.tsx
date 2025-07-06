
import React from 'react';
import { ArrowLeft, Share2, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TryOnHeaderProps {
  selectedClothing: {
    name: string;
    brand: string;
  };
  onBack: () => void;
  onRetry: () => void;
  onShare: () => void;
  isProcessing: boolean;
  supabaseConfigured: boolean;
  hasResult: boolean;
}

export const TryOnHeader: React.FC<TryOnHeaderProps> = ({
  selectedClothing,
  onBack,
  onRetry,
  onShare,
  isProcessing,
  supabaseConfigured,
  hasResult
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Catalog
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Virtual Try-On</h2>
          <p className="text-gray-600">{selectedClothing.name} {selectedClothing.brand}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={onRetry} disabled={isProcessing || !supabaseConfigured}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry
        </Button>
        {hasResult && !isProcessing && (
          <>
            <Button variant="outline" onClick={onShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
