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
import { UserProfile, HealthProfile, LocationProfile, Habit } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
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

  const [agenda, setAgenda] = useState<{calendar: any[], todoist: any[]}>({calendar: [], todoist: []});
  React.useEffect(() => {
    ApiService.getAgenda().then(data => {
      if(data) setAgenda(data);
    });
  }, []);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onNavigateToChat(quickInput.trim());
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#F5F1E8] text-[#2C3E50]">
      {/* Greeting & Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E3DCCB] shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E3A5F]">
            {greeting}, {userProfile.name}.
          </h1>
          <p className="text-xs text-[#6B7F8C] mt-1 font-mono">
            {locationProfile.city}, {locationProfile.country} · 22°C Soleado · Fuente: SENAMHI
          </p>
        </div>

        {/* Emergency Trigger Button */}
        <button
          onClick={onTriggerEmergency}
          className="px-4 py-2.5 bg-[#C0392B]/10 hover:bg-[#C0392B] text-[#C0392B] hover:text-white border border-[#C0392B]/30 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <AlertTriangle size={16} />
          <span>🌊 ALERTA HUAICO / SISMO</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E3DCCB] shadow-sm flex items-center gap-3">
          <div className="p-3 bg-[#1E3A5F]/10 text-[#1E3A5F] rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-[#1E3A5F]">5</div>
            <div className="text-[11px] text-[#6B7F8C]">Agentes Activos</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E3DCCB] shadow-sm flex items-center gap-3">
          <div className="p-3 bg-[#4A9B9D]/10 text-[#4A9B9D] rounded-xl">
            <HardDrive size={20} />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-[#1E3A5F]">2.4 GB</div>
            <div className="text-[11px] text-[#6B7F8C]">Memoria Usada</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E3DCCB] shadow-sm flex items-center gap-3">
          <div className="p-3 bg-[#B8924A]/10 text-[#B8924A] rounded-xl">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-[#1E3A5F]">120 ms</div>
            <div className="text-[11px] text-[#6B7F8C]">Latencia Local</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E3DCCB] shadow-sm flex items-center gap-3">
          <div className="p-3 bg-[#5A8F6B]/10 text-[#5A8F6B] rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-[#1E3A5F]">42 Días</div>
            <div className="text-[11px] text-[#6B7F8C]">Con MARU OS</div>
          </div>
        </div>
      </div>

      {/* Quote of the Day */}
      <FraseDelDia />

      {/* Environment & Weather Alert Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pacha Widget */}
        <div className="bg-white border border-[#E3DCCB] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono uppercase text-[#1E3A5F] mb-4">
              <span className="flex items-center gap-2">
                <Wind size={16} className="text-[#4A9B9D]" />
                Pacha: {locationProfile.city}
              </span>
              <span className="text-[#5A8F6B]">Conectado</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#F5F1E8]/50 p-2 rounded">
                <span className="text-sm font-bold text-[#C0392B] flex items-center gap-1.5"><AlertTriangle size={14}/> Riesgo Huaico</span>
                <span className="text-xs text-[#2C3E50]">85%</span>
              </div>
              <div className="flex justify-between items-center bg-[#F5F1E8]/50 p-2 rounded">
                <span className="text-sm font-bold text-[#5A8F6B] flex items-center gap-1.5"><Wind size={14}/> Calidad Aire</span>
                <span className="text-xs text-[#2C3E50]">AQI: 45</span>
              </div>
              <div className="flex justify-between items-center bg-[#F5F1E8]/50 p-2 rounded">
                <span className="text-sm font-bold text-[#1E3A5F] flex items-center gap-1.5"><MapPin size={14}/> Zona Segura</span>
                <span className="text-xs text-[#2C3E50]">A 500m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Agenda Widget */}
        <div className="bg-white border border-[#E3DCCB] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-[#1E3A5F] mb-4 border-b border-[#E3DCCB] pb-2">
            <Clock size={18} className="text-[#B8924A]" />
            <span>Agenda del Día (Mock)</span>
          </div>
          <div className="space-y-3 text-sm">
            {(agenda?.calendar || []).map((cal: any) => (
              <div key={cal.id} className="flex justify-between items-center bg-[#B8924A]/10 p-2 rounded">
                <span className="font-bold text-[#2C3E50]">{cal.title}</span>
                <span className="text-xs bg-white px-2 py-1 rounded text-[#B8924A] font-mono">{cal.time}</span>
              </div>
            ))}
            {(agenda?.todoist || []).map((tod: any) => (
              <div key={tod.id} className="flex justify-between items-center border border-gray-200 p-2 rounded">
                <span className="text-gray-600 flex items-center gap-2"><CheckSquare size={14}/> {tod.task}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${tod.priority === 'Alta' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{tod.priority}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Habits & Pomodoro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habits Checklist Widget */}
        <div className="bg-white border border-[#E3DCCB] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3DCCB] pb-3">
            <div className="flex items-center gap-2 text-sm font-serif font-bold text-[#1E3A5F]">
              <CheckSquare className="text-[#5A8F6B]" size={18} />
              <span>Hábitos y Rutinas de Hoy</span>
            </div>
            <span className="text-xs font-mono text-[#6B7F8C]">
              {completedHabitsCount}/{habits.length} ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#F5F1E8] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#5A8F6B] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-2">
            {habits.map((h) => (
              <div
                key={h.id}
                onClick={() => handleToggleHabit(h.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  h.completed ? 'bg-[#5A8F6B]/10 border-[#5A8F6B]/30' : 'bg-[#F5F1E8]/50 border-[#E3DCCB] hover:bg-[#F5F1E8]'
                }`}
              >
                <div className="flex items-center gap-3 text-xs">
                  {h.completed ? (
                    <CheckSquare size={18} className="text-[#5A8F6B]" />
                  ) : (
                    <Square size={18} className="text-[#6B7F8C]" />
                  )}
                  <span className={h.completed ? 'line-through text-[#6B7F8C]' : 'font-medium text-[#2C3E50]'}>
                    {h.title}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#1E3A5F]">{h.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pomodoro Timer Widget */}
        <PomodoroTimer />
      </div>

      {/* Quick Prompt Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3DCCB] shadow-sm">
        <form onSubmit={handleQuickSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder={`¿En qué pensamos hoy, ${userProfile.name}?`}
            className="flex-1 px-4 py-2.5 bg-[#F5F1E8]/60 border border-[#E3DCCB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9B9D]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#1E3A5F] hover:bg-[#2C3E50] text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow"
          >
            <span>Conversar</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
