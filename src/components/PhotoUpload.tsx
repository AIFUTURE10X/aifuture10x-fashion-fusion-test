
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, X, Check } from 'lucide-react';
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
  const [preparing, setPreparing] = useState(false);

  // Helper to check if the uploaded photo is accessible over the public internet
  async function isImagePubliclyAvailable(url: string): Promise<boolean> {
    try {
      // Use a HEAD request so we don't download the image content
      const resp = await fetch(url, { method: "HEAD" });
      return resp.ok;
    } catch {
      return false;
    }
  }

  // Try multiple times to verify image accessibility, with delay between checks
  async function waitForImageAvailability(url: string, retries = 3, delayMs = 1500): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      if (await isImagePubliclyAvailable(url)) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return false;
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setPreparing(false);
    const file = acceptedFiles[0];
    if (file) {
      setIsProcessing(true);
      try {
        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);

        // Upload image to Supabase Storage
        const publicUrl = await uploadPhotoToSupabase(file);
        setUploadedPhoto(publicUrl);

        // Begin preparing step
        setPreparing(true);

        // Wait for URL to be accessible (up to approx 4.5 seconds)
        const available = await waitForImageAvailability(publicUrl, 3, 1500);

        setPreparing(false);

        if (available) {
          onPhotoUpload(publicUrl);
        } else {
          setError(
            "Your photo is uploading, but the public link is not accessible yet. Please try again in a few seconds."
          );
          setUploadedPhoto(null);
          setFilePreview(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed. Please try again."
        );
        setFilePreview(null);
        setUploadedPhoto(null);
        setPreparing(false);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [onPhotoUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleConfirm = () => {
    if (uploadedPhoto) {
      onPhotoUpload(uploadedPhoto);
    }
  };

  const handleRemove = () => {
    setUploadedPhoto(null);
    setFilePreview(null);
    setError(null);
  };

  // If the photo is uploaded and accessible, UI will instantly transition via onPhotoUpload

  // Show feedback while we're checking for image availability
  if (preparing) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="aspect-[3/4] relative flex items-center justify-center">
            <div className="flex flex-col items-center py-12 w-full">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Preparing your photo…
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                Making sure your uploaded photo is available on the web.
              </p>
              <p className="text-xs text-gray-400">Hang tight, this may take a few seconds…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (uploadedPhoto) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="aspect-[3/4] relative">
            <img
              src={filePreview || uploadedPhoto}
              alt="Uploaded photo"
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleRemove}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center text-green-600 mb-4">
              <Check className="w-5 h-5 mr-2" />
              <span className="font-medium">Photo uploaded successfully!</span>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Great! Now you can browse our clothing catalog and see how different items look on you.
            </p>
            <Button 
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              size="lg"
            >
              Continue to Catalog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "bg-white rounded-3xl shadow-lg border-2 border-dashed border-gray-300 p-8 text-center cursor-pointer transition-all duration-200 hover:border-purple-400 hover:shadow-xl",
          isDragActive && "border-purple-500 bg-purple-50",
          isProcessing && "pointer-events-none opacity-75"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Camera className="w-8 h-8 text-purple-600" />
            )}
          </div>
          
          {isProcessing ? (
            <p className="text-gray-600">Uploading your photo...</p>
          ) : isDragActive ? (
            <p className="text-purple-600 font-medium">Drop your photo here</p>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Your Photo
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your photo here, or click to select
              </p>
              <Button variant="outline" className="mx-auto">
                <Upload className="w-4 h-4 mr-2" />
                Choose Photo
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Supported formats: JPEG, PNG, WebP</p>
          <p>• Maximum file size: 10MB</p>
          <p>• For best results, use a clear photo with good lighting</p>
        </div>
        {error && (
          <div className="mt-4 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Privacy notice */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          🔒 Your photos are processed securely and never stored permanently
        </p>
      </div>
    </div>
  );
};

