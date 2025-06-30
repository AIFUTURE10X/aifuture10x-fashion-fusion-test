
import React from 'react';
import { X } from 'lucide-react';

interface ClothingUploadModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const ClothingUploadModal: React.FC<ClothingUploadModalProps> = ({
  title,
  onClose,
  children
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full max-h-[70vh] overflow-y-auto relative">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
