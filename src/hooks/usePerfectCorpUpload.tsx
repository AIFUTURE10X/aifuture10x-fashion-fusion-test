
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PerfectCorpUploadResult {
  fileId: string;
  success: boolean;
}

export const usePerfectCorpUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadToPerfectCorp = async (file: File): Promise<PerfectCorpUploadResult | null> => {
    setIsUploading(true);
    
    try {
      console.log('Starting Perfect Corp upload process...');
      
      // Step 1: Get upload URL from Perfect Corp File API
      const { data: fileApiData, error: fileApiError } = await supabase.functions.invoke(
        'perfectcorp-file-api',
        {
          body: {
            fileName: file.name,
            contentType: file.type
          }
        }
      );

      if (fileApiError) {
        console.error('File API error:', fileApiError);
        throw new Error(`File API failed: ${fileApiError.message}`);
      }

      if (!fileApiData?.success || !fileApiData?.uploadUrl || !fileApiData?.fileId) {
        console.error('Invalid File API response:', fileApiData);
        throw new Error('Invalid response from Perfect Corp File API');
      }

      console.log('Got Perfect Corp upload URL, file_id:', fileApiData.fileId);

      // Step 2: Upload file directly to Perfect Corp's provided URL
      const uploadResponse = await fetch(fileApiData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      console.log(`Perfect Corp upload response: ${uploadResponse.status}`);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Perfect Corp upload failed:', uploadResponse.status, errorText);
        throw new Error(`Perfect Corp upload failed: ${uploadResponse.status}`);
      }

      console.log('Perfect Corp upload successful, file_id:', fileApiData.fileId);
      
      toast({
        title: "Upload Successful!",
        description: "Image uploaded to Perfect Corp successfully"
      });

      return {
        fileId: fileApiData.fileId,
        success: true
      };

    } catch (error) {
      console.error('Perfect Corp upload error:', error);
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload to Perfect Corp",
        variant: "destructive"
      });

      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadToPerfectCorp,
    isUploading
  };
};
