
import React from 'react';
import { Zap, Shield, Smartphone, Users } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instant Try-On',
    description: 'See how clothes look on you in real-time with our advanced AI technology.'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your photos are processed securely and never stored without your consent.'
  },
  {
    icon: Smartphone,
    title: 'Mobile Ready',
    description: 'Works perfectly on any device - desktop, tablet, or smartphone.'
  },
  {
    icon: Users,
    title: 'For Everyone',
    description: 'Designed to work with all body types and clothing styles.'
  }
];

export const MarketingFeatures = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4 font-poppins">
            Why Choose unowUafter?
          </h2>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto font-poppins">
            Revolutionary technology meets seamless user experience
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 font-poppins">
                {feature.title}
              </h3>
              <p className="text-gray-200 font-poppins">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
