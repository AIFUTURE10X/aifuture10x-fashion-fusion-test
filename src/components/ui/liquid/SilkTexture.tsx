
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
      const step = 2;
      
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          const normalizedY = y / height;
          
          // Two-tone effect: textured top, smooth bottom
          if (normalizedY < 0.6) { // Top 60% has texture
            const u = (x / width) * scale;
            const v = (y / height) * scale;
            
            // Much smoother wave effects with easing
            const smoothTime = easeInOutSine((tOffset % (Math.PI * 2)) / (Math.PI * 2));
            const wave1 = 0.015 * Math.sin(6.0 * v - smoothTime * Math.PI);
            const wave2 = 0.01 * Math.sin(8.0 * u + smoothTime * Math.PI * 0.8);
            
            let tex_x = u + wave1;
            let tex_y = v + wave2;

            // Simplified silk pattern
            const basePattern = 0.5 + 0.3 * Math.sin(
              3.0 * (tex_x + tex_y + smoothTime * 0.5)
            );

            // Fade factor for transition to bottom
            const fadeFactor = Math.max(0, (0.6 - normalizedY) / 0.6);
            const intensity = basePattern * fadeFactor * 0.3; // Reduced intensity
            
            // Very subtle grayscale
            const colorValue = Math.floor(20 * intensity); // Much darker
            
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
          } else {
            // Bottom 40% is pure black (already filled by background)
            // No additional processing needed
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Smooth gradient transition between top and bottom
      const transitionGradient = ctx.createLinearGradient(0, height * 0.5, 0, height * 0.7);
      transitionGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      transitionGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
      
      ctx.fillStyle = transitionGradient;
      ctx.fillRect(0, height * 0.5, width, height * 0.2);

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
