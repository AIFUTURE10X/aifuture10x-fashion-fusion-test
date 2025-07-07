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
      size: number;
      offset: number;

      constructor(zoff: number) {
        this.zoff = zoff;
        this.detail = 0.01 + Math.random() * 0.01;
        this.speed = 0.0005 + Math.random() * 0.0005;
        this.alpha = 18 + Math.random() * 10; // Very low opacity (out of 255)
        this.size = 180 + Math.random() * 120;
        this.offset = Math.random() * 1000;
        
        for (let i = 0; i < 8; i++) {
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

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha / 255; // Convert to 0-1 range
        ctx.fillStyle = 'white';
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        
        for (let i = 0; i < this.points.length; i++) {
          const p = this.points[i];
          const nextP = this.points[(i + 1) % this.points.length];
          const xc = (p.x + nextP.x) / 2;
          const yc = (p.y + nextP.y) / 2;
          ctx.quadraticCurveTo(p.x, p.y, xc, yc);
        }
        
        ctx.closePath();
        ctx.fill();
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
      // Very subtle trailing effect
      ctx.fillStyle = "rgba(0,0,0,0.04)"; // 10/255 ≈ 0.04
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