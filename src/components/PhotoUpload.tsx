
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadPhotoToSupabase } from '@/lib/supabase-upload';

interface PhotoUploadProps {
  onPhotoUpload: (photoUrl: string) => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoUpload }) => {
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleContinue = () => {
    if (uploadedPhoto) {
      onPhotoUpload(uploadedPhoto);
    }
  };

  const handleRetake = () => {
    setUploadedPhoto(null);
    setFilePreview(null);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto -mt-20">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
        <div className="text-center mb-6">
          <Camera className="w-10 h-10 text-white mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-3">Upload Your Photo</h2>
          <p className="text-gray-200 text-sm">
            Upload a clear photo of yourself to get started with virtual try-on
          </p>
        </div>

        {uploadedPhoto ? (
          <div className="space-y-6">
            {/* AI Clothes text above the model image */}
            <h3 className="text-xl font-bold text-white text-center">AI Clothes</h3>
            
            <div className="relative">
              <img
                src={filePreview || uploadedPhoto}
                alt="Uploaded photo"
                className="w-full max-h-64 object-contain rounded-lg border border-white/20 bg-gray-900/20"
              />
              <button
                onClick={handleRetake}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-700">
                <Check className="w-4 h-4" />
                <span className="font-medium text-sm">Photo uploaded successfully!</span>
              </div>
              <p className="text-green-600 text-xs mt-2">
                Great! Now you can browse clothes and see how they look on you.
              </p>
            </div>

            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              size="lg"
            >
              Continue to Browse Clothes
            </Button>
          </div>
        ) : (
          <div>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed border-white/30 rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-purple-400",
                isDragActive && "border-purple-500 bg-purple-50/10",
                isProcessing && "pointer-events-none opacity-75"
              )}
            >
              <input {...getInputProps()} />
              
              <div className="mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-6 h-6 text-white" />
                  )}
                </div>
                
                {isProcessing ? (
                  <p className="text-gray-200 text-sm">Uploading...</p>
                ) : isDragActive ? (
                  <p className="text-purple-300 font-medium text-sm">Drop the image here</p>
                ) : (
                  <>
                    <p className="text-white font-medium mb-2 text-sm">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-gray-300 text-xs">PNG, JPG, WebP up to 10MB</p>
                  </>
                )}
              </div>
            </div>

            {error && (
              <p className="text-red-300 text-sm mt-4 text-center">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
