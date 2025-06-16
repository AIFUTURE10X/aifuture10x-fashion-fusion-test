import React, { useState } from 'react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ClothingCatalog } from '@/components/ClothingCatalog';
import { TryOnViewer } from '@/components/TryOnViewer';
import { ShareModal } from '@/components/ShareModal';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/874b051a-d266-4c63-b611-9fdfd604fd54.png" 
                alt="UnowUafter Logo" 
                className="h-16 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              {userPhoto && (
                <Button variant="outline" onClick={resetApp} className="hidden sm:flex">
                  Start Over
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-gray-900"
              >
                <Users className="w-4 h-4 mr-2" />
                Community
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {currentStep === 'upload' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Try On Clothes
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Virtually, Instantly
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Upload your photo and see how clothes look on you before buying. 
              Powered by AI for the most accurate virtual try-on experience.
            </p>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <Camera className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Upload Photo</h3>
                <p className="text-gray-600 text-sm">Simply upload a clear photo of yourself</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <Zap className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">AI Try-On</h3>
                <p className="text-gray-600 text-sm">Advanced AI creates realistic try-on results</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Share & Shop</h3>
                <p className="text-gray-600 text-sm">Share your looks and shop with confidence</p>
              </div>
            </div>
          </div>

          <PhotoUpload onPhotoUpload={handlePhotoUpload} />
        </div>
      )}

      {/* Clothing Catalog */}
      {currentStep === 'browse' && userPhoto && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Style</h2>
            <p className="text-gray-600">Select clothing items to try on virtually</p>
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
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src="/lovable-uploads/874b051a-d266-4c63-b611-9fdfd604fd54.png" 
                alt="UnowUafter Logo" 
                className="h-12 w-auto"
              />
            </div>
            <p className="text-gray-600 mb-4">Virtual clothing try-on powered by AI</p>
            <p className="text-sm text-gray-500">
              © 2024 UnowUafter. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
