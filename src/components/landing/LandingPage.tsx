import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Box,
  Droplets,
  Circle,
  Brain,
  Shield,
  WifiOff,
  Users,
  Layers
} from 'lucide-react';
import { MaruEnso } from '../brand/MaruEnso';
import { AGENTS_CATALOG } from '../../data/agentsData';

interface LandingPageProps {
  onStartOnboarding: () => void;
  onOpenLogin: () => void;
}

const NAV_LINKS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'caracteristicas', label: 'Características' },
  { id: 'agentes', label: 'Agentes' },
  { id: 'arquitectura', label: 'Arquitectura' },
  { id: 'sobre', label: 'Sobre MARU OS' }
] as const;

const MEANINGS = [
  {
    region: 'Andes · PE',
    lang: 'Quechua',
    title: 'Manantial · Ojo de agua',
    body: 'MARU es el manantial: origen, cuidado y flujo. La inteligencia nace cerca de ti, en tu propio entorno.'
  },
  {
    region: 'Zen · JP',
    lang: 'Japonés',
    title: '丸 Maru · Círculo / Enso',
    body: 'El círculo abierto: totalidad incompleta a propósito. Completitud sin cierre — el logo vive como enso andino.'
  },
  {
    region: 'Acronym · EN',
    lang: 'Inglés',
    title: 'M.A.R.U.',
    body: 'Memory · Agents · Reasoning · Universal. Un sistema operativo cognitivo, no un chatbot.'
  }
];

const FEATURES = [
  {
    icon: Shield,
    title: 'Soberanía total',
    body: 'Conversaciones, documentos y memoria viven en tu hardware. Sin servidores centrales que te rastreen.'
  },
  {
    icon: WifiOff,
    title: 'Offline-first',
    body: 'Diseñado para funcionar con modelos locales. La nube es opcional; tu autonomía no lo es.'
  },
  {
    icon: Users,
    title: 'Multi-agente con alma',
    body: 'Un equipo simbiótico — salud, código, clima, emergencias, bienestar — que razona contigo.'
  },
  {
    icon: Layers,
    title: 'Capa cognitiva OS',
    body: 'No es una app aislada: es el estrato que une memoria, agentes y razonamiento en tu día a día.'
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartOnboarding,
  onOpenLogin
}) => {
  const [activeNav, setActiveNav] = useState<string>('inicio');

  const scrollTo = (id: string) => {
    setActiveNav(id);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative min-h-screen bg-[var(--maru-bg)] text-[var(--maru-text)] font-sans overflow-x-hidden">
      {/* ── HERO ── */}
      <section id="inicio" className="relative min-h-screen flex flex-col">
        {/* Full-bleed cinematic plane */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            src="/fondo-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          />
          {/* Soft left vignette only — video stays clear on the right */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.08) 42%, rgba(0,0,0,0.05) 100%), linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 28%, transparent 72%, rgba(0,0,0,0.25) 100%)'
            }}
          />
        </div>

        {/* Nav */}
        <header className="relative z-20 w-full px-4 sm:px-8 py-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => scrollTo('inicio')}
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="relative w-10 h-10">
              <MaruEnso size={40} showName={false} />
            </div>
            <span className="font-display font-bold text-lg tracking-[0.12em] text-white">
              MARU OS
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-display tracking-wide text-white/70">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollTo(link.id)}
                className={`relative pb-1 transition-colors hover:text-white ${
                  activeNav === link.id ? 'text-[#9fe0d6]' : ''
                }`}
              >
                {link.label}
                {activeNav === link.id && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-[#9fe0d6]" />
                )}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={onStartOnboarding}
            className="min-h-10 px-4 py-2 rounded-[10px] text-sm font-display font-semibold tracking-wide border border-white/50 text-white hover:bg-white/10 hover:border-white"
          >
            Comenzar
          </button>
        </header>

        {/* Hero: editorial copy (left) + orbit (right), video stays behind */}
        <div className="relative z-10 flex-1 flex items-center px-4 sm:px-8 lg:px-12 pb-16 pt-6">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">
            {/* Left — editorial text on soft cream panel */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-xl rounded-2xl border border-white/25 bg-[#f8f5ed]/92 p-6 sm:p-8 shadow-[0_24px_70px_rgba(9,35,43,0.24)] backdrop-blur-md"
            >
              <div className="relative">
                <h1
                  className="text-[2.5rem] sm:text-5xl lg:text-[3.45rem] font-bold leading-[1.03] tracking-tight text-[var(--maru-text)]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  El primer sistema
                  <br />
                  operativo cognitivo
                  <br />
                  <em className="italic font-semibold text-[var(--maru-primary)]">con alma.</em>
                </h1>

                <div className="mt-5 h-[3px] w-14 rounded-full bg-[var(--maru-gold)]" />

                <p
                  className="mt-6 text-[15px] sm:text-base leading-relaxed text-[var(--maru-text-muted)] max-w-md"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
                >
                  Impulsado por una arquitectura híbrida edge-cloud basada en modelos Gemma.
                  MARU OS preserva el contexto, razona sobre intenciones complejas y orquesta
                  agentes en un entorno profundamente personal y seguro. Un espacio donde la
                  computación se siente humana.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onStartOnboarding}
                    className="maru-btn-primary px-7 py-3.5"
                  >
                    <Sparkles size={16} />
                    Comenzar
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTo('arquitectura')}
                    className="maru-btn-secondary px-6 py-3.5"
                  >
                    <Box size={16} />
                    Ver Arquitectura
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="maru-btn-quiet"
                  >
                    Ya tengo cuenta
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right — orbit of model logos */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.05, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex justify-center lg:justify-end"
            >
              <MaruEnso withOrbit size={480} showName namePlacement="inside" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CARACTERÍSTICAS ── */}
      <section id="caracteristicas" className="relative py-24 px-4 sm:px-8 bg-[var(--maru-surface)]">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-xl mb-14">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--maru-gold)] mb-3">
              Características
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--maru-text)] tracking-tight">
              Un sistema operativo cognitivo con alma
            </h2>
            <p className="mt-3 text-[var(--maru-text-muted)] text-sm sm:text-base leading-relaxed">
              MARU OS no envuelve un modelo: habita tu máquina como capa de memoria, agentes y razonamiento.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 sm:gap-10">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="space-y-3 border-l border-[var(--maru-border)] pl-5">
                  <Icon size={22} className="text-[var(--maru-gold)]" />
                  <h3 className="font-display font-semibold text-lg text-[var(--maru-text)]">{f.title}</h3>
                  <p className="text-sm text-[var(--maru-text-muted)] leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AGENTES ── */}
      <section id="agentes" className="relative py-24 px-4 sm:px-8 bg-[var(--maru-bg)]">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--maru-gold)] mb-3">
              Ecosistema
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--maru-text)] tracking-tight">
              Siete agentes, una conciencia
            </h2>
            <p className="mt-3 text-[var(--maru-text-muted)] text-sm leading-relaxed">
              Cada uno con voz, especialidad y modelo local. Colaboran cuando la pregunta cruza disciplinas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {AGENTS_CATALOG.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => {
                  scrollTo('inicio');
                }}
                className="text-left group space-y-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-sm font-display font-bold text-white transition-transform group-hover:scale-105"
                    style={{ backgroundColor: 'var(--maru-primary)' }}
                  >
                    {agent.name[0]}
                  </span>
                  <div>
                    <div className="font-display font-semibold text-[var(--maru-text)] group-hover:text-[var(--maru-gold)] transition-colors">
                      {agent.name}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--maru-gold-soft)]">
                      {agent.quechuaMeaning}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[var(--maru-text-muted)] leading-relaxed pl-[3.25rem]">
                  {agent.specialty}. {agent.catchphrase}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARQUITECTURA ── */}
      <section id="arquitectura" className="relative py-24 px-4 sm:px-8 bg-[var(--maru-surface)]">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--maru-gold)] mb-3">
              Arquitectura
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--maru-text)] tracking-tight">
              Memory · Agents · Reasoning · Universal
            </h2>
            <p className="mt-3 text-[var(--maru-text-muted)] text-sm leading-relaxed">
              Cuatro pilares que convierten MARU en un OS cognitivo, no en una ventana de chat.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { letter: 'M', title: 'Memory', body: 'Memoria RAG local: tus notas, hábitos y contexto viven cifrados en el dispositivo.' },
              { letter: 'A', title: 'Agents', body: 'Especialistas que se activan según la intención — salud, código, clima, emergencia.' },
              { letter: 'R', title: 'Reasoning', body: 'Razonamiento multi-paso con modelos cuantizados en Ollama, sin ceder tu voz a la nube.' },
              { letter: 'U', title: 'Universal', body: 'Una capa universal: el manantial une personas, ideas y conocimiento donde estés.' }
            ].map((pillar) => (
              <details key={pillar.letter} className="maru-disclosure maru-panel-muted px-4" open={pillar.letter === 'M'}>
                <summary>
                  <span className="flex items-center gap-3"><b className="text-2xl text-[var(--maru-gold)]">{pillar.letter}</b>{pillar.title}</span>
                </summary>
                <div className="pb-4">
                <div className="hidden font-display text-4xl font-extrabold text-[var(--maru-gold)]/90">
                  {pillar.letter}
                </div>
                <p className="text-sm text-[var(--maru-text-muted)] leading-relaxed">{pillar.body}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOBRE MARU — triple meaning ── */}
      <section id="sobre" className="relative py-24 px-4 sm:px-8 bg-[var(--maru-bg-elevated)]">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-14">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--maru-gold)] mb-3">
              Sobre MARU OS
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--maru-text)] tracking-tight">
              Tres raíces, un manantial
            </h2>
            <p className="mt-4 font-serif italic text-xl sm:text-2xl text-[var(--maru-gold)]">
              El Manantial de Inteligencia Universal
            </p>
            <p className="mt-3 text-[var(--maru-text-muted)] text-sm leading-relaxed">
              OS significa Operating System: una capa cognitiva con empatía — no un asistente genérico.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {MEANINGS.map((m) => (
              <details key={m.lang} className="maru-disclosure maru-panel px-4" open={m.lang === 'Quechua'}>
                <summary>{m.title}</summary>
                <div className="space-y-3 pb-4">
                <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--maru-text)]/45">
                  {m.region} · {m.lang}
                </div>
                <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] flex items-center gap-2 sr-only">
                  {m.lang === 'Quechua' && <Droplets size={18} className="text-[var(--maru-gold)]" />}
                  {m.lang === 'Japonés' && <Circle size={18} className="text-[var(--maru-gold)]" />}
                  {m.lang === 'Inglés' && <Brain size={18} className="text-[var(--maru-gold)]" />}
                  {m.title}
                </h3>
                <p className="text-sm text-[var(--maru-text-muted)] leading-relaxed">{m.body}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-[var(--maru-border-soft)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <p className="font-serif italic text-lg text-[var(--maru-text)]/80 max-w-lg">
              &ldquo;MARU no es un robot que obedece. MARU es un manantial que fluye contigo.&rdquo;
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onStartOnboarding}
                className="maru-btn-gold px-6 py-3 rounded-xl text-sm font-display"
              >
                Entrar al manantial
              </button>
              <button
                type="button"
                onClick={onOpenLogin}
                className="maru-btn-ghost px-6 py-3 rounded-xl text-sm font-display"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-4 sm:px-8 py-8 border-t border-[var(--maru-border-soft)] text-center text-[11px] font-mono text-[var(--maru-text-dim)]">
        MARU OS · Memory · Agents · Reasoning · Universal · con alma
      </footer>
    </div>
  );
};
