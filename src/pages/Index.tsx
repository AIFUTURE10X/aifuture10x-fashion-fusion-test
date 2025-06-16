import React, { useState } from 'react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ClothingCatalog } from '@/components/ClothingCatalog';
import { TryOnViewer } from '@/components/TryOnViewer';
import { ShareModal } from '@/components/ShareModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Camera, Sparkles, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<any>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'browse' | 'tryon'>('upload');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900">
      {/* Hero Section */}
      {currentStep === 'upload' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Theme toggle in top right */}
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          
          <div className="text-center mb-8">
            {/* Logo positioned where indicated */}
            <div className="mb-6">
              <img 
                src="/lovable-uploads/874b051a-d266-4c63-b611-9fdfd604fd54.png" 
                alt="UnowUafter Logo" 
                className="h-48 w-auto mx-auto"
              />
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Try On Clothes
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Virtually, Instantly
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Upload your photo and see how clothes look on you before buying. 
              Powered by AI for the most accurate virtual try-on experience.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-75 group-hover:opacity-100 animate-border-spin" style={{ background: 'conic-gradient(from 0deg at 50% 50%, #9333ea, #ec4899, #3b82f6, #10b981, #f59e0b, #9333ea)', backgroundSize: '400% 400%' }}></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                <Camera className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Photo</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Simply upload a clear photo of yourself</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 rounded-2xl opacity-75 group-hover:opacity-100 animate-border-spin" style={{ background: 'conic-gradient(from 120deg at 50% 50%, #3b82f6, #06b6d4, #9333ea, #ec4899, #f59e0b, #3b82f6)', backgroundSize: '400% 400%', animationDelay: '1s' }}></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                <Zap className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Try-On</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Advanced AI creates realistic try-on results</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-green-600 to-purple-600 rounded-2xl opacity-75 group-hover:opacity-100 animate-border-spin" style={{ background: 'conic-gradient(from 240deg at 50% 50%, #06b6d4, #10b981, #9333ea, #ec4899, #3b82f6, #06b6d4)', backgroundSize: '400% 400%', animationDelay: '2s' }}></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Share & Shop</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Share your looks and shop with confidence</p>
              </div>
            </div>
          </div>

          <PhotoUpload onPhotoUpload={handlePhotoUpload} />
        </div>
      )}

      {/* Navigation for other steps */}
      {currentStep !== 'upload' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img 
                  src="/lovable-uploads/874b051a-d266-4c63-b611-9fdfd604fd54.png" 
                  alt="UnowUafter Logo" 
                  className="h-12 w-auto"
                />
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Button variant="outline" onClick={resetApp} className="hidden sm:flex">
                  Start Over
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Style</h2>
            <p className="text-gray-600 dark:text-gray-300">Select clothing items to try on virtually</p>
          </div>
          <ClothingCatalog onClothingSelect={handleClothingSelect} />
        </div>
      )}

      {/* Try-On Viewer */}
      {currentStep === 'tryon' && userPhoto && selectedClothing && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TryOnViewer
            userPhoto={userPhoto}
            selectedClothing={selectedClothing}
            tryOnResult={tryOnResult}
            onShare={() => setShowShareModal(true)}
            onBack={() => setCurrentStep('browse')}
          />
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tryOnResult={tryOnResult}
        selectedClothing={selectedClothing}
      />

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src="/lovable-uploads/874b051a-d266-4c63-b611-9fdfd604fd54.png" 
                alt="UnowUafter Logo" 
                className="h-12 w-auto"
              />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Virtual clothing try-on powered by AI</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 UnowUafter. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
