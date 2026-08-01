import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Box,
  Droplets,
  Circle,
  Brain,
  Shield,
  WifiOff,
  Users,
  Layers,
  Volume2,
  VolumeX,
  Volume1,
  Music,
  ChevronDown,
  Menu,
  X,
  Moon,
  Sun,
  HeartPulse,
  Scale,
  Code2,
  Leaf,
  CloudRain,
  ShieldAlert,
  Landmark,
  type LucideIcon
} from 'lucide-react';
import { MaruEnso } from '../brand/MaruEnso';
import { AGENTS_CATALOG } from '../../data/agentsData';
import { StorageService } from '../../services/storageService';
import { applyThemeMode, resolveThemeMode } from '../../services/themeService';
import type { AgentId, AppSettings } from '../../types';

interface LandingPageProps {
  onStartOnboarding: () => void;
  onOpenLogin: () => void;
}

const NAV_LINKS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'impacto', label: 'Impacto' },
  { id: 'caracteristicas', label: 'Características' },
  { id: 'agentes', label: 'Agentes' },
  { id: 'arquitectura', label: 'Arquitectura' },
  { id: 'sobre', label: 'Sobre MARU OS' }
] as const;

const IMPACT_CASES = [
  {
    id: 'rescue',
    eyebrow: 'Rescate en la montaña',
    title: 'Ayuda en situaciones de emergencia',
    summary:
      'Guía paso a paso cuando cada minuto cuenta: primeros auxilios, orientación y contacto con rescate.',
    scenario:
      'En una emergencia de montaña, MARU acompaña con instrucciones claras de primeros auxilios, prioriza señales vitales y ayuda a contactar equipos de rescate — incluso con conectividad limitada.',
    image: '/landing/rescue-mountain.png',
    alt: 'Ilustración de una excursionista en la montaña usando una IA holográfica mientras un equipo de rescate se acerca',
    anchor: 'agentes'
  },
  {
    id: 'program',
    eyebrow: 'Programar desde cualquier dispositivo',
    title: 'Programa sin límites',
    summary:
      'Un IDE en la nube impulsado por IA: crea y despliega sin hardware potente ni instalaciones pesadas.',
    scenario:
      'Desde un celular, tablet o laptop modesta, abre un entorno de desarrollo completo. Kipu y la capa cognitiva de MARU te ayudan a escribir, depurar y aprender — sin depender de una máquina de alto rendimiento.',
    image: '/landing/program-anywhere.png',
    alt: 'Ilustración futurista de programación en la nube desde múltiples dispositivos con asistencia de IA',
    anchor: 'agentes'
  },
  {
    id: 'kids',
    eyebrow: 'Maru, la IA que guía a los niños',
    title: 'Maru responde tus dudas',
    summary:
      'Explicaciones amables y claras para que niñas, niños y jóvenes aprendan con confianza.',
    scenario:
      'Maru traduce conceptos difíciles a lenguaje cercano: ciencia, matemáticas, cultura y curiosidad cotidiana. Un compañero paciente que motiva a preguntar sin miedo y a seguir explorando.',
    image: '/landing/maru-kids.png',
    alt: 'Ilustración de Maru, una IA amigable, explicando conceptos a niños y jóvenes',
    anchor: 'sobre'
  },
  {
    id: 'quechua',
    eyebrow: 'Traductor de Quechua con Gemma',
    title: 'Rompiendo las barreras del idioma',
    summary:
      'Traducción español ↔ quechua con modelos Gemma, para que el conocimiento circule sin fronteras.',
    scenario:
      'Habla o escribe en español o quechua y recibe traducciones naturales impulsadas por Gemma. MARU acerca servicios, educación y emergencia a comunidades donde el idioma no debería ser un muro.',
    image: '/landing/quechua-translator.png',
    alt: 'Ilustración de traducción español-quechua asistida por IA con el modelo Gemma',
    anchor: 'agentes'
  }
] as const;

const AGENT_ICONS: Record<AgentId, LucideIcon> = {
  aya: HeartPulse,
  inti: Scale,
  kipu: Code2,
  sumaq: Leaf,
  pacha: CloudRain,
  tupac: ShieldAlert,
  yaku: Landmark
};

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedImpact, setExpandedImpact] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<AppSettings['themeMode']>(() => {
    const mode = StorageService.getSettings().themeMode;
    applyThemeMode(mode);
    return mode;
  });
  const resolvedTheme = resolveThemeMode(themeMode);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Attempt initial autoplay if allowed by browser
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
    // Solo al montar: el volumen se sincroniza en handleVolumeChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (themeMode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeMode('auto');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeMode]);

  const persistTheme = (mode: AppSettings['themeMode']) => {
    const next = { ...StorageService.getSettings(), themeMode: mode };
    StorageService.saveSettings(next);
    applyThemeMode(mode);
    setThemeMode(mode);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const applyVolume = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) audioRef.current.volume = newVol;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    applyVolume(newVol);
    if (audioRef.current) {
      if (newVol > 0 && !isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
      } else if (newVol === 0 && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const scrollTo = (id: string) => {
    setActiveNav(id);
    setMenuOpen(false);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative min-h-screen bg-[var(--maru-bg)] text-[var(--maru-text)] font-sans overflow-x-hidden">
      {/* Background audio — musica-portada.mp3 */}
      <audio ref={audioRef} src="/musica-portada.mp3" loop />

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
                'linear-gradient(90deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.14) 42%, rgba(0,0,0,0.08) 100%), linear-gradient(180deg, rgba(0,0,0,0.42) 0%, transparent 28%, transparent 72%, rgba(0,0,0,0.32) 100%)'
            }}
          />
        </div>

        {/* Nav */}
        <header className="relative z-30 w-full px-4 sm:px-8 py-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => scrollTo('inicio')}
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="relative w-10 h-10">
              <MaruEnso size={40} showName={false} />
            </div>
            <span className="font-display font-bold text-lg tracking-[0.12em] text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
              MARU OS
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme: Light / Dark */}
            <div
              className="flex items-center rounded-xl border border-white/30 bg-black/30 backdrop-blur-md p-0.5"
              role="group"
              aria-label="Tema de interfaz"
            >
              <button
                type="button"
                onClick={() => persistTheme('day')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] text-[11px] font-display font-semibold transition-colors ${
                  resolvedTheme === 'light'
                    ? 'bg-white/90 text-[#142d35]'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Modo claro"
              >
                <Sun size={13} />
                <span className="hidden sm:inline">Claro</span>
              </button>
              <button
                type="button"
                onClick={() => persistTheme('night')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] text-[11px] font-display font-semibold transition-colors ${
                  resolvedTheme === 'dark'
                    ? 'bg-[#1a3d48] text-[#9fe0d6]'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Modo oscuro"
              >
                <Moon size={13} />
                <span className="hidden sm:inline">Oscuro</span>
              </button>
            </div>

            {/* Dropdown Control de Volumen - Música de portada */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVolumeMenu(!showVolumeMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display font-semibold border border-white/30 text-white bg-black/30 hover:bg-black/50 backdrop-blur-md transition-all shadow-sm"
                title="Música de Portada"
              >
                <Music size={14} className={isPlaying ? 'text-[#9fe0d6] animate-pulse' : 'text-white/60'} />
                {isPlaying ? (
                  volume > 0.5 ? <Volume2 size={15} /> : <Volume1 size={15} />
                ) : (
                  <VolumeX size={15} className="text-white/50" />
                )}
                <span className="hidden sm:inline font-mono">{Math.round(volume * 100)}%</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${showVolumeMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Popover / Desplegable de Volumen */}
              {showVolumeMenu && (
                <div className="absolute right-0 mt-2 w-56 p-3 bg-[var(--maru-surface)] text-[var(--maru-text)] border border-[var(--maru-border)] rounded-2xl shadow-xl backdrop-blur-xl z-50">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--maru-border-soft)]">
                    <span className="text-xs font-display font-bold flex items-center gap-1.5 text-[var(--maru-primary)]">
                      <Music size={14} /> Música de Fondo
                    </span>
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[var(--maru-primary-soft)] text-[var(--maru-primary)] hover:opacity-90 transition-colors"
                    >
                      {isPlaying ? 'Pausar' : 'Reproducir'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono font-medium text-[var(--maru-text-muted)]">
                      <span>Volumen</span>
                      <span>{Math.round(volume * 100)}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => applyVolume(0)}
                        className="p-1 text-[var(--maru-text-muted)] hover:text-[var(--maru-text)] transition-colors"
                        title="Silenciar"
                      >
                        <VolumeX size={16} />
                      </button>

                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full h-1.5 bg-[var(--maru-surface-muted)] rounded-lg appearance-none cursor-pointer accent-[var(--maru-primary)]"
                      />

                      <button
                        type="button"
                        onClick={() => applyVolume(1)}
                        className="p-1 text-[var(--maru-text-muted)] hover:text-[var(--maru-text)] transition-colors"
                        title="Volumen Máximo"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onStartOnboarding}
              className="hidden sm:inline-flex min-h-10 px-4 py-2 rounded-[10px] text-sm font-display font-semibold tracking-wide border border-white/50 text-white hover:bg-white/10 hover:border-white transition-all shadow-sm"
            >
              Comenzar
            </button>

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/30 text-white bg-black/30 hover:bg-black/50 backdrop-blur-md transition-all"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* Hamburger panel */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Cerrar menú"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
                onClick={() => setMenuOpen(false)}
              />
              <motion.nav
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-0 right-0 z-50 h-full w-[min(100%,20rem)] bg-[var(--maru-bg-elevated)] border-l border-[var(--maru-border)] shadow-[var(--maru-shadow-md)] px-5 py-6 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--maru-border-soft)]">
                  <span className="font-display font-bold tracking-[0.14em] text-[var(--maru-text)]">
                    MARU OS
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="p-2 rounded-lg text-[var(--maru-text-muted)] hover:bg-[var(--maru-surface-muted)]"
                    aria-label="Cerrar"
                  >
                    <X size={18} />
                  </button>
                </div>
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => scrollTo(link.id)}
                    className={`text-left px-3 py-3 rounded-[10px] font-display text-sm tracking-wide transition-colors ${
                      activeNav === link.id
                        ? 'bg-[var(--maru-primary-soft)] text-[var(--maru-primary)] font-semibold'
                        : 'text-[var(--maru-text-muted)] hover:bg-[var(--maru-surface-muted)] hover:text-[var(--maru-text)]'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
                <div className="mt-auto pt-4 space-y-2 border-t border-[var(--maru-border-soft)]">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onStartOnboarding();
                    }}
                    className="maru-btn-primary w-full"
                  >
                    <Sparkles size={16} />
                    Comenzar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="maru-btn-secondary w-full"
                  >
                    Ya tengo cuenta
                  </button>
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>

        {/* Hero: editorial copy (left) + orbit (right), video stays behind */}
        <div className="relative z-10 flex-1 flex items-center px-4 sm:px-8 lg:px-12 pb-16 pt-6">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">
            {/* Left — editorial text on opaque cream panel for contrast over video */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-xl rounded-2xl border border-[#e8e0d0]/80 bg-[#f8f5ed]/92 p-6 sm:p-8 shadow-[0_24px_70px_rgba(9,35,43,0.35)] backdrop-blur-xl"
              style={{
                textShadow: '0 1px 0 rgba(248,245,237,0.6)'
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background:
                    'linear-gradient(145deg, rgba(248,245,237,0.55) 0%, transparent 55%), radial-gradient(ellipse at 20% 0%, rgba(20,125,120,0.08), transparent 50%)'
                }}
              />
              <div className="relative">
                <h1
                  className="text-[2.5rem] sm:text-5xl lg:text-[3.45rem] font-bold leading-[1.03] tracking-tight text-[#142d35]"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    textShadow: '0 1px 2px rgba(248,245,237,0.9), 0 2px 12px rgba(20,45,53,0.12)'
                  }}
                >
                  El primer sistema
                  <br />
                  operativo cognitivo
                  <br />
                  <em className="italic font-semibold text-[#0f6965]">con alma.</em>
                </h1>

                <div className="mt-5 h-[3px] w-14 rounded-full bg-[#b3883c]" />

                <p
                  className="mt-6 text-[15px] sm:text-base leading-relaxed text-[#3d5258] max-w-md"
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    textShadow: '0 1px 1px rgba(248,245,237,0.85)'
                  }}
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
                    className="inline-flex items-center justify-center gap-2 min-h-10 px-6 py-3.5 rounded-[10px] text-sm font-display font-semibold border border-[#142d35]/25 text-[#0f6965] bg-white/85 hover:bg-white transition-colors"
                  >
                    <Box size={16} />
                    Ver Arquitectura
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-3.5 rounded-[10px] text-sm font-display font-semibold text-[#3d5258] hover:text-[#142d35] hover:bg-[#142d35]/06 transition-colors"
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

      {/* ── IMPACTO — IA donde más se necesita ── */}
      <section id="impacto" className="maru-impact-section relative overflow-hidden py-24 sm:py-28 px-4 sm:px-8">
        <div className="maru-impact-bg" aria-hidden="true">
          <span className="maru-impact-orb maru-impact-orb--a" />
          <span className="maru-impact-orb maru-impact-orb--b" />
          <span className="maru-impact-orb maru-impact-orb--c" />
          <span className="maru-impact-grid" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto text-center mb-12 sm:mb-16"
          >
            <p className="maru-impact-eyebrow text-xs font-mono uppercase tracking-[0.22em] mb-4">
              Impacto real
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-[2.65rem] leading-tight tracking-tight text-white">
              La IA que acompaña a las personas donde más la necesitan
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-white/80 max-w-2xl mx-auto">
              Tecnología accesible para resolver problemas reales, sin importar el lugar, el idioma o los
              recursos disponibles.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6">
            {IMPACT_CASES.map((item, index) => {
              const isOpen = expandedImpact === item.id;
              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.65,
                    delay: 0.08 * index,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className={`maru-impact-card flex flex-col ${isOpen ? 'maru-impact-card--open' : ''}`}
                >
                  <div className="maru-impact-card__media">
                    <img
                      src={item.image}
                      alt={item.alt}
                      width={1024}
                      height={572}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] text-[#c4b5fd] mb-2">
                      {item.eyebrow}
                    </p>
                    <h3 className="font-display font-semibold text-lg text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-white/75 flex-1">
                      {item.summary}
                    </p>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key={`${item.id}-detail`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="mt-3 pt-3 border-t border-white/15 text-sm leading-relaxed text-white/90">
                            {item.scenario}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedImpact(null);
                              scrollTo(item.anchor);
                            }}
                            className="mt-3 text-xs font-display font-semibold text-[#c4b5fd] hover:text-white underline-offset-4 hover:underline transition-colors"
                          >
                            Ver en el ecosistema →
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setExpandedImpact(isOpen ? null : item.id)}
                      className="maru-impact-cta mt-5"
                    >
                      {isOpen ? 'Cerrar' : 'Conocer más'}
                    </button>
                  </div>
                </motion.article>
              );
            })}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {AGENTS_CATALOG.map((agent) => {
              const Icon = AGENT_ICONS[agent.id];
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => scrollTo('inicio')}
                  className="maru-panel text-left group p-5 hover:border-[var(--maru-primary)] hover:shadow-[var(--maru-shadow-md)] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--maru-primary)]"
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: agent.colorPrimary,
                        color: agent.colorAccent,
                        boxShadow: `0 8px 20px ${agent.colorPrimary}55`
                      }}
                    >
                      <Icon size={20} strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="font-display font-semibold text-[var(--maru-text)] group-hover:text-[var(--maru-gold)] transition-colors">
                        {agent.name}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--maru-gold-soft)]">
                        {agent.quechuaMeaning}
                      </div>
                      <p className="text-xs text-[var(--maru-text-muted)] leading-relaxed pt-1">
                        {agent.specialty}. {agent.catchphrase}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
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
