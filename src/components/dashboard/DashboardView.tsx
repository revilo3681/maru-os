import React, { useState } from 'react';
import {
  AlertTriangle,
  Wind,
  MapPin,
  CheckSquare,
  Square,
  Send,
  Clock
} from 'lucide-react';
import { UserProfile, HealthProfile, LocationProfile, Habit, CalendarEvent, AppSettings } from '../../types';
import { StorageService } from '../../services/storageService';
import { FraseDelDia } from './FraseDelDia';
import { PomodoroTimer } from './PomodoroTimer';
import { UserPersonalization } from './UserPersonalization';
import { syncDashboardHabit } from '../../services/knowledgeSync';

interface DashboardViewProps {
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  locationProfile: LocationProfile;
  settings: AppSettings;
  onProfileChange: (p: UserProfile) => void;
  onSettingsChange: (s: AppSettings) => void;
  onNavigateToChat: (initialPrompt?: string) => void;
  onTriggerEmergency: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  healthProfile: _healthProfile,
  locationProfile,
  settings,
  onProfileChange,
  onSettingsChange,
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
    const before = habits.find((h) => h.id === id);
    const updated = StorageService.toggleHabit(id);
    setHabits(updated);
    const after = updated.find((h) => h.id === id);
    if (before && after) {
      syncDashboardHabit(after.title, after.completed);
    }
  };

  const [events] = useState<CalendarEvent[]>(() => StorageService.getCalendarEvents());

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onNavigateToChat(quickInput.trim());
    }
  };

  return (
    <div className="maru-page relative maru-read-scroll space-y-6">
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--maru-border-soft)] pb-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--maru-text-muted)] mb-1">
            Tu manantial
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--maru-text)] tracking-tight">
            {greeting}, {userProfile.name}.
          </h1>
          <p className="text-xs text-[var(--maru-text-muted)] mt-1.5 font-mono">
            {locationProfile.city}, {locationProfile.country} · 22°C Soleado · SENAMHI
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <UserPersonalization
            userProfile={userProfile}
            settings={settings}
            onProfileChange={onProfileChange}
            onSettingsChange={onSettingsChange}
          />
          <button
            onClick={onTriggerEmergency}
            className="maru-btn-secondary border-red-200 text-[var(--maru-danger)] hover:bg-red-50"
          >
            <AlertTriangle size={16} />
            <span>Ayuda y emergencias</span>
          </button>
        </div>
      </div>

      <div className="maru-panel">
        <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="flex-1">
            <label htmlFor="dashboard-chat" className="maru-eyebrow block mb-2">Pregunta a MARU</label>
            <input
              id="dashboard-chat"
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder={`¿En qué pensamos hoy, ${userProfile.name}?`}
              className="maru-field"
            />
          </div>
          <button type="submit" className="maru-btn-primary sm:self-end sm:px-6">
            <span>Conversar</span><Send size={16} />
          </button>
        </form>
      </div>

      <FraseDelDia />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="maru-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono uppercase text-[var(--maru-text-muted)] mb-4">
              <span className="flex items-center gap-2 text-[var(--maru-text)]">
                <Wind size={16} className="text-[#5AC8FA]" />
                Pacha: {locationProfile.city}
              </span>
              <span className="maru-chip maru-status-warning">Contexto demo</span>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center bg-[var(--maru-surface-muted)] p-3 rounded-[10px]">
                <span className="text-sm font-medium text-[#FF3B30] flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Riesgo Huaico
                </span>
                <span className="text-xs text-[var(--maru-text)] font-mono">85%</span>
              </div>
              <div className="flex justify-between items-center bg-[var(--maru-surface-muted)] p-3 rounded-[10px]">
                <span className="text-sm font-medium text-[#34C759] flex items-center gap-1.5">
                  <Wind size={14} /> Calidad Aire
                </span>
                <span className="text-xs text-[var(--maru-text)] font-mono">AQI: 45</span>
              </div>
              <div className="flex justify-between items-center bg-[var(--maru-surface-muted)] p-3 rounded-[10px]">
                <span className="text-sm font-medium text-[var(--maru-gold)] flex items-center gap-1.5">
                  <MapPin size={14} /> Zona Segura
                </span>
                <span className="text-xs text-[var(--maru-text)] font-mono">A 500m</span>
              </div>
            </div>
          </div>
        </div>

        <div className="maru-panel">
          <div className="flex items-center justify-between border-b border-[var(--maru-border-soft)] pb-2 mb-4">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-[var(--maru-text)]">
              <Clock size={18} className="text-[#FF9500]" />
              <span>Hoy · Agenda</span>
            </div>
            <span className="maru-chip">
              Datos locales
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
                  className="flex justify-between items-center bg-[var(--maru-surface-muted)] p-3 rounded-[10px]"
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
        <div className="maru-panel space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--maru-border-soft)] pb-3">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-[var(--maru-text)]">
              <CheckSquare className="text-[#34C759]" size={18} />
              <span>Bienestar · Hábitos de hoy</span>
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

    </div>
  );
};
