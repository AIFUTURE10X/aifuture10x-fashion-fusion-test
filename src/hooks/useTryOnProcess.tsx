
import { useState, useEffect } from 'react';
import { perfectCorpApi, TryOnResponse } from '@/services/perfectCorpApi';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

interface UseTryOnProcessProps {
  userPhoto: string;
  selectedClothing: any;
}

export const useTryOnProcess = ({ userPhoto, selectedClothing }: UseTryOnProcessProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [tryOnResultImage, setTryOnResultImage] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  return {
    isProcessing,
    supabaseConfigured,
    tryOnResultImage,
    processingTime,
    error,
    handleTryOn,
    handleRetry
  };
};
