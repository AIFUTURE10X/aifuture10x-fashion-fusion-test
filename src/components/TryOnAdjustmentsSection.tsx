
import React from 'react';
import { TryOnProductInfo } from './TryOnProductInfo';

interface TryOnAdjustmentsSectionProps {
  adjustments: { size: number[]; position: number[]; brightness: number[] };
  setAdjustments: React.Dispatch<React.SetStateAction<{
    size: number[];
    position: number[];
    brightness: number[];
  }>>;
  isProcessing: boolean;
  hasResult: boolean;
  selectedClothing: any;
}

export const TryOnAdjustmentsSection: React.FC<TryOnAdjustmentsSectionProps> = ({
  adjustments,
  setAdjustments,
  isProcessing,
  hasResult,
  selectedClothing
}) => {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900"></h3>
      <TryOnProductInfo selectedClothing={selectedClothing} />
    </div>
  );
};
