
import React from "react";
import { Button } from "@/components/ui/button";

interface TryOnAdjustmentsProps {
  adjustments: { size: number[]; position: number[]; brightness: number[] };
  setAdjustments: React.Dispatch<
    React.SetStateAction<{
      size: number[];
      position: number[];
      brightness: number[];
    }>
  >;
  isProcessing: boolean;
  hasResult: boolean;
}

export const TryOnAdjustments: React.FC<TryOnAdjustmentsProps> = ({
  adjustments,
  setAdjustments,
  isProcessing,
  hasResult,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Adjustments</h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Adjustment controls will be available here.
        </p>
      </div>
    </div>
  );
};

export default TryOnAdjustments;
