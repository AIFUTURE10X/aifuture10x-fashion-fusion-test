
import React, { useEffect, useRef } from 'react';

interface SilkTextureProps {
  className?: string;
}

export const SilkTexture = ({ className = "" }: SilkTextureProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const threadsRef = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeThreads();
    };

    // Smoke "thread" class
    class Thread {
      points: Array<{x: number, y: number, vx: number, vy: number}> = [];
      color: string;
      alpha: number;
      width: number;
      offset: number;

      constructor(color: string) {
        this.color = color;
        this.alpha = 0.07 + Math.random() * 0.07;
        this.width = 60 + Math.random() * 40;
        this.offset = Math.random() * 1000;
        
        for (let i = 0; i < 8; i++) {
          this.points.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
          });
        }
      }

      update(t: number) {
        for (let p of this.points) {
          p.x += p.vx + Math.sin(t/1200 + this.offset) * 0.15;
          p.y += p.vy + Math.cos(t/1500 + this.offset) * 0.15;
          // Bounce off edges
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        
        for (let i = 1; i < this.points.length - 2; i++) {
          let xc = (this.points[i].x + this.points[i + 1].x) / 2;
          let yc = (this.points[i].y + this.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
        }
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width * (0.5 + Math.random() * 0.5);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 40;
        ctx.stroke();
        ctx.restore();
      }
    }

    const initializeThreads = () => {
      const smokeColors = [
        'rgba(255,255,255,0.2)',
        'rgba(200,200,200,0.15)',
        'rgba(180,180,180,0.12)',
        'rgba(220,220,220,0.18)'
      ];
      
      threadsRef.current = [];
      for (let i = 0; i < 10; i++) {
        threadsRef.current.push(new Thread(smokeColors[i % smokeColors.length]));
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = (t: number) => {
      // Trailing effect for smokiness
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let thread of threadsRef.current) {
        thread.update(t);
        thread.draw(ctx);
      }
      
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
