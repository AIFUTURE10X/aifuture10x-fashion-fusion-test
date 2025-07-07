
import React from 'react';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { MarketingFeatures } from '@/components/marketing/MarketingFeatures';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';

const Marketing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900">
      <MarketingNav />
      <MarketingHero />
      <MarketingFeatures />
      <MarketingCTA />
    </div>
  );
};

export default Marketing;
