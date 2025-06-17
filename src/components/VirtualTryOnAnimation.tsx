
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const clothingItems = [
  {
    id: 1,
    name: "Pink Floral Dress",
    image: "/lovable-uploads/aa0177fd-7fc4-40d9-b1b6-20e0d8f82594.png",
    brand: "Summer Collection"
  },
  {
    id: 2,
    name: "Pink Ruffle Dress",
    image: "/lovable-uploads/ba7e7b5d-f949-46ce-9579-303ac63565fb.png",
    brand: "Elegant Series"
  }
];

export const VirtualTryOnAnimation = () => {
  const [currentClothingIndex, setCurrentClothingIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showClothing, setShowClothing] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setProgress(0);
      setShowClothing(false);
      
      // Simulate AI processing with progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
              setCurrentClothingIndex(prev => (prev + 1) % clothingItems.length);
              setShowClothing(true);
              setIsTransitioning(false);
              setProgress(0);
            }, 300);
            return 100;
          }
          return prev + 8;
        });
      }, 120);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleManualChange = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setProgress(0);
    setShowClothing(false);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setCurrentClothingIndex(index);
            setShowClothing(true);
            setIsTransitioning(false);
            setProgress(0);
          }, 300);
          return 100;
        }
        return prev + 15;
      });
    }, 80);
  };

  const currentClothing = clothingItems[currentClothingIndex];

  return (
    <div className="relative">
      {/* Animation Container */}
      <div className="relative bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm rounded-3xl p-8 border border-white/30 shadow-2xl">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse"></div>
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Virtual Try-On Demo</h3>
            <p className="text-gray-600">Watch AI transform your look instantly</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-white/80 hover:bg-white border-purple-200"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleManualChange(0)}
              disabled={isTransitioning}
              className="bg-white/80 hover:bg-white border-purple-200"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Virtual Try-On Display */}
        <div className="relative z-10 flex items-center justify-center mb-6">
          <div className="relative w-64 h-80">
            {/* Person Silhouette Base */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                width="160"
                height="280"
                viewBox="0 0 160 280"
                className="drop-shadow-lg"
              >
                {/* Head */}
                <ellipse cx="80" cy="30" rx="20" ry="25" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="2" />
                
                {/* Neck */}
                <rect x="75" y="50" width="10" height="15" fill="#E5E7EB" />
                
                {/* Body outline for dress fitting */}
                <path
                  d="M 60 65 Q 50 70 45 85 L 40 120 Q 38 140 42 160 Q 45 180 50 200 Q 55 220 60 240 L 70 270 Q 80 275 90 270 L 100 240 Q 105 220 110 200 Q 115 180 118 160 Q 122 140 120 120 L 115 85 Q 110 70 100 65 Q 90 60 80 62 Q 70 60 60 65 Z"
                  fill="#F3F4F6"
                  stroke="#D1D5DB"
                  strokeWidth="2"
                  opacity="0.8"
                />
                
                {/* Arms */}
                <ellipse cx="40" cy="90" rx="8" ry="25" fill="#E5E7EB" transform="rotate(-15 40 90)" />
                <ellipse cx="120" cy="90" rx="8" ry="25" fill="#E5E7EB" transform="rotate(15 120 90)" />
                
                {/* Legs (visible below dress) */}
                <ellipse cx="70" cy="260" rx="6" ry="20" fill="#E5E7EB" />
                <ellipse cx="90" cy="260" rx="6" ry="20" fill="#E5E7EB" />
              </svg>
            </div>
            
            {/* Clothing Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className={`relative transition-all duration-700 ${
                  showClothing && !isTransitioning 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-95'
                }`}
              >
                <img
                  src={currentClothing.image}
                  alt={currentClothing.name}
                  className="w-36 h-48 object-cover rounded-lg shadow-lg"
                  style={{
                    clipPath: 'polygon(15% 10%, 85% 10%, 95% 25%, 90% 85%, 10% 85%, 5% 25%)',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                  }}
                />
                
                {/* Blending overlay for realistic fitting */}
                <div 
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent rounded-lg"
                  style={{
                    clipPath: 'polygon(15% 10%, 85% 10%, 95% 25%, 90% 85%, 10% 85%, 5% 25%)'
                  }}
                />
              </div>
            </div>

            {/* AI Processing Overlay */}
            {isTransitioning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl p-6 backdrop-blur-sm border border-white/30">
                  <Sparkles className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-2" />
                  <div className="text-sm text-purple-700 font-medium">AI Fitting...</div>
                </div>
              </div>
            )}

            {/* Fitting Guide Lines */}
            {!isTransitioning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Shoulder guides */}
                <div className="absolute top-16 left-8 w-2 h-2 bg-purple-400/60 rounded-full animate-pulse"></div>
                <div className="absolute top-16 right-8 w-2 h-2 bg-purple-400/60 rounded-full animate-pulse"></div>
                
                {/* Waist guides */}
                <div className="absolute top-32 left-6 w-1.5 h-1.5 bg-pink-400/60 rounded-full animate-pulse delay-300"></div>
                <div className="absolute top-32 right-6 w-1.5 h-1.5 bg-pink-400/60 rounded-full animate-pulse delay-300"></div>
                
                {/* Hem guides */}
                <div className="absolute bottom-16 left-10 w-1 h-1 bg-purple-300/60 rounded-full animate-pulse delay-500"></div>
                <div className="absolute bottom-16 right-10 w-1 h-1 bg-purple-300/60 rounded-full animate-pulse delay-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Processing indicator */}
        {isTransitioning && (
          <div className="relative z-10 mb-6">
            <div className="bg-white/60 rounded-full p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700">AI Fitting Clothes...</span>
                <span className="text-sm text-purple-600">{progress}%</span>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {progress < 30 ? 'Analyzing body shape...' : 
                 progress < 60 ? 'Adjusting fit...' : 
                 progress < 90 ? 'Applying final touches...' : 'Complete!'}
              </div>
            </div>
          </div>
        )}

        {/* Current clothing info */}
        <div className="relative z-10 bg-white/60 rounded-2xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">{currentClothing.name}</h4>
              <p className="text-sm text-gray-600">{currentClothing.brand}</p>
              <p className="text-xs text-purple-600 mt-1">
                {showClothing ? 'Try-on complete' : 'Processing...'}
              </p>
            </div>
            <div className="flex space-x-1">
              {clothingItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleManualChange(index)}
                  disabled={isTransitioning}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentClothingIndex
                      ? 'bg-purple-500 scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Floating elements for visual appeal */}
        <div className="absolute top-4 left-4 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-6 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-8 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse delay-500"></div>
      </div>
    </div>
  );
};
