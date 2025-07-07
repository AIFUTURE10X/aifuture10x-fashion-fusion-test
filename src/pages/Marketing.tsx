
import React from 'react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { MarketingFeatures } from '@/components/marketing/MarketingFeatures';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';
import { SilkTexture } from '@/components/ui/liquid/SilkTexture';

const Marketing = () => {
  return (
    <div className="min-h-screen bg-black relative">
      {/* Animated Silk Background */}
      <SilkTexture className="fixed inset-0 z-0" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-purple-900/10 via-transparent to-gray-900/20" />
      
      <div className="relative z-20">
        <MarketingNav />
        <MarketingHero />
        <MarketingFeatures />
        <MarketingCTA />
      </div>
    </div>
  );
};

export default Marketing;
