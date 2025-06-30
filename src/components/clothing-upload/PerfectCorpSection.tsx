
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface PerfectCorpSectionProps {
  uploadedPhoto: string | null;
  garmentCategory: string;
  clothingName: string;
  perfectCorpStatus: 'idle' | 'uploading' | 'success' | 'error';
  onPerfectCorpUpload: () => void;
}

export const PerfectCorpSection: React.FC<PerfectCorpSectionProps> = ({
  uploadedPhoto,
  garmentCategory,
  clothingName,
  perfectCorpStatus,
  onPerfectCorpUpload
}) => {
  if (!uploadedPhoto || !garmentCategory || !clothingName) {
    return null;
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-purple-900">Perfect Corp AI Processing</h4>
        {perfectCorpStatus === 'success' && <Check className="w-5 h-5 text-green-600" />}
      </div>
      
      {perfectCorpStatus === 'idle' && (
        <div>
          <p className="text-purple-700 text-sm mb-3">
            Process your clothing with Perfect Corp AI for realistic try-on results. (Optional)
          </p>
          <Button
            type="button"
            onClick={onPerfectCorpUpload}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            Process with AI
          </Button>
        </div>
      )}
      
      {perfectCorpStatus === 'uploading' && (
        <div className="flex items-center space-x-2 text-purple-700">
          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Processing with Perfect Corp AI...</span>
        </div>
      )}
      
      {perfectCorpStatus === 'success' && (
        <p className="text-green-700 text-sm">
          ✅ Successfully processed! Ready for virtual try-on.
        </p>
      )}
      
      {perfectCorpStatus === 'error' && (
        <div>
          <p className="text-red-700 text-sm mb-2">Failed to process with Perfect Corp AI</p>
          <Button
            type="button"
            onClick={onPerfectCorpUpload}
            size="sm"
            variant="outline"
          >
            Retry Processing
          </Button>
        </div>
      )}
    </div>
  );
};
