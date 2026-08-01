import React, { useEffect, useMemo, useState } from 'react';
import {
  Heart, RefreshCw, Share2, Quote, Settings2, Bookmark, X, Trash2
} from 'lucide-react';

interface FraseItem {
  text: string;
  author: string;
}

type FraseTheme = 'void-gold' | 'andes-dawn' | 'rio-teal' | 'ink-paper';
type FraseFont = 'serif' | 'display' | 'mono' | 'sans';

interface FrasePrefs {
  theme: FraseTheme;
  font: FraseFont;
}

const FRASE_POOL: FraseItem[] = [
  { text: 'El conocimiento es el manantial del alma.', author: 'Sabiduría Andina' },
  { text: 'No te juzga. Te entiende. No te invada. Te protege.', author: 'Manifiesto MARU' },
  { text: 'Ama llulla, ama suwa, ama qilla (No seas mentiroso, ni ladrón, ni ocioso).', author: 'Principio Inca' },
  { text: 'El equilibrio no se encuentra, se cultiva cada mañana.', author: 'Sumaq' },
  { text: 'Cuidar la salud es honrar el templo de la vida.', author: 'Aya' },
  { text: 'En la armonía con la Pachamama reside la verdadera paz.', author: 'Pacha' }
];

const FAV_KEY = 'maru_frase_favorites';
const PREFS_KEY = 'maru_frase_prefs';

const THEMES: Record<FraseTheme, { label: string; style: React.CSSProperties; text: string; muted: string; accent: string }> = {
  'void-gold': {
    label: 'Vacío dorado',
    style: {
      background:
        'radial-gradient(ellipse 70% 90% at 85% 15%, rgba(212,175,55,0.35), transparent 50%),' +
        'radial-gradient(ellipse 50% 60% at 10% 90%, rgba(74,155,157,0.25), transparent 55%),' +
        'linear-gradient(145deg, #0c1118 0%, #1a2332 45%, #0f1724 100%)'
    },
    text: '#ffffff',
    muted: '#d9c18d',
    accent: '#D4AF37'
  },
  'andes-dawn': {
    label: 'Amanecer andino',
    style: {
      background:
        'radial-gradient(ellipse 80% 70% at 20% 0%, rgba(255,180,100,0.45), transparent 55%),' +
        'linear-gradient(160deg, #2c1810 0%, #5c2e1a 40%, #1e3a5f 100%)'
    },
    text: '#FFF8F0',
    muted: '#F0C9A0',
    accent: '#FFB86B'
  },
  'rio-teal': {
    label: 'Río manantial',
    style: {
      background:
        'radial-gradient(circle at 80% 20%, rgba(90,200,250,0.3), transparent 45%),' +
        'linear-gradient(135deg, #0a2e2f 0%, #1E3A5F 50%, #4A9B9D 100%)'
    },
    text: '#F4FFFE',
    muted: '#A8E4E2',
    accent: '#5AC8FA'
  },
  'ink-paper': {
    label: 'Tinta & papel',
    style: {
      background:
        'linear-gradient(180deg, #f7f1e6 0%, #efe6d5 50%, #e8dcc6 100%)'
    },
    text: '#1E3A5F',
    muted: '#6B5B4A',
    accent: '#8B6914'
  }
};

const FONTS: Record<FraseFont, { label: string; className: string }> = {
  serif: { label: 'Serif', className: 'font-serif italic' },
  display: { label: 'Display', className: 'font-display font-semibold' },
  mono: { label: 'Mono', className: 'font-mono' },
  sans: { label: 'Sans', className: 'font-sans font-medium' }
};

function loadFavorites(): FraseItem[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (raw) return JSON.parse(raw) as FraseItem[];
  } catch { /* ignore */ }
  return [];
}

function loadPrefs(): FrasePrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { theme: 'void-gold', font: 'serif', ...JSON.parse(raw) } as FrasePrefs;
  } catch { /* ignore */ }
  return { theme: 'void-gold', font: 'serif' };
}

function fraseKey(f: FraseItem) {
  return `${f.text}::${f.author}`;
}

export const FraseDelDia: React.FC = () => {
  const dayIndex = useMemo(() => {
    const d = new Date();
    return (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % FRASE_POOL.length;
  }, []);

  const [index, setIndex] = useState(dayIndex);
  const [favorites, setFavorites] = useState<FraseItem[]>(() => loadFavorites());
  const [prefs, setPrefs] = useState<FrasePrefs>(() => loadPrefs());
  const [copied, setCopied] = useState(false);
  const [showFavs, setShowFavs] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  const currentFrase = FRASE_POOL[index];
  const theme = THEMES[prefs.theme];
  const font = FONTS[prefs.font];
  const isSaved = favorites.some((f) => fraseKey(f) === fraseKey(currentFrase));

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const handleNext = () => setIndex((prev) => (prev + 1) % FRASE_POOL.length);

  const toggleSave = () => {
    setFavorites((prev) => {
      const key = fraseKey(currentFrase);
      if (prev.some((f) => fraseKey(f) === key)) {
        return prev.filter((f) => fraseKey(f) !== key);
      }
      return [currentFrase, ...prev];
    });
  };

  const removeFavorite = (item: FraseItem) => {
    setFavorites((prev) => prev.filter((f) => fraseKey(f) !== fraseKey(item)));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`"${currentFrase.text}" — ${currentFrase.author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative overflow-hidden rounded-[var(--maru-radius-lg)] border border-white/10 p-5 sm:p-6 shadow-[var(--maru-shadow-sm)]"
      style={theme.style}
    >
      {/* Capas animadas de atmósfera */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-1/3 -right-1/4 w-[70%] h-[70%] rounded-full blur-3xl opacity-40 animate-[maruDrift_12s_ease-in-out_infinite]"
          style={{ background: `radial-gradient(circle, ${theme.accent}66, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-1/3 -left-1/4 w-[60%] h-[60%] rounded-full blur-3xl opacity-30 animate-[maruDrift_16s_ease-in-out_infinite_reverse]"
          style={{ background: `radial-gradient(circle, ${theme.accent}44, transparent 70%)` }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(105deg, transparent, transparent 18px, currentColor 18px, currentColor 19px)',
            color: theme.text
          }}
        />
      </div>

      <Quote
        className="absolute -right-2 -bottom-2 opacity-10"
        size={120}
        style={{ color: theme.accent }}
      />

      <div className="relative z-10 space-y-3">
        <div
          className="flex items-center justify-between text-xs font-mono uppercase tracking-wider"
          style={{ color: theme.accent }}
        >
          <span>Frase del Día</span>
          <span className="opacity-80">MARU OS</span>
        </div>

        <p
          className={`text-xl sm:text-2xl leading-relaxed max-w-3xl transition-all duration-500 ${font.className}`}
          style={{ color: theme.text }}
        >
          &ldquo;{currentFrase.text}&rdquo;
        </p>

        <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
          <span className="text-xs font-mono" style={{ color: theme.muted }}>
            — {currentFrase.author}
          </span>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              onClick={toggleSave}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: isSaved ? '#FB7185' : theme.muted }}
              title={isSaved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            >
              <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={() => { setShowFavs((v) => !v); setShowPrefs(false); }}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: showFavs ? theme.accent : theme.muted }}
              title="Ver favoritos"
            >
              <Bookmark size={16} />
            </button>

            <button
              onClick={() => { setShowPrefs((v) => !v); setShowFavs(false); }}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: showPrefs ? theme.accent : theme.muted }}
              title="Fondo y tipografía"
            >
              <Settings2 size={16} />
            </button>

            <button
              onClick={handleNext}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: theme.muted }}
              title="Siguiente frase"
            >
              <RefreshCw size={16} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: theme.muted }}
              title="Compartir frase"
            >
              <Share2 size={16} />
            </button>
            {copied && (
              <span className="text-[10px] font-mono" style={{ color: theme.accent }}>
                Copiado
              </span>
            )}
          </div>
        </div>

        {showPrefs && (
          <div
            className="mt-2 p-3 rounded-xl border space-y-3"
            style={{
              borderColor: `${theme.accent}44`,
              background: prefs.theme === 'ink-paper' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.25)'
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: theme.accent }}>
                Apariencia
              </span>
              <button onClick={() => setShowPrefs(false)} style={{ color: theme.muted }}>
                <X size={14} />
              </button>
            </div>
            <div>
              <div className="text-[10px] mb-1.5 uppercase" style={{ color: theme.muted }}>Fondo</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(THEMES) as FraseTheme[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setPrefs((p) => ({ ...p, theme: key }))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      prefs.theme === key ? 'ring-2 ring-offset-1' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: `${THEMES[key].accent}66`,
                      color: theme.text,
                      background: prefs.theme === key ? `${theme.accent}33` : 'transparent'
                    }}
                  >
                    {THEMES[key].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] mb-1.5 uppercase" style={{ color: theme.muted }}>Fuente</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(FONTS) as FraseFont[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setPrefs((p) => ({ ...p, font: key }))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] border ${FONTS[key].className} ${
                      prefs.font === key ? 'ring-2' : 'opacity-80'
                    }`}
                    style={{
                      borderColor: `${theme.accent}66`,
                      color: theme.text,
                      background: prefs.font === key ? `${theme.accent}33` : 'transparent'
                    }}
                  >
                    {FONTS[key].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showFavs && (
          <div
            className="mt-2 p-3 rounded-xl border space-y-2 max-h-56 overflow-y-auto"
            style={{
              borderColor: `${theme.accent}44`,
              background: prefs.theme === 'ink-paper' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.25)'
            }}
          >
            <div className="flex items-center justify-between sticky top-0">
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: theme.accent }}>
                Favoritos ({favorites.length})
              </span>
              <button onClick={() => setShowFavs(false)} style={{ color: theme.muted }}>
                <X size={14} />
              </button>
            </div>
            {favorites.length === 0 ? (
              <p className="text-xs py-2" style={{ color: theme.muted }}>
                Aún no hay frases guardadas. Toca el corazón para guardar.
              </p>
            ) : (
              favorites.map((f) => (
                <div
                  key={fraseKey(f)}
                  className="flex items-start gap-2 p-2 rounded-lg"
                  style={{ background: prefs.theme === 'ink-paper' ? 'rgba(30,58,95,0.06)' : 'rgba(255,255,255,0.06)' }}
                >
                  <button
                    className="flex-1 text-left"
                    onClick={() => {
                      const idx = FRASE_POOL.findIndex((p) => fraseKey(p) === fraseKey(f));
                      if (idx >= 0) setIndex(idx);
                      setShowFavs(false);
                    }}
                  >
                    <p className={`text-sm leading-snug ${font.className}`} style={{ color: theme.text }}>
                      &ldquo;{f.text}&rdquo;
                    </p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: theme.muted }}>
                      — {f.author}
                    </p>
                  </button>
                  <button
                    onClick={() => removeFavorite(f)}
                    className="p-1.5 rounded-md hover:bg-white/10 shrink-0"
                    style={{ color: theme.muted }}
                    title="Eliminar favorito"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes maruDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-6%, 4%) scale(1.08); }
        }
      `}</style>
    </div>
  );
};
