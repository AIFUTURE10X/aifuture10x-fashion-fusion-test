
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
}) => null;

export default TryOnAdjustments;
