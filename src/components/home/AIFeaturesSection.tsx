
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface AIFeaturesSectionProps {
  onGetStarted: () => void;
}

export const AIFeaturesSection: React.FC<AIFeaturesSectionProps> = ({ onGetStarted }) => {
  return (
    <div className="mt-20 mb-16 flex justify-center">
      <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl w-full max-w-7xl">
        <h3 className="text-3xl font-bold text-white mb-8 text-center">
          AI Clothes Virtual Try-On: Hyper-Realistic Results
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          {/* Features List - Takes 1/3 and aligned with video */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="text-white font-semibold mb-1">One-click outfit change:</h4>
                <p className="text-gray-200">Easily transform your look with a single click.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="text-white font-semibold mb-1">AI face detection:</h4>
                <p className="text-gray-200">Accurately detects facial features to provide vivid and realistic results.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="text-white font-semibold mb-1">Change clothes styles instantly:</h4>
                <p className="text-gray-200">Experiment with different clothing styles effortlessly.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="text-white font-semibold mb-1">Upload your photo as style reference:</h4>
                <p className="text-gray-200">Use your own photo to customize and explore various outfit options.</p>
              </div>
            </div>
            
            {/* Try Now button positioned here */}
            <div className="pt-6">
              <Button onClick={onGetStarted} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg w-full text-lg font-semibold">
                Try Now
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* AI Clothes text and Video Section - Takes 2/3 of container */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <h4 className="text-4xl font-bold text-white mb-6 text-center">AI Clothes</h4>
            <div className="w-full rounded-xl overflow-hidden shadow-2xl">
              <div style={{
            position: 'relative',
            width: '100%',
            height: '0px',
            paddingBottom: '109.551%'
          }}>
                <iframe allow="fullscreen;autoplay" allowFullScreen height="100%" src="https://streamable.com/e/lxxq3v?autoplay=1" width="100%" style={{
              border: 'none',
              width: '100%',
              height: '100%',
              position: 'absolute',
              left: '0px',
              top: '0px',
              overflow: 'hidden'
            }} className="rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
