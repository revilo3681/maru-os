import React, { useEffect, useState } from 'react';
import { Music2, Pause, Play, Waves, AudioLines, Droplets } from 'lucide-react';
import { AmbientLayerId, AmbientMusicService } from '../../services/ambientMusicService';

const LAYERS: { id: AmbientLayerId; label: string; icon: React.ReactNode }[] = [
  { id: 'river', label: 'Río', icon: <Waves size={14} /> },
  { id: 'birds', label: 'Aves', icon: <AudioLines size={14} /> },
  { id: 'waterfall', label: 'Cascada', icon: <Droplets size={14} /> }
];

export const AmbientMusicDock: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [master, setMaster] = useState(0.55);
  const [vols, setVols] = useState({ river: 0.45, birds: 0.35, waterfall: 0.25 });

  useEffect(() => {
    return () => AmbientMusicService.stop();
  }, []);

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
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-64 p-3 rounded-2xl bg-white/95 border border-[var(--maru-border-soft)] shadow-[var(--maru-shadow-md)] backdrop-blur space-y-3">
          <div className="text-xs font-bold text-[var(--maru-text)] flex items-center gap-2">
            <Music2 size={14} className="text-[#4A9B9D]" /> Ambiente andino local
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
              className="w-full accent-[#4A9B9D]"
            />
          </label>
          {LAYERS.map((layer) => (
            <label key={layer.id} className="flex items-center gap-2">
              <span className="w-16 text-[11px] text-[var(--maru-text-muted)] flex items-center gap-1">
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
                className="flex-1 accent-[#1E3A5F]"
              />
            </label>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="px-3 py-2 rounded-xl bg-white border border-[var(--maru-border-soft)] text-xs font-bold text-[var(--maru-text)] shadow-sm"
        >
          Mezcla
        </button>
        <button
          onClick={toggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-colors ${
            playing ? 'bg-[#4A9B9D] text-white' : 'bg-[var(--maru-primary)] text-white'
          }`}
          title={playing ? 'Pausar ambiente' : 'Reproducir ambiente'}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </div>
    </div>
  );
};
