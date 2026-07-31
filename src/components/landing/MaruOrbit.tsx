import type { CSSProperties } from 'react';

const logos = [
  { slug: 'googlegemini', name: 'Gemini' },
  { slug: 'claude', name: 'Claude' },
  { slug: 'meta', name: 'Meta' },
  { slug: 'mistralai', name: 'Mistral' },
  { slug: 'ollama', name: 'Ollama' },
  { slug: 'openai', name: 'ChatGPT' },
  { slug: 'deepseek', name: 'DeepSeek' },
];

const ORBIT_DURATION_S = 28;

interface MaruOrbitProps {
  className?: string;
  /** Nominal desktop diameter in px (scales down via max-width). */
  size?: number;
}

export function MaruOrbit({ className = '', size = 480 }: MaruOrbitProps) {
  return (
    <div
      className={`relative mx-auto select-none aspect-square ${className}`}
      style={{ width: size, maxWidth: 'min(100%, 92vw)' }}
      aria-label="MARU OS · ecosistema de modelos"
    >
      {/* Soft sky / gold halo */}
      <div
        className="pointer-events-none absolute inset-[8%] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(212,175,55,0.35) 0%, rgba(29,124,114,0.18) 42%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-[18%] rounded-full blur-2xl animate-maru-halo"
        style={{
          background:
            'radial-gradient(circle, rgba(90,200,250,0.22) 0%, rgba(212,175,55,0.12) 50%, transparent 72%)',
        }}
      />

      {/* Dashed orbit ring */}
      <div
        className="absolute inset-[12%] rounded-full border border-dashed border-white/55"
        style={{ boxShadow: '0 0 40px rgba(212,175,55,0.12)' }}
      />
      <div className="absolute inset-[8%] rounded-full border border-white/15" />

      {/* Center badge */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex w-[34%] aspect-square flex-col items-center justify-center rounded-full bg-white shadow-[0_12px_48px_rgba(11,33,63,0.18)]"
          style={{ border: '3px solid rgba(212,175,55,0.55)' }}
        >
          <span className="font-display text-base sm:text-xl font-extrabold tracking-[0.14em] text-[#0B213F]">
            MARU
          </span>
          <span className="mt-0.5 font-display text-[10px] sm:text-xs font-semibold tracking-[0.28em] text-[#1D7C72]">
            OS
          </span>
        </div>
      </div>

      {/* Orbiting logo pills */}
      {logos.map((logo, i) => {
        const delay = `-${(ORBIT_DURATION_S / logos.length) * i}s`;
        const spinnerStyle: CSSProperties = {
          animation: `maru-orbit ${ORBIT_DURATION_S}s linear infinite`,
          animationDelay: delay,
        };
        const counterStyle: CSSProperties = {
          animation: `maru-orbit-counter ${ORBIT_DURATION_S}s linear infinite`,
          animationDelay: delay,
        };

        return (
          <div key={logo.slug} className="absolute inset-0" style={spinnerStyle}>
            <div
              className="absolute left-1/2 top-[12%]"
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <div style={counterStyle}>
                <div className="flex items-center gap-2 rounded-full bg-white/95 px-2.5 py-1.5 shadow-[0_8px_24px_rgba(11,33,63,0.16)] ring-1 ring-black/5 backdrop-blur-sm sm:px-3 sm:py-2">
                  <img
                    src={`https://cdn.simpleicons.org/${logo.slug}`}
                    alt=""
                    width={18}
                    height={18}
                    className="h-3.5 w-3.5 object-contain sm:h-[18px] sm:w-[18px]"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="text-[10px] font-semibold tracking-wide text-[#0B213F]/85 sm:text-[11px]">
                    {logo.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
