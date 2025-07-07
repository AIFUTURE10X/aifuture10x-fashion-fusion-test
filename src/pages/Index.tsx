
import React, { useState } from 'react';
import { ClothingCatalog } from '@/components/ClothingCatalog';
import { TryOnViewer } from '@/components/TryOnViewer';
import { ShareModal } from '@/components/ShareModal';
import { StyleSelector } from '@/components/StyleSelector';
import { MarketingLink } from '@/components/MarketingLink';
import { useTheme } from '@/components/ThemeProvider';
import { HeroSection } from '@/components/home/HeroSection';
import { AIFeaturesSection } from '@/components/home/AIFeaturesSection';
import { AppNavigation } from '@/components/home/AppNavigation';
import { AppFooter } from '@/components/home/AppFooter';
import { PhotoUploadSection } from '@/components/home/PhotoUploadSection';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<any>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'browse' | 'tryon'>('upload');
  const [showUploadComponent, setShowUploadComponent] = useState(false);
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string[]>(['all']);
  const { theme } = useTheme();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen relative bg-black">
      {/* Marketing Link - Always show on home page when no photo exists */}
      {!showUploadComponent && !userPhoto && <MarketingLink />}

      {/* Hero Section - Only show when not showing upload component and no photo */}
      {!showUploadComponent && !userPhoto && (
        <>
          <HeroSection />
          <AIFeaturesSection onGetStarted={handleGoToApp} />
        </>
      )}

      {/* Photo Upload Component - Show when Go To App is clicked and no photo exists */}
      {showUploadComponent && !userPhoto && (
        <PhotoUploadSection 
          onPhotoUpload={handlePhotoUpload}
          onBackToHome={handleBackToHome}
        />
      )}

      {/* Navigation for other steps */}
      {(currentStep !== 'upload' || userPhoto) && !showUploadComponent && (
        <AppNavigation onReset={resetApp} />
      )}

      {/* Clothing Catalog */}
      {currentStep === 'browse' && userPhoto && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
        </h2>
            <p className="text-gray-200 drop-shadow-sm">
        </p>
          </div>
          
          <StyleSelector onStyleChange={handleStyleChange} />
          
          <ClothingCatalog onClothingSelect={handleClothingSelect} styleFilter={selectedStyleFilter} />
        </div>
      )}

      {/* Try-On Viewer */}
      {currentStep === 'tryon' && userPhoto && selectedClothing && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
          <TryOnViewer userPhoto={userPhoto} selectedClothing={selectedClothing} tryOnResult={tryOnResult} onShare={() => setShowShareModal(true)} onBack={() => setCurrentStep('browse')} />
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tryOnResult={tryOnResult}
        selectedClothing={selectedClothing}
      />

      {/* Footer - Only show on main page (not when browsing clothing) */}
      {!showUploadComponent && !userPhoto && <AppFooter />}
    </div>
  );
};

export default Index;
