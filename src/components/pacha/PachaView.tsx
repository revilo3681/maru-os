import React, { useEffect, useMemo, useState } from 'react';
import {
  CloudRain, Wind, Thermometer, AlertTriangle, Navigation,
  Map as MapIcon, Activity, Leaf, Droplets
} from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile } from '../../types';
import { ApiService } from '../../services/apiService';
import { PERU_SEED_DATA } from '../../data/seedPeru';

interface PachaViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

interface PeruContextData {
  weather?: { temperatura?: string; sensacion?: string; humedad?: string };
  huaico?: { riesgo?: string; actualizado?: string };
  sismo?: { magnitud?: string; referencia?: string; profundidad?: string };
}

const FORECAST_DAYS = [
  { day: 'Hoy', icon: '☀️', high: 23, low: 16, rain: 10 },
  { day: 'Mañana', icon: '🌤', high: 22, low: 15, rain: 20 },
  { day: 'Sáb', icon: '🌧', high: 19, low: 14, rain: 70 },
  { day: 'Dom', icon: '⛅', high: 21, low: 15, rain: 35 },
  { day: 'Lun', icon: '☀️', high: 24, low: 16, rain: 5 },
  { day: 'Mar', icon: '🌤', high: 23, low: 16, rain: 15 },
  { day: 'Mié', icon: '☁️', high: 20, low: 14, rain: 40 }
];

export const PachaView: React.FC<PachaViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const [peruData, setPeruData] = useState<PeruContextData | null>(null);
  const city = locationProfile.city || 'Chosica';
  const seedWeather = PERU_SEED_DATA.weatherMap[city] || PERU_SEED_DATA.weatherMap['Chosica'];
  const huaico = PERU_SEED_DATA.huaicoMap[city] || PERU_SEED_DATA.huaicoMap['Chosica'];

  useEffect(() => {
    const loadData = async () => {
      const data = await ApiService.getPeruData(city);
      if (data) setPeruData(data as PeruContextData);
    };
    loadData();
  }, [city]);

  const aqi = seedWeather?.aqi ?? 45;
  const aqiLabel = aqi <= 50 ? 'Bueno' : aqi <= 100 ? 'Moderado' : 'Dañino';
  const aqiColor = aqi <= 50 ? 'text-emerald-600' : aqi <= 100 ? 'text-amber-600' : 'text-red-600';

  const ecoTips = useMemo(
    () => [
      aqi > 80 ? 'Limita ejercicio intenso al aire libre hoy.' : 'Buen día para caminata o huerta urbana.',
      (huaico?.riskPercent || 0) > 60
        ? 'Evita quebradas; revisa desagües y rutas de evacuación.'
        : 'Riesgo hidrológico controlado; aprovecha para riego eficiente.',
      'Recoge agua de lluvia si hay pronóstico >50% el sábado.'
    ],
    [aqi, huaico]
  );

  // Heatmap cells — relative rain intensity by district mock
  const heatCells = Array.from({ length: 48 }, (_, i) => {
    const base = (huaico?.riskPercent || 30) / 100;
    const v = Math.min(1, Math.abs(Math.sin(i * 0.7 + base * 3)) * 0.55 + base * 0.45);
    return v;
  });

  return (
    <div className="flex flex-col xl:flex-row h-full w-full overflow-y-auto xl:overflow-hidden bg-[var(--maru-bg)]">
      <div className="w-full xl:w-1/2 min-h-[620px] xl:min-h-0 border-b xl:border-b-0 xl:border-r border-[var(--maru-border-soft)] flex flex-col">
        <ChatView
          activeAgentId="pacha"
          onSelectAgent={() => {}}
          userProfile={userProfile}
          healthProfile={healthProfile}
          locationProfile={locationProfile}
        />
      </div>

      <div className="w-full xl:w-1/2 flex flex-col overflow-y-auto bg-[var(--maru-surface)]">
        <div className="p-5 border-b border-[var(--maru-border-soft)] bg-gradient-to-br from-[#4A9B9D]/15 to-transparent">
          <div className="flex items-center gap-3 text-[#1E3A5F]">
            <CloudRain size={26} />
            <div>
              <h1 className="text-2xl font-display font-bold text-[var(--maru-text)]">Panel Pacha</h1>
              <p className="text-xs text-[var(--maru-text-muted)] flex items-center gap-1">
                <Navigation size={12} /> {city}, Perú · SENAMHI / IGP (offline seed)
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] text-center">
              <Thermometer size={18} className="mx-auto text-[#4A9B9D] mb-1" />
              <div className="text-xl font-bold">{peruData?.weather?.temperatura || `${seedWeather?.temperature ?? 22}°C`}</div>
              <div className="text-[10px] text-[var(--maru-text-muted)]">Temperatura</div>
            </div>
            <div className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] text-center">
              <Wind size={18} className="mx-auto text-[#4A9B9D] mb-1" />
              <div className="text-xl font-bold">{peruData?.weather?.humedad || `${seedWeather?.humidity ?? 68}%`}</div>
              <div className="text-[10px] text-[var(--maru-text-muted)]">Humedad</div>
            </div>
            <div className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] text-center">
              <Droplets size={18} className="mx-auto text-[#4A9B9D] mb-1" />
              <div className={`text-xl font-bold ${aqiColor}`}>{aqi}</div>
              <div className="text-[10px] text-[var(--maru-text-muted)]">ICA · {aqiLabel}</div>
            </div>
            <div className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] text-center">
              <AlertTriangle size={18} className="mx-auto text-[#B8924A] mb-1" />
              <div className="text-xl font-bold">{huaico?.riskPercent ?? 0}%</div>
              <div className="text-[10px] text-[var(--maru-text-muted)]">Huaico</div>
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-[var(--maru-text)]">Pronóstico 7 días</h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FORECAST_DAYS.map((d) => (
                <div key={d.day} className="min-w-[72px] p-2.5 rounded-xl border border-[var(--maru-border-soft)] bg-white text-center">
                  <div className="text-[11px] font-bold text-[var(--maru-text-muted)]">{d.day}</div>
                  <div className="text-lg my-1">{d.icon}</div>
                  <div className="text-xs font-bold">{d.high}° / {d.low}°</div>
                  <div className="text-[10px] text-[#4A9B9D]">{d.rain}% lluvia</div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
              <MapIcon size={16} className="text-[#4A9B9D]" /> Mapa de precipitación / calor
            </h3>
            <div className="rounded-xl border border-[var(--maru-border-soft)] overflow-hidden bg-[#1a3326] p-3">
              <div className="grid grid-cols-8 gap-1">
                {heatCells.map((v, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-sm"
                    style={{
                      backgroundColor: `rgba(74, 155, 157, ${0.15 + v * 0.85})`,
                      boxShadow: v > 0.7 ? 'inset 0 0 0 1px rgba(255,120,80,0.5)' : undefined
                    }}
                    title={`Intensidad ${(v * 100).toFixed(0)}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-white/50 mt-2 font-mono">
                <span>Bajo</span>
                <span>{city}</span>
                <span>Alto / calor</span>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
              <Leaf size={16} className="text-emerald-600" /> Recomendaciones ecológicas
            </h3>
            <ul className="space-y-2">
              {ecoTips.map((t) => (
                <li key={t} className="text-sm p-3 rounded-xl bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]">
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 flex gap-2">
            <Activity size={14} className="shrink-0 mt-0.5" />
            Último sismo IGP: {peruData?.sismo?.magnitud || PERU_SEED_DATA.sismoLatest.magnitude} ·{' '}
            {peruData?.sismo?.referencia || PERU_SEED_DATA.sismoLatest.epicenter}
          </div>
        </div>
      </div>
    </div>
  );
};
