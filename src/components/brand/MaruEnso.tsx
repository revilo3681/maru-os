import { useId, useState, type CSSProperties } from 'react';

/**
 * MaruEnso — the MARU OS brand mark.
 *
 * An open zen enso (hand-brushed ink/gold ring) embracing an Andean sunrise:
 * snowy peak, terraced hills, and a manantial (spring/river) flowing toward
 * the rising sun. Pure SVG, so it stays crisp from 40px to 480px and works
 * fully offline. All motion respects `prefers-reduced-motion`.
 */
export interface MaruEnsoProps {
  /** Diameter of the mark in px (orbit diameter when `withOrbit`). */
  size?: number;
  showName?: boolean;
  namePlacement?: 'below' | 'inside';
  /** Surround the enso with the orbiting AI-model badges. */
  withOrbit?: boolean;
  className?: string;
}

const ORBIT_DURATION_S = 28;

const MODELS: { slug: string | null; mark: string; name: string }[] = [
  { slug: 'googlegemini', mark: 'G', name: 'Gemini' },
  { slug: 'claude', mark: 'C', name: 'Claude' },
  { slug: 'meta', mark: 'M', name: 'Meta' },
  { slug: 'mistralai', mark: 'Mi', name: 'Mistral' },
  { slug: 'ollama', mark: 'O', name: 'Ollama' },
  // SimpleIcons no longer hosts the OpenAI glyph (404) — lettermark only.
  { slug: null, mark: 'AI', name: 'OpenAI' },
  { slug: 'deepseek', mark: 'D', name: 'DeepSeek' },
];

/** Orbit badge with a resilient icon: remote brand glyph, lettermark on error. */
function OrbitBadge({ slug, mark, name }: { slug: string | null; mark: string; name: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-[10px] bg-white/95 px-2.5 py-1.5 shadow-[0_8px_24px_rgba(11,33,63,0.16)] ring-1 ring-black/5 backdrop-blur-sm sm:px-3 sm:py-2">
      {broken || !slug ? (
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-[var(--maru-primary-soft)] px-1 text-[9px] font-bold text-[var(--maru-primary)]">
          {mark}
        </span>
      ) : (
        <img
          src={`https://cdn.simpleicons.org/${slug}`}
          alt=""
          width={18}
          height={18}
          loading="lazy"
          draggable={false}
          className="h-[18px] w-[18px] object-contain"
          onError={() => setBroken(true)}
        />
      )}
      <span className="text-[10px] font-semibold tracking-wide text-[#0B213F]/85 sm:text-[11px]">
        {name}
      </span>
    </div>
  );
}

/**
 * The enso core: Andean landscape clipped in a circle + open brush ring.
 * Fills its parent (parent controls sizing via width/aspect-square).
 */
function EnsoCore({ insideName = false }: { insideName?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `me-${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <div className="relative h-full w-full select-none">
      {/* Breathing halo behind everything */}
      <div
        className="animate-maru-halo-breathe pointer-events-none absolute -inset-[7%] rounded-full blur-xl"
        style={{
          background:
            'radial-gradient(circle, rgba(179,136,60,0.30) 30%, rgba(20,125,120,0.20) 58%, transparent 74%)',
        }}
      />

      {/* Landscape inside the circle */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <clipPath id={id('clip')}>
            <circle cx="100" cy="100" r="82" />
          </clipPath>
          <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f2750" />
            <stop offset="26%" stopColor="#3a3a6a" />
            <stop offset="44%" stopColor="#8a4f5f" />
            <stop offset="55%" stopColor="#cf7a44" />
            <stop offset="63%" stopColor="#f0ad55" />
            <stop offset="74%" stopColor="#f9d488" />
            <stop offset="100%" stopColor="#f6c46e" />
          </linearGradient>
          <radialGradient id={id('sunglow')}>
            <stop offset="0%" stopColor="#ffe9b3" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#ffd98a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffd98a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('river')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f6c46e" />
            <stop offset="38%" stopColor="#8fb8a8" />
            <stop offset="100%" stopColor="#2e7f7a" />
          </linearGradient>
          {/* Soft diagonal glint that drifts across the water */}
          <linearGradient id={id('glint')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="38%" stopColor="#fff3d0" stopOpacity="0" />
            <stop offset="50%" stopColor="#fff3d0" stopOpacity="0.16" />
            <stop offset="62%" stopColor="#fff3d0" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={id('vignette')}>
            <stop offset="62%" stopColor="#102b35" stopOpacity="0" />
            <stop offset="100%" stopColor="#102b35" stopOpacity="0.34" />
          </radialGradient>
        </defs>

        <g clipPath={url('clip')}>
          {/* Sky */}
          <rect x="18" y="18" width="164" height="164" fill={url('sky')} />

          {/* Stars */}
          <g fill="#fdf6e3">
            <circle cx="60" cy="40" r="0.9" opacity="0.85" />
            <circle cx="80" cy="30" r="0.7" opacity="0.6" />
            <circle cx="105" cy="36" r="1.1" opacity="0.9" />
            <circle cx="130" cy="44" r="0.8" opacity="0.7" />
            <circle cx="147" cy="60" r="0.7" opacity="0.55" />
            <circle cx="70" cy="55" r="0.6" opacity="0.5" />
            <circle cx="122" cy="26" r="0.9" opacity="0.8" />
            <circle cx="45" cy="52" r="0.7" opacity="0.6" />
          </g>

          {/* Rising sun + glow, sitting in the saddle of the far range */}
          <circle cx="112" cy="98" r="27" fill={url('sunglow')} />
          <circle cx="112" cy="98" r="9" fill="#ffdf96" />

          {/* Dawn clouds */}
          <ellipse cx="60" cy="80" rx="16" ry="3.4" fill="#f2a45f" opacity="0.5" />
          <ellipse cx="150" cy="72" rx="13" ry="2.8" fill="#e88f52" opacity="0.45" />

          {/* Far range (dusky) */}
          <path
            d="M18,112 L30,102 L44,107 L58,97 L74,105 L88,99 L100,105 L108,103 L118,104 L132,99 L146,106 L158,98 L170,105 L182,100 L182,140 L18,140 Z"
            fill="#4c3f66"
            opacity="0.92"
          />

          {/* Snowy peak (apu) */}
          <path d="M28,118 L52,64 L58,72 L64,68 L86,118 Z" fill="#6a5a86" />
          <path d="M35,118 L52,64 L58,72 L64,68 L86,118 L74,118 L62,92 L54,104 Z" fill="#544a72" opacity="0.6" />
          <path d="M48,74 L52,64 L58,72 L64,68 L68,78 L63,76 L58,81 L53,76 Z" fill="#f3f1ec" />

          {/* Mid range, warm sunlit */}
          <path
            d="M18,126 L40,98 L60,120 L78,94 L96,116 L112,106 L128,114 L148,96 L166,118 L182,108 L182,152 L18,152 Z"
            fill="#7c4a38"
          />
          <path d="M78,94 L96,116 L78,116 Z" fill="#d98e4f" opacity="0.55" />
          <path d="M148,96 L166,118 L148,118 Z" fill="#d98e4f" opacity="0.45" />

          {/* River — the manantial flowing from the saddle toward us */}
          <path
            d="M110,106 C106,116 114,124 109,134 C105,142 114,150 108,160 C104,167 112,172 108,180 L96,180 C102,170 92,164 98,154 C103,146 96,138 102,130 C107,122 102,114 106,106 Z"
            fill={url('river')}
          />
          {/* Sun reflection at the source */}
          <path d="M106,107 L110,107 L108,113 Z" fill="#ffe9b3" opacity="0.8" />
          {/* Flowing current line */}
          <path
            d="M108,109 C104,117 111,125 106,135 C102,143 110,151 105,160 C101,167 108,172 104,178"
            fill="none"
            stroke="#ffe9b3"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="5 9"
            opacity="0.65"
            className="animate-maru-water-flow"
          />

          {/* Terraced hills (andenes) */}
          <path d="M18,152 C40,140 60,144 78,154 L78,168 L18,168 Z" fill="#3f6247" />
          <path d="M24,152 C40,146 56,148 72,155" fill="none" stroke="#cfa75c" strokeWidth="1" opacity="0.45" />
          <path d="M22,158 C40,152 58,153 74,160" fill="none" stroke="#cfa75c" strokeWidth="1" opacity="0.35" />
          <path d="M124,154 C144,146 164,148 182,156 L182,168 L124,168 Z" fill="#35544a" />
          <circle cx="150" cy="155" r="0.8" fill="#ffd98a" opacity="0.85" />
          <circle cx="158" cy="158" r="0.7" fill="#ffd98a" opacity="0.7" />
          <circle cx="166" cy="154" r="0.8" fill="#ffd98a" opacity="0.8" />

          {/* Foreground ridge */}
          <path
            d="M18,168 C50,159 78,163 106,159 C140,154 164,159 182,165 L182,182 L18,182 Z"
            fill="#22343b"
          />

          {/* Figures in ponchos at the riverbank, looking toward the light */}
          <g fill="#15242b">
            <circle cx="76" cy="153.5" r="2.3" />
            <path d="M71.2,165.5 L76,154.8 L80.8,165.5 Z" />
            <circle cx="85" cy="151" r="2.6" />
            <path d="M79.6,165 L85,152.4 L90.4,165 Z" />
            <circle cx="94" cy="153.5" r="2.2" />
            <path d="M89.6,165 L94,154.8 L98.4,165 Z" />
            <circle cx="119" cy="152.5" r="2.4" />
            <path d="M114.2,165 L119,153.8 L123.8,165 Z" />
          </g>

          {/* Drifting light over the water — the shimmer */}
          <rect
            x="18"
            y="18"
            width="164"
            height="164"
            fill={url('glint')}
            className="animate-maru-water-glint"
            style={{ mixBlendMode: 'soft-light' }}
          />

          {/* Vignette for depth */}
          <circle cx="100" cy="100" r="82" fill={url('vignette')} />
        </g>

        {/* Fine rim keeping the landscape crisp against the page */}
        <circle cx="100" cy="100" r="82" fill="none" stroke="#102b35" strokeOpacity="0.28" strokeWidth="0.8" />
      </svg>

      {/* Open enso brush ring — draws in on mount, then rotates imperceptibly */}
      <svg
        viewBox="0 0 200 200"
        className="animate-maru-enso-spin pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={id('ink')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#96742e" />
            <stop offset="45%" stopColor="#c49a4a" />
            <stop offset="100%" stopColor="#2c3b41" />
          </linearGradient>
          {/* Grainy displacement = hand-painted edge */}
          <filter id={id('brush')} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" />
          </filter>
        </defs>
        <g filter={url('brush')}>
          {/* Main stroke: open arc, gap at the top-right (enso stays unclosed) */}
          <path
            d="M 182.7 69.9 A 88 88 0 1 1 130.1 17.3"
            fill="none"
            stroke={url('ink')}
            strokeWidth="7"
            strokeLinecap="round"
            pathLength={1}
            className="animate-maru-enso-stroke"
          />
          {/* Dry-brush companion stroke for texture */}
          <path
            d="M 181.2 72.5 A 86 86 0 1 1 129.5 19.6"
            fill="none"
            stroke={url('ink')}
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.35"
            pathLength={1}
            className="animate-maru-enso-stroke"
            style={{ animationDelay: '0.12s' }}
          />
          {/* Tapered flick where the brush lifts off */}
          <path
            d="M129,14.5 Q138,15.8 144.5,20.5 Q136,20.8 128.6,20.4 Z"
            fill="#856426"
            opacity="0.9"
            className="animate-maru-enso-appear"
          />
        </g>
      </svg>

      {insideName && (
        <div
          className="pointer-events-none absolute inset-x-0 flex flex-col items-center"
          style={{ top: '60%' }}
        >
          <span
            className="font-semibold leading-none text-[#faf6ec]"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '10.5cqw',
              letterSpacing: '0.26em',
              paddingLeft: '0.26em',
              textShadow: '0 2px 14px rgba(10,22,30,0.75), 0 0 4px rgba(10,22,30,0.5)',
            }}
          >
            MARU
          </span>
          <span
            className="font-display mt-[1.6cqw] font-semibold uppercase text-[#f0dfae]"
            style={{
              fontSize: '3.8cqw',
              letterSpacing: '0.42em',
              paddingLeft: '0.42em',
              textShadow: '0 1px 8px rgba(10,22,30,0.8)',
            }}
          >
            OS
          </span>
        </div>
      )}
    </div>
  );
}

export function MaruEnso({
  size = 280,
  showName = true,
  namePlacement = 'below',
  withOrbit = false,
  className = '',
}: MaruEnsoProps) {
  const insideName = showName && namePlacement === 'inside';
  const belowName = showName && namePlacement === 'below';

  if (withOrbit) {
    return (
      <div
        className={`relative mx-auto aspect-square select-none ${className}`}
        style={{ width: size, maxWidth: 'min(100%, 92vw)' }}
        aria-label="MARU OS · ecosistema de modelos"
      >
        {/* Ambient halos */}
        <div
          className="pointer-events-none absolute inset-[8%] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(179,136,60,0.28) 0%, rgba(20,125,120,0.22) 42%, transparent 70%)',
          }}
        />
        <div
          className="animate-maru-halo-breathe pointer-events-none absolute inset-[18%] rounded-full blur-2xl"
          style={{
            background:
              'radial-gradient(circle, rgba(20,125,120,0.22) 0%, rgba(179,136,60,0.12) 50%, transparent 72%)',
          }}
        />

        {/* Orbit rings */}
        <div
          className="absolute inset-[12%] rounded-full border border-dashed border-white/55"
          style={{ boxShadow: '0 0 40px rgba(212,175,55,0.12)' }}
        />
        <div className="absolute inset-[8%] rounded-full border border-white/15" />

        {/* Center — the enso with the landscape */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="aspect-square w-[54%]" style={{ containerType: 'size' }}>
            <EnsoCore insideName={insideName} />
          </div>
        </div>

        {/* Orbiting model badges */}
        {MODELS.map((model, i) => {
          const delay = `-${(ORBIT_DURATION_S / MODELS.length) * i}s`;
          const spinnerStyle: CSSProperties = {
            animation: `maru-orbit ${ORBIT_DURATION_S}s linear infinite`,
            animationDelay: delay,
          };
          const counterStyle: CSSProperties = {
            animation: `maru-orbit-counter ${ORBIT_DURATION_S}s linear infinite`,
            animationDelay: delay,
          };
          return (
            <div key={model.name} className="absolute inset-0" style={spinnerStyle}>
              <div
                className="absolute left-1/2 top-[12%]"
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                <div style={counterStyle}>
                  <OrbitBadge slug={model.slug} mark={model.mark} name={model.name} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <figure
      className={`m-0 flex flex-col items-center ${className}`}
      style={{ width: size, maxWidth: '100%' }}
      aria-label="MARU OS"
    >
      <div className="aspect-square w-full" style={{ containerType: 'size' }}>
        <EnsoCore insideName={insideName} />
      </div>
      {belowName && (
        <figcaption className="mt-[7%] text-center leading-none">
          <span
            className="block font-semibold text-[var(--maru-text)]"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: Math.max(15, size * 0.13),
              letterSpacing: '0.3em',
              paddingLeft: '0.3em',
            }}
          >
            MARU
          </span>
          <span
            className="font-display mt-1.5 block font-semibold uppercase text-[var(--maru-primary)]"
            style={{
              fontSize: Math.max(8, size * (size >= 220 ? 0.032 : 0.045)),
              letterSpacing: size >= 220 ? '0.24em' : '0.4em',
              paddingLeft: size >= 220 ? '0.24em' : '0.4em',
            }}
          >
            {size >= 220 ? 'Sistema Operativo Cognitivo' : 'OS'}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
