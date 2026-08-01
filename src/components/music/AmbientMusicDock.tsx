import React, { useEffect, useRef, useState } from 'react';
import { Music2, Pause, Play, Waves, AudioLines, Droplets, Wind, Moon, X } from 'lucide-react';
import { AmbientLayerId, AmbientMusicService } from '../../services/ambientMusicService';

const LAYERS: { id: AmbientLayerId; label: string; icon: React.ReactNode }[] = [
  { id: 'river', label: 'Río', icon: <Waves size={13} /> },
  { id: 'birds', label: 'Aves', icon: <AudioLines size={13} /> },
  { id: 'nightbirds', label: 'Aves noche', icon: <Moon size={13} /> },
  { id: 'waterfall', label: 'Cascada', icon: <Droplets size={13} /> },
  { id: 'whitenoise', label: 'Ruido blanco', icon: <Wind size={13} /> }
];

export const AmbientMusicDock: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [master, setMaster] = useState(0.55);
  const [vols, setVols] = useState({
    river: 0.45,
    birds: 0.35,
    waterfall: 0.25,
    whitenoise: 0.15,
    nightbirds: 0.2
  });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => AmbientMusicService.stop();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = async () => {
    if (playing) {
      AmbientMusicService.stop();
      setPlaying(false);
    } else {
      await AmbientMusicService.play();
      setPlaying(true);
      setOpen(true);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none">
      {/* Panel flotante: no tapa el contenido debajo; se eleva y es compacto */}
      {open && (
        <div
          ref={panelRef}
          className="pointer-events-auto absolute bottom-16 right-0 w-[220px] max-h-[min(60vh,420px)] overflow-y-auto p-3 rounded-2xl bg-white/90 border border-[var(--maru-border-soft)] shadow-[0_12px_40px_rgba(15,23,36,0.18)] backdrop-blur-md space-y-2.5 animate-[maruFloatIn_0.2s_ease-out]"
        >
          <div className="text-xs font-bold text-[var(--maru-text)] flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Music2 size={13} className="text-[#4A9B9D]" /> Mezcla
            </span>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-md text-[var(--maru-text-muted)] hover:bg-[var(--maru-surface-muted)]"
              title="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wide text-[var(--maru-text-muted)]">Volumen general</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={master}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMaster(v);
                AmbientMusicService.setMasterVolume(v);
              }}
              className="w-full accent-[#4A9B9D] h-1.5"
            />
          </label>
          {LAYERS.map((layer) => (
            <label key={layer.id} className="flex items-center gap-2">
              <span className="w-[76px] text-[10px] text-[var(--maru-text-muted)] flex items-center gap-1 shrink-0">
                {layer.icon} {layer.label}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={vols[layer.id]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVols((prev) => ({ ...prev, [layer.id]: v }));
                  AmbientMusicService.setLayerVolume(layer.id, v);
                }}
                className="flex-1 accent-[#1E3A5F] h-1.5"
              />
            </label>
          ))}
          <p className="text-[9px] text-[var(--maru-text-muted)] leading-snug">
            Panel flotante · no bloquea el contenido. Esc para cerrar.
          </p>
        </div>
      )}

      <div className="pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="px-3 py-2 rounded-xl bg-white/90 backdrop-blur border border-[var(--maru-border-soft)] text-xs font-bold text-[var(--maru-text)] shadow-sm"
        >
          Mezcla
        </button>
        <button
          onClick={toggle}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-colors ${
            playing ? 'bg-[#4A9B9D] text-white' : 'bg-[var(--maru-primary)] text-white'
          }`}
          title={playing ? 'Pausar ambiente' : 'Reproducir ambiente'}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
      </div>

      <style>{`
        @keyframes maruFloatIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
