
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const MarketingCTA = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white/10 backdrop-blur-sm p-12 rounded-3xl border border-white/20">
          <h2 className="text-4xl font-bold text-white mb-4 font-poppins">
            Ready to Transform Your Shopping Experience?
          </h2>
          <p className="text-xl text-gray-200 mb-8 font-poppins">
            Join thousands of users who are already trying on fashion with AI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-3 font-poppins">
                Start Trying On <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-white border-white/30 hover:bg-white/10 text-lg px-8 py-3 font-poppins">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
