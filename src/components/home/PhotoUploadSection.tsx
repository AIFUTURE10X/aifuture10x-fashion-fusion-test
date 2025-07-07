
import React from 'react';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { PhotoUpload } from '@/components/PhotoUpload';

interface PhotoUploadSectionProps {
  onPhotoUpload: (photoUrl: string) => void;
  onBackToHome: () => void;
}

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({ 
  onPhotoUpload, 
  onBackToHome 
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-20">
      {/* Back to Home Button positioned to the far left */}
      <div className="fixed left-4 top-20 z-40">
        <Button onClick={onBackToHome} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm shadow-lg" size="lg">
          <Home className="w-5 h-5 mr-2" />
          Back to Home
        </Button>
      </div>
      <PhotoUpload onPhotoUpload={onPhotoUpload} />
    </div>
  );
};
