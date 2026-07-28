import React, { useState } from 'react';
import { Heart, RefreshCw, Share2, Quote } from 'lucide-react';

const FRASE_POOL = [
  { text: 'El conocimiento es el manantial del alma.', author: 'Sabiduría Andina' },
  { text: 'No te juzga. Te entiende. No te invada. Te protege.', author: 'Manifiesto MARU' },
  { text: 'Ama llulla, ama suwa, ama qilla (No seas mentiroso, ni ladrón, ni ocioso).', author: 'Principio Inca' },
  { text: 'El equilibrio no se encuentra, se cultiva cada mañana.', author: 'Sumaq' },
  { text: 'Cuidar la salud es honrar el templo de la vida.', author: 'Aya' },
  { text: 'En la armonía con la Pachamama reside la verdadera paz.', author: 'Pacha' }
];

export const FraseDelDia: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentFrase = FRASE_POOL[index];

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % FRASE_POOL.length);
    setIsSaved(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`"${currentFrase.text}" — ${currentFrase.author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2C3E50] text-[#F5F1E8] p-5 rounded-2xl shadow-md border border-[#4A9B9D]/30 relative overflow-hidden">
      <Quote className="absolute -right-2 -bottom-2 text-[#4A9B9D]/10" size={120} />
      
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#4A9B9D]">
          <span>📜 Frase del Día</span>
          <span>MARU OS</span>
        </div>

        <p className="text-lg sm:text-xl font-serif italic text-white leading-relaxed">
          "{currentFrase.text}"
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-mono text-[#B8924A]">— {currentFrase.author}</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-lg transition-colors ${
                isSaved ? 'text-red-400 bg-white/10' : 'text-[#F5F1E8]/70 hover:text-white hover:bg-white/10'
              }`}
              title="Guardar en favoritos"
            >
              <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={handleNext}
              className="p-2 rounded-lg text-[#F5F1E8]/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Siguiente frase"
            >
              <RefreshCw size={16} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-[#F5F1E8]/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Compartir frase"
            >
              <Share2 size={16} />
            </button>
            {copied && <span className="text-[10px] text-[#4A9B9D] font-mono">Copiado</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
