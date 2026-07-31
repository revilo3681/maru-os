import React, { useState } from 'react';
import {
  AlertTriangle,
  Wind,
  MapPin,
  CheckSquare,
  Square,
  Send,
  Users,
  HardDrive,
  Zap,
  Clock
} from 'lucide-react';
import { UserProfile, HealthProfile, LocationProfile, Habit, CalendarEvent } from '../../types';
import { StorageService } from '../../services/storageService';
import { FraseDelDia } from './FraseDelDia';
import { PomodoroTimer } from './PomodoroTimer';

interface DashboardViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
  onNavigateToChat: (initialPrompt?: string) => void;
  onTriggerEmergency: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  healthProfile: _healthProfile,
  locationProfile,
  onNavigateToChat,
  onTriggerEmergency
}) => {
  const [habits, setHabits] = useState<Habit[]>(() => StorageService.getHabits());
  const [quickInput, setQuickInput] = useState('');

  const hour = new Date().getHours();
  let greeting = 'Buenos días';
  if (hour >= 12 && hour < 18) greeting = 'Buenas tardes';
  else if (hour >= 18 || hour < 5) greeting = 'Buenas noches';

  const completedHabitsCount = habits.filter((h) => h.completed).length;
  const progressPercent = habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : 0;

  const handleToggleHabit = (id: string) => {
    const updated = StorageService.toggleHabit(id);
    setHabits(updated);
  };

  const [events] = useState<CalendarEvent[]>(() => StorageService.getCalendarEvents());

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onNavigateToChat(quickInput.trim());
    }
  };

  return (
    <div className="relative flex-1 overflow-y-auto maru-read-scroll p-4 sm:p-8 space-y-6 bg-[var(--maru-bg)] text-[var(--maru-text)]">
      {/* Atmospheric top wash */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 70% 80% at 30% 0%, rgba(212,175,55,0.12), transparent 60%)'
        }}
      />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--maru-border-soft)] pb-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--maru-text-muted)] mb-1">
            Manantial vivo
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--maru-text)] tracking-tight">
            {greeting}, {userProfile.name}.
          </h1>
          <p className="text-xs text-[var(--maru-text-muted)] mt-1.5 font-mono">
            {locationProfile.city}, {locationProfile.country} · 22°C Soleado · SENAMHI
          </p>
        </div>

        <button
          onClick={onTriggerEmergency}
          className="px-4 py-2.5 bg-[#C0392B]/15 hover:bg-[#C0392B] text-[#F5A9A0] hover:text-white border border-[#C0392B]/40 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <AlertTriangle size={16} />
          <span>ALERTA HUAICO / SISMO</span>
        </button>
      </div>

      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Agentes Activos', value: '7', accent: 'var(--maru-gold)' },
          { icon: HardDrive, label: 'Memoria Usada', value: '2.4 GB', accent: '#4A9B9D' },
          { icon: Zap, label: 'Latencia Local', value: '120 ms', accent: 'var(--maru-amber)' },
          { icon: Clock, label: 'Con MARU OS', value: '42 Días', accent: '#5A8F6B' }
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="bg-white shadow-sm border border-[var(--maru-border-soft)] p-4 rounded-2xl flex items-center gap-3 transition-transform hover:-translate-y-0.5"
            >
              <div
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `${m.accent}15`, color: m.accent }}
              >
                <Icon size={18} />
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-[var(--maru-text)]">{m.value}</div>
                <div className="text-[11px] text-[var(--maru-text-muted)]">{m.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <FraseDelDia />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-[var(--maru-border-soft)] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono uppercase text-[var(--maru-text-muted)] mb-4">
              <span className="flex items-center gap-2 text-[var(--maru-text)]">
                <Wind size={16} className="text-[#5AC8FA]" />
                Pacha: {locationProfile.city}
              </span>
              <span className="text-[#34C759]">Conectado</span>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center bg-[#F2F2F7] p-2.5 rounded-xl">
                <span className="text-sm font-medium text-[#FF3B30] flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Riesgo Huaico
                </span>
                <span className="text-xs text-[var(--maru-text)] font-mono">85%</span>
              </div>
              <div className="flex justify-between items-center bg-[#F2F2F7] p-2.5 rounded-xl">
                <span className="text-sm font-medium text-[#34C759] flex items-center gap-1.5">
                  <Wind size={14} /> Calidad Aire
                </span>
                <span className="text-xs text-[var(--maru-text)] font-mono">AQI: 45</span>
              </div>
              <div className="flex justify-between items-center bg-[#F2F2F7] p-2.5 rounded-xl">
                <span className="text-sm font-medium text-[var(--maru-gold)] flex items-center gap-1.5">
                  <MapPin size={14} /> Zona Segura
                </span>
                <span className="text-xs text-[var(--maru-text)] font-mono">A 500m</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--maru-border-soft)] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--maru-border-soft)] pb-2 mb-4">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-[var(--maru-text)]">
              <Clock size={18} className="text-[#FF9500]" />
              <span>Agenda del Día</span>
            </div>
            <span className="text-[10px] bg-[#FF9500]/10 text-[#FF9500] px-2 py-0.5 rounded-md font-mono font-bold">
              REAL
            </span>
          </div>
          <div className="space-y-2.5 text-sm">
            {events.length === 0 ? (
              <div className="text-xs text-[var(--maru-text-muted)] italic text-center py-2">
                No hay eventos para hoy
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex justify-between items-center bg-[#F2F2F7] p-2.5 rounded-xl"
                >
                  <span className="font-medium text-[var(--maru-text)] text-xs">{ev.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md text-[var(--maru-text-muted)] font-mono">
                      {ev.type}
                    </span>
                    <span className="text-xs bg-white border border-[var(--maru-border-soft)] px-2 py-1 rounded-md text-[var(--maru-text)] font-mono font-bold">
                      {ev.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-[var(--maru-border-soft)] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--maru-border-soft)] pb-3">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-[var(--maru-text)]">
              <CheckSquare className="text-[#34C759]" size={18} />
              <span>Hábitos y Rutinas de Hoy</span>
            </div>
            <span className="text-xs font-mono text-[var(--maru-text-muted)]">
              {completedHabitsCount}/{habits.length} ({progressPercent}%)
            </span>
          </div>

          <div className="w-full bg-[#F2F2F7] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#34C759] h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-2">
            {habits.map((h) => (
              <div
                key={h.id}
                onClick={() => handleToggleHabit(h.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  h.completed
                    ? 'bg-[#34C759]/10 border-[#34C759]/30'
                    : 'bg-white border-[var(--maru-border-soft)] hover:bg-[#F2F2F7]'
                }`}
              >
                <div className="flex items-center gap-3 text-xs">
                  {h.completed ? (
                    <CheckSquare size={18} className="text-[#34C759]" />
                  ) : (
                    <Square size={18} className="text-[var(--maru-text-dim)]" />
                  )}
                  <span
                    className={
                      h.completed
                        ? 'line-through text-[var(--maru-text-dim)]'
                        : 'font-medium text-[var(--maru-text)]'
                    }
                  >
                    {h.title}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--maru-text-muted)]">{h.time}</span>
              </div>
            ))}
          </div>
        </div>

        <PomodoroTimer />
      </div>

      <div className="bg-white shadow-sm border border-[var(--maru-border-soft)] p-4 rounded-2xl">
        <form onSubmit={handleQuickSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder={`¿En qué pensamos hoy, ${userProfile.name}?`}
            className="flex-1 px-4 py-2.5 bg-[#F2F2F7] border border-[var(--maru-border-soft)] rounded-xl text-sm text-[var(--maru-text)] placeholder:text-[var(--maru-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--maru-gold)] focus:border-transparent"
          />
          <button
            type="submit"
            className="maru-btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
          >
            <span>Conversar</span>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
