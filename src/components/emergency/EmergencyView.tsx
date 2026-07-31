import React, { useMemo, useState } from 'react';
import { ShieldAlert, PhoneCall, Navigation, MapPin, Waves, Mountain } from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile } from '../../types';
import { PERU_SEED_DATA } from '../../data/seedPeru';

interface EmergencyViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

type EmergencyType = 'huaico' | 'sismo' | 'incendio' | 'medico';

const EMERGENCY_NUMBERS = [
  { label: 'Policía Nacional', number: '105', hint: 'Seguridad ciudadana', color: 'text-blue-400' },
  { label: 'Bomberos', number: '116', hint: 'Incendios y rescate', color: 'text-red-400' },
  { label: 'SAMU', number: '106', hint: 'Emergencia médica', color: 'text-emerald-400' },
  { label: 'Defensa Civil', number: '115', hint: 'INDECI / desastres', color: 'text-amber-400' },
  { label: 'Serenazgo Lima', number: '0800-12-400', hint: 'Municipal', color: 'text-sky-300' },
  { label: 'Línea 113 Salud', number: '113', hint: 'MINSA orientación', color: 'text-teal-300' }
];

const PROTOCOLS: Record<EmergencyType, { title: string; steps: string[] }> = {
  huaico: {
    title: 'Protocolo huaico / inundación',
    steps: [
      'Sube a zona alta lejos de quebradas y ríos.',
      'No cruces corrientes ni puentes improvisados.',
      'Lleva documentos, agua y medicamentos esenciales.',
      'Dirígete a la zona segura más cercana y espera instrucciones.'
    ]
  },
  sismo: {
    title: 'Protocolo sismo',
    steps: [
      'Agáchate, cúbrete y sujétate bajo estructura firme.',
      'Aléjate de ventanas, estantes y tendido eléctrico.',
      'Cuando cese el movimiento, evacúa por rutas seguras.',
      'No uses ascensores; reúnete en la zona segura designada.'
    ]
  },
  incendio: {
    title: 'Protocolo incendio',
    steps: [
      'Cierra puertas al salir para limitar el fuego.',
      'Si hay humo, avanza agachado cubriendo nariz y boca.',
      'No regreses por objetos; llama a Bomberos 116.',
      'Reúnete en punto de encuentro exterior.'
    ]
  },
  medico: {
    title: 'Protocolo emergencia médica',
    steps: [
      'Llama a SAMU 106 e indica ubicación exacta.',
      'Comparte alergias y medicamentos del perfil MARU.',
      'No administres fármacos salvo indicación clara.',
      'Mantén vía aérea libre y monitorea consciencia.'
    ]
  }
};

export const EmergencyView: React.FC<EmergencyViewProps> = ({ userProfile, healthProfile, locationProfile }) => {
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('huaico');

  const city = locationProfile.city || 'Chosica';
  const huaico = PERU_SEED_DATA.huaicoMap[city] || PERU_SEED_DATA.huaicoMap['Chosica'];
  const safeZones = PERU_SEED_DATA.safeZones[city] || PERU_SEED_DATA.safeZones['Chosica'] || [];
  const protocol = PROTOCOLS[emergencyType];

  const contextNumbers = useMemo(() => {
    if (emergencyType === 'medico') return EMERGENCY_NUMBERS.filter((n) => ['106', '113'].includes(n.number));
    if (emergencyType === 'incendio') return EMERGENCY_NUMBERS.filter((n) => ['116', '105'].includes(n.number));
    if (emergencyType === 'sismo' || emergencyType === 'huaico') {
      return EMERGENCY_NUMBERS.filter((n) => ['115', '105', '116'].includes(n.number));
    }
    return EMERGENCY_NUMBERS;
  }, [emergencyType]);

  return (
    <div className="flex flex-col xl:flex-row h-full w-full overflow-y-auto xl:overflow-hidden bg-[var(--maru-bg)]">
      <div className="w-full xl:w-1/2 min-h-[620px] xl:min-h-0 border-b xl:border-b-0 xl:border-r border-[var(--maru-border-soft)] flex flex-col">
        <ChatView
          activeAgentId="tupac"
          onSelectAgent={() => {}}
          userProfile={userProfile}
          healthProfile={healthProfile}
          locationProfile={locationProfile}
        />
      </div>

      <div className="w-full xl:w-1/2 flex flex-col overflow-y-auto bg-[var(--maru-void)] text-white p-5 sm:p-7 space-y-6">
        <div className="flex flex-col items-center">
          <button
            onClick={() => setIsAlertActive(!isAlertActive)}
            className={`w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 transition-all ${
              isAlertActive
                ? 'bg-red-600 animate-pulse scale-105'
                : 'bg-[#4A1512] hover:bg-red-900 border-4 border-red-900/50'
            }`}
          >
            <ShieldAlert size={44} className={isAlertActive ? 'text-white' : 'text-red-500'} />
            <span className="font-bold text-lg tracking-widest">{isAlertActive ? 'ALERTA ACTIVA' : 'S.O.S'}</span>
            <span className="text-[10px] opacity-70">{isAlertActive ? 'Toca para desactivar' : 'Activar protocolo'}</span>
          </button>
          <p className="text-xs text-white/50 mt-3 flex items-center gap-1">
            <MapPin size={12} /> {city} · riesgo huaico {huaico?.riskPercent ?? 0}%
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-white/50">Tipo de emergencia</div>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['huaico', 'Huaico', Waves],
              ['sismo', 'Sismo', Mountain],
              ['incendio', 'Incendio', ShieldAlert],
              ['medico', 'Médica', PhoneCall]
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setEmergencyType(id)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm font-bold transition-colors ${
                  emergencyType === id
                    ? 'bg-red-600/30 border-red-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border border-red-500/40 bg-red-950/30 rounded-xl space-y-2">
          <h3 className="font-bold text-red-400 flex items-center gap-2">
            <Navigation size={18} /> {protocol.title}
          </h3>
          <ol className="space-y-1.5 text-sm text-white/80 list-decimal list-inside">
            {protocol.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-white/50">Llamadas rápidas</div>
          <div className="grid grid-cols-2 gap-2">
            {(isAlertActive ? contextNumbers : EMERGENCY_NUMBERS).map((n) => (
              <a
                key={n.number}
                href={`tel:${n.number.replace(/[^\d+]/g, '')}`}
                className="flex flex-col items-start p-3 rounded-xl bg-[#2C3E50] hover:bg-[#34495E] transition-colors border border-white/10 gap-1"
              >
                <span className={`flex items-center gap-2 font-bold ${n.color}`}>
                  <PhoneCall size={16} /> {n.number}
                </span>
                <span className="text-xs text-white/80">{n.label}</span>
                <span className="text-[10px] text-white/40">{n.hint}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-white/50">Zonas seguras · {city}</div>
          <div className="space-y-2">
            {safeZones.map((z) => (
              <div key={z.name} className="p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="font-bold text-sm">{z.name}</div>
                <div className="text-xs text-white/60">{z.address}</div>
                <div className="text-[11px] text-emerald-400 mt-1">≈ {z.dist}</div>
              </div>
            ))}
          </div>
        </div>

        {(healthProfile.allergies?.length || 0) > 0 && (
          <div className="p-3 rounded-xl bg-yellow-900/20 border border-yellow-700/50 text-yellow-400 text-xs">
            <span className="font-bold">Aviso de salud:</span> alergias{' '}
            {healthProfile.allergies.join(', ')}. Compártelo con rescatistas si activas S.O.S.
          </div>
        )}
      </div>
    </div>
  );
};
