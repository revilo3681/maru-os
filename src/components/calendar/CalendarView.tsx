import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  CheckSquare, Square, Flame, Pill, Repeat
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { CalendarEvent, Habit } from '../../types';

type ViewMode = 'day' | 'week' | 'month' | 'year';
type PanelTab = 'agenda' | 'rutinas';

function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // lunes = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const TYPE_COLOR: Record<CalendarEvent['type'], string> = {
  medication: 'bg-[#FF3B30]/10 text-[#FF3B30]',
  habit: 'bg-[#FF9500]/10 text-[#FF9500]',
  appointment: 'bg-[#007AFF]/10 text-[#007AFF]',
  routine: 'bg-[#34C759]/10 text-[#34C759]'
};

export const CalendarView: React.FC<{ initialTab?: PanelTab }> = ({ initialTab = 'agenda' }) => {
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [panel, setPanel] = useState<PanelTab>(initialTab);
  const [events, setEvents] = useState<CalendarEvent[]>(() => StorageService.getCalendarEvents());
  const [habits, setHabits] = useState<Habit[]>(() => StorageService.getHabits());
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState<CalendarEvent['type']>('appointment');
  const [habitTitle, setHabitTitle] = useState('');
  const [habitTime, setHabitTime] = useState('08:00');

  const todayStr = toISODate(new Date());
  const cursorStr = toISODate(cursor);

  const persistEvents = (next: CalendarEvent[]) => {
    setEvents(next);
    StorageService.saveCalendarEvents(next);
  };

  // Sincronizar hábitos/medicación del día en la agenda visual
  const unifiedDayItems = useMemo(() => {
    const dayEvents = events
      .filter((e) => e.date === cursorStr)
      .sort((a, b) => a.time.localeCompare(b.time));
    const habitItems = habits.map((h) => ({
      id: `habit-${h.id}`,
      time: h.time,
      title: h.title,
      kind: 'habit' as const,
      completed: h.completed,
      streak: h.streak,
      habitId: h.id
    }));
    const meds = StorageService.getHealth().currentMedications.map((m) => ({
      id: `med-${m.id}`,
      time: m.frequency.includes('8 PM') ? '20:00' : '08:00',
      title: `${m.name} ${m.dose}`,
      kind: 'medication' as const,
      completed: false
    }));
    return { dayEvents, habitItems, meds };
  }, [cursorStr, events, habits]);

  const eventsForDate = (dateStr: string) =>
    events.filter((e) => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));

  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const yearMonths = useMemo(
    () => Array.from({ length: 12 }, (_, m) => new Date(cursor.getFullYear(), m, 1)),
    [cursor]
  );

  const navigate = (dir: -1 | 1) => {
    const next = new Date(cursor);
    if (view === 'day') next.setDate(next.getDate() + dir);
    else if (view === 'week') next.setDate(next.getDate() + dir * 7);
    else if (view === 'month') next.setMonth(next.getMonth() + dir);
    else next.setFullYear(next.getFullYear() + dir);
    setCursor(next);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      date: cursorStr,
      time,
      title: title.trim(),
      type,
      completed: false
    };
    StorageService.saveCalendarEvent(newEv);
    setEvents(StorageService.getCalendarEvents());
    setTitle('');
  };

  const toggleEvent = (id: string) => {
    const next = events.map((ev) => (ev.id === id ? { ...ev, completed: !ev.completed } : ev));
    persistEvents(next);
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    const newH: Habit = {
      id: `h-${Date.now()}`,
      title: habitTitle.trim(),
      time: habitTime,
      frequency: 'Diario',
      completed: false,
      streak: 1,
      category: 'custom'
    };
    const updated = [...StorageService.getHabits(), newH];
    StorageService.saveHabits(updated);
    setHabits(updated);
    setHabitTitle('');
  };

  const handleToggleHabit = (id: string) => {
    setHabits(StorageService.toggleHabit(id));
  };

  const headerLabel =
    view === 'year'
      ? String(cursor.getFullYear())
      : view === 'month'
        ? cursor.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
        : view === 'week'
          ? `Semana del ${weekDays[0].toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}`
          : cursor.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="maru-page space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="maru-eyebrow">Organización unificada</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--maru-text)]">
            Calendario & Rutinas
          </h1>
          <p className="text-xs text-[var(--maru-text-muted)]">
            Citas, medicamentos y hábitos en un solo módulo · vistas día / semana / mes / año
          </p>
        </div>
        <div className="flex gap-1 bg-[var(--maru-surface-muted)] p-1 rounded-[10px]">
          {([
            ['agenda', 'Agenda'],
            ['rutinas', 'Rutinas']
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setPanel(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                panel === id ? 'bg-white shadow-sm text-[var(--maru-text)]' : 'text-[var(--maru-text-muted)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {panel === 'agenda' ? (
        <>
          <div className="maru-panel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-[var(--maru-surface-muted)]">
                  <ChevronLeft size={18} />
                </button>
                <div className="font-display font-bold text-[var(--maru-text)] capitalize min-w-[180px] text-center">
                  {headerLabel}
                </div>
                <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-[var(--maru-surface-muted)]">
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => setCursor(new Date())}
                  className="ml-1 px-2 py-1 text-[11px] font-bold rounded-lg border border-[var(--maru-border-soft)]"
                >
                  Hoy
                </button>
              </div>
              <div className="flex gap-1 bg-[var(--maru-surface-muted)] p-1 rounded-[10px]">
                {(['day', 'week', 'month', 'year'] as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${
                      view === v ? 'bg-white shadow-sm' : 'text-[var(--maru-text-muted)]'
                    }`}
                  >
                    {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : v === 'month' ? 'Mes' : 'Año'}
                  </button>
                ))}
              </div>
            </div>

            {view === 'month' && (
              <div className="grid grid-cols-7 gap-1">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-[var(--maru-text-muted)] py-1">{d}</div>
                ))}
                {monthCells.map((d) => {
                  const iso = toISODate(d);
                  const count = eventsForDate(iso).length;
                  const inMonth = d.getMonth() === cursor.getMonth();
                  const isToday = iso === todayStr;
                  const selected = iso === cursorStr;
                  return (
                    <button
                      key={iso}
                      onClick={() => setCursor(d)}
                      className={`min-h-[64px] p-1.5 rounded-xl border text-left transition-colors ${
                        selected
                          ? 'border-[#007AFF] bg-[#007AFF]/10'
                          : isToday
                            ? 'border-[#34C759]/50 bg-[#34C759]/5'
                            : 'border-transparent bg-[var(--maru-surface-muted)]'
                      } ${inMonth ? '' : 'opacity-40'}`}
                    >
                      <div className="text-xs font-bold">{d.getDate()}</div>
                      {count > 0 && (
                        <div className="mt-1 text-[10px] text-[#007AFF] font-mono">{count} evento{count > 1 ? 's' : ''}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'week' && (
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                {weekDays.map((d) => {
                  const iso = toISODate(d);
                  const list = eventsForDate(iso);
                  return (
                    <button
                      key={iso}
                      onClick={() => { setCursor(d); setView('day'); }}
                      className={`p-2 rounded-xl border text-left min-h-[120px] ${
                        iso === cursorStr ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-[var(--maru-border-soft)]'
                      }`}
                    >
                      <div className="text-[11px] font-bold capitalize">
                        {d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' })}
                      </div>
                      <div className="mt-2 space-y-1">
                        {list.slice(0, 3).map((ev) => (
                          <div key={ev.id} className="text-[10px] truncate px-1 py-0.5 rounded bg-white border border-[var(--maru-border-soft)]">
                            {ev.time} {ev.title}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'year' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {yearMonths.map((m) => {
                  const monthEvents = events.filter(
                    (e) => e.date.startsWith(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`)
                  );
                  return (
                    <button
                      key={m.getMonth()}
                      onClick={() => { setCursor(m); setView('month'); }}
                      className="p-3 rounded-xl border border-[var(--maru-border-soft)] bg-[var(--maru-surface-muted)] text-left hover:border-[#007AFF]/40"
                    >
                      <div className="font-bold text-sm capitalize">
                        {m.toLocaleDateString('es-PE', { month: 'long' })}
                      </div>
                      <div className="text-[11px] text-[var(--maru-text-muted)] mt-1">
                        {monthEvents.length} eventos
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {(view === 'day' || view === 'month' || view === 'week') && (
              <div className="space-y-3 pt-2 border-t border-[var(--maru-border-soft)]">
                <div className="flex items-center gap-2 text-sm font-display font-semibold">
                  <CalendarIcon size={16} className="text-[#007AFF]" />
                  Agenda · {cursorStr}
                </div>

                {unifiedDayItems.dayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => toggleEvent(ev.id)}
                    className={`w-full p-3 rounded-xl flex items-center justify-between text-left ${
                      ev.completed ? 'bg-[#34C759]/10' : 'bg-[var(--maru-surface-muted)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs bg-white border border-[var(--maru-border-soft)] px-2 py-1 rounded-md font-bold">
                        {ev.time}
                      </span>
                      <span className={`text-sm font-medium ${ev.completed ? 'line-through text-[var(--maru-text-muted)]' : ''}`}>
                        {ev.title}
                      </span>
                    </div>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md font-bold ${TYPE_COLOR[ev.type]}`}>
                      {ev.type}
                    </span>
                  </button>
                ))}

                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--maru-text-muted)] flex items-center gap-1 pt-2">
                  <Pill size={12} /> Medicamentos del perfil
                </div>
                {unifiedDayItems.meds.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-[#FF3B30]/5 border border-[#FF3B30]/15 flex justify-between text-sm">
                    <span className="font-medium">{m.title}</span>
                    <span className="font-mono text-xs text-[var(--maru-text-muted)]">{m.time}</span>
                  </div>
                ))}

                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--maru-text-muted)] flex items-center gap-1 pt-2">
                  <Repeat size={12} /> Rutinas del día
                </div>
                {unifiedDayItems.habitItems.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleToggleHabit(h.habitId)}
                    className={`w-full p-3 rounded-xl flex items-center justify-between ${
                      h.completed ? 'bg-[#34C759]/10' : 'bg-[var(--maru-surface-muted)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      {h.completed ? <CheckSquare size={16} className="text-[#34C759]" /> : <Square size={16} />}
                      <span className={h.completed ? 'line-through text-[var(--maru-text-muted)]' : ''}>{h.title}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#FF9500] flex items-center gap-1">
                      <Flame size={12} /> {h.streak}
                    </span>
                  </button>
                ))}

                <form onSubmit={handleAddEvent} className="pt-2 flex flex-wrap gap-2 border-t border-[var(--maru-border-soft)]">
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="maru-field !w-auto font-mono" />
                  <select value={type} onChange={(e) => setType(e.target.value as CalendarEvent['type'])} className="maru-field !w-auto text-xs">
                    <option value="appointment">Cita</option>
                    <option value="medication">Medicamento</option>
                    <option value="routine">Rutina</option>
                    <option value="habit">Hábito</option>
                  </select>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nuevo evento..."
                    className="maru-field flex-1 min-w-[160px]"
                  />
                  <button type="submit" className="maru-btn-primary">
                    <Plus size={16} /> Agregar
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="maru-panel space-y-4">
          <div className="flex items-center gap-2 font-display font-semibold text-[var(--maru-text)]">
            <Repeat size={18} className="text-[#FF9500]" /> Gestor de rutinas
          </div>
          <div className="space-y-2">
            {habits.map((h) => (
              <button
                key={h.id}
                onClick={() => handleToggleHabit(h.id)}
                className={`w-full p-4 rounded-xl flex items-center justify-between text-left ${
                  h.completed ? 'bg-[#34C759]/10 border border-[#34C759]/30' : 'bg-[var(--maru-surface-muted)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {h.completed ? <CheckSquare className="text-[#34C759]" size={20} /> : <Square size={20} className="text-[var(--maru-text-muted)]" />}
                  <div>
                    <div className={`text-sm font-semibold ${h.completed ? 'line-through text-[var(--maru-text-muted)]' : ''}`}>{h.title}</div>
                    <div className="text-[11px] font-mono text-[var(--maru-text-muted)]">{h.time} · {h.frequency}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#FF9500] bg-[#FF9500]/10 px-2 py-1 rounded-md">
                  <Flame size={14} /> {h.streak}
                </div>
              </button>
            ))}
          </div>
          <form onSubmit={handleAddHabit} className="flex flex-wrap gap-2 pt-3 border-t border-[var(--maru-border-soft)]">
            <input type="time" value={habitTime} onChange={(e) => setHabitTime(e.target.value)} className="maru-field !w-auto font-mono" />
            <input
              value={habitTitle}
              onChange={(e) => setHabitTitle(e.target.value)}
              placeholder="Nueva rutina..."
              className="maru-field flex-1 min-w-[180px]"
            />
            <button type="submit" className="maru-btn-primary">
              <Plus size={16} /> Agregar rutina
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
