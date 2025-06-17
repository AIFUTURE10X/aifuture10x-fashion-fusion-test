import React, { useState } from 'react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ClothingCatalog } from '@/components/ClothingCatalog';
import { TryOnViewer } from '@/components/TryOnViewer';
import { ShareModal } from '@/components/ShareModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';
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

  // Theme-aware background styles
  const getBackgroundStyle = () => {
    if (theme === 'light') {
      return {
        background: 'linear-gradient(to bottom right, #f8f9fa, #e9ecef)'
      };
    }
    return {
      background: 'linear-gradient(to bottom right, #141414, #1a1a1a)'
    };
  };

  return <div className="min-h-screen relative" style={getBackgroundStyle()}>
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
      backgroundSize: '100px 100px'
    }} />

      {/* Hero Section */}
      {currentStep === 'upload' && <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {/* Theme toggle in top right */}
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          
          <div className="text-center mb-6">
            {/* Logo positioned where indicated */}
            <div className="mb-6">
              <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-48 w-auto mx-auto" />
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Try On Clothes
              <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Virtually, Instantly, AI</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
              Upload your photo and see how clothes look on you before buying. 
              Powered by AI for the most accurate virtual try-on experience.
            </p>
          </div>

          {/* Feature highlights - moved down 2 inches */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 mt-32">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-conic-1 opacity-75 group-hover:opacity-100 animate-border-spin"></div>
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <Camera className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Photo</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Simply upload a clear photo of yourself</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-conic-2 opacity-75 group-hover:opacity-100 animate-border-spin"></div>
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <Zap className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Try-On</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Advanced AI creates realistic try-on results</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-conic-3 opacity-75 group-hover:opacity-100 animate-border-spin"></div>
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <Users className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Share & Shop</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Share your looks and shop with confidence</p>
              </div>
            </div>
          </div>

          <PhotoUpload onPhotoUpload={handlePhotoUpload} />
        </div>}

      {/* Navigation for other steps */}
      {currentStep !== 'upload' && <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-12 w-auto" />
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Button variant="outline" onClick={resetApp} className="hidden sm:flex border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Start Over
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Users className="w-4 h-4 mr-2" />
                  Community
                </Button>
              </div>
            </div>
          </div>
        </div>}

      {/* Clothing Catalog */}
      {currentStep === 'browse' && userPhoto && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Style</h2>
            <p className="text-gray-600 dark:text-gray-300">Select clothing items to try on virtually</p>
          </div>
          <ClothingCatalog onClothingSelect={handleClothingSelect} />
        </div>}

      {/* Try-On Viewer */}
      {currentStep === 'tryon' && userPhoto && selectedClothing && <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <TryOnViewer userPhoto={userPhoto} selectedClothing={selectedClothing} tryOnResult={tryOnResult} onShare={() => setShowShareModal(true)} onBack={() => setCurrentStep('browse')} />
        </div>}

      {/* Share Modal */}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} tryOnResult={tryOnResult} selectedClothing={selectedClothing} />

      {/* Footer */}
      <footer style={getBackgroundStyle()} className="border-t border-gray-200 dark:border-gray-700 mt-20 relative">
        {/* Noise texture overlay for footer */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
        backgroundSize: '100px 100px'
      }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-12 w-auto" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Virtual clothing try-on powered by AI</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 UnowUafter. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};

export default Index;
