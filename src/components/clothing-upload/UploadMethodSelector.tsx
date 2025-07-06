import React from 'react';
import { Upload, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadMethodSelectorProps {
  activeMethod: 'file' | 'url';
  onMethodChange: (method: 'file' | 'url') => void;
}

export const UploadMethodSelector: React.FC<UploadMethodSelectorProps> = ({
  activeMethod,
  onMethodChange
}) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
      <button
        type="button"
        onClick={() => onMethodChange('file')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
          activeMethod === 'file' 
            ? "bg-white text-purple-600 shadow-sm" 
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        <Upload className="w-4 h-4" />
        Upload File
      </button>
      <button
        type="button"
        onClick={() => onMethodChange('url')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
          activeMethod === 'url' 
            ? "bg-white text-purple-600 shadow-sm" 
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        <Link className="w-4 h-4" />
        From Website
      </button>
    </div>
  );
};