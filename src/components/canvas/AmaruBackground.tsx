import React, { useEffect, useState } from 'react';

export const AmaruBackground: React.FC = () => {
  const [leaves, setLeaves] = useState<Array<{ id: number; left: string; duration: string; delay: string; scale: number; type: number }>>([]);
  const [waterfalls, setWaterfalls] = useState<Array<{ id: number; left: string; opacity: number; width: string; duration: string; delay: string }>>([]);

  useEffect(() => {
    // Generate Leaves
    const leafCount = 15;
    const generatedLeaves = Array.from({ length: leafCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      duration: `${10 + Math.random() * 15}s`,
      delay: `${Math.random() * 5}s`,
      scale: 0.5 + Math.random() * 0.8,
      type: Math.floor(Math.random() * 3), // For different leaf colors/SVG paths
    }));
    setLeaves(generatedLeaves);

    // Generate Waterfalls
    const waterfallCount = 5;
    const generatedWaterfalls = Array.from({ length: waterfallCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      opacity: 0.1 + Math.random() * 0.2,
      width: `${10 + Math.random() * 40}px`,
      duration: `${2 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`,
    }));
    setWaterfalls(generatedWaterfalls);
  }, []);

  const getLeafColor = (type: number) => {
    switch(type) {
      case 0: return 'text-[#4A9B9D]'; // Emerald
      case 1: return 'text-[#B8924A]'; // Gold
      case 2: return 'text-[#2C3E50]'; // Dark Slate
      default: return 'text-[#4A9B9D]';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-gradient-to-br from-[#F5F1E8] via-[#E3DCCB]/20 to-[#F5F1E8]">
      {/* Dynamic Waterfalls */}
      {waterfalls.map((wf) => (
        <div
          key={`wf-${wf.id}`}
          className="absolute top-0 h-full animate-waterfall"
          style={{
            left: wf.left,
            width: wf.width,
            opacity: wf.opacity,
            animationDuration: wf.duration,
            animationDelay: wf.delay,
            background: 'linear-gradient(180deg, transparent 0%, rgba(74, 155, 157, 0.4) 50%, transparent 100%)',
            filter: 'blur(4px)',
          }}
        />
      ))}

      {/* Falling Leaves */}
      {leaves.map((leaf) => (
        <div
          key={`leaf-${leaf.id}`}
          className={`absolute -top-10 animate-falling-leaf ${getLeafColor(leaf.type)}`}
          style={{
            left: leaf.left,
            animationDuration: leaf.duration,
            animationDelay: leaf.delay,
            transform: `scale(${leaf.scale})`,
          }}
        >
          {/* Simple Leaf SVG */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6 }}>
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM11 14H13V9C13 8.45 12.55 8 12 8C11.45 8 11 8.45 11 9V14Z" />
          </svg>
        </div>
      ))}

      {/* Global Gradient Overlay to make it feel premium */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#F5F1E8]/30 to-[#F5F1E8] mix-blend-overlay"></div>
    </div>
  );
};
