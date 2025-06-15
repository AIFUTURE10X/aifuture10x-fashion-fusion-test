
import React, { useState } from 'react';
import { ArrowLeft, Share2, Download, RotateCcw, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [adjustments, setAdjustments] = useState({
    size: [100],
    position: [50],
    brightness: [100]
  });

  // Simulate processing when retry is clicked
  const handleRetry = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Virtual Try-On</h2>
            <p className="text-gray-600">{selectedClothing.name} by {selectedClothing.brand}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRetry}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          {!isProcessing && (
            <>
              <Button variant="outline" onClick={onShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Original Photo */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Original Photo</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-[3/4] relative">
              <img
                src={userPhoto}
                alt="Original photo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Try-On Result */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Try-On Result</h3>
            {isProcessing && (
              <div className="flex items-center text-purple-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-[3/4] relative bg-gray-50 flex items-center justify-center">
              {isProcessing ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-purple-600 animate-pulse" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">AI Magic in Progress</h4>
                  <p className="text-gray-600 text-sm">Creating your virtual try-on...</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto mt-4">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  {/* Base user photo */}
                  <img
                    src={userPhoto}
                    alt="User photo base"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Try-on effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/20 to-transparent pointer-events-none">
                    {/* Clothing visualization based on category */}
                    <div 
                      className="absolute left-1/2 transform -translate-x-1/2"
                      style={{
                        top: selectedClothing.category === 'outerwear' ? '25%' : 
                             selectedClothing.category === 'tops' ? '30%' : 
                             selectedClothing.category === 'dresses' ? '25%' : '45%',
                        transform: `translateX(-50%) scale(${adjustments.size[0] / 100}) translateY(${(adjustments.position[0] - 50) * 1.5}px)`,
                      }}
                    >
                      {/* Simulated clothing overlay with proper styling based on item */}
                      <div 
                        className={`
                          relative rounded-lg border-2 border-white/30 shadow-lg
                          ${selectedClothing.category === 'outerwear' ? 'w-32 h-40 bg-gradient-to-b from-gray-800/60 to-gray-900/60' : ''}
                          ${selectedClothing.category === 'tops' ? 'w-28 h-32 bg-gradient-to-b from-white/70 to-gray-100/70' : ''}
                          ${selectedClothing.category === 'dresses' ? 'w-30 h-48 bg-gradient-to-b from-pink-200/60 to-pink-300/60' : ''}
                          ${selectedClothing.category === 'bottoms' ? 'w-24 h-36 bg-gradient-to-b from-blue-200/60 to-blue-300/60' : ''}
                        `}
                        style={{
                          filter: `brightness(${adjustments.brightness[0]}%)`,
                          backdropFilter: 'blur(0.5px)',
                        }}
                      >
                        {/* Clothing pattern/texture overlay */}
                        <div 
                          className="absolute inset-1 rounded opacity-80"
                          style={{
                            backgroundImage: `url(${selectedClothing.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            mixBlendMode: 'overlay',
                          }}
                        />
                        
                        {/* Clothing details overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-1">
                              <Zap className="w-3 h-3 text-purple-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-900 bg-white/90 px-2 py-1 rounded">
                              {selectedClothing.name.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Success indicator */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      Try-On Applied
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isProcessing && (
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

        {/* Adjustments Panel */}
        <div className="space-y-6">
          <h3 className="font-semibold text-gray-900">Adjustments</h3>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Size Adjustment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Size: {adjustments.size[0]}%
              </label>
              <Slider
                value={adjustments.size}
                onValueChange={(value) => setAdjustments(prev => ({ ...prev, size: value }))}
                max={150}
                min={50}
                step={5}
                className="w-full"
                disabled={isProcessing}
              />
            </div>

            {/* Position Adjustment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Position: {adjustments.position[0]}%
              </label>
              <Slider
                value={adjustments.position}
                onValueChange={(value) => setAdjustments(prev => ({ ...prev, position: value }))}
                max={100}
                min={0}
                step={5}
                className="w-full"
                disabled={isProcessing}
              />
            </div>

            {/* Brightness Adjustment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Brightness: {adjustments.brightness[0]}%
              </label>
              <Slider
                value={adjustments.brightness}
                onValueChange={(value) => setAdjustments(prev => ({ ...prev, brightness: value }))}
                max={150}
                min={50}
                step={5}
                className="w-full"
                disabled={isProcessing}
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                className="w-full"
                disabled={isProcessing}
                onClick={() => setAdjustments({
                  size: [100],
                  position: [50],
                  brightness: [100]
                })}
              >
                Reset Adjustments
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden">
              <img
                src={selectedClothing.image}
                alt={selectedClothing.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">{selectedClothing.name}</h4>
            <p className="text-gray-600 text-sm mb-3">{selectedClothing.brand}</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-gray-900">${selectedClothing.price}</span>
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
