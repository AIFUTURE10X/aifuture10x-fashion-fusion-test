
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Download, RotateCcw, Zap, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { perfectCorpApi, TryOnResponse } from '@/services/perfectCorpApi';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

interface TryOnViewerProps {
  userPhoto: string;
  selectedClothing: any;
  tryOnResult: string | null;
  onShare: () => void;
  onBack: () => void;
}

export const TryOnViewer: React.FC<TryOnViewerProps> = ({
  userPhoto,
  selectedClothing,
  tryOnResult,
  onShare,
  onBack
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [tryOnResultImage, setTryOnResultImage] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState({
    size: [100],
    position: [50],
    brightness: [100]
  });
  const { toast } = useToast();

  // --- Supabase configured logic (Lovable-native check) ---
  useEffect(() => {
    // In Lovable, Supabase is considered configured if we have a valid client
    setSupabaseConfigured(!!supabase);
  }, []);

  // --- Auto-trigger try-on ---
  useEffect(() => {
    if (
      supabaseConfigured &&
      !tryOnResultImage &&
      !isProcessing
    ) {
      handleTryOn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClothing, userPhoto, supabaseConfigured]);

  const handleTryOn = async () => {
    if (!supabaseConfigured) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    console.log('Starting virtual try-on process...');

    try {
      const response: TryOnResponse = await perfectCorpApi.tryOnClothing({
        userPhoto,
        clothingImage: selectedClothing.image,
        clothingCategory: selectedClothing.category
      });

      if (response.success && response.resultImage) {
        const resultImageUrl = `data:image/jpeg;base64,${response.resultImage}`;
        setTryOnResultImage(resultImageUrl);
        setProcessingTime(response.processingTime || null);
        toast({
          title: "Try-On Complete!",
          description: "Your virtual try-on has been generated successfully."
        });
      } else {
        // Enhance error message for fetch failures
        const isFetchError = response.error?.toLowerCase().includes("fetch");
        setError(
          isFetchError
            ? "Image fetch failed. Please double-check your uploaded photo and clothing image are public URLs (not local or protected links)."
            : response.error || "Try-on failed"
        );
        toast({
          title: "Try-On Failed",
          description: isFetchError
            ? "Image fetch failed. Only public image URLs (jpg/png on the internet) are supported for try-on."
            : response.error || "An error occurred during processing",
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setTryOnResultImage(null);
    setError(null);
    handleTryOn();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Virtual Try-On</h2>
            <p className="text-gray-600">{selectedClothing.name} by {selectedClothing.brand}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRetry} disabled={isProcessing || !supabaseConfigured}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          {tryOnResultImage && !isProcessing && (
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

      {/* Supabase Configuration Notice */}
      {/* REMOVED: The configuration notice, because Supabase is detected as configured via Lovable */}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Original Photo */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Original Photo</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-[3/4] relative">
              <img
                src={userPhoto}
                alt="Original photo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Try-On Result */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Try-On Result</h3>
            {isProcessing && (
              <div className="flex items-center text-purple-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-[3/4] relative bg-gray-50 flex items-center justify-center">
              {isProcessing ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-purple-600 animate-pulse" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">AI Processing</h4>
                  <p className="text-gray-600 text-sm">Creating your virtual try-on...</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto mt-4">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse w-3/4"></div>
                  </div>
                </div>
              ) : tryOnResultImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={tryOnResultImage}
                    alt="Try-on result"
                    className="w-full h-full object-cover"
                    style={{
                      filter: `brightness(${adjustments.brightness[0]}%)`,
                      transform: `scale(${adjustments.size[0] / 100}) translateY(${(adjustments.position[0] - 50) * 2}px)`
                    }}
                  />
                  <div className="absolute top-4 left-4">
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      AI Generated
                      {processingTime && <span className="ml-1">({processingTime}s)</span>}
                    </div>
                  </div>
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
                  <Button onClick={handleTryOn} className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Zap className="w-4 h-4 mr-2" />
                    Start Try-On
                  </Button>
                </div>
              )}
            </div>
          </div>

          {tryOnResultImage && !isProcessing && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center text-green-700 mb-2">
                <Zap className="w-5 h-5 mr-2" />
                <span className="font-medium">Try-on Complete!</span>
              </div>
              <p className="text-green-600 text-sm">
                How does it look? You can adjust the fit or try another item.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="font-semibold text-gray-900">Adjustments</h3>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Size Adjustment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Size: {adjustments.size[0]}%
              </label>
              <Slider
                value={adjustments.size}
                onValueChange={(value) => setAdjustments(prev => ({ ...prev, size: value }))}
                max={150}
                min={50}
                step={5}
                className="w-full"
                disabled={isProcessing || !tryOnResultImage}
              />
            </div>

            {/* Position Adjustment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Position: {adjustments.position[0]}%
              </label>
              <Slider
                value={adjustments.position}
                onValueChange={(value) => setAdjustments(prev => ({ ...prev, position: value }))}
                max={100}
                min={0}
                step={5}
                className="w-full"
                disabled={isProcessing || !tryOnResultImage}
              />
            </div>

            {/* Brightness Adjustment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Brightness: {adjustments.brightness[0]}%
              </label>
              <Slider
                value={adjustments.brightness}
                onValueChange={(value) => setAdjustments(prev => ({ ...prev, brightness: value }))}
                max={150}
                min={50}
                step={5}
                className="w-full"
                disabled={isProcessing || !tryOnResultImage}
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                className="w-full"
                disabled={isProcessing || !tryOnResultImage}
                onClick={() => setAdjustments({
                  size: [100],
                  position: [50],
                  brightness: [100]
                })}
              >
                Reset Adjustments
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden">
              <img
                src={selectedClothing.image}
                alt={selectedClothing.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">{selectedClothing.name}</h4>
            <p className="text-gray-600 text-sm mb-3">{selectedClothing.brand}</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-gray-900">${selectedClothing.price}</span>
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// End of TryOnViewer.tsx
