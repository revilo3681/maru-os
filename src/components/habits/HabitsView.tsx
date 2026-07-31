import React, { useState } from 'react';
import { CheckSquare, Square, Flame, Plus, Trash2, Filter, Flag, Tag } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Habit } from '../../types';

interface ExtendedTask extends Habit {
  priority?: 'Alta' | 'Media' | 'Baja';
  project?: string;
}

export const HabitsView: React.FC = () => {
  const [habits, setHabits] = useState<ExtendedTask[]>(() => {
    const raw = StorageService.getHabits();
    return raw.map(h => ({
      ...h,
      priority: (h as any).priority || 'Media',
      project: (h as any).project || 'Personal'
    }));
  });

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [priority, setPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [project, setProject] = useState('Personal');
  const [selectedFilter, setSelectedFilter] = useState<string>('Todas');

  const handleToggle = (id: string) => {
    const updated = StorageService.toggleHabit(id);
    setHabits(updated as ExtendedTask[]);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = habits.filter(h => h.id !== id);
    StorageService.saveHabits(updated);
    setHabits(updated);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newH: ExtendedTask = {
      id: `h-${Date.now()}`,
      title: title.trim(),
      time,
      frequency: 'Diario',
      completed: false,
      streak: 1,
      category: 'custom',
      priority,
      project
    };

    const current = StorageService.getHabits();
    const updated = [...current, newH];
    StorageService.saveHabits(updated);
    setHabits(updated as ExtendedTask[]);
    setTitle('');
  };

  const filteredTasks = habits.filter(h => {
    if (selectedFilter === 'Todas') return true;
    return h.project === selectedFilter;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[var(--maru-bg)] text-[var(--maru-text)]">
      <div className="flex justify-between items-end border-b border-[var(--maru-border-soft)] pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#34C759]">MARU Task Manager</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--maru-text)]">
            Gestor de Rutinas y Tareas
          </h1>
          <p className="text-xs text-[var(--maru-text-muted)] mt-1">
            Organiza tus hábitos, tareas de alto impacto y actividades diarias sin depender de servicios externos.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-[#F2F2F7] p-1 rounded-xl">
          {['Todas', 'Personal', 'Trabajo', 'Salud'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedFilter === cat ? 'bg-white text-[var(--maru-text)] shadow-sm' : 'text-[var(--maru-text-muted)] hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[var(--maru-border-soft)] p-6 rounded-2xl shadow-sm space-y-6">
        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--maru-text-dim)] font-mono">
              No hay tareas en esta categoría. ¡Añade una abajo!
            </div>
          ) : (
            filteredTasks.map((h) => (
              <div
                key={h.id}
                onClick={() => handleToggle(h.id)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  h.completed ? 'bg-[#34C759]/10 border-[#34C759]/30' : 'bg-[#F2F2F7] border-transparent hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {h.completed ? <CheckSquare size={20} className="text-[#34C759]" /> : <Square size={20} className="text-[var(--maru-text-muted)]" />}
                  <div>
                    <div className={`text-sm font-semibold flex items-center gap-2 ${h.completed ? 'line-through text-[var(--maru-text-muted)]' : 'text-[var(--maru-text)]'}`}>
                      {h.title}
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                        h.priority === 'Alta' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : h.priority === 'Media' ? 'bg-[#FF9500]/10 text-[#FF9500]' : 'bg-[#34C759]/10 text-[#34C759]'
                      }`}>
                        {h.priority || 'Media'}
                      </span>
                      <span className="text-[10px] bg-white text-[var(--maru-text-muted)] border border-[var(--maru-border-soft)] px-2 py-0.5 rounded-md font-mono">
                        {h.project || 'Personal'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--maru-text-muted)] font-mono mt-0.5">{h.time} · {h.frequency}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-mono text-xs text-[#FF9500] bg-[#FF9500]/10 px-2.5 py-1 rounded-md font-bold">
                    <Flame size={14} />
                    <span>{h.streak} racha</span>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(h.id, e)}
                    className="p-1.5 text-[var(--maru-text-dim)] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors"
                    title="Eliminar tarea"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAdd} className="pt-4 border-t border-[var(--maru-border-soft)] flex flex-wrap gap-3">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-3 py-2 bg-[#F2F2F7] border border-transparent focus:border-[#007AFF] rounded-xl text-xs font-mono outline-none"
          />
          
          <select 
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="px-3 py-2 bg-[#F2F2F7] border border-transparent focus:border-[#007AFF] rounded-xl text-xs font-mono outline-none"
          >
            <option value="Alta">🔴 Prioridad Alta</option>
            <option value="Media">🟠 Prioridad Media</option>
            <option value="Baja">🟢 Prioridad Baja</option>
          </select>

          <select 
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="px-3 py-2 bg-[#F2F2F7] border border-transparent focus:border-[#007AFF] rounded-xl text-xs font-mono outline-none"
          >
            <option value="Personal">📁 Personal</option>
            <option value="Trabajo">💼 Trabajo</option>
            <option value="Salud">💊 Salud</option>
          </select>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Escribe una nueva tarea o rutina..."
            className="flex-1 min-w-[200px] px-4 py-2 bg-[#F2F2F7] border border-transparent focus:border-[#007AFF] rounded-xl text-xs outline-none"
          />
          
          <button
            type="submit"
            className="px-5 py-2 bg-[#007AFF] hover:bg-[#0056B3] text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus size={16} />
            <span>Agregar Tarea</span>
          </button>
        </form>
      </div>
    </div>
  );
};
