import React, { useState } from 'react';
import { Repeat, CheckSquare, Square, Flame, Plus } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Habit } from '../../types';

export const HabitsView: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>(() => StorageService.getHabits());
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');

  const handleToggle = (id: string) => {
    const updated = StorageService.toggleHabit(id);
    setHabits(updated);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newH: Habit = {
      id: `h-${Date.now()}`,
      title: title.trim(),
      time,
      frequency: 'Diario',
      completed: false,
      streak: 1,
      category: 'custom'
    };

    const current = StorageService.getHabits();
    const updated = [...current, newH];
    StorageService.saveHabits(updated);
    setHabits(updated);
    setTitle('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#F5F1E8] text-[#2C3E50]">
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-wider text-[#5A8F6B]">Bienestar Integral</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E3A5F]">
          Gestor de Rutinas & Hábitos
        </h1>
        <p className="text-xs text-[#6B7F8C]">
          Sumaq te acompaña en cada hito positivo para cultivar equilibrio sostenible.
        </p>
      </div>

      <div className="bg-white border border-[#E3DCCB] p-6 rounded-2xl shadow-sm space-y-4">
        <div className="space-y-3">
          {habits.map((h) => (
            <div
              key={h.id}
              onClick={() => handleToggle(h.id)}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                h.completed ? 'bg-[#5A8F6B]/10 border-[#5A8F6B]/30' : 'bg-[#F5F1E8] border-[#E3DCCB] hover:bg-[#E3DCCB]/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {h.completed ? <CheckSquare size={20} className="text-[#5A8F6B]" /> : <Square size={20} className="text-[#6B7F8C]" />}
                <div>
                  <div className={`text-sm font-semibold ${h.completed ? 'line-through text-[#6B7F8C]' : 'text-[#1E3A5F]'}`}>
                    {h.title}
                  </div>
                  <div className="text-[11px] text-[#6B7F8C] font-mono">{h.time} · {h.frequency}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs text-[#B8924A] bg-[#B8924A]/10 px-2.5 py-1 rounded-full font-bold">
                <Flame size={14} />
                <span>{h.streak} racha</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="pt-3 border-t border-[#E3DCCB] flex gap-3">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-3 py-2 bg-[#F5F1E8]/50 border border-[#E3DCCB] rounded-xl text-xs font-mono"
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Crear nueva rutina diaria..."
            className="flex-1 px-4 py-2 bg-[#F5F1E8]/50 border border-[#E3DCCB] rounded-xl text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#5A8F6B] hover:bg-[#4A7F5B] text-white text-xs font-medium rounded-xl flex items-center gap-1 shadow"
          >
            <Plus size={16} />
            <span>Crear Hábito</span>
          </button>
        </form>
      </div>
    </div>
  );
};
