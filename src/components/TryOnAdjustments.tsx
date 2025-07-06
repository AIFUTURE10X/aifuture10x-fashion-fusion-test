
import React from "react";
import { Slider } from "@/components/ui/slider";
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
}) => (
  <div className="space-y-6">
    {/* Size Adjustment */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Size: {adjustments.size[0]}%
      </label>
      <Slider
        value={adjustments.size}
        onValueChange={(value) =>
          setAdjustments((prev) => ({ ...prev, size: value }))
        }
        max={150}
        min={50}
        step={5}
        className="w-full"
        disabled={isProcessing || !hasResult}
      />
    </div>

    {/* Position Adjustment */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Position: {adjustments.position[0]}%
      </label>
      <Slider
        value={adjustments.position}
        onValueChange={(value) =>
          setAdjustments((prev) => ({ ...prev, position: value }))
        }
        max={100}
        min={0}
        step={5}
        className="w-full"
        disabled={isProcessing || !hasResult}
      />
    </div>

    {/* Brightness Adjustment */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Brightness: {adjustments.brightness[0]}%
      </label>
      <Slider
        value={adjustments.brightness}
        onValueChange={(value) =>
          setAdjustments((prev) => ({ ...prev, brightness: value }))
        }
        max={150}
        min={50}
        step={5}
        className="w-full"
        disabled={isProcessing || !hasResult}
      />
    </div>

    <div className="pt-4 border-t border-gray-200">
      <Button
        variant="outline"
        className="w-full"
        disabled={isProcessing || !hasResult}
        onClick={() =>
          setAdjustments({
            size: [100],
            position: [50],
            brightness: [100],
          })
        }
      >
        Reset Adjustments
      </Button>
    </div>
  </div>
);

export default TryOnAdjustments;
