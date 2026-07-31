import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { CalendarEvent } from '../../types';

export const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => StorageService.getCalendarEvents());
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('09:00');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      date: todayStr,
      time: eventTime,
      title: eventTitle.trim(),
      type: 'appointment',
      completed: false
    };

    StorageService.saveCalendarEvent(newEv);
    setEvents([...events, newEv]);
    setEventTitle('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[var(--maru-bg)] text-[var(--maru-text)]">
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--maru-text-muted)]">Organización Personal</div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--maru-text)]">
          Calendario & Recordatorios
        </h1>
        <p className="text-xs text-[var(--maru-text-muted)]">
          Sincronización local de citas médicas, rutinas y tomas de medicamentos.
        </p>
      </div>

      <div className="bg-white border border-[var(--maru-border-soft)] p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--maru-border-soft)] pb-3">
          <div className="flex items-center gap-2 text-sm font-display font-semibold text-[var(--maru-text)]">
            <CalendarIcon className="text-[#007AFF]" size={18} />
            <span>Eventos de Hoy ({todayStr})</span>
          </div>
        </div>

        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="p-3.5 bg-[#F2F2F7] border border-transparent rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono bg-white text-[var(--maru-text)] border border-[var(--maru-border-soft)] px-2 py-1 rounded-md font-bold">{ev.time}</span>
                <span className="font-medium text-[var(--maru-text)]">{ev.title}</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[#007AFF]/10 text-[#007AFF] font-bold">
                {ev.type}
              </span>
            </div>
          ))}
        </div>

        {/* Add Event Form */}
        <form onSubmit={handleAddEvent} className="pt-2 flex gap-3 border-t border-[var(--maru-border-soft)]">
          <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="px-3 py-2 bg-[#F2F2F7] border border-transparent focus:border-[#007AFF] rounded-xl text-xs font-mono outline-none"
          />
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Nuevo evento o recordatorio..."
            className="flex-1 px-4 py-2 bg-[#F2F2F7] border border-transparent focus:border-[#007AFF] rounded-xl text-xs outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#007AFF] hover:bg-[#0056B3] text-white text-xs font-medium rounded-xl flex items-center gap-1 shadow-sm transition-colors"
          >
            <Plus size={16} />
            <span>Agregar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
