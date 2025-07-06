
import React from 'react';

interface TryOnOriginalPhotoProps {
  userPhoto: string;
}

export const TryOnOriginalPhoto: React.FC<TryOnOriginalPhotoProps> = ({ userPhoto }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900"></h3>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="aspect-[3/4] relative">
          <img
            src={userPhoto}
            alt="Original photo"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
