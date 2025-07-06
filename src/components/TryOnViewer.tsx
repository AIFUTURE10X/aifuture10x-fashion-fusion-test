
import React, { useState } from 'react';
import { useTryOnProcess } from '@/hooks/useTryOnProcess';
import { TryOnHeader } from './TryOnHeader';
import { TryOnOriginalPhoto } from './TryOnOriginalPhoto';
import { TryOnResultSection } from './TryOnResultSection';
import { TryOnAdjustmentsSection } from './TryOnAdjustmentsSection';

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
  const [adjustments, setAdjustments] = useState({
    size: [100],
    position: [50],
    brightness: [100]
  });

  const {
    isProcessing,
    supabaseConfigured,
    tryOnResultImage,
    processingTime,
    error,
    handleTryOn,
    handleRetry
  } = useTryOnProcess({ userPhoto, selectedClothing });

  return (
    <div className="max-w-6xl mx-auto -mt-4">
      <TryOnHeader
        selectedClothing={selectedClothing}
        onBack={onBack}
        onRetry={handleRetry}
        onShare={onShare}
        isProcessing={isProcessing}
        supabaseConfigured={supabaseConfigured}
        hasResult={!!tryOnResultImage}
      />

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <TryOnOriginalPhoto userPhoto={userPhoto} />

        <TryOnResultSection
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

        <TryOnAdjustmentsSection
          adjustments={adjustments}
          setAdjustments={setAdjustments}
          isProcessing={isProcessing}
          hasResult={!!tryOnResultImage}
          selectedClothing={selectedClothing}
        />
      </div>
    </div>
  );
};
