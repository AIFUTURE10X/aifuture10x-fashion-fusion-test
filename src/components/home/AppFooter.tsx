
import React from 'react';

export const AppFooter = () => {
  return (
    <footer className="border-t border-white/10 mt-48 relative z-20">
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
    </footer>
  );
};
