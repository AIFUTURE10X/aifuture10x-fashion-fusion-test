
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
    let lastTime = 0;
    const speed = 0.008; // Much slower for smoother animation
    const scale = 0.8; // Reduced scale for subtler patterns

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Smooth easing function
    const easeInOutSine = (t: number) => {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    };

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      const { width, height } = canvas;
      const tOffset = speed * time;
      
      // Pure black background
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, width, height);

      // Create imageData for pixel manipulation
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Larger step for better performance
      const step = 3;
      
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          const normalizedX = x / width;
          const normalizedY = y / height;
          
          // Smokey silk effect covering entire canvas
          const u = normalizedX * scale;
          const v = normalizedY * scale;
          
          // Multiple time-based animations for smokey flow
          const smoothTime = easeInOutSine((tOffset % (Math.PI * 2)) / (Math.PI * 2));
          const fastTime = tOffset * 2;
          const slowTime = tOffset * 0.5;
          
          // Multiple wave layers for complexity
          const wave1 = 0.03 * Math.sin(4.0 * v - fastTime + 2.0 * u);
          const wave2 = 0.025 * Math.sin(6.0 * u + slowTime - 1.5 * v);
          const wave3 = 0.02 * Math.cos(8.0 * (u + v) + smoothTime * Math.PI);
          
          // Vertical flow for smokey effect
          const verticalFlow = 0.01 * Math.sin(3.0 * u + fastTime) * (1.0 - normalizedY);
          
          let tex_x = u + wave1 + wave3;
          let tex_y = v + wave2 + verticalFlow;

          // Complex smokey silk pattern with multiple frequencies
          const pattern1 = Math.sin(5.0 * (tex_x + tex_y) + slowTime);
          const pattern2 = Math.sin(8.0 * tex_x - 6.0 * tex_y + fastTime * 0.7);
          const pattern3 = Math.cos(12.0 * (tex_x - tex_y) + smoothTime * Math.PI * 1.3);
          const noise = Math.sin(20.0 * tex_x) * Math.cos(20.0 * tex_y) * 0.1;
          
          const basePattern = 0.5 + 0.35 * pattern1 + 0.25 * pattern2 + 0.15 * pattern3 + noise;
          
          // Smokey gradient - denser at bottom, lighter at top
          const smokeDensity = 0.3 + 0.7 * Math.pow(normalizedY, 0.8);
          const edgeFade = Math.min(normalizedX * 4, (1 - normalizedX) * 4, 1); // Fade at edges
          
          const intensity = basePattern * smokeDensity * edgeFade;
          
          // Much more visible grayscale for smokey effect
          const colorValue = Math.floor(Math.max(0, Math.min(255, 95 * Math.abs(intensity))));
          
          // Fill pixels
          for (let dx = 0; dx < step && x + dx < width; dx++) {
            for (let dy = 0; dy < step && y + dy < height; dy++) {
              const index = ((y + dy) * width + (x + dx)) * 4;
              if (index < data.length) {
                data[index] = colorValue;     // R
                data[index + 1] = colorValue; // G
                data[index + 2] = colorValue; // B
                data[index + 3] = 255;        // A
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      time += deltaTime * 0.001; // Convert to seconds for smoother time progression
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

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
