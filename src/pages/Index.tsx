import React, { useState } from 'react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ClothingCatalog } from '@/components/ClothingCatalog';
import { TryOnViewer } from '@/components/TryOnViewer';
import { ShareModal } from '@/components/ShareModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';
import { SilkTexture } from '@/components/ui/liquid/SilkTexture';
import { Camera, Sparkles, Users, Zap, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<any>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'browse' | 'tryon'>('upload');
  const [showUploadComponent, setShowUploadComponent] = useState(false);
  const {
    theme
  } = useTheme();

  const handlePhotoUpload = (photoUrl: string) => {
    setUserPhoto(photoUrl);
    setCurrentStep('browse');
    setShowUploadComponent(false);
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
    setShowUploadComponent(false);
  };

  const handleGoToApp = () => {
    if (!userPhoto) {
      setShowUploadComponent(true);
    } else {
      setCurrentStep('browse');
    }
  };

  const handleBackToHome = () => {
    setShowUploadComponent(false);
  };

  return (
    <div className="min-h-screen relative">
      {/* Animated Silk Background */}
      <SilkTexture className="fixed inset-0 z-0" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-black/30" />

      {/* Go To App Button - Always visible in top right */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-3">
        <Button
          onClick={handleGoToApp}
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg"
        >
          Go To App
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
        <ThemeToggle />
      </div>

      {/* Hero Section - Only show when not showing upload component and no photo */}
      {!showUploadComponent && !userPhoto && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-20">
          <div className="text-center mb-6">
            {/* Logo positioned where indicated */}
            <div className="mb-6">
              <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-48 w-auto mx-auto drop-shadow-lg" />
            </div>
            
            <h2 className="text-4xl mb-6 font-bold sm:text-6xl text-white drop-shadow-lg">
              Try On Clothes
              <span className="block bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-purple-600">Virtually, Instantly, AI</span>
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-6 drop-shadow-sm">
              Upload your photo and see how clothes look on you before buying. 
              Powered by AI for the most accurate virtual try-on experience.
            </p>
          </div>

          {/* Feature highlights */}
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

          {/* AI Virtual Try-On Features Section - Updated to 3/4 width */}
          <div className="mt-20 mb-16 flex justify-center">
            <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl w-3/4">
              <h3 className="text-3xl font-bold text-white mb-8 text-center">
                AI Clothes Virtual Try-On: Hyper-Realistic Results
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                {/* Features List - Takes 1/3 */}
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">One-click outfit change:</h4>
                      <p className="text-gray-200">Easily transform your look with a single click.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">AI face detection:</h4>
                      <p className="text-gray-200">Accurately detects facial features to provide vivid and realistic results.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Change clothes styles instantly:</h4>
                      <p className="text-gray-200">Experiment with different clothing styles effortlessly.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Upload your photo as style reference:</h4>
                      <p className="text-gray-200">Use your own photo to customize and explore various outfit options.</p>
                    </div>
                  </div>
                </div>

                {/* Video Section - Takes 2/3 of container */}
                <div className="lg:col-span-2 flex justify-center">
                  <div className="w-full rounded-xl overflow-hidden shadow-2xl">
                    <iframe 
                      width="100%" 
                      height="480" 
                      src="https://www.youtube.com/embed/dfAFXzOczHk?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=dfAFXzOczHk&start=7&showinfo=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0" 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="autoplay; encrypted-media" 
                      referrerPolicy="strict-origin-when-cross-origin" 
                      allowFullScreen
                      className="rounded-xl"
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Component - Show when Go To App is clicked and no photo exists */}
      {showUploadComponent && !userPhoto && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-20">
          {/* Back to Home Button */}
          <div className="mb-6">
            <Button
              onClick={handleBackToHome}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
          <PhotoUpload onPhotoUpload={handlePhotoUpload} />
        </div>
      )}

      {/* Navigation for other steps */}
      {(currentStep !== 'upload' || userPhoto) && !showUploadComponent && (
        <div className="bg-black/60 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-12 w-auto" />
              </div>
              <div className="flex items-center space-x-4">
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
              <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-16 w-auto" />
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
