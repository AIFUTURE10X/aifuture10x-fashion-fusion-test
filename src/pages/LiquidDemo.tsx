
import { useState, useEffect } from "react";
import { DeformationImage } from "@/components/ui/liquid-image";
import { SilkTexture } from "@/components/ui/liquid/SilkTexture";

const LiquidDemo = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black">
      {/* Silk Texture Background */}
      <SilkTexture className="z-0" />
      
      {/* Liquid Deformation Effect */}
      <div className="absolute top-0 left-0 w-full h-full z-10 mix-blend-overlay">
        <DeformationImage color="#000000" />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      {/* Content */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-center items-center text-center z-30">
        {/* Main Title */}
        <h1 
          className={`
            text-6xl md:text-8xl font-bold mb-6 tracking-tight 
            mix-blend-exclusion text-white
            transition-all duration-1000 ease-out
            ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{ 
            textShadow: '0 0 40px rgba(255, 255, 255, 0.1)'
          }}
        >
          Liquid Reality
        </h1>

        {/* Subtitle */}
        <p 
          className={`
            text-lg md:text-xl text-white mix-blend-exclusion max-w-2xl px-6 leading-relaxed
            transition-all duration-1000 ease-out delay-300
            ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          Experience the fluid boundary between digital and physical realms. Move your cursor to reshape reality itself.
        </p>

        {/* Silk Effect Label */}
        <div 
          className={`
            mt-8 text-sm font-light tracking-widest uppercase
            text-gray-300/60 mix-blend-overlay
            transition-all duration-1000 ease-out delay-600
            ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <span className="inline-block">flowing</span>
          <span className="mx-4 text-gray-500">•</span>
          <span className="inline-block">texture</span>
          <span className="mx-4 text-gray-500">•</span>
          <span className="inline-block">deformation</span>
        </div>
      </div>

      {/* Corner Accent */}
      <div 
        className={`
          absolute top-8 left-8 z-40
          text-xs font-light tracking-widest uppercase
          text-gray-500/40 mix-blend-overlay
          transition-all duration-1000 ease-out delay-900
          ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}
      >
        2025
      </div>
    </div>
  );
};

export default LiquidDemo;
