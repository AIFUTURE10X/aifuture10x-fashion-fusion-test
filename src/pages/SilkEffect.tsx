import React, { useEffect, useRef } from 'react';
import { createNoise2D } from 'simplex-noise';

const SilkEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const noise2D = createNoise2D();
    let frameCount = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeLayers();
    };

    // Perlin noise smoke layer class
    class SmokeLayer {
      points: Array<{x: number, y: number, n: number}> = [];
      zoff: number;
      detail: number;
      speed: number;
      alpha: number;
      offset: number;

      constructor(zoff: number) {
        this.zoff = zoff;
        this.detail = 0.01 + Math.random() * 0.01;
        this.speed = 0.0005 + Math.random() * 0.0005;
        this.alpha = 18 + Math.random() * 10; // Very low opacity (out of 255)
        this.offset = Math.random() * 1000;
        
        // Reduced from 8 to 6 points for less visual density
        for (let i = 0; i < 6; i++) {
          this.points.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            n: Math.random() * 1000
          });
        }
      }

      update() {
        for (let p of this.points) {
          const angle = noise2D(p.n + this.offset, frameCount * this.speed + this.zoff) * Math.PI * 4;
          p.x += Math.cos(angle) * 0.3;
          p.y += Math.sin(angle) * 0.3;
          p.n += this.detail;
          
          // Smooth edge wrapping
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
        }
      }

      // Catmull-Rom spline implementation for smooth curves like p5.js curveVertex
      drawSmoothCurve(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 3) return;
        
        ctx.beginPath();
        
        // Add duplicate points at beginning and end for proper curve calculation
        const extendedPoints = [
          this.points[this.points.length - 1],
          ...this.points,
          this.points[0],
          this.points[1]
        ];
        
        ctx.moveTo(extendedPoints[1].x, extendedPoints[1].y);
        
        for (let i = 1; i < extendedPoints.length - 2; i++) {
          const p0 = extendedPoints[i - 1];
          const p1 = extendedPoints[i];
          const p2 = extendedPoints[i + 1];
          const p3 = extendedPoints[i + 2];
          
          // Catmull-Rom spline calculation
          for (let t = 0; t <= 1; t += 0.1) {
            const t2 = t * t;
            const t3 = t2 * t;
            
            const x = 0.5 * (
              (2 * p1.x) +
              (-p0.x + p2.x) * t +
              (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
              (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
            );
            
            const y = 0.5 * (
              (2 * p1.y) +
              (-p0.y + p2.y) * t +
              (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
              (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
            );
            
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.fill();
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha / 255; // Convert to 0-1 range
        ctx.fillStyle = 'white';
        
        this.drawSmoothCurve(ctx);
        
        ctx.restore();
      }
    }

    const initializeLayers = () => {
      layersRef.current = [];
      for (let i = 0; i < 3; i++) {
        layersRef.current.push(new SmokeLayer(i * 1000));
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      // Very subtle trailing effect - exact match to p5.js fill(0, 10)
      ctx.fillStyle = "rgba(0,0,0,0.039)"; // 10/255 = 0.039
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let layer of layersRef.current) {
        layer.update();
        layer.draw(ctx);
      }
      
      frameCount++;
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
    <div className="h-screen w-screen overflow-hidden bg-black">
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};

export default SilkEffect;