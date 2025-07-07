
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export const MarketingHero = () => {
  return (
    <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <Sparkles className="h-4 w-4 text-purple-300" />
            <span className="text-purple-200 text-sm font-poppins">AI-Powered Fashion Try-On</span>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-poppins">
          Try On Fashion
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent block">
            Before You Buy
          </span>
        </h1>
        
        <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto font-poppins">
          Experience the future of online shopping with our AI-powered virtual try-on technology. 
          See how clothes look on you instantly, without ever leaving your home.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-3 font-poppins">
              Try It Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="text-white border-white/30 hover:bg-white/10 text-lg px-8 py-3 font-poppins">
            Watch Demo
          </Button>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-pink-800/20 pointer-events-none" />
    </section>
  );
};
