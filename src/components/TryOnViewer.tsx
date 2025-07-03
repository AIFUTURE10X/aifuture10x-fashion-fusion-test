
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Download, RotateCcw, Zap, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { perfectCorpApi, TryOnResponse } from '@/services/perfectCorpApi';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { TryOnAdjustments } from './TryOnAdjustments';
import { TryOnProductInfo } from './TryOnProductInfo';
import { TryOnResultPanel } from './TryOnResultPanel';

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
      console.log('❌ Cannot start try-on: Supabase not configured');
      return;
    }

    console.log('🚀 Starting virtual try-on process...');
    console.log('📸 User photo:', userPhoto);
    console.log('👕 Selected clothing:', selectedClothing);
    
    setIsProcessing(true);
    setError(null);
    const startTime = Date.now();

    try {
      // Always treat clothing as custom now since we use Perfect Corp File API
      const payload: any = {
        userPhoto,
        clothingCategory: selectedClothing.category,
        clothingImage: selectedClothing.image, // Supabase URL for reference
        isCustomClothing: true
      };

      // If we have a stored Perfect Corp ref_id, use it
      if (selectedClothing.perfect_corp_ref_id) {
        payload.perfectCorpRefId = selectedClothing.perfect_corp_ref_id;
        console.log('🎨 Using stored Perfect Corp ref_id:', selectedClothing.perfect_corp_ref_id);
      } else {
        console.log('📤 Will upload clothing image to Perfect Corp during try-on');
      }

      console.log('📤 Sending try-on request payload:', JSON.stringify(payload, null, 2));
      
      // Start processing timer
      const response: TryOnResponse = await perfectCorpApi.tryOnClothing(payload);
      const processingTimeMs = Date.now() - startTime;
      const processingTimeSec = Math.round(processingTimeMs / 1000);
      
      console.log('📥 Received try-on response:', JSON.stringify(response, null, 2));
      console.log('⏱️ Total processing time:', processingTimeSec, 'seconds');

      // Check for API errors or missing data
      if (!response.success) {
        const errorMsg = response.error || 'Unknown API error occurred';
        console.error('❌ API returned error:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!response.resultImage) {
        console.error('❌ No result image in successful response');
        throw new Error('No result image returned from API');
      }

      // Validate and prepare the base64 image data
      let imageData = response.resultImage;
      if (!imageData.startsWith('data:image/')) {
        console.log('🔧 Adding data URL prefix to base64 image');
        imageData = `data:image/jpeg;base64,${imageData}`;
      }

      console.log('✅ Image validation passed');
      console.log('📊 Result image length:', imageData.length);
      console.log('🖼️ Image preview:', imageData.substring(0, 100) + '...');
      
      // Set the result image
      console.log('🎯 Setting try-on result image...');
      setTryOnResultImage(imageData);
      setProcessingTime(response.processingTime || processingTimeSec);
      
      // Small delay to ensure state is set
      setTimeout(() => {
        console.log('🔍 Final check - tryOnResultImage state:', !!imageData);
      }, 100);
      
      toast({
        title: "Try-On Complete!",
        description: "Your virtual try-on has been generated successfully."
      });

    } catch (err) {
      const processingTimeMs = Date.now() - startTime;
      const processingTimeSec = Math.round(processingTimeMs / 1000);
      
      console.error('❌ Try-on error after', processingTimeSec, 'seconds:', err);
      
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      
      // Enhanced error message for common issues
      let enhancedError = errorMessage;
      if (errorMessage.toLowerCase().includes("fetch")) {
        enhancedError = "Unable to connect to the try-on service. Please check your connection and try again.";
      } else if (errorMessage.toLowerCase().includes("file_id")) {
        enhancedError = "Image processing failed. The clothing image may need to be re-uploaded.";
      } else if (errorMessage.toLowerCase().includes("authentication")) {
        enhancedError = "Authentication failed. Please try again or contact support.";
      }
      
      setError(enhancedError);
      
      toast({
        title: "Try-On Failed",
        description: enhancedError,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Retrying try-on...');
    setTryOnResultImage(null);
    setError(null);
    handleTryOn();
  };

  // Debug effect to log when tryOnResultImage changes
  useEffect(() => {
    if (tryOnResultImage) {
      console.log('🖼️ Try-on result image updated in TryOnViewer:', {
        length: tryOnResultImage.length,
        isDataUrl: tryOnResultImage.startsWith('data:'),
        preview: tryOnResultImage.substring(0, 100) + '...'
      });
    } else {
      console.log('🗑️ Try-on result image cleared in TryOnViewer');
    }
  }, [tryOnResultImage]);

  // Debug effect to log processing state changes
  useEffect(() => {
    console.log('⚙️ Processing state changed in TryOnViewer:', isProcessing ? 'PROCESSING' : 'IDLE');
  }, [isProcessing]);

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

          <TryOnResultPanel
            isProcessing={isProcessing}
            tryOnResultImage={tryOnResultImage}
            error={error}
            adjustments={adjustments}
            processingTime={processingTime}
            supabaseConfigured={supabaseConfigured}
            handleTryOn={handleTryOn}
            handleRetry={handleRetry}
            onShare={onShare}
          />

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
          <TryOnAdjustments
            adjustments={adjustments}
            setAdjustments={setAdjustments}
            isProcessing={isProcessing}
            hasResult={!!tryOnResultImage}
          />
          <TryOnProductInfo selectedClothing={selectedClothing} />
        </div>
      </div>
    </div>
  );
};
