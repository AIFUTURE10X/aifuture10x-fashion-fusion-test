
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
    const speed = 0.03; // Reduced from 0.08 for smoother motion
    const scale = 1.5; // Slightly reduced for better performance
    const noiseIntensity = 1.8; // Reduced for smoother texture

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Optimized noise function
    const noise = (x: number, y: number, t: number = 0) => {
      const G = 2.5; // Reduced complexity
      const rx = G * Math.sin(G * x + t * 0.08);
      const ry = G * Math.sin(G * y + t * 0.12);
      return (rx * ry) % 1;
    };

    const animate = () => {
      const { width, height } = canvas;
      const tOffset = speed * time;
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0a0a0f');
      gradient.addColorStop(0.3, '#151520');
      gradient.addColorStop(0.6, '#1a1a2e');
      gradient.addColorStop(1, '#0f3460');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Create silk pattern with optimized sampling
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Sample every 2 pixels for better performance
      const step = 2;
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          const u = (x / width) * scale;
          const v = (y / height) * scale;
          
          // Simplified wave effects for smoother motion
          const wave1 = 0.06 * Math.sin(12.0 * v - tOffset * 3.0);
          const wave2 = 0.04 * Math.sin(18.0 * u + tOffset * 2.0);
          const wave3 = 0.08 * Math.sin(10.0 * (u + v) - tOffset * 2.5);
          
          let tex_x = u + wave1 + wave2;
          let tex_y = v + wave3 + 0.05 * Math.sin(15.0 * tex_x + tOffset * 1.8);

          // Simplified silk pattern calculation
          const basePattern = 0.5 + 0.5 * Math.sin(
            6.0 * (tex_x + tex_y + 
              0.8 * Math.cos(8.0 * tex_x + 6.0 * tex_y + tOffset * 2.0) + 
              0.5 * Math.cos(12.0 * tex_x - 8.0 * tex_y + tOffset * 1.5) +
              0.05 * tOffset)
          );

          // Simplified shimmer layer
          const shimmer = 0.4 + 0.6 * Math.sin(
            20.0 * (tex_x + tex_y - 0.15 * tOffset)
          );

          const rnd = noise(x * 0.5 + time * 0.1, y * 0.5 + time * 0.12, time);
          const combinedPattern = (basePattern * 0.75 + shimmer * 0.25);
          const intensity = Math.max(0, combinedPattern - rnd / 6.0 * noiseIntensity);
          
          // Smooth color transitions
          let r, g, b;
          if (intensity < 0.2) {
            const factor = intensity * 5;
            r = Math.floor(25 + (50 - 25) * factor);
            g = Math.floor(30 + (55 - 30) * factor);
            b = Math.floor(40 + (70 - 40) * factor);
          } else if (intensity < 0.5) {
            const factor = (intensity - 0.2) * 3.33;
            r = Math.floor(50 + (75 - 50) * factor);
            g = Math.floor(55 + (75 - 55) * factor);
            b = Math.floor(70 + (95 - 70) * factor);
          } else if (intensity < 0.8) {
            const factor = (intensity - 0.5) * 3.33;
            r = Math.floor(75 + (100 - 75) * factor);
            g = Math.floor(75 + (95 - 75) * factor);
            b = Math.floor(95 + (115 - 95) * factor);
          } else {
            const factor = (intensity - 0.8) * 5;
            r = Math.floor(100 + (125 - 100) * factor);
            g = Math.floor(95 + (115 - 95) * factor);
            b = Math.floor(115 + (135 - 115) * factor);
          }
          
          const a = 255;

          // Fill multiple pixels for the step size
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

      // Subtle overlay for depth
      const overlayGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      overlayGradient.addColorStop(0, 'rgba(15, 25, 45, 0.1)');
      overlayGradient.addColorStop(0.7, 'rgba(8, 18, 35, 0.2)');
      overlayGradient.addColorStop(1, 'rgba(5, 12, 28, 0.4)');
      
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, width, height);

      // Smooth moving light effect
      const lightX = width / 2 + 150 * Math.sin(tOffset * 0.015);
      const lightY = height / 2 + 150 * Math.cos(tOffset * 0.012);
      
      const lightGradient = ctx.createLinearGradient(
        0, 0, lightX, lightY
      );
      lightGradient.addColorStop(0, 'rgba(100, 120, 160, 0.02)');
      lightGradient.addColorStop(0.5, 'rgba(70, 90, 130, 0.04)');
      lightGradient.addColorStop(1, 'rgba(50, 70, 110, 0.02)');
      
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
