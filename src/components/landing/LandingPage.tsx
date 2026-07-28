import React from 'react';
import { Enso3DCanvas } from '../canvas/Enso3DCanvas';
import { ParticleBackground } from '../canvas/ParticleBackground';
import { Sparkles, Shield, Cpu, ArrowRight, UserCheck } from 'lucide-react';

interface LandingPageProps {
  onStartOnboarding: () => void;
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartOnboarding,
  onOpenLogin
}) => {
  return (
    <div className="relative min-h-screen bg-[#F5F1E8] text-[#2C3E50] overflow-hidden flex flex-col justify-between select-none">
      {/* Floating Canvas Particles */}
      <ParticleBackground />

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-[#E3DCCB]/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#4A9B9D] flex items-center justify-center bg-[#1E3A5F] shadow-sm">
            <span className="text-[#4A9B9D] font-serif font-bold text-xl">丸</span>
          </div>
          <div>
            <span className="font-serif font-bold text-2xl text-[#1E3A5F]">MARU OS</span>
            <span className="text-xs text-[#4A9B9D] italic font-serif ml-2">con alma.</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="hidden sm:inline text-[#6B7F8C]">OJO DE AGUA · MEMORY · REASONING</span>
          <button
            onClick={onOpenLogin}
            className="px-4 py-2 border border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white rounded-xl transition-all shadow-sm font-semibold flex items-center gap-1.5"
          >
            <UserCheck size={14} />
            <span>ENTRAR</span>
          </button>
        </div>
      </header>

      {/* Hero Body */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        <div className="space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1E3A5F]/10 text-[#1E3A5F] rounded-full text-xs font-mono border border-[#1E3A5F]/20">
            <Sparkles size={14} className="text-[#B8924A]" />
            <span>SISTEMA OPERATIVO COGNITIVO PARA PERÚ</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-[#1E3A5F] leading-tight">
            El primer <br />
            sistema operativo <br />
            cognitivo <span className="text-[#4A9B9D] italic font-normal">con alma.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#6B7F8C] max-w-lg leading-relaxed">
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
              className="px-6 py-4 border border-[#E3DCCB] hover:bg-white text-[#2C3E50] rounded-2xl font-medium text-sm transition-colors"
            >
              Ver Dashboard Vivo →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E3DCCB]/60 text-xs font-mono text-[#6B7F8C]">
            <div>
              <div className="font-bold text-[#1E3A5F] text-sm">7 AGENTES</div>
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
