import React, { useMemo, useState } from 'react';
import {
  HeartPulse, Pill, Thermometer, Brain, CalendarClock,
  Activity, Check, Plus, Apple
} from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import { UserProfile, HealthProfile, LocationProfile, Medication } from '../../types';
import { StorageService } from '../../services/storageService';

interface HealthViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
}

const CHRONIC_OPTIONS = [
  'Anemia ferropénica',
  'Diabetes mellitus tipo 2',
  'Hipertensión arterial',
  'Hipertensión arterial (controlada)',
  'Asma bronquial',
  'Hipotiroidismo',
  'Gastritis / Úlcera',
  'Enfermedad renal crónica'
];

const VITALS_KEY = 'maru_vitals_log';
const PILL_TAKEN_KEY = 'maru_pill_taken';

interface VitalEntry {
  id: string;
  label: string;
  value: string;
  unit: string;
  at: string;
}

const RECIPE_SEED = [
  { name: 'Quinua con verduras', kcal: 320, tags: ['sin maní', 'hierro'] },
  { name: 'Sopa de zapallo y avena', kcal: 210, tags: ['suave', 'cena'] },
  { name: 'Ensalada de lentejas', kcal: 280, tags: ['proteína', 'fibra'] }
];

function loadVitals(): VitalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(VITALS_KEY) || '[]');
  } catch {
    return [];
  }
}

function loadPillTaken(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(PILL_TAKEN_KEY) || '{}');
  } catch {
    return {};
  }
}

export const HealthView: React.FC<HealthViewProps> = ({ userProfile, healthProfile: initialHealth, locationProfile }) => {
  const [activeTab, setActiveTab] = useState<'aya' | 'sumaq'>('aya');
  const [health, setHealth] = useState<HealthProfile>(() => initialHealth || StorageService.getHealth());
  const [vitals, setVitals] = useState<VitalEntry[]>(() => {
    const existing = loadVitals();
    if (existing.length) return existing;
    return [
      { id: 'v1', label: 'Presión', value: '118/76', unit: 'mmHg', at: 'Hoy 08:10' },
      { id: 'v2', label: 'Glucosa', value: '102', unit: 'mg/dL', at: 'Hoy 07:45' },
      { id: 'v3', label: 'Peso', value: '72.4', unit: 'kg', at: 'Ayer' }
    ];
  });
  const [pillTaken, setPillTaken] = useState<Record<string, boolean>>(() => loadPillTaken());
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');

  const appointments = useMemo(
    () => StorageService.getCalendarEvents().filter((e) => e.type === 'appointment' || e.type === 'medication').slice(0, 4),
    []
  );

  const persistHealth = (next: HealthProfile) => {
    setHealth(next);
    StorageService.saveHealth(next);
  };

  const toggleCondition = (condition: string) => {
    const has = health.chronicConditions.includes(condition);
    const chronicConditions = has
      ? health.chronicConditions.filter((c) => c !== condition)
      : [...health.chronicConditions, condition];
    persistHealth({ ...health, chronicConditions });
  };

  const togglePill = (medId: string) => {
    const next = { ...pillTaken, [medId]: !pillTaken[medId] };
    setPillTaken(next);
    localStorage.setItem(PILL_TAKEN_KEY, JSON.stringify(next));
  };

  const addMedication = () => {
    if (!newMedName.trim()) return;
    const med: Medication = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      dose: newMedDose.trim() || 'según indicación',
      frequency: 'Diario'
    };
    persistHealth({ ...health, currentMedications: [...health.currentMedications, med] });
    setNewMedName('');
    setNewMedDose('');
  };

  const addVital = () => {
    const entry: VitalEntry = {
      id: `v-${Date.now()}`,
      label: 'SatO₂',
      value: '98',
      unit: '%',
      at: 'Ahora'
    };
    const next = [entry, ...vitals].slice(0, 8);
    setVitals(next);
    localStorage.setItem(VITALS_KEY, JSON.stringify(next));
  };

  return (
    <div className="flex flex-col xl:flex-row h-full w-full overflow-y-auto xl:overflow-hidden bg-[var(--maru-bg)]">
      <div className="w-full xl:w-1/2 min-h-[620px] xl:min-h-0 border-b xl:border-b-0 xl:border-r border-[var(--maru-border-soft)] flex flex-col">
        <div className="flex items-center gap-2 p-2 border-b border-[#E3DCCB] bg-white">
          <button
            onClick={() => setActiveTab('aya')}
            className={`flex-1 p-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'aya' ? 'bg-[var(--maru-primary)] text-white' : 'bg-[var(--maru-surface-muted)] text-[var(--maru-text-muted)] hover:bg-white'}`}
          >
            Aya · Salud
          </button>
          <button
            onClick={() => setActiveTab('sumaq')}
            className={`flex-1 p-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'sumaq' ? 'bg-[var(--maru-primary)] text-white' : 'bg-[var(--maru-surface-muted)] text-[var(--maru-text-muted)] hover:bg-white'}`}
          >
            Sumaq · Bienestar
          </button>
        </div>
        <div className="flex-1 relative min-h-0">
          <ChatView
            activeAgentId={activeTab}
            onSelectAgent={() => {}}
            userProfile={userProfile}
            healthProfile={health}
            locationProfile={locationProfile}
          />
        </div>
      </div>

      <div className="w-full xl:w-1/2 flex flex-col overflow-y-auto bg-[var(--maru-surface)] p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3 text-[#1E3A5F]">
          {activeTab === 'aya' ? <HeartPulse size={26} className="text-red-500" /> : <Apple size={26} className="text-[#4A9B9D]" />}
          <div>
            <h1 className="text-2xl font-display font-bold text-[var(--maru-text)]">
              {activeTab === 'aya' ? 'Panel Aya' : 'Panel Sumaq'}
            </h1>
            <p className="text-xs text-[var(--maru-text-muted)]">
              {activeTab === 'aya'
                ? 'Pastillero, condiciones crónicas y signos vitales'
                : 'Nutrición, hábitos y recetas seguras para tu perfil'}
            </p>
          </div>
        </div>

        {activeTab === 'aya' ? (
          <>
            <section className="space-y-3">
              <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                <Thermometer size={16} className="text-orange-500" /> Condiciones crónicas
              </h3>
              <div className="flex flex-wrap gap-2">
                {CHRONIC_OPTIONS.map((c) => {
                  const on = health.chronicConditions.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => toggleCondition(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        on
                          ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                          : 'bg-[var(--maru-surface-muted)] text-[var(--maru-text-muted)] border-[var(--maru-border-soft)]'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                <Pill size={16} className="text-blue-500" /> Pastillero de hoy
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {health.currentMedications.map((med) => {
                  const taken = !!pillTaken[med.id || med.name];
                  return (
                    <button
                      key={med.id || med.name}
                      onClick={() => togglePill(med.id || med.name)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        taken
                          ? 'border-[#34C759]/50 bg-[#34C759]/10'
                          : 'border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[var(--maru-text)]">{med.name}</span>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${taken ? 'bg-[#34C759] text-white' : 'bg-white border border-[var(--maru-border-soft)]'}`}>
                          {taken ? <Check size={14} /> : null}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--maru-text-muted)] mt-1">{med.dose} · {med.frequency}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="Medicamento"
                  className="maru-field flex-1 min-w-[120px] !text-xs"
                />
                <input
                  value={newMedDose}
                  onChange={(e) => setNewMedDose(e.target.value)}
                  placeholder="Dosis"
                  className="maru-field w-28 !text-xs"
                />
                <button onClick={addMedication} className="maru-btn-primary !min-h-9 px-3 text-xs">
                  <Plus size={14} /> Añadir
                </button>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                  <Activity size={16} className="text-[#C0392B]" /> Signos vitales
                </h3>
                <button onClick={addVital} className="text-xs font-bold text-[var(--maru-primary)]">Registrar SatO₂</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {vitals.slice(0, 3).map((v) => (
                  <div key={v.id} className="p-3 rounded-xl bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)] text-center">
                    <div className="text-[10px] uppercase tracking-wide text-[var(--maru-text-muted)]">{v.label}</div>
                    <div className="text-lg font-bold text-[var(--maru-text)]">{v.value}</div>
                    <div className="text-[10px] text-[var(--maru-text-muted)]">{v.unit} · {v.at}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                <CalendarClock size={16} className="text-[#B8924A]" /> Próximas citas / tomas
              </h3>
              <div className="space-y-2">
                {appointments.length === 0 && (
                  <p className="text-xs text-[var(--maru-text-muted)]">Sin eventos en calendario.</p>
                )}
                {appointments.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--maru-border-soft)] bg-white">
                    <div>
                      <div className="font-bold text-sm text-[var(--maru-text)]">{ev.title}</div>
                      <div className="text-[11px] text-[var(--maru-text-muted)]">{ev.time} · {ev.type}</div>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--maru-text-muted)]">{ev.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-sm text-[var(--maru-text)]">Alergias · historial</h3>
              <div className="flex flex-wrap gap-2">
                {(health.allergies || []).map((allergy) => (
                  <span key={allergy} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200">
                    {allergy}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-[var(--maru-text-muted)] font-mono">
                Tipo sanguíneo {health.bloodType} · Contacto: {health.emergencyContact}
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="p-4 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Brain size={16} /> Estado de bienestar
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Sueño promedio</span><span className="font-bold">6.5 h</span></div>
                <div className="flex justify-between"><span>Estrés</span><span className="font-bold text-orange-500">Moderado</span></div>
                <div className="flex justify-between"><span>Hidratación hoy</span><span className="font-bold">4 / 8 vasos</span></div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                <Apple size={16} className="text-[#4A9B9D]" /> Recetas seguras (sin alergias)
              </h3>
              <div className="space-y-2">
                {RECIPE_SEED.map((r) => (
                  <div key={r.name} className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-white">
                    <div className="flex justify-between gap-2">
                      <span className="font-bold text-sm">{r.name}</span>
                      <span className="text-xs text-[var(--maru-text-muted)]">{r.kcal} kcal</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[var(--maru-surface-muted)] text-[var(--maru-text-muted)]">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[var(--maru-text-muted)]">
                Filtrado contra alergias: {(health.allergies || []).join(', ') || 'ninguna registrada'}.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
