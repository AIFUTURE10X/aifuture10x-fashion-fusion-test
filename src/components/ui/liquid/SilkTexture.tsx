
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
      
      // Create gradient background using the new color palette
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#6E6873');
      gradient.addColorStop(0.25, '#555159');
      gradient.addColorStop(0.5, '#3C3A40');
      gradient.addColorStop(0.75, '#242326');
      gradient.addColorStop(1, '#0C0B0D');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Create enhanced silk-like pattern with more waves
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
          
          // Use the new color palette for texture interpolation
          let r, g, b;
          if (intensity < 0.2) {
            // Interpolate between #0C0B0D and #242326
            const factor = intensity * 5;
            r = Math.floor(12 + (36 - 12) * factor);
            g = Math.floor(11 + (35 - 11) * factor);
            b = Math.floor(13 + (38 - 13) * factor);
          } else if (intensity < 0.4) {
            // Interpolate between #242326 and #3C3A40
            const factor = (intensity - 0.2) * 5;
            r = Math.floor(36 + (60 - 36) * factor);
            g = Math.floor(35 + (58 - 35) * factor);
            b = Math.floor(38 + (64 - 38) * factor);
          } else if (intensity < 0.6) {
            // Interpolate between #3C3A40 and #555159
            const factor = (intensity - 0.4) * 5;
            r = Math.floor(60 + (85 - 60) * factor);
            g = Math.floor(58 + (81 - 58) * factor);
            b = Math.floor(64 + (89 - 64) * factor);
          } else {
            // Interpolate between #555159 and #6E6873
            const factor = (intensity - 0.6) * 2.5;
            r = Math.floor(85 + (110 - 85) * factor);
            g = Math.floor(81 + (104 - 81) * factor);
            b = Math.floor(89 + (115 - 89) * factor);
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

      // Add subtle overlay for depth using the new color palette
      const overlayGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      overlayGradient.addColorStop(0, 'rgba(110, 104, 115, 0.05)'); // #6E6873 with low opacity
      overlayGradient.addColorStop(1, 'rgba(12, 11, 13, 0.7)'); // #0C0B0D with higher opacity
      
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
