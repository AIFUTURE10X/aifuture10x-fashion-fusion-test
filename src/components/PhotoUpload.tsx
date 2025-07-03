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
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/jpg': ['.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024 // 5MB
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
    <div className="max-w-lg mx-auto">
      {/* AI Clothes text positioned above the image container */}
      <div className="text-center mb-8">
        <h3 className="text-4xl font-bold text-white">AI Clothes</h3>
      </div>

      {/* Main image container */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-2xl">
        {uploadedPhoto ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={filePreview || uploadedPhoto}
                alt="Uploaded photo"
                className="w-full h-[500px] object-contain rounded-lg bg-gray-100"
              />
              <button
                onClick={handleRetake}
                className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-green-700">
                <Check className="w-4 h-4" />
                <span className="font-medium text-sm">Photo uploaded successfully!</span>
              </div>
              <p className="text-green-600 text-sm mt-1">
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
                "border-2 border-dashed border-white/30 rounded-lg p-12 text-center cursor-pointer transition-all duration-200 hover:border-purple-400",
                isDragActive && "border-purple-500 bg-purple-50/10",
                isProcessing && "pointer-events-none opacity-75"
              )}
            >
              <input {...getInputProps()} />
              
              <div className="mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {isProcessing ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-6 h-6 text-white" />
                  )}
                </div>
                
                {isProcessing ? (
                  <p className="text-gray-200">Uploading and converting to JPG...</p>
                ) : isDragActive ? (
                  <p className="text-purple-300 font-medium">Drop your photo here</p>
                ) : (
                  <>
                    <p className="text-white font-medium mb-2">
                      Upload Your Photo for Virtual Try-On
                    </p>
                    <p className="text-gray-300 mb-1">
                      <span className="font-semibold text-purple-300">Best: JPG/JPEG format</span>
                    </p>
                    <p className="text-gray-300 text-sm">
                      Also accepts PNG, WebP (auto-converted to JPG) • Max 5MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
                <p className="text-red-300 text-sm text-center">{error}</p>
                <p className="text-red-200 text-xs text-center mt-1">
                  For best results, please use JPG/JPEG format
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
