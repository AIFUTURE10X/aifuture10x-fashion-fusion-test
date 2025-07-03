
import React from "react";
import {
  Loader2,
  Zap,
  AlertCircle,
  RotateCcw,
  Share2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface TryOnResultPanelProps {
  isProcessing: boolean;
  tryOnResultImage: string | null;
  error: string | null;
  adjustments: { brightness: number[]; size: number[]; position: number[] };
  processingTime: number | null;
  supabaseConfigured: boolean;
  handleTryOn: () => void;
  handleRetry: () => void;
  onShare: () => void;
}

export const TryOnResultPanel: React.FC<TryOnResultPanelProps> = ({
  isProcessing,
  tryOnResultImage,
  error,
  adjustments,
  processingTime,
  supabaseConfigured,
  handleTryOn,
  handleRetry,
  onShare,
}) => {
  const [progress, setProgress] = React.useState(0);
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Simulate progress during processing
  React.useEffect(() => {
    if (isProcessing) {
      setProgress(0);
      setImageLoaded(false);
      setImageError(false);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isProcessing]);

  // Reset states when new image is provided
  React.useEffect(() => {
    if (tryOnResultImage) {
      console.log('🖼️ TryOnResultPanel - New image received:', {
        hasTryOnResultImage: !!tryOnResultImage,
        imageLength: tryOnResultImage?.length || 0,
        imagePrefix: tryOnResultImage?.substring(0, 100) || 'none',
        isProcessing,
        error,
        isDataUrl: tryOnResultImage?.startsWith('data:')
      });
      setImageError(false);
      setImageLoaded(false);
    } else {
      console.log('🗑️ TryOnResultPanel - Image cleared');
      setImageError(false);
      setImageLoaded(false);
    }
  }, [tryOnResultImage, isProcessing, error]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('❌ Try-on result image failed to load:', e);
    console.error('Image src preview:', tryOnResultImage?.substring(0, 200));
    console.error('Image length:', tryOnResultImage?.length);
    setImageError(true);
    setImageLoaded(false);
  };

  const handleImageLoad = () => {
    console.log('✅ Try-on result image loaded successfully');
    console.log('Image dimensions and basic info logged');
    setImageError(false);
    setImageLoaded(true);
  };

  const renderImage = () => {
    if (!tryOnResultImage) return null;

    console.log('🎨 Rendering image with data:', {
      hasImage: !!tryOnResultImage,
      isDataUrl: tryOnResultImage.startsWith('data:'),
      length: tryOnResultImage.length,
      preview: tryOnResultImage.substring(0, 50)
    });

    return (
      <div className="relative w-full h-full bg-gray-100">
        <img
          src={tryOnResultImage}
          alt="Try-on result"
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            filter: `brightness(${adjustments.brightness[0]}%)`,
            transform: `scale(${adjustments.size[0] / 100}) translateY(${
              (adjustments.position[0] - 50) * 2
            }px)`,
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        )}
        {imageLoaded && (
          <div className="absolute top-4 left-4">
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              AI Generated
              {processingTime && (
                <span className="ml-1">({processingTime}s)</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="aspect-[3/4] relative bg-gray-50 flex items-center justify-center">
        {isProcessing ? (
          <div className="absolute inset-0">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/60 z-10"></div>
            
            {/* Processing overlay */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-purple-600 animate-pulse" />
              </div>
              
              <h4 className="font-bold text-white text-2xl mb-2">Processing</h4>
              <p className="text-white/90 text-lg mb-6">Please don't close the window</p>
              
              {/* Progress bar */}
              <div className="w-full max-w-xs">
                <Progress 
                  value={progress} 
                  className="h-3 bg-white/20"
                />
                <div className="text-white text-lg font-semibold mt-3">
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
          </div>
        ) : tryOnResultImage && !imageError ? (
          renderImage()
        ) : imageError ? (
          <div className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 mb-2">Image Display Error</h4>
            <p className="text-gray-600 text-sm mb-4">
              The try-on result couldn't be displayed properly
            </p>
            <div className="text-xs text-gray-500 mb-4 font-mono bg-gray-100 p-2 rounded">
              Debug: {tryOnResultImage?.substring(0, 100)}...
            </div>
            <Button onClick={handleRetry} size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : error ? (
          <div className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 mb-2">Try-On Failed</h4>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <Button onClick={handleRetry} size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : !supabaseConfigured ? (
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Setup Required</h4>
            <p className="text-gray-600 text-sm">Supabase not connected</p>
          </div>
        ) : (
          <div className="text-center p-6">
            <Button
              onClick={handleTryOn}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Zap className="w-4 h-4 mr-2" />
              Start Try-On
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TryOnResultPanel;
