
import React, { useState } from 'react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ClothingCatalog } from '@/components/ClothingCatalog';
import { TryOnViewer } from '@/components/TryOnViewer';
import { ShareModal } from '@/components/ShareModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VirtualTryOnAnimation } from '@/components/VirtualTryOnAnimation';
import { useTheme } from '@/components/ThemeProvider';
import { SilkTexture } from '@/components/ui/liquid/SilkTexture';
import { Camera, Sparkles, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<any>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'browse' | 'tryon'>('upload');
  const {
    theme
  } = useTheme();

  const handlePhotoUpload = (photoUrl: string) => {
    setUserPhoto(photoUrl);
    setCurrentStep('browse');
  };

  const handleClothingSelect = (clothing: any) => {
    setSelectedClothing(clothing);
    setCurrentStep('tryon');
    // Simulate try-on result for MVP
    setTimeout(() => {
      setTryOnResult('/placeholder.svg');
    }, 2000);
  };

  const resetApp = () => {
    setUserPhoto(null);
    setSelectedClothing(null);
    setTryOnResult(null);
    setCurrentStep('upload');
  };

  return (
    <div className="min-h-screen relative">
      {/* Animated Silk Background */}
      <SilkTexture className="fixed inset-0 z-0" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-black/30" />

      {/* Hero Section */}
      {currentStep === 'upload' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-20">
          {/* Theme toggle in top right */}
          <div className="absolute top-4 right-4 flex items-center space-x-4">
            <ThemeToggle />
          </div>
          
          <div className="text-center mb-8">
            {/* Logo positioned where indicated */}
            <div className="mb-6">
              <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-48 w-auto mx-auto drop-shadow-lg" />
            </div>
            
            <h2 className="text-4xl mb-6 font-bold sm:text-6xl text-white drop-shadow-lg">
              Try On Clothes
              <span className="block bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-purple-600">Virtually, Instantly, AI</span>
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8 drop-shadow-sm">
              Upload your photo and see how clothes look on you before buying. 
              Powered by AI for the most accurate virtual try-on experience.
            </p>
          </div>

          {/* Main content with animation and features */}
          <div className="grid lg:grid-cols-5 gap-8 mb-12 items-start">
            {/* Left side - Animation (60% width) */}
            <div className="lg:col-span-3">
              <VirtualTryOnAnimation />
            </div>

            {/* Right side - Feature cards (40% width) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative group">
                {/* Spinning border effect */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-conic-1 opacity-75 group-hover:opacity-100 animate-border-spin"></div>
                <div className="relative bg-gradient-to-br from-purple-600/80 to-pink-600/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <Camera className="w-8 h-8 text-white mx-auto mb-4" />
                  <h3 className="font-semibold text-white mb-2 text-center">Upload Photo</h3>
                  <p className="text-gray-100 text-sm text-center">Simply upload a clear photo of yourself</p>
                </div>
              </div>
              
              <div className="relative group">
                {/* Spinning border effect */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-conic-2 opacity-75 group-hover:opacity-100 animate-border-spin"></div>
                <div className="relative bg-gradient-to-br from-blue-600/80 to-purple-600/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <Zap className="w-8 h-8 text-white mx-auto mb-4" />
                  <h3 className="font-semibold text-white mb-2 text-center">AI Try-On</h3>
                  <p className="text-gray-100 text-sm text-center">Advanced AI creates realistic try-on results</p>
                </div>
              </div>
              
              <div className="relative group">
                {/* Spinning border effect */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-conic-3 opacity-75 group-hover:opacity-100 animate-border-spin"></div>
                <div className="relative bg-gradient-to-br from-cyan-500/80 to-blue-600/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <Users className="w-8 h-8 text-white mx-auto mb-4" />
                  <h3 className="font-semibold text-white mb-2 text-center">Share & Shop</h3>
                  <p className="text-gray-100 text-sm text-center">Share your looks and shop with confidence</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <PhotoUpload onPhotoUpload={handlePhotoUpload} />
          </div>
        </div>
      )}

      {/* Navigation for other steps */}
      {currentStep !== 'upload' && (
        <div className="bg-black/60 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-12 w-auto" />
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Button variant="outline" onClick={resetApp} className="hidden sm:flex border-white/30 text-gray-200 hover:bg-white/10 hover:text-white backdrop-blur-sm">
                  Start Over
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-200 hover:text-white hover:bg-white/10 backdrop-blur-sm">
                  <Users className="w-4 h-4 mr-2" />
                  Community
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clothing Catalog */}
      {currentStep === 'browse' && userPhoto && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Choose Your Style</h2>
            <p className="text-gray-200 drop-shadow-sm">Select clothing items to try on virtually</p>
          </div>
          <ClothingCatalog onClothingSelect={handleClothingSelect} />
        </div>
      )}

      {/* Try-On Viewer */}
      {currentStep === 'tryon' && userPhoto && selectedClothing && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
          <TryOnViewer userPhoto={userPhoto} selectedClothing={selectedClothing} tryOnResult={tryOnResult} onShare={() => setShowShareModal(true)} onBack={() => setCurrentStep('browse')} />
        </div>
      )}

      {/* Share Modal */}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} tryOnResult={tryOnResult} selectedClothing={selectedClothing} />

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-12 w-auto" />
            </div>
            <p className="text-gray-300 mb-4 drop-shadow-sm">Virtual clothing try-on powered by AI</p>
            <p className="text-sm text-gray-400">
              © 2024 UnowUafter. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
