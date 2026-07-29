import React from 'react';

interface Enso3DCanvasProps {
  size?: number;
  isThinking?: boolean;
  isListening?: boolean;
  _isThinking?: boolean;
  _isListening?: boolean;
  _audioPulseLevel?: number;
  interactive?: boolean;
  onClick?: () => void;
  accentColor?: string;
}

export const Enso3DCanvas: React.FC<Enso3DCanvasProps> = ({
  size = 280,
  _isThinking = false,
  _isListening = false,
  _audioPulseLevel = 0,
  interactive = true,
  onClick,
  accentColor = '#4A9B9D'
}) => {
  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer group' : ''
      }`}
      title="MARU OS — Manantial de pensamiento vivo"
    >
      {/* Radiating Water Wave Rings (Olas de agua latientes en el borde) */}
      <div 
        className="absolute inset-0 rounded-full border-2 animate-water-wave-1 pointer-events-none"
        style={{ borderColor: accentColor }}
      />
      <div 
        className="absolute inset-0 rounded-full border-2 animate-water-wave-2 pointer-events-none"
        style={{ borderColor: accentColor }}
      />
      <div 
        className="absolute inset-0 rounded-full border-2 animate-water-wave-3 pointer-events-none"
        style={{ borderColor: accentColor }}
      />

      {/* Pulsing Beating Core with Enso Logo Image */}
      <div 
        className="relative w-4/5 h-4/5 rounded-full overflow-hidden border-2 shadow-2xl transition-transform duration-500 animate-maru-heartbeat group-hover:scale-105"
        style={{ borderColor: accentColor }}
      >
        <img
          src="/logo.jpg"
          alt="MARU OS — Manantial Enso"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Subtle Inner Glow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 pointer-events-none" />
      </div>
    </div>
  );
};
