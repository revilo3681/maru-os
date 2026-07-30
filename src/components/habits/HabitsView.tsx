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
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#F5F1E8] text-[#2C3E50]">
      <div className="flex justify-between items-end border-b border-[#E3DCCB] pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#5A8F6B]">MARU Task Manager (Todoist Nativo)</div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E3A5F]">
            Gestor de Rutinas y Tareas
          </h1>
          <p className="text-xs text-[#6B7F8C] mt-1">
            Organiza tus hábitos, tareas de alto impacto y actividades diarias sin depender de servicios externos.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E3DCCB]">
          {['Todas', 'Personal', 'Trabajo', 'Salud'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedFilter === cat ? 'bg-[#1E3A5F] text-white' : 'text-[#6B7F8C] hover:bg-gray-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E3DCCB] p-6 rounded-2xl shadow-sm space-y-6">
        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 font-mono">
              No hay tareas en esta categoría. ¡Añade una abajo!
            </div>
          ) : (
            filteredTasks.map((h) => (
              <div
                key={h.id}
                onClick={() => handleToggle(h.id)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  h.completed ? 'bg-[#5A8F6B]/10 border-[#5A8F6B]/30' : 'bg-[#F5F1E8]/50 border-[#E3DCCB] hover:bg-[#F5F1E8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {h.completed ? <CheckSquare size={20} className="text-[#5A8F6B]" /> : <Square size={20} className="text-[#6B7F8C]" />}
                  <div>
                    <div className={`text-sm font-semibold flex items-center gap-2 ${h.completed ? 'line-through text-[#6B7F8C]' : 'text-[#1E3A5F]'}`}>
                      {h.title}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        h.priority === 'Alta' ? 'bg-red-100 text-red-700' : h.priority === 'Media' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {h.priority || 'Media'}
                      </span>
                      <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono">
                        {h.project || 'Personal'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B7F8C] font-mono mt-0.5">{h.time} · {h.frequency}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-mono text-xs text-[#B8924A] bg-[#B8924A]/10 px-2.5 py-1 rounded-full font-bold">
                    <Flame size={14} />
                    <span>{h.streak} racha</span>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(h.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <form onSubmit={handleAdd} className="pt-4 border-t border-[#E3DCCB] flex flex-wrap gap-3">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-3 py-2 bg-[#F5F1E8]/60 border border-[#E3DCCB] rounded-xl text-xs font-mono"
          />
          
          <select 
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="px-3 py-2 bg-[#F5F1E8]/60 border border-[#E3DCCB] rounded-xl text-xs font-mono"
          >
            <option value="Alta">🔴 Prioridad Alta</option>
            <option value="Media">🟠 Prioridad Media</option>
            <option value="Baja">🟢 Prioridad Baja</option>
          </select>

          <select 
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="px-3 py-2 bg-[#F5F1E8]/60 border border-[#E3DCCB] rounded-xl text-xs font-mono"
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
            className="flex-1 min-w-[200px] px-4 py-2 bg-[#F5F1E8]/60 border border-[#E3DCCB] rounded-xl text-xs"
          />
          
          <button
            type="submit"
            className="px-5 py-2 bg-[#5A8F6B] hover:bg-[#4A7F5B] text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow transition-colors"
          >
            <Plus size={16} />
            <span>Agregar Tarea</span>
          </button>
        </form>
      </div>
    </div>
  );
};
