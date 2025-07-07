
import React from 'react';
import { Camera, Zap, Users } from 'lucide-react';

export const HeroSection = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-20">
      {/* Logo positioned in top right corner */}
      <div className="absolute top-4 right-4">
        <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-16 w-auto drop-shadow-lg" />
      </div>
      
      <div className="text-center mb-6">        
        <p className="text-2xl text-white font-semibold drop-shadow-lg mb-4">Your Fashion Reveal</p>
        
        <h2 className="text-5xl mb-6 font-normal text-white drop-shadow-lg font-poppins">
          Try On Clothes
          <span className="block bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-purple-600">Virtually, Instantly, AI</span>
        </h2>
        <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-6 drop-shadow-sm">
          Upload your photo and see how clothes look on you before buying. 
          Powered by AI for the most accurate virtual try-on experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 mt-32">
        <div className="relative group">
          {/* Spinning border effect */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-conic-1 opacity-75 group-hover:opacity-100 animate-border-spin"></div>
          <div className="relative bg-gradient-to-br from-purple-600/80 to-pink-600/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <Camera className="w-8 h-8 text-white mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">Upload Photo</h3>
            <p className="text-gray-100 text-sm">Simply upload a clear photo of yourself</p>
          </div>
        </div>
        <div className="relative group">
          {/* Spinning border effect */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-conic-2 opacity-75 group-hover:opacity-100 animate-border-spin"></div>
          <div className="relative bg-gradient-to-br from-blue-600/80 to-purple-600/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <Zap className="w-8 h-8 text-white mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">AI Try-On</h3>
            <p className="text-gray-100 text-sm">Advanced AI creates realistic try-on results</p>
          </div>
        </div>
        <div className="relative group">
          {/* Spinning border effect */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-conic-3 opacity-75 group-hover:opacity-100 animate-border-spin"></div>
          <div className="relative bg-gradient-to-br from-cyan-500/80 to-blue-600/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <Users className="w-8 h-8 text-white mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">Share & Shop</h3>
            <p className="text-gray-100 text-sm">Share your looks and shop with confidence</p>
          </div>
        </div>
      </div>
    </div>
  );
};
