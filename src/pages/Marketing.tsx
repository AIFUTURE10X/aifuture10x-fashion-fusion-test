
import React from 'react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { MarketingFeatures } from '@/components/marketing/MarketingFeatures';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';

const Marketing = () => {
  return (
    <div className="min-h-screen bg-black relative">      
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
