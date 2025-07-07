
'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SilkEffectProps {
  className?: string;
}

export const SilkEffect = ({ className = "" }: SilkEffectProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const speed = 0.015;
    const scale = 1.5;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Enhanced noise function for cloud-like patterns
    const noise = (x: number, y: number, octave: number = 1) => {
      const G = 2.71828;
      const freq = octave * 0.1;
      const rx = G * Math.sin(G * x * freq);
      const ry = G * Math.sin(G * y * freq);
      return Math.abs((rx * ry * (1 + x * freq)) % 1);
    };

    // Turbulence function for swirling motion
    const turbulence = (x: number, y: number, t: number) => {
      const swirl1 = Math.sin(x * 0.02 + t * 0.3) * Math.cos(y * 0.015 + t * 0.2);
      const swirl2 = Math.cos(x * 0.01 + t * 0.1) * Math.sin(y * 0.025 + t * 0.4);
      return (swirl1 + swirl2) * 0.3;
    };

    const animate = () => {
      const { width, height } = canvas;
      
      // Pure black background
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, width, height);

      // Create smokey cloud pattern with multiple layers
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
          const u = x / width;
          const v = y / height;
          
          const tOffset = speed * time;
          
          // Add turbulence for swirling motion
          const turbulenceEffect = turbulence(x, y, tOffset);
          
          // Multiple cloud layers with different scales and speeds
          const layer1 = noise(u * 2 + turbulenceEffect, v * 2 + tOffset * 0.5, 1);
          const layer2 = noise(u * 4 + turbulenceEffect * 0.5, v * 4 + tOffset * 0.3, 2);
          const layer3 = noise(u * 8 + turbulenceEffect * 0.2, v * 8 + tOffset * 0.1, 3);
          
          // Combine layers for cloud density
          const cloudDensity = (layer1 * 0.6 + layer2 * 0.3 + layer3 * 0.1);
          
          // Add flowing motion
          const flow = Math.sin(u * 3 + tOffset * 0.2) * Math.cos(v * 2 + tOffset * 0.15);
          
          // Final cloud intensity with subtle variations
          const intensity = Math.max(0, Math.min(1, 
            (cloudDensity + flow * 0.2 + turbulenceEffect * 0.1) * 0.4
          ));
          
          // Smokey cloud colors - subtle grays to whites
          const baseColor = intensity * 120;
          const r = Math.floor(baseColor + Math.random() * 20);
          const g = Math.floor(baseColor + Math.random() * 15);
          const b = Math.floor(baseColor + Math.random() * 25);
          const a = Math.floor(intensity * 180 + 75); // Varied opacity

          const index = (y * width + x) * 4;
          if (index < data.length) {
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = a;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      time += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUpDelay {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInCorner {
          from {
            opacity: 0;
            transform: translateY(-1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out forwards;
        }
        
        .animate-fade-in-up-delay {
          animation: fadeInUpDelay 1s ease-out 0.3s forwards;
        }
        
        .animate-fade-in-corner {
          animation: fadeInCorner 1s ease-out 0.9s forwards;
        }
        
        .silk-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }
      `}</style>
      
      <div className={`relative h-screen w-full overflow-hidden bg-black ${className}`}>
        {/* Animated Silk Background */}
        <canvas 
          ref={canvasRef}
          className="silk-canvas"
        />


        {/* Content */}
        <div className="relative z-20 flex h-full items-center justify-center">
          <div className="text-center px-8">
            {/* Main Title */}
            <h1 
              className={`
                text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] xl:text-[14rem] 
                font-light tracking-[-0.05em] leading-none
                text-white mix-blend-difference
                opacity-0
                ${isLoaded ? 'animate-fade-in-up' : ''}
              `}
              style={{ 
                textShadow: '0 0 40px rgba(255, 255, 255, 0.1)',
                fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
              }}
            >
              silk
            </h1>

            {/* Subtitle */}
            <div 
              className={`
                mt-8 text-lg md:text-xl lg:text-2xl 
                font-extralight tracking-[0.2em] uppercase
                text-gray-300/80 mix-blend-overlay
                opacity-0
                ${isLoaded ? 'animate-fade-in-up-delay' : ''}
              `}
            >
              <span className="inline-block">flowing</span>
              <span className="mx-4 text-gray-500">•</span>
              <span className="inline-block">texture</span>
              <span className="mx-4 text-gray-500">•</span>
              <span className="inline-block">art</span>
            </div>
          </div>
        </div>

        {/* Corner Accent */}
        <div 
          className={`
            absolute top-8 left-8 z-30
            text-xs font-light tracking-widest uppercase
            text-gray-500/40 mix-blend-overlay
            opacity-0
            ${isLoaded ? 'animate-fade-in-corner' : ''}
          `}
        >
          2025
        </div>
      </div>
    </>
  );
};
