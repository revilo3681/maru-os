import React, { useEffect, useRef } from 'react';
import { AgentId } from '../../types';

interface ParticleBackgroundProps {
  activeAgentId?: AgentId;
  weatherCondition?: string;
  themeHour?: number;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  activeAgentId,
  weatherCondition = 'Soleado',
  themeHour
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const hour = themeHour ?? new Date().getHours();

    // Determine particle color palette & motion based on Agent or Time of day
    let particleColor = 'rgba(184, 146, 74, 0.25)'; // Default Gold
    let speedMult = 1.0;
    let particleType: 'dot' | 'line' | 'matrix' | 'flake' = 'dot';

    if (activeAgentId === 'aya') {
      particleColor = 'rgba(42, 117, 211, 0.3)'; // Blue
    } else if (activeAgentId === 'inti') {
      particleColor = 'rgba(184, 146, 74, 0.35)'; // Silver/Gold
    } else if (activeAgentId === 'kipu') {
      particleColor = 'rgba(46, 204, 113, 0.4)'; // Matrix green
      particleType = 'matrix';
    } else if (activeAgentId === 'sumaq') {
      particleColor = 'rgba(155, 89, 182, 0.35)'; // Lavender
    } else if (activeAgentId === 'pacha') {
      particleColor = 'rgba(39, 174, 96, 0.35)'; // Forest green
      particleType = 'flake';
    } else if (activeAgentId === 'tupac') {
      particleColor = 'rgba(192, 57, 43, 0.4)'; // Red seismic
      speedMult = 2.0;
    } else if (activeAgentId === 'yaku') {
      particleColor = 'rgba(74, 155, 157, 0.35)'; // Teal water
    } else {
      // Time based
      if (hour >= 20 || hour < 5) {
        particleColor = 'rgba(255, 255, 255, 0.35)'; // Stars
      } else if (hour >= 18) {
        particleColor = 'rgba(211, 84, 0, 0.3)'; // Orange sunset
      } else if (hour >= 5 && hour < 8) {
        particleColor = 'rgba(230, 126, 34, 0.3)'; // Dawn
      }
    }

    if (weatherCondition === 'Lluvia' || weatherCondition === 'Tormenta') {
      particleType = 'line';
      particleColor = 'rgba(52, 152, 219, 0.4)';
    }

    // Initialize particles
    const particleCount = particleType === 'matrix' ? 35 : 55;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8 * speedMult,
      vy: particleType === 'line' ? 3 + Math.random() * 4 : (Math.random() - 0.5) * 0.8 * speedMult,
      radius: Math.random() * 2.5 + 1,
      alpha: Math.random() * 0.6 + 0.2,
      char: particleType === 'matrix' ? String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96)) : ''
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.save();
        if (particleType === 'matrix') {
          ctx.fillStyle = particleColor;
          ctx.font = '12px JetBrains Mono, monospace';
          ctx.fillText(p.char, p.x, p.y);
        } else if (particleType === 'line') {
          ctx.strokeStyle = particleColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + 10);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = particleColor;
          ctx.fill();
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeAgentId, weatherCondition, themeHour]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
    />
  );
};
