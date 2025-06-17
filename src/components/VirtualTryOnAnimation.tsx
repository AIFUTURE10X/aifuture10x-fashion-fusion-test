
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

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setProgress(0);
      
      // Simulate AI processing with progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
              setCurrentClothingIndex(prev => (prev + 1) % clothingItems.length);
              setIsTransitioning(false);
              setProgress(0);
            }, 500);
            return 100;
          }
          return prev + 10;
        });
      }, 150);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleManualChange = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setCurrentClothingIndex(index);
            setIsTransitioning(false);
            setProgress(0);
          }, 500);
          return 100;
        }
        return prev + 20;
      });
    }, 100);
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

        {/* Model and Clothing Display */}
        <div className="relative z-10 flex items-center justify-center mb-6">
          <div className="relative">
            {/* Model silhouette placeholder */}
            <div className="w-48 h-64 bg-gradient-to-b from-gray-200 to-gray-300 rounded-full opacity-40 mx-auto"></div>
            
            {/* Clothing overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className={`relative transition-all duration-1000 ${
                  isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                <img
                  src={currentClothing.image}
                  alt={currentClothing.name}
                  className="w-40 h-52 object-cover rounded-2xl shadow-lg"
                />
                {isTransitioning && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-purple-600 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Processing indicator */}
        {isTransitioning && (
          <div className="relative z-10 mb-6">
            <div className="bg-white/60 rounded-full p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700">AI Processing...</span>
                <span className="text-sm text-purple-600">{progress}%</span>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                ></div>
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
