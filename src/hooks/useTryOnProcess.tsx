
import { useState, useEffect } from 'react';
import { perfectCorpApi, TryOnResponse } from '@/services/perfectCorpApi';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { createProcessingSimulation } from './useTryOnProcess/processingSimulation';
import { enhanceErrorMessage } from './useTryOnProcess/errorHandling';
import { validateAndPrepareImage, logImageDetails } from './useTryOnProcess/imageValidation';
import { PROCESSING_TIME_RANGE } from './useTryOnProcess/constants';

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
      // Add realistic processing delay with progress simulation (4-7 seconds)
      const simulateProcessing = createProcessingSimulation();

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
      
      // Run both processing simulation and actual API call
      const [response] = await Promise.all([
        perfectCorpApi.tryOnClothing(payload),
        simulateProcessing
      ]);
      
      const processingTimeMs = Math.max(Date.now() - startTime, PROCESSING_TIME_RANGE.MINIMUM_REALISTIC); // Minimum 5 seconds for realism
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
      const imageData = validateAndPrepareImage(response.resultImage);
      logImageDetails(imageData);
      
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
      const enhancedError = enhanceErrorMessage(errorMessage);
      
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
