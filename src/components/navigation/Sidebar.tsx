import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Brain,
  Calendar,
  Repeat,
  Settings,
  Flame,
  Radio,
  Cpu,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  LogOut
} from 'lucide-react';
import { AgentId } from '../../types';
import { AGENTS_CATALOG } from '../../data/agentsData';
import { ApiService } from '../../services/apiService';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeAgentId: AgentId;
  onSelectAgent: (id: AgentId) => void;
  isEphemeralMode?: boolean;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeAgentId,
  onSelectAgent,
  isEphemeralMode = false,
  onLogout
}) => {
  const [ollamaActive, setOllamaActive] = useState<boolean | null>(null);
  const [modelsCount, setModelsCount] = useState<number>(0);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      const health = await ApiService.getHealth();
      if (isMounted) {
        if (health && health.ollamaLocalActive) {
          setOllamaActive(true);
          setModelsCount((health.localModelsAvailable as unknown[])?.length || 4);
        } else {
          setOllamaActive(false);
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const mainNavItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat Cognitivo', icon: MessageSquare },
    { id: 'agents', label: 'Agentes (7)', icon: Users },
    { id: 'memory', label: 'Memoria RAG', icon: Brain },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'habits', label: 'Rutinas', icon: Repeat },
    { id: 'settings', label: 'Ajustes', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-[#1E3A5F] text-[#F5F1E8] flex flex-col justify-between h-screen border-r border-[#2C3E50] shrink-0 select-none overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#2C3E50]/60 flex items-center gap-3">
          <img 
            src="/logo.jpg" 
            alt="MARU OS Logo" 
            className="w-10 h-10 rounded-full object-cover border-2 border-[#4A9B9D] shadow-sm shrink-0" 
          />
          <div>
            <div className="font-serif font-bold text-xl tracking-wide flex items-center gap-1">
              MARU OS
            </div>
            <p className="text-[11px] text-[#4A9B9D] italic font-serif">con alma.</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="p-3 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#4A9B9D] text-white shadow-md'
                    : 'text-[#F5F1E8]/80 hover:bg-[#2C3E50] hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-[#4A9B9D]'} />
                <span>{item.label}</span>
              </button>
            );
          })}
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-red-400 hover:bg-red-500/20 hover:text-red-300 mt-2 border border-transparent hover:border-red-500/30"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </nav>

        {/* Agents Quick Selection */}
        <div className="px-4 py-3 border-t border-[#2C3E50]/60">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#6B7F8C] mb-2">
            <span>Agentes Activos</span>
            <span className="text-[10px] text-[#4A9B9D]">7/7</span>
          </div>

          <div className="space-y-1">
            {AGENTS_CATALOG.map((agent) => {
              const isSelected = activeAgentId === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent(agent.id);
                    if (currentTab !== 'chat') onSelectTab('chat');
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#2C3E50] text-[#B8924A] font-semibold border-l-2 border-[#B8924A]'
                      : 'text-[#F5F1E8]/70 hover:bg-[#2C3E50]/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.colorAccent }} />
                    <span className="truncate">{agent.name} <span className="opacity-60 text-[10px]">({agent.specialty.split('&')[0]})</span></span>
                  </div>
                  {isSelected && <span className="text-[10px] text-[#4A9B9D] font-mono">ON</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ollama Status Panel */}
      <div className="p-4 border-t border-[#2C3E50]/60 space-y-2.5 text-xs font-mono bg-[#162A45]">
        {/* Main status badge */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <Cpu size={14} className="text-[#4A9B9D]" />
            <span>Ollama:</span>
          </span>
          {ollamaActive === null ? (
            <span className="text-[10px] text-[#6B7F8C] animate-pulse">Verificando...</span>
          ) : ollamaActive ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
              <CheckCircle2 size={12} /> ON · {modelsCount} modelos
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/40">
              <XCircle size={12} /> OFF
            </span>
          )}
        </div>

        {/* Live models list - the ones that actually work */}
        {ollamaActive && (
          <div className="space-y-1 pt-1">
            <div className="text-[9px] text-[#6B7F8C] uppercase tracking-widest mb-1.5">IAs Locales Activas</div>
            {[
              { name: "gemma4:e4b", ram: "9.6G", icon: "🧠", role: "Cerebro diario" },
              { name: "gemma4:12b", ram: "7.6G", icon: "👁️", role: "Visión & Código" },
              { name: "gemma4:e2b", ram: "7.2G", icon: "⚡", role: "Ultra rápido" },
            ].map(m => (
              <div key={m.name} className="flex items-center justify-between px-2 py-1 rounded bg-[#1E3A5F]/60 border border-[#2C3E50]/40">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[#F5F1E8]/80">{m.icon} {m.name}</span>
                </span>
                <span className="text-[#6B7F8C] text-[9px]">{m.ram}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-2 py-1 rounded bg-[#B8924A]/10 border border-[#B8924A]/30 mt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8924A]" />
                <span className="text-[#B8924A]/80">☁️ gemma4:31b-cloud</span>
              </span>
              <span className="text-[#6B7F8C] text-[9px]">Cloud</span>
            </div>
          </div>
        )}

        {/* Online/Offline toggle */}
        <button
          onClick={() => setIsOfflineMode(!isOfflineMode)}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] transition-colors border ${
            isOfflineMode
              ? 'bg-[#B8924A]/20 text-[#B8924A] border-[#B8924A]/40'
              : 'bg-[#5A8F6B]/20 text-[#5A8F6B] border-[#5A8F6B]/40'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Radio size={12} />
            <span>{isOfflineMode ? '100% Offline' : 'Modo Híbrido'}</span>
          </span>
          {isOfflineMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
        </button>

        {isEphemeralMode && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#C0392B]/20 text-[#C0392B] border border-[#C0392B]/40">
            <Flame size={12} className="animate-pulse" />
            <span className="font-semibold text-[10px]">Modo Efímero ON</span>
          </div>
        )}
      </div>
    </aside>
  );
};
