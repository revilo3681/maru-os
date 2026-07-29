import React, { useState } from 'react';
import { Enso3DCanvas } from '../canvas/Enso3DCanvas';
import { AmaruBackground } from '../canvas/AmaruBackground';
import { PeruRegionsCanvas } from '../canvas/PeruRegionsCanvas';
import { Sparkles, ArrowRight, UserCheck, Mountain, TreePine, Waves } from 'lucide-react';

interface LandingPageProps {
  onStartOnboarding: () => void;
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartOnboarding,
  onOpenLogin
}) => {
  const [region, setRegion] = useState<'costa' | 'sierra' | 'selva'>('costa');

  return (
    <div className="relative min-h-screen bg-[#F5F1E8] text-[#2C3E50] overflow-hidden flex flex-col justify-between select-none transition-colors duration-1000" style={{
      backgroundColor: region === 'costa' ? '#F5F1E8' : region === 'sierra' ? '#1E293B' : '#1A3326',
      color: region === 'costa' ? '#2C3E50' : '#F5F1E8'
    }}>
      {/* 3D Peru Regions Canvas */}
      <PeruRegionsCanvas region={region} />
      
      {/* Fallback floating Canvas Particles (Amaru theme) */}
      <div className="opacity-40">
        <AmaruBackground />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-[#E3DCCB]/60">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {/* Clock-like outer ring that ripples */}
            <div className="absolute inset-0 rounded-full border-2 border-[#4A9B9D]/30 animate-water-wave-1"></div>
            <div className="absolute inset-0 rounded-full border-2 border-[#B8924A]/20 animate-water-wave-2"></div>
            <img 
              src="/logo.jpg" 
              alt="MARU OS Logo" 
              className="w-12 h-12 rounded-full object-cover border-2 border-[#4A9B9D] shadow-md shrink-0 relative z-10 animate-maru-heartbeat" 
            />
          </div>

          <div>
            <span className={`font-serif font-bold text-2xl ${region === 'costa' ? 'text-[#1E3A5F]' : 'text-white'}`}>MARU OS</span>
            <span className={`text-xs italic font-serif ml-2 ${region === 'costa' ? 'text-[#4A9B9D]' : 'text-[#A3E4D7]'}`}>con alma.</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className={`hidden sm:inline ${region === 'costa' ? 'text-[#6B7F8C]' : 'text-white/60'}`}>OJO DE AGUA · MEMORY · REASONING</span>
          <button
            onClick={onOpenLogin}
            className={`px-4 py-2 border rounded-xl transition-all shadow-sm font-semibold flex items-center gap-1.5 ${
              region === 'costa' 
                ? 'border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white'
                : 'border-white text-white hover:bg-white hover:text-[#1E3A5F]'
            }`}
          >
            <UserCheck size={14} />
            <span>ENTRAR</span>
          </button>
        </div>
      </header>

      {/* Hero Body */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        <div className="space-y-6 text-left">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${
            region === 'costa' ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] border-[#1E3A5F]/20' : 'bg-white/10 text-white border-white/20'
          }`}>
            <Sparkles size={14} className={region === 'costa' ? 'text-[#B8924A]' : 'text-[#A3E4D7]'} />
            <span>SISTEMA OPERATIVO COGNITIVO PARA PERÚ</span>
          </div>

          <h1 className={`text-4xl sm:text-6xl font-serif font-bold leading-tight ${region === 'costa' ? 'text-[#1E3A5F]' : 'text-white'}`}>
            El primer <br />
            sistema operativo <br />
            cognitivo <span className={`italic font-normal ${region === 'costa' ? 'text-[#4A9B9D]' : 'text-[#A3E4D7]'}`}>con alma.</span>
          </h1>

          <p className={`text-base sm:text-lg max-w-lg leading-relaxed ${region === 'costa' ? 'text-[#6B7F8C]' : 'text-white/80'}`}>
            Un compañero vivo que habita en tu dispositivo. Te conoce, reacciona al clima y huaicos de Chosica, cuida tu salud y razona contigo sin invadir tu privacidad.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartOnboarding}
              className="px-8 py-4 bg-[#1E3A5F] hover:bg-[#2C3E50] text-white rounded-2xl font-serif text-lg font-bold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 flex items-center gap-3"
            >
              <span>COMENZAR ONBOARDING</span>
              <ArrowRight size={20} className="text-[#4A9B9D]" />
            </button>

            <button
              onClick={onOpenLogin}
              className={`px-6 py-4 border rounded-2xl font-medium text-sm transition-colors ${
                region === 'costa'
                  ? 'border-[#E3DCCB] hover:bg-white text-[#2C3E50]'
                  : 'border-white/40 hover:bg-white/10 text-white'
              }`}
            >
              Ver Dashboard Vivo →
            </button>
          </div>

          {/* Region Selector */}
          <div className="flex gap-2 pt-6">
            <button onClick={() => setRegion('costa')} className={`px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-bold transition-all ${region === 'costa' ? 'bg-[#4A9B9D] text-white shadow-lg scale-105' : 'bg-[#E3DCCB]/20 text-current hover:bg-[#E3DCCB]/40'}`}>
              <Waves size={16} /> COSTA
            </button>
            <button onClick={() => setRegion('sierra')} className={`px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-bold transition-all ${region === 'sierra' ? 'bg-[#B8924A] text-white shadow-lg scale-105' : 'bg-[#E3DCCB]/20 text-current hover:bg-[#E3DCCB]/40'}`}>
              <Mountain size={16} /> SIERRA
            </button>
            <button onClick={() => setRegion('selva')} className={`px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-bold transition-all ${region === 'selva' ? 'bg-[#5A8F6B] text-white shadow-lg scale-105' : 'bg-[#E3DCCB]/20 text-current hover:bg-[#E3DCCB]/40'}`}>
              <TreePine size={16} /> SELVA
            </button>
          </div>

          <div className={`grid grid-cols-3 gap-4 pt-6 border-t text-xs font-mono ${region === 'costa' ? 'border-[#E3DCCB]/60 text-[#6B7F8C]' : 'border-white/20 text-white/60'}`}>
            <div>
              <div className={`font-bold text-sm ${region === 'costa' ? 'text-[#1E3A5F]' : 'text-white'}`}>7 AGENTES</div>
              <div>Salud, Leyes, Código, Clima</div>
            </div>
            <div>
              <div className="font-bold text-[#1E3A5F] text-sm">100% LOCAL</div>
              <div>Privacidad Radical</div>
            </div>
            <div>
              <div className="font-bold text-[#1E3A5F] text-sm">DATOS PERÚ</div>
              <div>SENAMHI & MINSA</div>
            </div>
          </div>
        </div>

        {/* 3D Enso Hero Canvas */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="relative">
            <Enso3DCanvas size={320} interactive={true} accentColor="#4A9B9D" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-serif text-2xl font-bold text-[#1E3A5F]/80 tracking-widest">MARU</span>
            </div>
          </div>
          <p className="text-xs font-mono text-[#B8924A] mt-4">
            丸 · Manantial de pensamiento vivo
          </p>
        </div>
      </main>

      {/* Manifesto Footer */}
      <footer className="relative z-10 bg-[#1E3A5F] text-[#F5F1E8] py-8 border-t border-[#2C3E50]">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-3 text-xs sm:text-sm font-serif">
          <p className="text-[#4A9B9D] font-bold text-base">"MARU no es un robot que obedece. MARU es un manantial que fluye contigo."</p>
          <div className="flex flex-wrap justify-center gap-6 text-[#F5F1E8]/70 text-xs font-sans">
            <span>• La tecnología debe ser cálida, no fría</span>
            <span>• La privacidad es un derecho, no un lujo</span>
            <span>• La inteligencia artificial debe tener alma</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
