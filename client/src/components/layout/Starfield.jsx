import React, { useEffect, useRef } from 'react';

export function Starfield({
  starCount = 15000,
  waveFrequency = 15,
  starEscapeWidth = 450,
  voidWidth = 80,
  starColor = { r: 0, g: 229, b: 255 },
  maxOpacity = 220,
  rotationSpeed = 0.0003,
  waveSpeed = 0.006,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate stars
    const stars = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let i = 0; i < starCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * maxRadius;
      const size = Math.random() * 1.5 + 0.5;
      const speed = Math.random() * 0.2 + 0.05;
      const opacity = Math.random() * maxOpacity;

      stars.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size,
        speed,
        opacity,
        angle,
        dist,
      });
    }

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += waveSpeed;

      const cX = width / 2;
      const cY = height / 2;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.angle += rotationSpeed;
        const wave = Math.sin(time + star.dist / waveFrequency) * 15;
        const r = star.dist + wave;

        const x = cX + Math.cos(star.angle) * r;
        const y = cY + Math.sin(star.angle) * r;

        if (x < 0 || x > width || y < 0 || y > height) continue;

        const alpha = (star.opacity / 255) * (1 - star.dist / maxRadius);
        ctx.fillStyle = `rgba(${starColor.r}, ${starColor.g}, ${starColor.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [starCount, waveFrequency, starEscapeWidth, voidWidth, starColor, maxOpacity, rotationSpeed, waveSpeed]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}

export default Starfield;
