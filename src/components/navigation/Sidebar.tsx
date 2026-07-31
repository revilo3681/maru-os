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
  LogOut,
  FileText,
  Code2,
  CloudRain,
  HeartPulse,
  Scale,
  ShieldAlert
} from 'lucide-react';
import { AgentId } from '../../types';
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
  activeAgentId: _activeAgentId,
  onSelectAgent: _onSelectAgent,
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
    { id: 'notes', label: 'Bloc de Notas', icon: FileText },
    { id: 'health', label: 'Salud (Aya)', icon: HeartPulse },
    { id: 'legal', label: 'Legal (Inti)', icon: Scale },
    { id: 'kipu', label: 'Desarrollo (Kipu)', icon: Code2 },
    { id: 'pacha', label: 'Clima (Pacha)', icon: CloudRain },
    { id: 'emergency', label: 'Emergencia (Tupac)', icon: ShieldAlert },
    { id: 'settings', label: 'Ajustes', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-[var(--maru-bg)] text-[var(--maru-text)] flex flex-col justify-between h-screen border-r border-[var(--maru-border-soft)] shrink-0 select-none overflow-y-auto">
      <div>
        <div className="p-5 border-b border-[var(--maru-border-soft)] flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="MARU OS Logo"
            className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0 animate-maru-spin-slow"
          />
          <div>
            <div className="font-display font-bold text-lg tracking-[0.1em] flex items-center gap-1 text-[var(--maru-text)]">
              MARU OS
            </div>
            <p className="text-[11px] text-[var(--maru-text-muted)] italic font-sans">con alma.</p>
          </div>
        </div>

        <nav className="p-3 space-y-0.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--maru-gold)] text-white shadow-sm'
                    : 'text-[var(--maru-text-muted)] hover:bg-black/5 hover:text-[var(--maru-text)] border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-[var(--maru-text-dim)]'} />
                <span className="font-sans">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-rose-400/90 hover:bg-rose-500/10 hover:text-rose-300 mt-2 border border-transparent hover:border-rose-500/25"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </nav>
      </div>

      <div className="p-4 border-t border-[var(--maru-border-soft)] space-y-2.5 text-xs font-mono bg-[var(--maru-void)]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--maru-text-muted)]">
            <Cpu size={14} className="text-[var(--maru-gold)]" />
            <span>Ollama:</span>
          </span>
          {ollamaActive === null ? (
            <span className="text-[10px] text-[var(--maru-text-dim)] animate-pulse">Verificando...</span>
          ) : ollamaActive ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/35">
              <CheckCircle2 size={12} /> ON · {modelsCount} modelos
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] font-bold border border-rose-500/35">
              <XCircle size={12} /> OFF
            </span>
          )}
        </div>

        {ollamaActive && (
          <div className="space-y-1 pt-1">
            <div className="text-[9px] text-[var(--maru-text-dim)] uppercase tracking-widest mb-1.5">
              IAs Locales Activas
            </div>
            {[
              { name: 'gemma4:e4b', ram: '9.6G', role: 'Cerebro diario' },
              { name: 'gemma4:12b', ram: '7.6G', role: 'Visión & Código' },
              { name: 'gemma4:e2b', ram: '7.2G', role: 'Ultra rápido' }
            ].map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between px-2 py-1 rounded bg-[var(--maru-surface)]/80 border border-[var(--maru-border-soft)]"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[var(--maru-text)]/80">{m.name}</span>
                </span>
                <span className="text-[var(--maru-text-dim)] text-[9px]">{m.ram}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-2 py-1 rounded bg-[var(--maru-gold)]/10 border border-[var(--maru-gold)]/25 mt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--maru-gold)]" />
                <span className="text-[var(--maru-gold)]/90">gemma4:31b-cloud</span>
              </span>
              <span className="text-[var(--maru-text-dim)] text-[9px]">Cloud</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOfflineMode(!isOfflineMode)}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] transition-colors border ${
            isOfflineMode
              ? 'bg-[var(--maru-gold)]/15 text-[var(--maru-gold)] border-[var(--maru-gold)]/35'
              : 'bg-emerald-500/10 text-emerald-400/90 border-emerald-500/30'
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
