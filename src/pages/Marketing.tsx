
import React from 'react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { MarketingFeatures } from '@/components/marketing/MarketingFeatures';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';

const Marketing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-800">
      <MarketingNav />
      <MarketingHero />
      <MarketingFeatures />
      <MarketingCTA />
    </div>
  );
};

export default Marketing;
