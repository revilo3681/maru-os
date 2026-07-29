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
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#F5F1E8] text-[#2C3E50]">
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-wider text-[#4A9B9D]">Organización Personal</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E3A5F]">
          Calendario & Recordatorios
        </h1>
        <p className="text-xs text-[#6B7F8C]">
          Sincronización local de citas médicas, rutinas y tomas de medicamentos.
        </p>
      </div>

      <div className="bg-white border border-[#E3DCCB] p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3DCCB] pb-3">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-[#1E3A5F]">
            <CalendarIcon className="text-[#4A9B9D]" size={18} />
            <span>Eventos de Hoy ({todayStr})</span>
          </div>
        </div>

        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="p-3.5 bg-[#F5F1E8] border border-[#E3DCCB] rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono bg-[#1E3A5F] text-white px-2 py-1 rounded font-bold">{ev.time}</span>
                <span className="font-medium text-[#2C3E50]">{ev.title}</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#4A9B9D]/10 text-[#4A9B9D] font-bold">
                {ev.type}
              </span>
            </div>
          ))}
        </div>

        {/* Add Event Form */}
        <form onSubmit={handleAddEvent} className="pt-2 flex gap-3 border-t border-[#E3DCCB]">
          <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="px-3 py-2 bg-[#F5F1E8]/50 border border-[#E3DCCB] rounded-xl text-xs font-mono"
          />
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Nuevo evento o recordatorio..."
            className="flex-1 px-4 py-2 bg-[#F5F1E8]/50 border border-[#E3DCCB] rounded-xl text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#1E3A5F] hover:bg-[#2C3E50] text-white text-xs font-medium rounded-xl flex items-center gap-1 shadow"
          >
            <Plus size={16} />
            <span>Agregar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
