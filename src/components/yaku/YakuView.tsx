import React, { useMemo, useState } from 'react';
import { Landmark, Languages, BarChart3, MapPinned } from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile } from '../../types';
import { PERU_SEED_DATA } from '../../data/seedPeru';

interface YakuViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

const QUECHUA_DICT: Array<{ es: string; qu: string }> = [
  { es: 'hola', qu: 'napaykullayki' },
  { es: 'gracias', qu: 'sulpayki' },
  { es: 'agua', qu: 'yaku' },
  { es: 'sol', qu: 'inti' },
  { es: 'tierra', qu: 'pacha' },
  { es: 'camino', qu: 'ñan' },
  { es: 'amigo', qu: 'masi' },
  { es: 'casa', qu: 'wasi' },
  { es: 'comida', qu: 'mikhuna' },
  { es: 'salud', qu: 'qhali kay' },
  { es: 'emergencia', qu: 'utqay' },
  { es: 'buenos días', qu: 'allin p\'unchay' }
];

const CULTURE_SPOTS = [
  { name: 'Caral', region: 'Lima', era: '3000 a.C.', note: 'Ciudad sagrada más antigua de América' },
  { name: 'Chavín de Huántar', region: 'Áncash', era: '900 a.C.', note: 'Centro ceremonial andino' },
  { name: 'Machu Picchu', region: 'Cusco', era: 's. XV', note: 'Llaqta inka de montaña' },
  { name: 'Chan Chan', region: 'La Libertad', era: 's. IX–XV', note: 'Capital chimú de adobe' }
];

export const YakuView: React.FC<YakuViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const city = locationProfile.city || 'Chosica';
  const stats = PERU_SEED_DATA.ineiCities[city] || PERU_SEED_DATA.ineiCities['Lima'];
  const [phrase, setPhrase] = useState('hola');
  const [direction, setDirection] = useState<'es-qu' | 'qu-es'>('es-qu');

  const translation = useMemo(() => {
    const q = phrase.trim().toLowerCase();
    if (!q) return '';
    if (direction === 'es-qu') {
      const hit = QUECHUA_DICT.find((d) => d.es === q || q.includes(d.es));
      return hit ? hit.qu : 'Aún no tengo esa entrada. Pregúntale a Yaku en el chat.';
    }
    const hit = QUECHUA_DICT.find((d) => d.qu === q || q.includes(d.qu));
    return hit ? hit.es : 'Aún no tengo esa entrada. Pregúntale a Yaku en el chat.';
  }, [phrase, direction]);

  const cities = Object.entries(PERU_SEED_DATA.ineiCities);

  return (
    <div className="flex flex-col xl:flex-row h-full w-full overflow-y-auto xl:overflow-hidden bg-[var(--maru-bg)]">
      <div className="w-full xl:w-1/2 min-h-[620px] xl:min-h-0 border-b xl:border-b-0 xl:border-r border-[var(--maru-border-soft)] flex flex-col">
        <ChatView
          activeAgentId="yaku"
          onSelectAgent={() => {}}
          userProfile={userProfile}
          healthProfile={healthProfile}
          locationProfile={locationProfile}
        />
      </div>

      <div className="w-full xl:w-1/2 flex flex-col overflow-y-auto bg-[var(--maru-surface)] p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Landmark size={26} className="text-[#B8924A]" />
          <div>
            <h1 className="text-2xl font-display font-bold text-[var(--maru-text)]">Panel Yaku</h1>
            <p className="text-xs text-[var(--maru-text-muted)]">Datos Perú · cultura · quechua</p>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <BarChart3 size={16} className="text-[#1E3A5F]" /> INEI · {city}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Población', stats.population],
              ['Pobreza', stats.povertyRate],
              ['IDH', stats.idh],
              ['Agua potable', stats.waterAccess]
            ].map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)]">
                <div className="text-[10px] uppercase text-[var(--maru-text-muted)]">{k}</div>
                <div className="text-lg font-bold text-[var(--maru-text)]">{v}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-sm">Comparativa histórica (ciudades)</h3>
          <div className="space-y-2">
            {cities.map(([name, s]) => {
              const poverty = parseFloat(String(s.povertyRate));
              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold">{name}</span>
                    <span className="text-[var(--maru-text-muted)]">{s.povertyRate} pobreza</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--maru-surface-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#B8924A]"
                      style={{ width: `${Math.min(100, poverty * 2.8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <MapPinned size={16} className="text-[#4A9B9D]" /> Mapa cultural
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CULTURE_SPOTS.map((s) => (
              <div key={s.name} className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-white">
                <div className="font-bold text-sm">{s.name}</div>
                <div className="text-[11px] text-[var(--maru-text-muted)]">{s.region} · {s.era}</div>
                <div className="text-xs mt-1">{s.note}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Languages size={16} /> Traductor Quechua ↔ Español
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setDirection('es-qu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${direction === 'es-qu' ? 'bg-[var(--maru-primary)] text-white' : 'bg-[var(--maru-surface-muted)]'}`}
            >
              ES → QU
            </button>
            <button
              onClick={() => setDirection('qu-es')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${direction === 'qu-es' ? 'bg-[var(--maru-primary)] text-white' : 'bg-[var(--maru-surface-muted)]'}`}
            >
              QU → ES
            </button>
          </div>
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            className="maru-field"
            placeholder={direction === 'es-qu' ? 'Escribe en español…' : 'Qillqay runasimipi…'}
          />
          <div className="p-4 rounded-xl bg-[#1E3A5F] text-white">
            <div className="text-[10px] uppercase opacity-60 mb-1">Traducción</div>
            <div className="font-display text-xl font-bold">{translation}</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUECHUA_DICT.slice(0, 8).map((d) => (
              <button
                key={d.es}
                onClick={() => {
                  setDirection('es-qu');
                  setPhrase(d.es);
                }}
                className="text-[11px] px-2 py-1 rounded-lg border border-[var(--maru-border-soft)] hover:bg-[var(--maru-surface-muted)]"
              >
                {d.es}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
