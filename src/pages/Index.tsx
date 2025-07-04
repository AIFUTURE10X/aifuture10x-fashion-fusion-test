import React, { useState } from 'react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ClothingCatalog } from '@/components/ClothingCatalog';
import { TryOnViewer } from '@/components/TryOnViewer';
import { ShareModal } from '@/components/ShareModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StyleSelector } from '@/components/StyleSelector';
import { useTheme } from '@/components/ThemeProvider';
import { SilkTexture } from '@/components/ui/liquid/SilkTexture';
import { Camera, Sparkles, Users, Zap, ArrowRight, ArrowLeft, Home, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { perfectCorpTest } from '@/services/perfectCorpTest';
import { useToast } from '@/hooks/use-toast';
const Index = () => {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<any>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'browse' | 'tryon'>('upload');
  const [showUploadComponent, setShowUploadComponent] = useState(false);
  const [isTestingConfig, setIsTestingConfig] = useState(false);
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string[]>(['all']);
  const {
    theme
  } = useTheme();
  const {
    toast
  } = useToast();
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
    setSelectedStyleFilter(['all']);
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
  const handleStyleChange = (styleFilters: string[]) => {
    console.log('Style filters changed to:', styleFilters);
    setSelectedStyleFilter(styleFilters);
  };
  const handleTestConfiguration = async () => {
    setIsTestingConfig(true);
    try {
      console.log('🧪 Starting Perfect Corp configuration test...');
      const result = await perfectCorpTest.testConfiguration();

      // Show detailed results in toast
      const configStatus = result.configTest.credentials.clientIdValid && result.configTest.credentials.secretValid ? '✅ Valid' : '❌ Invalid';
      const authStatus = result.authTest.status === 'success' ? '✅ Success' : '❌ Failed';
      toast({
        title: "Perfect Corp Configuration Test",
        description: `Config: ${configStatus} | Auth: ${authStatus}`,
        duration: 5000
      });

      // Also log to console for detailed inspection
      await perfectCorpTest.logConfigurationStatus();
    } catch (error) {
      console.error('❌ Configuration test failed:', error);
      toast({
        title: "Configuration Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsTestingConfig(false);
    }
  };
  return <div className="min-h-screen relative">
      {/* Animated Silk Background */}
      <SilkTexture className="fixed inset-0 z-0" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-black/30" />

      {/* Theme Toggle - Only show on home page when no photo exists */}
      {!showUploadComponent && !userPhoto && <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>}

      {/* Theme Toggle - Always visible in top right when Go To App button is hidden */}
      {(showUploadComponent || userPhoto) && <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>}

      {/* Test Configuration Button - Only show on home page during development */}
      {!showUploadComponent && !userPhoto && <div className="fixed top-4 left-4 z-50">
          <Button onClick={handleTestConfiguration} disabled={isTestingConfig} variant="outline" className="bg-yellow-500/20 border-yellow-400/50 text-yellow-100 hover:bg-yellow-500/30 hover:text-white backdrop-blur-sm shadow-lg" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            {isTestingConfig ? 'Testing...' : 'Test API Config'}
          </Button>
        </div>}

      {/* Hero Section - Only show when not showing upload component and no photo */}
      {!showUploadComponent && !userPhoto && <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-20">
          
          <div className="text-center mb-6">
            {/* Logo positioned where indicated */}
            <div className="mb-6">
              <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-48 w-auto mx-auto drop-shadow-lg" />
              <p className="text-2xl text-white font-semibold drop-shadow-lg -mt-2">Your Fashion Reveal</p>
            </div>
            
            <h2 className="text-4xl mb-6 font-bold sm:text-6xl text-white drop-shadow-lg font-poppins">
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

          {/* AI Virtual Try-On Features Section - Expanded */}
          <div className="mt-20 mb-16 flex justify-center">
            <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl w-full max-w-7xl">
              <h3 className="text-3xl font-bold text-white mb-8 text-center">
                AI Clothes Virtual Try-On: Hyper-Realistic Results
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                {/* Features List - Takes 1/3 and aligned with video */}
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
                  
                  {/* Try Now button positioned here */}
                  <div className="pt-6">
                    <Button onClick={handleGoToApp} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg w-full text-lg font-semibold">
                      Try Now
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* AI Clothes text and Video Section - Takes 2/3 of container */}
                <div className="lg:col-span-2 flex flex-col items-center">
                  <h4 className="text-4xl font-bold text-white mb-6 text-center">AI Clothes</h4>
                  <div className="w-full rounded-xl overflow-hidden shadow-2xl">
                    <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '0px',
                  paddingBottom: '109.551%'
                }}>
                      <iframe allow="fullscreen;autoplay" allowFullScreen height="100%" src="https://streamable.com/e/lxxq3v?autoplay=1" width="100%" style={{
                    border: 'none',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    left: '0px',
                    top: '0px',
                    overflow: 'hidden'
                  }} className="rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}

      {/* Photo Upload Component - Show when Go To App is clicked and no photo exists */}
      {showUploadComponent && !userPhoto && <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-20">
          {/* Back to Home Button positioned to the far left */}
          <div className="fixed left-4 top-20 z-40">
            <Button onClick={handleBackToHome} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm shadow-lg" size="lg">
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </div>
          <PhotoUpload onPhotoUpload={handlePhotoUpload} />
        </div>}

      {/* Navigation for other steps */}
      {(currentStep !== 'upload' || userPhoto) && !showUploadComponent && <div className="bg-black/60 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
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
        </div>}

      {/* Clothing Catalog */}
      {currentStep === 'browse' && userPhoto && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
        </h2>
            <p className="text-gray-200 drop-shadow-sm">
        </p>
          </div>
          
          <StyleSelector onStyleChange={handleStyleChange} />
          
          <ClothingCatalog onClothingSelect={handleClothingSelect} styleFilter={selectedStyleFilter} />
        </div>}

      {/* Try-On Viewer */}
      {currentStep === 'tryon' && userPhoto && selectedClothing && <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
          <TryOnViewer userPhoto={userPhoto} selectedClothing={selectedClothing} tryOnResult={tryOnResult} onShare={() => setShowShareModal(true)} onBack={() => setCurrentStep('browse')} />
        </div>}

      {/* Share Modal */}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} tryOnResult={tryOnResult} selectedClothing={selectedClothing} />

      {/* Footer - Only show on main page (not when browsing clothing) */}
      {!showUploadComponent && !userPhoto && <footer className="border-t border-white/10 mt-48 relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-12 w-auto" />
              </div>
              <p className="text-gray-300 mb-2 drop-shadow-sm">Virtual clothing try-on powered by AI</p>
              <p className="text-sm text-gray-400">
                © 2024 UnowUafter. All rights reserved.
              </p>
            </div>
          </div>
        </footer>}
    </div>;
};
export default Index;