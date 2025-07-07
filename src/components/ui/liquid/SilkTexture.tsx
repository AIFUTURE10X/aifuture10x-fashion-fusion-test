
import React, { useEffect, useRef } from 'react';

interface SilkTextureProps {
  className?: string;
}

export const SilkTexture = ({ className = "" }: SilkTextureProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const speed = 0.02; // Reduced from 0.03 for gentler motion
    const scale = 1.2; // Reduced for subtler patterns
    const noiseIntensity = 1.2; // Reduced from 1.8 for smoother texture

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Optimized noise function
    const noise = (x: number, y: number, t: number = 0) => {
      const G = 2.0; // Reduced complexity
      const rx = G * Math.sin(G * x + t * 0.06);
      const ry = G * Math.sin(G * y + t * 0.08);
      return (rx * ry) % 1;
    };

    const animate = () => {
      const { width, height } = canvas;
      const tOffset = speed * time;
      
      // Pure black background
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, width, height);

      // Create silk pattern with better quality sampling
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Reduced step size for better quality
      const step = 1;
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          const u = (x / width) * scale;
          const v = (y / height) * scale;
          
          // Gentler wave effects
          const wave1 = 0.03 * Math.sin(10.0 * v - tOffset * 2.5); // Reduced amplitude
          const wave2 = 0.02 * Math.sin(14.0 * u + tOffset * 1.8); // Reduced amplitude
          const wave3 = 0.04 * Math.sin(8.0 * (u + v) - tOffset * 2.0); // Reduced amplitude
          
          let tex_x = u + wave1 + wave2;
          let tex_y = v + wave3 + 0.03 * Math.sin(12.0 * tex_x + tOffset * 1.5); // Reduced amplitude

          // Subtler silk pattern calculation
          const basePattern = 0.5 + 0.5 * Math.sin(
            5.0 * (tex_x + tex_y + 
              0.6 * Math.cos(6.0 * tex_x + 5.0 * tex_y + tOffset * 1.8) + 
              0.3 * Math.cos(10.0 * tex_x - 6.0 * tex_y + tOffset * 1.2) +
              0.03 * tOffset)
          );

          // Gentler shimmer layer
          const shimmer = 0.5 + 0.5 * Math.sin(
            15.0 * (tex_x + tex_y - 0.1 * tOffset)
          );

          const rnd = noise(x * 0.3 + time * 0.08, y * 0.3 + time * 0.1, time);
          const combinedPattern = (basePattern * 0.8 + shimmer * 0.2);
          const intensity = Math.max(0, combinedPattern - rnd / 8.0 * noiseIntensity); // Reduced noise impact
          
          // Grayscale silk color like SilkEffect
          const r = Math.floor(123 * intensity);
          const g = Math.floor(116 * intensity);
          const b = Math.floor(129 * intensity);
          const a = 255;

          // Fill pixels for the step size
          for (let dx = 0; dx < step && x + dx < width; dx++) {
            for (let dy = 0; dy < step && y + dy < height; dy++) {
              const index = ((y + dy) * width + (x + dx)) * 4;
              if (index < data.length) {
                data[index] = Math.min(255, r);
                data[index + 1] = Math.min(255, g);
                data[index + 2] = Math.min(255, b);
                data[index + 3] = a;
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Subtle overlay for depth with black tones
      const overlayGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      overlayGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
      overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, width, height);

      // Gentler moving light effect
      const lightX = width / 2 + 100 * Math.sin(tOffset * 0.012); // Reduced amplitude
      const lightY = height / 2 + 100 * Math.cos(tOffset * 0.01); // Reduced amplitude
      
      const lightGradient = ctx.createLinearGradient(
        0, 0, lightX, lightY
      );
      lightGradient.addColorStop(0, 'rgba(0, 0, 0, 0.015)');
      lightGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.025)');
      lightGradient.addColorStop(1, 'rgba(0, 0, 0, 0.015)');
      
      ctx.fillStyle = lightGradient;
      ctx.fillRect(0, 0, width, height);

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
    <canvas 
      ref={canvasRef}
      className={`absolute top-0 left-0 w-full h-full ${className}`}
    />
  );
};
