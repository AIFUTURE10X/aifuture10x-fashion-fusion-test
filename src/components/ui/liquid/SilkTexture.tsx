
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
    const speed = 0.08; // Increased from 0.05 for more noticeable movement
    const scale = 1.8;
    const noiseIntensity = 2.5; // Increased for more texture variation

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Enhanced noise function for better pattern generation
    const noise = (x: number, y: number, t: number = 0) => {
      const G = 2.71828;
      const rx = G * Math.sin(G * x + t * 0.1);
      const ry = G * Math.sin(G * y + t * 0.15);
      return (rx * ry * (1 + x + Math.sin(t * 0.05))) % 1;
    };

    const animate = () => {
      const { width, height } = canvas;
      const tOffset = speed * time; // Define tOffset here in the proper scope
      
      // Create enhanced gradient background with more depth
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0a0a0f');
      gradient.addColorStop(0.2, '#151520');
      gradient.addColorStop(0.4, '#1a1a2e');
      gradient.addColorStop(0.6, '#16213e');
      gradient.addColorStop(0.8, '#0f3460');
      gradient.addColorStop(1, '#0a1932');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Create much more visible silk-like pattern
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let x = 0; x < width; x += 1) { // Reduced sampling for smoother rendering
        for (let y = 0; y < height; y += 1) {
          const u = (x / width) * scale;
          const v = (y / height) * scale;
          
          // Enhanced multi-layered wave effects for silk-like motion
          let tex_x = u + 0.08 * Math.sin(15.0 * v - tOffset * 2.0) + 
                         0.04 * Math.sin(25.0 * u + tOffset * 1.5);
          let tex_y = v + 0.12 * Math.sin(12.0 * tex_x - tOffset * 1.8) + 
                         0.06 * Math.sin(20.0 * u + tOffset * 2.2) +
                         0.03 * Math.sin(30.0 * (u + v) + tOffset * 1.2);

          // Complex silk pattern with multiple harmonics for realistic texture
          const basePattern = 0.5 + 0.5 * Math.sin(
            8.0 * (tex_x + tex_y + 
              Math.cos(6.0 * tex_x + 8.0 * tex_y + tOffset * 1.5) + 
              0.7 * Math.cos(12.0 * tex_x - 10.0 * tex_y + tOffset * 2.0) +
              0.4 * Math.cos(18.0 * tex_x + 6.0 * tex_y - tOffset * 1.8) +
              0.08 * tOffset)
          );

          // Additional shimmer layer for silk-like highlights
          const shimmer = 0.3 + 0.7 * Math.sin(
            25.0 * (tex_x + tex_y - 0.2 * tOffset) +
            0.5 * Math.sin(40.0 * (tex_x - tex_y + 0.15 * tOffset))
          );

          const rnd = noise(x + time * 0.2, y + time * 0.25, time);
          const combinedPattern = (basePattern * 0.7 + shimmer * 0.3);
          const intensity = Math.max(0, combinedPattern - rnd / 8.0 * noiseIntensity);
          
          // Much more visible color range (20-120 instead of 0-45)
          let r, g, b;
          if (intensity < 0.15) {
            // Deep silk shadows with subtle blue tint
            const factor = intensity * 6.67;
            r = Math.floor(20 + (40 - 20) * factor);
            g = Math.floor(25 + (45 - 25) * factor);
            b = Math.floor(35 + (60 - 35) * factor);
          } else if (intensity < 0.35) {
            // Mid-tone silk with purple undertones
            const factor = (intensity - 0.15) * 5;
            r = Math.floor(40 + (65 - 40) * factor);
            g = Math.floor(45 + (60 - 45) * factor);
            b = Math.floor(60 + (85 - 60) * factor);
          } else if (intensity < 0.65) {
            // Silk highlights with warm tones
            const factor = (intensity - 0.35) * 3.33;
            r = Math.floor(65 + (90 - 65) * factor);
            g = Math.floor(60 + (80 - 60) * factor);
            b = Math.floor(85 + (100 - 85) * factor);
          } else {
            // Silk shine with bright highlights
            const factor = (intensity - 0.65) * 2.86;
            r = Math.floor(90 + (120 - 90) * factor);
            g = Math.floor(80 + (110 - 80) * factor);
            b = Math.floor(100 + (130 - 100) * factor);
          }
          
          const a = 255;

          const index = (y * width + x) * 4;
          if (index < data.length) {
            data[index] = Math.min(255, r);
            data[index + 1] = Math.min(255, g);
            data[index + 2] = Math.min(255, b);
            data[index + 3] = a;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Enhanced overlay for better depth with more visible gradients
      const overlayGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      overlayGradient.addColorStop(0, 'rgba(10, 20, 40, 0.1)'); // Subtle blue tint center
      overlayGradient.addColorStop(0.6, 'rgba(5, 15, 30, 0.3)'); // Mid transition
      overlayGradient.addColorStop(1, 'rgba(0, 10, 25, 0.6)'); // Darker edges
      
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, width, height);

      // Add subtle moving light effect for silk shimmer
      const lightGradient = ctx.createLinearGradient(
        0, 0, 
        width + 200 * Math.sin(tOffset * 0.02), 
        height + 200 * Math.cos(tOffset * 0.015)
      );
      lightGradient.addColorStop(0, 'rgba(120, 140, 180, 0.02)');
      lightGradient.addColorStop(0.5, 'rgba(80, 100, 140, 0.05)');
      lightGradient.addColorStop(1, 'rgba(40, 60, 100, 0.02)');
      
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
