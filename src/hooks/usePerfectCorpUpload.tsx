
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
      
      // Step 1: Get upload URL from Perfect Corp File API with enhanced error handling
      console.log('📤 Starting Perfect Corp upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
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
        console.error('❌ File API error:', fileApiError);
        throw new Error(`File API failed: ${fileApiError.message}`);
      }

      if (!fileApiData?.success) {
        console.error('❌ File API returned failure:', fileApiData);
        throw new Error(fileApiData?.error || 'File API request failed');
      }

      if (!fileApiData?.uploadUrl || !fileApiData?.fileId) {
        console.error('❌ Invalid File API response structure:', fileApiData);
        throw new Error('Missing upload URL or file ID from Perfect Corp File API');
      }

      console.log('✅ Got Perfect Corp upload credentials:', {
        fileId: fileApiData.fileId,
        uploadUrlLength: fileApiData.uploadUrl.length,
        workingEndpoint: fileApiData.workingEndpoint
      });

      // Step 2: Upload file directly to Perfect Corp's provided URL with enhanced logging
      console.log('📤 Uploading file to Perfect Corp signed URL...');
      console.log('🔗 Upload URL length:', fileApiData.uploadUrl.length);
      console.log('📊 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const uploadResponse = await fetch(fileApiData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
        body: file,
      });

      console.log(`📥 Perfect Corp upload response: ${uploadResponse.status} ${uploadResponse.statusText}`);
      console.log('📋 Response headers:', Object.fromEntries(uploadResponse.headers.entries()));

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Perfect Corp file upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error: errorText,
          uploadUrl: fileApiData.uploadUrl.substring(0, 100) + '...'
        });
        throw new Error(`Perfect Corp upload failed: ${uploadResponse.status} - ${errorText || uploadResponse.statusText}`);
      }

      console.log('✅ Perfect Corp upload successful, file_id:', fileApiData.fileId);
      
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
