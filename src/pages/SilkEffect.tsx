<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Smokey Silk Animation</title>
  <style>
    body {
      margin: 0;
      background: #000;
      overflow: hidden;
    }
    canvas {
      display: block;
      position: absolute;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <canvas id="smoke"></canvas>
  <script>
    const canvas = document.getElementById('smoke');
    const ctx = canvas.getContext('2d');
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    }
    window.addEventListener('resize', resize);

    // Smoke "thread" object
    function Thread(color) {
      this.points = [];
      this.color = color;
      this.alpha = 0.07 + Math.random() * 0.07;
      this.width = 60 + Math.random() * 40;
      this.offset = Math.random() * 1000;
      for (let i = 0; i < 8; i++) {
        this.points.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5
        });
      }
    }

    Thread.prototype.update = function(t) {
      for (let p of this.points) {
        p.x += p.vx + Math.sin(t/1200 + this.offset) * 0.15;
        p.y += p.vy + Math.cos(t/1500 + this.offset) * 0.15;
        // Bounce off edges
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
    };

    Thread.prototype.draw = function(ctx) {
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
    };

    // Create multiple threads with smoke colors
    const threads = [];
    const smokeColors = [
      'rgba(255,255,255,0.2)',
      'rgba(200,200,200,0.15)',
      'rgba(180,180,180,0.12)',
      'rgba(220,220,220,0.18)'
    ];
    for (let i = 0; i < 10; i++) {
      threads.push(new Thread(smokeColors[i % smokeColors.length]));
    }

    function animate(t) {
      // Trailing effect for smokiness
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, w, h);
      for (let thread of threads) {
        thread.update(t);
        thread.draw(ctx);
      }
      requestAnimationFrame(animate);
    }

    animate(0);
  </script>
</body>
</html>