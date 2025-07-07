
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface AppNavigationProps {
  onReset: () => void;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({ onReset }) => {
  return (
    <div className="bg-black/60 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img src="/lovable-uploads/f9265307-2ead-41c3-9026-28f963830025.png" alt="UnowUafter Logo" className="h-12 w-auto" />
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onReset} className="hidden sm:flex border-white/30 text-gray-200 hover:bg-white/10 hover:text-white backdrop-blur-sm">
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
  );
};
