
import React from 'react';
import { Loader2, Zap } from 'lucide-react';
import { TryOnResultPanel } from './TryOnResultPanel';

interface TryOnResultSectionProps {
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

export const TryOnResultSection: React.FC<TryOnResultSectionProps> = ({
  isProcessing,
  tryOnResultImage,
  error,
  adjustments,
  processingTime,
  supabaseConfigured,
  handleTryOn,
  handleRetry,
  onShare
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900"></h3>
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
  );
};
