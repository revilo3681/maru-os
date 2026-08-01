import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CloudRain, Wind, Thermometer, AlertTriangle, Navigation,
  Map as MapIcon, Activity, Leaf, Droplets
} from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile } from '../../types';
import { ApiService } from '../../services/apiService';
import { PERU_SEED_DATA } from '../../data/seedPeru';
import { findCity, validateLocation } from '../../data/peruCities';
import { syncPachaWeather } from '../../services/knowledgeSync';

interface PachaViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

interface PeruContextData {
  weather?: {
    temperature?: number;
    humidity?: number;
    precip_mm?: number;
    condition?: string;
    source?: string;
    updated_at?: string;
    daily_report?: Array<{
      date: string;
      high?: number;
      low?: number;
      precip_mm?: number;
      weather_code?: number;
    }>;
    // legacy seed shapes
    temperatura?: string;
    sensacion?: string;
    humedad?: string;
  };
  huaico?: { riesgo?: string; actualizado?: string; risk_percent?: number; level?: string };
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

const DISTRICTS = [
  'Chosica', 'Ñaña', 'Santa Eulalia', 'Ricardo Palma',
  'Jicamarca', 'Huachipa', 'Carapongo', 'Cajamarquilla'
];

export const PachaView: React.FC<PachaViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const [peruData, setPeruData] = useState<PeruContextData | null>(null);
  const city = locationProfile.city || 'Chosica';
  const cityMeta = findCity(city);
  const locCheck = validateLocation(city, locationProfile.district);
  const seedWeather = PERU_SEED_DATA.weatherMap[city] || PERU_SEED_DATA.weatherMap['Chosica'];
  const huaico = PERU_SEED_DATA.huaicoMap[city] || PERU_SEED_DATA.huaicoMap['Chosica'];
  const districts = cityMeta?.districts || DISTRICTS;
  const lastWeatherKey = useRef('');

  useEffect(() => {
    const loadData = async () => {
      const data = await ApiService.getPeruData(city);
      if (!data) return;
      const typed = data as PeruContextData;
      setPeruData(typed);
      const w = typed.weather;
      const key = `${city}|${w?.temperature}|${w?.condition}|${w?.humidity}|${w?.source}`;
      if (key !== lastWeatherKey.current) {
        lastWeatherKey.current = key;
        syncPachaWeather({
          city,
          temperature: w?.temperature ?? seedWeather?.temperature,
          condition: w?.condition || seedWeather?.condition,
          humidity: w?.humidity ?? seedWeather?.humidity,
          precipMm: w?.precip_mm,
          source: w?.source || 'Semilla offline'
        });
      }
    };
    loadData();
    // refrescar cada 30 min si hay red
    const id = window.setInterval(loadData, 30 * 60 * 1000);
    return () => window.clearInterval(id);
    // seedWeather is derived from city; intentional deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const liveTemp = peruData?.weather?.temperature ?? seedWeather?.temperature;
  const liveHumidity = peruData?.weather?.humidity ?? seedWeather?.humidity;
  const livePrecip = peruData?.weather?.precip_mm ?? 0;
  const liveCondition = peruData?.weather?.condition ?? seedWeather?.condition ?? '—';
  const weatherSource = peruData?.weather?.source || 'Semilla offline';
  const dailyReport = peruData?.weather?.daily_report || [];

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

  // Celdas animadas: precipitación + calor relativo por distrito
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1200);
    return () => window.clearInterval(id);
  }, []);

  const heatCells = useMemo(() => {
    const base = (huaico?.riskPercent || 30) / 100;
    return Array.from({ length: 48 }, (_, i) => {
      const wave = Math.abs(Math.sin(i * 0.7 + base * 3 + tick * 0.35));
      const v = Math.min(1, wave * 0.55 + base * 0.45);
      const district = districts[i % districts.length];
      const precipMm = Math.round(Number(livePrecip) + v * 18);
      const tempC = Math.round(Number(liveTemp || 18) + (1 - v) * 4 - 2);
      return { v, district, precipMm, tempC, risk: v > 0.72 ? 'Alto' : v > 0.45 ? 'Moderado' : 'Bajo' };
    });
  }, [huaico?.riskPercent, tick, districts, livePrecip, liveTemp]);

  const mapStats = useMemo(() => {
    const avgPrecip = Math.round(heatCells.reduce((s, c) => s + c.precipMm, 0) / heatCells.length);
    const maxPrecip = Math.max(...heatCells.map((c) => c.precipMm));
    const avgTemp = Math.round(heatCells.reduce((s, c) => s + c.tempC, 0) / heatCells.length);
    const hotCells = heatCells.filter((c) => c.v > 0.7).length;
    return { avgPrecip, maxPrecip, avgTemp, hotCells };
  }, [heatCells]);

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
                <Navigation size={12} /> {city}, Perú · {weatherSource}
              </p>
              <p className={`text-[10px] mt-1 ${locCheck.districtOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                {locCheck.message}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]">
              <div className="text-[10px] uppercase text-[var(--maru-text-muted)] flex items-center gap-1"><Thermometer size={11} /> Temp</div>
              <div className="text-lg font-bold font-mono">{liveTemp ?? '—'}°C</div>
              <div className="text-[10px] text-[var(--maru-text-muted)]">{liveCondition}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]">
              <div className="text-[10px] uppercase text-[var(--maru-text-muted)] flex items-center gap-1"><Droplets size={11} /> Humedad</div>
              <div className="text-lg font-bold font-mono">{liveHumidity ?? '—'}%</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]">
              <div className="text-[10px] uppercase text-[var(--maru-text-muted)] flex items-center gap-1"><CloudRain size={11} /> Precip.</div>
              <div className="text-lg font-bold font-mono">{livePrecip ?? 0} mm</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]">
              <div className="text-[10px] uppercase text-[var(--maru-text-muted)]">AQI</div>
              <div className={`text-lg font-bold font-mono ${aqiColor}`}>{aqi}</div>
              <div className="text-[10px] text-[var(--maru-text-muted)]">{aqiLabel}</div>
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-[var(--maru-text)]">Reporte diario · {city}</h3>
            <p className="text-[11px] text-[var(--maru-text-muted)]">
              Fuente: {weatherSource}
              {peruData?.weather?.updated_at ? ` · actualizado ${peruData.weather.updated_at}` : ''}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(dailyReport.length
                ? dailyReport.map((d) => ({
                    day: d.date?.slice(5) || '—',
                    high: d.high ?? '—',
                    low: d.low ?? '—',
                    rain: d.precip_mm ?? 0,
                    icon: (d.precip_mm || 0) > 5 ? '🌧' : (d.high || 0) > 26 ? '☀️' : '⛅'
                  }))
                : FORECAST_DAYS
              ).map((d) => (
                <div key={String(d.day)} className="min-w-[72px] p-2.5 rounded-xl border border-[var(--maru-border-soft)] bg-white text-center">
                  <div className="text-[11px] font-bold text-[var(--maru-text-muted)]">{d.day}</div>
                  <div className="text-lg my-1">{'icon' in d ? d.icon : '🌤'}</div>
                  <div className="text-xs font-bold">{d.high}° / {d.low}°</div>
                  <div className="text-[10px] text-[#4A9B9D]">{d.rain} mm</div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] text-center">
              <AlertTriangle size={18} className="mx-auto text-[#B8924A] mb-1" />
              <div className="text-xl font-bold">{huaico?.riskPercent ?? 0}%</div>
              <div className="text-[10px] text-[var(--maru-text-muted)]">Huaico</div>
            </div>
            <div className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] text-center">
              <Wind size={18} className="mx-auto text-[#4A9B9D] mb-1" />
              <div className="text-xl font-bold">{liveHumidity ?? seedWeather?.humidity ?? '—'}%</div>
              <div className="text-[10px] text-[var(--maru-text-muted)]">Humedad</div>
            </div>
            <div className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] text-center">
              <Droplets size={18} className="mx-auto text-[#4A9B9D] mb-1" />
              <div className={`text-xl font-bold ${aqiColor}`}>{aqi}</div>
              <div className="text-[10px] text-[var(--maru-text-muted)]">ICA · {aqiLabel}</div>
            </div>
            <div className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] text-center">
              <Thermometer size={18} className="mx-auto text-[#4A9B9D] mb-1" />
              <div className="text-xl font-bold">{liveTemp ?? seedWeather?.temperature ?? '—'}°C</div>
              <div className="text-[10px] text-[var(--maru-text-muted)]">Temp</div>
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
              <MapIcon size={16} className="text-[#4A9B9D]" /> Mapa de precipitación / calor
            </h3>
            <p className="text-[11px] text-[var(--maru-text-muted)] leading-relaxed">
              Cada celda es una zona del valle (distrito). El color teal = lluvia (mm); el brillo naranja = calor / riesgo hidrológico.
              El mapa late para mostrar el frente de precipitación en movimiento.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-1">
              {[
                { label: 'Precip. media', value: `${mapStats.avgPrecip} mm`, icon: Droplets },
                { label: 'Pico lluvia', value: `${mapStats.maxPrecip} mm`, icon: CloudRain },
                { label: 'Temp. media', value: `${mapStats.avgTemp}°C`, icon: Thermometer },
                { label: 'Zonas alerta', value: String(mapStats.hotCells), icon: AlertTriangle }
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="p-2 rounded-lg bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]">
                    <div className="flex items-center gap-1 text-[10px] text-[var(--maru-text-muted)]">
                      <Icon size={11} /> {m.label}
                    </div>
                    <div className="text-sm font-bold font-mono text-[var(--maru-text)]">{m.value}</div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl border border-[var(--maru-border-soft)] overflow-hidden bg-[#0f241c] p-3 relative">
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 40%, rgba(90,200,250,0.25) 50%, transparent 60%)',
                  backgroundSize: '200% 100%',
                  animation: 'pachaSweep 3.5s linear infinite'
                }}
              />
              <div className="grid grid-cols-8 gap-1 relative z-10">
                {heatCells.map((cell, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-sm transition-colors duration-700 cursor-help"
                    style={{
                      backgroundColor: `rgba(${Math.round(74 + cell.v * 140)}, ${Math.round(155 - cell.v * 80)}, ${Math.round(157 - cell.v * 90)}, ${0.2 + cell.v * 0.8})`,
                      boxShadow: cell.v > 0.7 ? 'inset 0 0 0 1px rgba(255,140,80,0.7)' : undefined,
                      transform: cell.v > 0.75 ? 'scale(1.04)' : undefined
                    }}
                    title={`${cell.district}: ${cell.precipMm} mm · ${cell.tempC}°C · riesgo ${cell.risk}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-[10px] text-white/55 mt-2 font-mono relative z-10">
                <span>Bajo mm</span>
                <span>{city} · distrito / precipitación / calor</span>
                <span>Alto · alerta</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2 relative z-10">
                {districts.map((d) => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-white/70">
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <style>{`
              @keyframes pachaSweep {
                0% { background-position: 100% 0; }
                100% { background-position: -100% 0; }
              }
            `}</style>
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
