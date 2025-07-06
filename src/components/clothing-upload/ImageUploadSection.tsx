
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { UploadMethodSelector } from './UploadMethodSelector';
import { UrlImageUpload } from './UrlImageUpload';
import { ImageExtractionPreview } from './ImageExtractionPreview';

interface ImageUploadSectionProps {
  uploadedPhoto: string | null;
  filePreview: string | null;
  isProcessing: boolean;
  onDrop: (acceptedFiles: File[]) => void;
  onRemoveImage: () => void;
  onUrlImageSelect?: (imageUrl: string, metadata?: any) => void;
  extractedImageData?: {
    url: string;
    metadata?: any;
  } | null;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  uploadedPhoto,
  filePreview,
  isProcessing,
  onDrop,
  onRemoveImage,
  onUrlImageSelect,
  extractedImageData
}) => {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/jpg': ['.jpg'],
      'image/png': ['.png'], 
      'image/webp': ['.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleUrlImageSelect = (imageUrl: string, metadata?: any) => {
    if (onUrlImageSelect) {
      onUrlImageSelect(imageUrl, metadata);
    }
  };

  const showImagePreview = uploadedPhoto || extractedImageData?.url;
  const previewImageUrl = extractedImageData?.url || filePreview || uploadedPhoto;

  return (
    <div>
      <Label className="text-sm font-medium text-gray-700 mb-2 block">
        Clothing Reference Image *
      </Label>
      
      <UploadMethodSelector 
        activeMethod={uploadMethod}
        onMethodChange={setUploadMethod}
      />
      
      {showImagePreview ? (
        <div>
          {extractedImageData ? (
            <ImageExtractionPreview
              imageUrl={extractedImageData.url}
              metadata={extractedImageData.metadata}
              onRemove={onRemoveImage}
            />
          ) : (
            <div className="relative">
              <img
                src={previewImageUrl!}
                alt="Uploaded clothing"
                className="w-full h-64 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={onRemoveImage}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {uploadMethod === 'file' ? (
            <div>
              <p className="text-xs text-gray-600 mb-3">
                <span className="font-semibold text-purple-600">Recommended: JPG/JPEG format</span> for optimal AI processing
              </p>
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
                    <div className="text-center">
                      <p className="text-gray-600 font-medium">Processing image...</p>
                      <p className="text-gray-500 text-sm">Converting to JPG format</p>
                    </div>
                  ) : isDragActive ? (
                    <p className="text-purple-600 font-medium">Drop your clothing image here</p>
                  ) : (
                    <>
                      <p className="text-gray-900 font-medium mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-purple-600 font-semibold mb-1">
                        Preferred: JPG/JPEG format
                      </p>
                      <p className="text-gray-500 text-sm">
                        Also accepts PNG, WebP (converted to JPG) • Max 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <UrlImageUpload
              onImageSelect={handleUrlImageSelect}
              isProcessing={isProcessing}
            />
          )}
        </div>
      )}
    </div>
  );
};
