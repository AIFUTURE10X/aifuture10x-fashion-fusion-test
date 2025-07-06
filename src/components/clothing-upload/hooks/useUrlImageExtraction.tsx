import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExtractedImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

interface ExtractedMetadata {
  title?: string;
  brand?: string;
  price?: string;
  category?: string;
}

interface ExtractionResult {
  success: boolean;
  images?: ExtractedImage[];
  metadata?: ExtractedMetadata;
  error?: string;
}

export const useUrlImageExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const { toast } = useToast();

  const extractImages = async (url: string): Promise<ExtractionResult> => {
    setIsExtracting(true);
    setError(null);
    setExtractedData(null);

    try {
      console.log('🔍 Starting image extraction from URL:', url);

      const { data, error: functionError } = await supabase.functions.invoke(
        'extract-clothing-image',
        {
          body: { url }
        }
      );

      if (functionError) {
        console.error('❌ Function error:', functionError);
        throw new Error(functionError.message || 'Failed to extract images');
      }

      if (!data || !data.success) {
        const errorMessage = data?.error || 'Failed to extract images from the webpage';
        console.error('❌ Extraction failed:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('✅ Extraction successful:', {
        imageCount: data.images?.length || 0,
        hasMetadata: !!data.metadata
      });

      setExtractedData(data);
      
      toast({
        title: "Images extracted successfully!",
        description: `Found ${data.images?.length || 0} product images`
      });

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract images';
      console.error('❌ URL extraction error:', err);
      setError(errorMessage);
      
      toast({
        title: "Extraction failed",
        description: errorMessage,
        variant: "destructive"
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsExtracting(false);
    }
  };

  const clearData = () => {
    setExtractedData(null);
    setError(null);
  };

  return {
    extractImages,
    isExtracting,
    error,
    extractedData,
    clearData
  };
};