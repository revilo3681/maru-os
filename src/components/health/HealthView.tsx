import React, { useEffect, useMemo, useState } from 'react';
import {
  HeartPulse, Pill, Thermometer, Brain, CalendarClock,
  Activity, Check, Plus, Apple, AlertTriangle, Camera, Trash2, Clock,
  BookOpen, Search, User, X
} from 'lucide-react';
import { ChatView } from '../chat/ChatView';
import {
  UserProfile, HealthProfile, LocationProfile, Medication,
  MedForm, MedDoseUnit, HabitFrequencyMode
} from '../../types';
import { StorageService } from '../../services/storageService';
import { getAiPanelEvents, notifyPanelChange } from '../../services/knowledgeSync';
import { COMMON_MEDICATIONS, findMedInteractions, MedCatalogEntry } from '../../data/medicationsCatalog';

/** Heurística simple de exceso de dosis */
function isOverdoseRisk(med: Pick<Medication, 'dose' | 'pillsPerDose' | 'doseAmount' | 'doseUnit'>): boolean {
  if ((med.pillsPerDose ?? 0) >= 4) return true;
  if (med.doseAmount != null && med.doseUnit) {
    const n = med.doseAmount;
    const unit = med.doseUnit;
    if (unit === 'g' && n >= 2) return true;
    if (unit === 'mg' && n >= 2000) return true;
    if (unit === 'comp' && n >= 4) return true;
  }
  const m = med.dose.match(/(\d+(?:[.,]\d+)?)\s*(mg|g|comp|tab|caps?)/i);
  if (!m) return false;
  const n = parseFloat(m[1].replace(',', '.'));
  const unit = m[2].toLowerCase();
  if (unit === 'g' && n >= 2) return true;
  if (unit === 'mg' && n >= 2000) return true;
  if (['comp', 'tab', 'cap', 'caps'].includes(unit) && n >= 4) return true;
  return false;
}

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

const MED_FORMS: MedForm[] = ['pastilla', 'jarabe', 'gotas', 'inyeccion', 'crema', 'otro'];
const DOSE_UNITS: MedDoseUnit[] = ['mg', 'ml', 'g', 'mcg', 'UI', 'cucharada', 'comp', 'gota'];
const FREQ_MODES: { value: HabitFrequencyMode; label: string }[] = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekdays', label: 'Lun–Vie' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'always', label: 'Continuo' },
  { value: 'custom_days', label: 'Días custom' }
];

const VITALS_KEY = 'maru_vitals_log';
const PILL_TAKEN_KEY = 'maru_pill_taken';
const AI_EVENTS_KEY = 'maru_health_ai_events';

interface VitalEntry {
  id: string;
  label: string;
  value: string;
  unit: string;
  at: string;
}

interface AiHealthEvent {
  at: string;
  text: string;
}

interface UpcomingItem {
  id: string;
  title: string;
  time: string;
  date: string;
  kind: 'appointment' | 'toma' | 'medication' | 'routine';
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

function loadAiEvents(): AiHealthEvent[] {
  const universal = getAiPanelEvents(40)
    .filter((e) => e.domain === 'health' || e.agentId === 'aya' || e.agentId === 'sumaq')
    .map((e) => ({ at: e.at, text: e.text }));
  if (universal.length) return universal;
  try {
    return JSON.parse(localStorage.getItem(AI_EVENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function pushAiEvent(text: string): AiHealthEvent[] {
  notifyPanelChange({ domain: 'health', summary: text, agentId: 'aya' });
  return loadAiEvents();
}

function formatElapsed(iso?: string): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'hace unos segundos';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function nextScheduleCountdown(times: string[] | undefined, lastTakenAt?: string): string | null {
  if (!times?.length) return formatElapsed(lastTakenAt);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const candidates = times
    .map((t) => {
      const [hh, mm] = t.split(':').map(Number);
      const d = new Date(`${today}T${String(hh).padStart(2, '0')}:${String(mm || 0).padStart(2, '0')}:00`);
      return d;
    })
    .filter((d) => d.getTime() > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime());

  if (candidates.length) {
    const diff = candidates[0].getTime() - now.getTime();
    const mins = Math.ceil(diff / 60000);
    if (mins < 60) return `próxima en ${mins}m`;
    return `próxima en ${Math.floor(mins / 60)}h ${mins % 60}m`;
  }
  return formatElapsed(lastTakenAt) || 'todas las tomas de hoy pasaron';
}

function dosesExpectedToday(med: Medication): number {
  const times = med.scheduleTimes?.length ? med.scheduleTimes.length : 1;
  const mode = med.frequencyMode || 'daily';
  const dow = new Date().getDay();
  if (mode === 'weekdays' && (dow === 0 || dow === 6)) return 0;
  if (mode === 'weekly') return times > 0 ? 1 : 0;
  return times;
}

function buildDoseLabel(amount: string, unit: MedDoseUnit, pills: number, form: MedForm): string {
  const amt = amount.trim();
  if (amt) return `${amt} ${unit}${pills > 1 ? ` · ${pills} u/toma` : ''} · ${form}`;
  return `según indicación · ${form}`;
}

export const HealthView: React.FC<HealthViewProps> = ({ userProfile, healthProfile: initialHealth, locationProfile }) => {
  const [activeTab, setActiveTab] = useState<'aya' | 'sumaq'>('aya');
  const [health, setHealth] = useState<HealthProfile>(() => initialHealth || StorageService.getHealth());
  const [vitals, setVitals] = useState<VitalEntry[]>(() => loadVitals());
  const [pillTaken, setPillTaken] = useState<Record<string, boolean>>(() => loadPillTaken());
  const [tick, setTick] = useState(0);
  const [customCondition, setCustomCondition] = useState('');
  const [aiNotices, setAiNotices] = useState<string[]>([]);
  const [aiEvents, setAiEvents] = useState<AiHealthEvent[]>(() => loadAiEvents());
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [useCustomName, setUseCustomName] = useState(false);

  const [blockDisease, setBlockDisease] = useState('');
  const [newMedName, setNewMedName] = useState('');
  const [newMedForm, setNewMedForm] = useState<MedForm>('pastilla');
  const [newMedAmount, setNewMedAmount] = useState('');
  const [newMedUnit, setNewMedUnit] = useState<MedDoseUnit>('mg');
  const [newMedPurpose, setNewMedPurpose] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00');
  const [newMedTime2, setNewMedTime2] = useState('');
  const [newMedDuration, setNewMedDuration] = useState('');
  const [newMedStart, setNewMedStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [newMedEnd, setNewMedEnd] = useState('');
  const [newMedFreq, setNewMedFreq] = useState<HabitFrequencyMode>('daily');
  const [newMedPills, setNewMedPills] = useState('1');
  const [pendingRecipeFor, setPendingRecipeFor] = useState<string | null>(null);
  const [pendingRecipeDataUrl, setPendingRecipeDataUrl] = useState<string | null>(null);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  const upcomingItems = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const events = StorageService.getCalendarEvents()
      .filter((e) => e.date >= today)
      .filter((e) => e.type === 'appointment' || e.type === 'medication' || e.type === 'routine')
      .map((e): UpcomingItem => ({
        id: e.id,
        title: e.title,
        time: e.time,
        date: e.date,
        kind: e.type === 'appointment' ? 'appointment' : e.type === 'medication' ? 'medication' : 'routine'
      }));

    const tomas: UpcomingItem[] = [];
    for (const med of health.currentMedications) {
      if (dosesExpectedToday(med) === 0) continue;
      for (const t of med.scheduleTimes?.length ? med.scheduleTimes : ['08:00']) {
        tomas.push({
          id: `toma-${med.id}-${t}`,
          title: `Toma: ${med.name}`,
          time: t,
          date: today,
          kind: 'toma'
        });
      }
    }

    return [...events, ...tomas]
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 8);
  }, [health.currentMedications]);

  const catalogFiltered = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return COMMON_MEDICATIONS.slice(0, 40);
    return COMMON_MEDICATIONS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.className.toLowerCase().includes(q) ||
        m.useFor.toLowerCase().includes(q)
    ).slice(0, 60);
  }, [catalogQuery]);

  const nameSuggestions = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!q || useCustomName) return [];
    return COMMON_MEDICATIONS.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 8);
  }, [nameQuery, useCustomName]);

  const recordHealthActivity = (text: string) => {
    setAiEvents(pushAiEvent(text));
  };

  const persistHealth = (next: HealthProfile, activity?: string) => {
    setHealth(next);
    StorageService.saveHealth(next); // rebuilds core health/profile graph nodes
    if (activity) recordHealthActivity(activity);
  };

  const toggleCondition = (condition: string) => {
    const has = health.chronicConditions.includes(condition);
    const chronicConditions = has
      ? health.chronicConditions.filter((c) => c !== condition)
      : [...health.chronicConditions, condition];
    persistHealth(
      { ...health, chronicConditions },
      has ? `Quitó condición: ${condition}` : `Añadió condición: ${condition}`
    );
  };

  const addCustomCondition = () => {
    const c = customCondition.trim();
    if (!c) return;
    if (health.chronicConditions.includes(c)) {
      setCustomCondition('');
      return;
    }
    persistHealth(
      { ...health, chronicConditions: [...health.chronicConditions, c] },
      `Añadió condición personalizada: ${c}`
    );
    setCustomCondition('');
  };

  const markTaken = (med: Medication) => {
    const key = med.id || med.name;
    const nextTaken = !pillTaken[key];
    const nextMap = { ...pillTaken, [key]: nextTaken };
    setPillTaken(nextMap);
    localStorage.setItem(PILL_TAKEN_KEY, JSON.stringify(nextMap));

    if (nextTaken) {
      const now = new Date().toISOString();
      persistHealth(
        {
          ...health,
          currentMedications: health.currentMedications.map((m) =>
            m.id === med.id ? { ...m, lastTakenAt: now } : m
          )
        },
        `Marcó tomada: ${med.name}`
      );
    }
  };

  const medBlocks = useMemo(() => {
    const map = new Map<string, Medication[]>();
    for (const med of health.currentMedications) {
      const key = med.condition?.trim() || 'General';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(med);
    }
    return Array.from(map.entries());
  }, [health.currentMedications]);

  const attachRecipe = (medId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      persistHealth(
        {
          ...health,
          currentMedications: health.currentMedications.map((m) =>
            m.id === medId ? { ...m, recipePhotoDataUrl: dataUrl } : m
          )
        },
        'Adjuntó foto de receta médica'
      );
      setPendingRecipeFor(null);
    };
    reader.readAsDataURL(file);
  };

  const applyCatalogEntry = (entry: MedCatalogEntry) => {
    setNewMedName(entry.name);
    setNameQuery(entry.name);
    setUseCustomName(false);
    setNewMedAmount(entry.usualDose);
    setNewMedUnit((DOSE_UNITS.includes(entry.unit as MedDoseUnit) ? entry.unit : 'mg') as MedDoseUnit);
    setNewMedPurpose(entry.useFor);
    setShowCatalog(false);
    setShowNameDropdown(false);
  };

  const resetMedForm = () => {
    setEditingMedId(null);
    setNewMedName('');
    setNameQuery('');
    setUseCustomName(false);
    setNewMedForm('pastilla');
    setNewMedAmount('');
    setNewMedUnit('mg');
    setNewMedPurpose('');
    setNewMedTime('08:00');
    setNewMedTime2('');
    setNewMedDuration('');
    setNewMedEnd('');
    setNewMedFreq('daily');
    setNewMedPills('1');
    setPendingRecipeDataUrl(null);
  };

  const addMedication = () => {
    if (!newMedName.trim()) return;
    const disease = blockDisease.trim() || 'General';
    const times = [newMedTime, newMedTime2].filter(Boolean) as string[];
    const pills = Math.max(1, parseInt(newMedPills, 10) || 1);
    const amountNum = parseFloat(newMedAmount.replace(',', '.'));
    const durationDays = newMedDuration ? Math.max(1, parseInt(newMedDuration, 10) || 0) || undefined : undefined;
    let endDate = newMedEnd || undefined;
    if (!endDate && durationDays && newMedStart) {
      const d = new Date(newMedStart);
      d.setDate(d.getDate() + durationDays);
      endDate = d.toISOString().slice(0, 10);
    }

    const med: Medication = {
      id: editingMedId || `med-${Date.now()}`,
      name: newMedName.trim(),
      dose: buildDoseLabel(newMedAmount, newMedUnit, pills, newMedForm),
      frequency: times.length
        ? `${times.join(' · ')} · ${FREQ_MODES.find((f) => f.value === newMedFreq)?.label || 'Diario'}`
        : FREQ_MODES.find((f) => f.value === newMedFreq)?.label || 'Diario',
      condition: disease,
      scheduleTimes: times.length ? times : ['08:00'],
      startDate: newMedStart || undefined,
      endDate,
      durationDays,
      pillsPerDose: pills,
      form: newMedForm,
      doseAmount: Number.isFinite(amountNum) ? amountNum : undefined,
      doseUnit: newMedUnit,
      purpose: newMedPurpose.trim() || undefined,
      frequencyMode: newMedFreq
    };

    if (pendingRecipeDataUrl) med.recipePhotoDataUrl = pendingRecipeDataUrl;

    const risk = isOverdoseRisk(med);
    if (risk && !med.recipePhotoDataUrl && editingMedId) {
      const existing = health.currentMedications.find((m) => m.id === editingMedId);
      if (existing?.recipePhotoDataUrl) med.recipePhotoDataUrl = existing.recipePhotoDataUrl;
    }
    if (risk && !med.recipePhotoDataUrl) {
      setPendingRecipeFor(med.id);
      window.alert('Posible exceso de dosis: adjunta la foto de la receta médica para continuar con seguridad.');
    }

    const existingNames = health.currentMedications
      .filter((m) => m.id !== med.id)
      .map((m) => m.name);
    const warnings = findMedInteractions(med.name, existingNames);
    if (warnings.length) {
      const tip = `⚠️ Interacciones posibles con ${med.name}:\n${warnings.join('\n')}`;
      window.alert(tip);
      setAiNotices((prev) => [tip, ...prev].slice(0, 8));
      recordHealthActivity(`Alerta de interacción: ${med.name}`);
    }

    const rest = health.currentMedications.filter((m) => m.id !== med.id);
    persistHealth(
      { ...health, currentMedications: [...rest, med] },
      editingMedId ? `Actualizó medicamento: ${med.name}` : `Añadió medicamento: ${med.name} (${disease})`
    );
    resetMedForm();
  };

  const removeMedication = (id: string) => {
    const med = health.currentMedications.find((m) => m.id === id);
    persistHealth(
      {
        ...health,
        currentMedications: health.currentMedications.filter((m) => m.id !== id)
      },
      med ? `Eliminó medicamento: ${med.name}` : 'Eliminó un medicamento'
    );
  };

  const startEditMed = (med: Medication) => {
    setEditingMedId(med.id);
    setBlockDisease(med.condition || '');
    setNewMedName(med.name);
    setNameQuery(med.name);
    setUseCustomName(!COMMON_MEDICATIONS.some((c) => c.name.toLowerCase() === med.name.toLowerCase()));
    setNewMedForm(med.form || 'pastilla');
    setNewMedAmount(med.doseAmount != null ? String(med.doseAmount) : '');
    setNewMedUnit(med.doseUnit || 'mg');
    setNewMedPurpose(med.purpose || '');
    setNewMedTime(med.scheduleTimes?.[0] || '08:00');
    setNewMedTime2(med.scheduleTimes?.[1] || '');
    setNewMedDuration(med.durationDays != null ? String(med.durationDays) : '');
    setNewMedStart(med.startDate || new Date().toISOString().slice(0, 10));
    setNewMedEnd(med.endDate || '');
    setNewMedFreq(med.frequencyMode || 'daily');
    setNewMedPills(String(med.pillsPerDose || 1));
    setPendingRecipeDataUrl(med.recipePhotoDataUrl || null);
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
    recordHealthActivity('Registró SatO₂');
  };

  return (
    <div className="flex flex-col xl:flex-row h-full w-full overflow-y-auto xl:overflow-hidden bg-[var(--maru-bg)]">
      <div className="w-full xl:w-1/2 min-h-[620px] xl:min-h-0 border-b xl:border-b-0 xl:border-r border-[var(--maru-border-soft)] flex flex-col">
        {aiNotices.length > 0 && (
          <div className="p-2 border-b border-[#E3DCCB] bg-[#C0392B]/8 space-y-1 max-h-28 overflow-y-auto">
            {aiNotices.slice(0, 3).map((n, i) => (
              <div key={i} className="text-[11px] text-[#C0392B] flex gap-2 items-start">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{n}</span>
                <button
                  type="button"
                  className="ml-auto shrink-0 text-[var(--maru-text-muted)]"
                  onClick={() => setAiNotices((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Cerrar aviso"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
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
                ? 'Pastillero, condiciones crónicas e información del paciente'
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
                {health.chronicConditions
                  .filter((c) => !CHRONIC_OPTIONS.includes(c))
                  .map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleCondition(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-[#1E3A5F] text-white border-[#1E3A5F]"
                    >
                      {c}
                    </button>
                  ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addCustomCondition();
                  }}
                  placeholder="Otra condición…"
                  className="maru-field flex-1 !text-xs"
                />
                <button type="button" onClick={addCustomCondition} className="maru-btn-primary !min-h-9 px-3 text-xs">
                  <Plus size={14} /> Añadir
                </button>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                  <Pill size={16} className="text-blue-500" /> Medicamentos por enfermedad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCatalog(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--maru-primary)] px-2 py-1 rounded-lg hover:bg-white border border-transparent hover:border-[var(--maru-border-soft)]"
                >
                  <BookOpen size={14} /> Catálogo
                </button>
              </div>

              {medBlocks.length === 0 && (
                <p className="text-xs text-[var(--maru-text-muted)]">
                  Crea un bloque (enfermedad) y añade medicamentos con forma, dosis y horarios.
                </p>
              )}

              {medBlocks.map(([disease, meds]) => (
                <div key={disease} className="rounded-xl border border-[var(--maru-border-soft)] bg-white overflow-hidden">
                  <div className="px-3 py-2 bg-[#1E3A5F] text-white text-xs font-bold uppercase tracking-wide">
                    {disease}
                  </div>
                  <div className="p-2 space-y-2">
                    {meds.map((med) => {
                      const key = med.id || med.name;
                      const taken = !!pillTaken[key];
                      const risk = isOverdoseRisk(med);
                      const needsRecipe = risk && !med.recipePhotoDataUrl;
                      const expected = dosesExpectedToday(med);
                      const statusLabel = expected === 0
                        ? 'Hoy no aplica'
                        : taken
                          ? 'Completado hoy'
                          : 'Pendiente hoy';
                      // `tick` refreshes cronómetros cada 30s
                      const timerLabel = tick >= 0
                        ? nextScheduleCountdown(med.scheduleTimes, med.lastTakenAt)
                        : null;
                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-xl border ${
                            needsRecipe
                              ? 'border-[#C0392B] bg-[#C0392B]/5'
                              : taken
                                ? 'border-[#34C759]/50 bg-[#34C759]/10'
                                : 'border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => markTaken(med)}
                              className="text-left flex-1 min-w-0"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${taken ? 'bg-[#34C759] text-white' : 'bg-white border border-[var(--maru-border-soft)]'}`}>
                                  {taken ? <Check size={12} /> : null}
                                </span>
                                <span className="font-bold text-sm text-[var(--maru-text)]">{med.name}</span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${taken ? 'bg-[#34C759]/20 text-[#1B7A3D]' : 'bg-white text-[var(--maru-text-muted)]'}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--maru-text-muted)] mt-1 pl-7">
                                {med.dose}
                                {med.form ? ` · ${med.form}` : ''}
                                {med.purpose ? ` · ${med.purpose}` : ''}
                              </div>
                              <div className="text-[10px] font-mono text-[var(--maru-text-muted)] mt-0.5 pl-7 flex flex-wrap items-center gap-1">
                                <Clock size={10} />
                                {(med.scheduleTimes || []).join(' · ') || med.frequency}
                                {med.durationDays ? ` · ${med.durationDays}d` : ''}
                                {med.startDate && (
                                  <span>
                                    · {med.startDate}
                                    {med.endDate ? ` → ${med.endDate}` : ' → continuo'}
                                  </span>
                                )}
                              </div>
                              {timerLabel && (
                                <div className="text-[10px] text-[var(--maru-primary)] mt-1 pl-7 font-bold">
                                  {timerLabel}
                                </div>
                              )}
                            </button>
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditMed(med)}
                                className="text-[10px] font-bold text-[var(--maru-primary)] px-2 py-1 rounded-md hover:bg-white"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => removeMedication(med.id)}
                                className="p-1.5 rounded-md text-[#C0392B] hover:bg-red-50"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {risk && (
                            <div className="mt-2 flex items-start gap-2 text-[11px] text-[#C0392B] bg-[#C0392B]/10 rounded-lg px-2 py-1.5">
                              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                              <span>
                                Posible exceso de dosis. {needsRecipe
                                  ? 'Debes adjuntar la foto de la receta médica.'
                                  : 'Receta adjunta ✓'}
                              </span>
                            </div>
                          )}
                          {(needsRecipe || pendingRecipeFor === med.id || med.recipePhotoDataUrl) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-[var(--maru-border-soft)] text-[11px] font-bold cursor-pointer hover:bg-[var(--maru-surface-muted)]">
                                <Camera size={13} />
                                {med.recipePhotoDataUrl ? 'Cambiar receta' : 'Subir receta'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) attachRecipe(med.id, f);
                                  }}
                                />
                              </label>
                              {med.recipePhotoDataUrl && (
                                <img
                                  src={med.recipePhotoDataUrl}
                                  alt="Receta"
                                  className="h-12 rounded-md border border-[var(--maru-border-soft)] object-cover"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="p-3 rounded-xl border border-dashed border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] space-y-2">
                <div className="text-[11px] font-bold uppercase text-[var(--maru-text-muted)]">
                  {editingMedId ? 'Editar medicamento' : 'Nuevo bloque / medicamento'}
                </div>
                <input
                  value={blockDisease}
                  onChange={(e) => setBlockDisease(e.target.value)}
                  placeholder="Enfermedad / bloque (ej. Anemia, Gripe)"
                  className="maru-field !text-xs"
                  list="chronic-list"
                />
                <datalist id="chronic-list">
                  {[...CHRONIC_OPTIONS, ...health.chronicConditions].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>

                <div className="relative">
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={useCustomName ? newMedName : nameQuery || newMedName}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (useCustomName) {
                          setNewMedName(v);
                        } else {
                          setNameQuery(v);
                          setNewMedName(v);
                          setShowNameDropdown(true);
                        }
                      }}
                      onFocus={() => !useCustomName && setShowNameDropdown(true)}
                      placeholder={useCustomName ? 'Nombre personalizado' : 'Buscar medicamento…'}
                      className="maru-field flex-1 min-w-[140px] !text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomName((u) => !u);
                        setShowNameDropdown(false);
                      }}
                      className="maru-btn-secondary !min-h-9 px-3 text-xs"
                    >
                      {useCustomName ? 'Catálogo' : 'Otro'}
                    </button>
                  </div>
                  {showNameDropdown && nameSuggestions.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-lg border border-[var(--maru-border-soft)] bg-white shadow-sm">
                      {nameSuggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--maru-surface-muted)] border-b border-[var(--maru-border-soft)] last:border-0"
                          onClick={() => applyCatalogEntry(s)}
                        >
                          <span className="font-bold">{s.name}</span>
                          <span className="text-[var(--maru-text-muted)]"> · {s.usualDose}{s.unit} · {s.useFor}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={newMedForm}
                    onChange={(e) => setNewMedForm(e.target.value as MedForm)}
                    className="maru-field w-28 !text-xs"
                    title="Forma"
                  >
                    {MED_FORMS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <input
                    value={newMedAmount}
                    onChange={(e) => setNewMedAmount(e.target.value)}
                    placeholder="Cantidad"
                    className="maru-field w-20 !text-xs"
                  />
                  <select
                    value={newMedUnit}
                    onChange={(e) => setNewMedUnit(e.target.value as MedDoseUnit)}
                    className="maru-field w-24 !text-xs"
                  >
                    {DOSE_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newMedPills}
                    onChange={(e) => setNewMedPills(e.target.value)}
                    title="Unidades por toma"
                    className="maru-field w-16 !text-xs"
                  />
                </div>

                <input
                  value={newMedPurpose}
                  onChange={(e) => setNewMedPurpose(e.target.value)}
                  placeholder="Para qué sirve / propósito"
                  className="maru-field !text-xs"
                />

                <div className="flex flex-wrap gap-2 items-center">
                  <label className="text-[10px] text-[var(--maru-text-muted)] flex items-center gap-1">
                    Hora 1
                    <input type="time" value={newMedTime} onChange={(e) => setNewMedTime(e.target.value)} className="maru-field !w-auto !text-xs font-mono" />
                  </label>
                  <label className="text-[10px] text-[var(--maru-text-muted)] flex items-center gap-1">
                    Hora 2
                    <input type="time" value={newMedTime2} onChange={(e) => setNewMedTime2(e.target.value)} className="maru-field !w-auto !text-xs font-mono" />
                  </label>
                  <label className="text-[10px] text-[var(--maru-text-muted)] flex items-center gap-1">
                    Días
                    <input
                      type="number"
                      min={1}
                      value={newMedDuration}
                      onChange={(e) => setNewMedDuration(e.target.value)}
                      placeholder="duración"
                      className="maru-field w-16 !text-xs"
                    />
                  </label>
                  <select
                    value={newMedFreq}
                    onChange={(e) => setNewMedFreq(e.target.value as HabitFrequencyMode)}
                    className="maru-field w-28 !text-xs"
                    title="Frecuencia"
                  >
                    {FREQ_MODES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <label className="text-[10px] text-[var(--maru-text-muted)] flex items-center gap-1">
                    Desde
                    <input type="date" value={newMedStart} onChange={(e) => setNewMedStart(e.target.value)} className="maru-field !w-auto !text-xs" />
                  </label>
                  <label className="text-[10px] text-[var(--maru-text-muted)] flex items-center gap-1">
                    Hasta
                    <input type="date" value={newMedEnd} onChange={(e) => setNewMedEnd(e.target.value)} className="maru-field !w-auto !text-xs" />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={addMedication} className="maru-btn-primary !min-h-9 px-3 text-xs">
                    <Plus size={14} /> {editingMedId ? 'Guardar cambios' : 'Añadir al bloque'}
                  </button>
                  {editingMedId && (
                    <button type="button" onClick={resetMedForm} className="maru-btn-secondary !min-h-9 px-3 text-xs">
                      Cancelar
                    </button>
                  )}
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--maru-border-soft)] bg-white text-[11px] font-bold cursor-pointer">
                    <Camera size={13} /> Receta
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (editingMedId) {
                          attachRecipe(editingMedId, f);
                          return;
                        }
                        if (pendingRecipeFor) {
                          attachRecipe(pendingRecipeFor, f);
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setPendingRecipeDataUrl(reader.result as string);
                        reader.readAsDataURL(f);
                      }}
                    />
                  </label>
                  {pendingRecipeDataUrl && !editingMedId && (
                    <img src={pendingRecipeDataUrl} alt="Receta pendiente" className="h-10 rounded-md border border-[var(--maru-border-soft)] object-cover" />
                  )}
                </div>
                <p className="text-[10px] text-[var(--maru-text-muted)]">
                  Si la dosis parece excesiva, MARU exige la foto de la receta médica. Al guardar se revisan interacciones y se actualiza el grafo de conocimiento.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                  <User size={16} className="text-[#C0392B]" /> Información del paciente
                </h3>
                <button onClick={addVital} className="text-xs font-bold text-[var(--maru-primary)]">+ SatO₂ opcional</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)] text-center">
                  <div className="text-[10px] uppercase tracking-wide text-[var(--maru-text-muted)]">Edad</div>
                  <div className="text-lg font-bold text-[var(--maru-text)]">{userProfile.age || '—'}</div>
                  <div className="text-[10px] text-[var(--maru-text-muted)]">años</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)] text-center">
                  <div className="text-[10px] uppercase tracking-wide text-[var(--maru-text-muted)]">Altura</div>
                  <div className="text-lg font-bold text-[var(--maru-text)]">{userProfile.heightCm || '—'}</div>
                  <div className="text-[10px] text-[var(--maru-text-muted)]">cm</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)] text-center">
                  <div className="text-[10px] uppercase tracking-wide text-[var(--maru-text-muted)]">Peso</div>
                  <div className="text-lg font-bold text-[var(--maru-text)]">{userProfile.weightKg || '—'}</div>
                  <div className="text-[10px] text-[var(--maru-text-muted)]">kg</div>
                </div>
              </div>
              {vitals.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-[var(--maru-text-muted)] flex items-center gap-1">
                    <Activity size={12} /> Registro vital opcional
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vitals.slice(0, 4).map((v) => (
                      <div key={v.id} className="px-2.5 py-1.5 rounded-lg bg-white border border-[var(--maru-border-soft)] text-[11px]">
                        <span className="font-bold">{v.label}</span> {v.value}{v.unit} · {v.at}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                <CalendarClock size={16} className="text-[#B8924A]" /> Próximas citas / tomas
              </h3>
              <div className="space-y-2">
                {upcomingItems.length === 0 && (
                  <p className="text-xs text-[var(--maru-text-muted)]">Sin eventos ni tomas próximas.</p>
                )}
                {upcomingItems.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--maru-border-soft)] bg-white">
                    <div>
                      <div className="font-bold text-sm text-[var(--maru-text)]">{ev.title}</div>
                      <div className="text-[11px] text-[var(--maru-text-muted)]">
                        {ev.time} · {ev.kind === 'toma' ? 'toma' : ev.kind}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--maru-text-muted)]">{ev.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                <Brain size={16} className="text-[#4A9B9D]" /> Actividad Aya
              </h3>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {aiEvents.length === 0 && (
                  <p className="text-xs text-[var(--maru-text-muted)]">Sin actividad reciente.</p>
                )}
                {aiEvents.slice(0, 8).map((ev, i) => (
                  <div key={`${ev.at}-${i}`} className="text-[11px] p-2 rounded-lg bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]">
                    <span className="font-mono text-[10px] text-[var(--maru-text-muted)]">
                      {new Date(ev.at).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </span>
                    <div className="text-[var(--maru-text)] mt-0.5">{ev.text}</div>
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

      {showCatalog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3">
          <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-white border border-[var(--maru-border-soft)] shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--maru-border-soft)]">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BookOpen size={16} /> Catálogo · {COMMON_MEDICATIONS.length} medicamentos
              </h3>
              <button type="button" onClick={() => setShowCatalog(false)} className="p-1.5 rounded-lg hover:bg-[var(--maru-surface-muted)]">
                <X size={16} />
              </button>
            </div>
            <div className="p-3 border-b border-[var(--maru-border-soft)]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--maru-text-muted)]" />
                <input
                  autoFocus
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  placeholder="Buscar por nombre, clase o uso…"
                  className="maru-field !pl-9 !text-xs"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {catalogFiltered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => applyCatalogEntry(m)}
                  className="w-full text-left p-3 rounded-xl hover:bg-[var(--maru-surface-muted)] border border-transparent hover:border-[var(--maru-border-soft)]"
                >
                  <div className="font-bold text-sm text-[var(--maru-text)]">{m.name}</div>
                  <div className="text-[11px] text-[var(--maru-text-muted)] mt-0.5">
                    {m.className} · {m.usualDose}{m.unit} · {m.useFor}
                  </div>
                  {m.notes && (
                    <div className="text-[10px] text-[var(--maru-text-muted)] mt-1">{m.notes}</div>
                  )}
                </button>
              ))}
              {catalogFiltered.length === 0 && (
                <p className="text-xs text-[var(--maru-text-muted)] p-3">Sin coincidencias.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
