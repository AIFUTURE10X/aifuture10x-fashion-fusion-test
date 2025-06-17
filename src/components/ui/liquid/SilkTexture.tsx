
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
    const speed = 0.05;
    const scale = 1.5;
    const noiseIntensity = 1.2;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Simple noise function
    const noise = (x: number, y: number) => {
      const G = 2.71828;
      const rx = G * Math.sin(G * x);
      const ry = G * Math.sin(G * y);
      return (rx * ry * (1 + x)) % 1;
    };

    const animate = () => {
      const { width, height } = canvas;
      
      // Create gradient background using predominantly #282424
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#282424');
      gradient.addColorStop(0.25, '#1e1a1a');
      gradient.addColorStop(0.5, '#282424');
      gradient.addColorStop(0.75, '#322e2e');
      gradient.addColorStop(1, '#282424');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Create enhanced silk-like pattern with #282424 variations
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let x = 0; x < width; x += 2) {
        for (let y = 0; y < height; y += 2) {
          const u = (x / width) * scale;
          const v = (y / height) * scale;
          
          const tOffset = speed * time;
          
          // Enhanced wave effects with multiple layers
          let tex_x = u + 0.02 * Math.sin(12.0 * v - tOffset * 1.5);
          let tex_y = v + 0.05 * Math.sin(8.0 * tex_x - tOffset) + 
                         0.03 * Math.sin(15.0 * u + tOffset * 2.0);

          // More complex wave pattern with additional harmonics
          const pattern = 0.5 + 0.5 * Math.sin(
            6.0 * (tex_x + tex_y + 
              Math.cos(4.0 * tex_x + 6.0 * tex_y + tOffset) + 
              0.5 * Math.cos(10.0 * tex_x - 8.0 * tex_y + tOffset * 1.5) +
              0.03 * tOffset) +
            Math.sin(25.0 * (tex_x + tex_y - 0.15 * tOffset)) +
            0.3 * Math.sin(40.0 * (tex_x - tex_y + 0.1 * tOffset))
          );

          const rnd = noise(x + time * 0.1, y + time * 0.15);
          const intensity = Math.max(0, pattern - rnd / 12.0 * noiseIntensity);
          
          // Use variations of #282424 (40, 36, 36) for texture interpolation
          let r, g, b;
          if (intensity < 0.2) {
            // Darker variation
            const factor = intensity * 5;
            r = Math.floor(18 + (40 - 18) * factor);
            g = Math.floor(16 + (36 - 16) * factor);
            b = Math.floor(16 + (36 - 16) * factor);
          } else if (intensity < 0.4) {
            // Base #282424 color
            const factor = (intensity - 0.2) * 5;
            r = Math.floor(40 + (40 - 40) * factor);
            g = Math.floor(36 + (36 - 36) * factor);
            b = Math.floor(36 + (36 - 36) * factor);
          } else if (intensity < 0.6) {
            // Slightly lighter variation
            const factor = (intensity - 0.4) * 5;
            r = Math.floor(40 + (52 - 40) * factor);
            g = Math.floor(36 + (48 - 36) * factor);
            b = Math.floor(36 + (48 - 36) * factor);
          } else {
            // Lightest variation but still close to #282424
            const factor = (intensity - 0.6) * 2.5;
            r = Math.floor(52 + (62 - 52) * factor);
            g = Math.floor(48 + (58 - 48) * factor);
            b = Math.floor(48 + (58 - 48) * factor);
          }
          
          const a = 255;

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

      // Add subtle overlay for depth using #282424 variations
      const overlayGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      overlayGradient.addColorStop(0, 'rgba(40, 36, 36, 0.05)'); // #282424 with low opacity
      overlayGradient.addColorStop(1, 'rgba(18, 16, 16, 0.7)'); // Darker variation with higher opacity
      
      ctx.fillStyle = overlayGradient;
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
