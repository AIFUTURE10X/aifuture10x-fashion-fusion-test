import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ImageExtractionPreviewProps {
  imageUrl: string;
  metadata?: {
    title?: string;
    brand?: string;
    price?: string;
    category?: string;
  };
  onRemove: () => void;
}

export const ImageExtractionPreview: React.FC<ImageExtractionPreviewProps> = ({
  imageUrl,
  metadata,
  onRemove
}) => {
  return (
    <div className="space-y-3">
      <div className="relative">
        <img
          src={imageUrl}
          alt="Extracted clothing image"
          className="w-full h-64 object-cover rounded-lg border border-gray-200"
          onError={(e) => {
            console.error('Failed to load extracted image:', imageUrl);
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Extracted from web
        </div>
      </div>

      {metadata && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-purple-900 mb-2">Auto-detected information:</h4>
          <div className="space-y-1 text-sm">
            {metadata.title && (
              <p className="text-gray-700">
                <span className="font-medium">Title:</span> {metadata.title.substring(0, 60)}
                {metadata.title.length > 60 && '...'}
              </p>
            )}
            {metadata.brand && (
              <p className="text-gray-700">
                <span className="font-medium">Brand:</span> {metadata.brand}
              </p>
            )}
            {metadata.price && (
              <p className="text-gray-700">
                <span className="font-medium">Price:</span> {metadata.price}
              </p>
            )}
          </div>
          <p className="text-xs text-purple-600 mt-2">
            You can edit these details in the form below
          </p>
        </div>
      )}
    </div>
  );
};