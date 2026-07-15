import React, { useEffect, useRef } from 'react';

const StarfieldBg = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Resize handler to keep canvas full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Star configuration
    const starCount = 120;
    const stars = [];

    // Initialize stars
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5, // Tiny twinkling points
        alpha: Math.random(), // Starting opacity
        speed: Math.random() * 0.015 + 0.005, // Speed of fade/twinkle
        driftX: (Math.random() - 0.5) * 0.1, // Subtle drift to mimic camera movement
        driftY: (Math.random() - 0.5) * 0.1,
      });
    }

    // Animation Loop
    const draw = () => {
      // Semi-transparent overlay gives a slight motion-blur/smooth glow trail
      ctx.fillStyle = 'rgba(10, 10, 15, 0.2)'; // Very dark cosmic blue-black
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        // Twinkle effect (fade in and out)
        star.alpha += star.speed;
        if (star.alpha <= 0 || star.alpha >= 1) {
          star.speed = -star.speed; // Reverse fade direction
        }

        // Keep alpha in bounds
        star.alpha = Math.max(0, Math.min(1, star.alpha));

        // Slow cinematic drift
        star.x += star.driftX;
        star.y += star.driftY;

        // Wrap around edge boundaries
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Draw the sparkling star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        // Create a faint glow effect around brighter stars
        if (star.radius > 1.2) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#ffffff';
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1, // Sits behind all app content
        pointerEvents: 'none', // Allows clicks to pass through to buttons/inputs
        display: 'block',
      }}
    />
  );
};

export default StarfieldBg;