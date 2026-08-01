import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Brain,
  Calendar,
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
  ShieldAlert,
  Landmark,
  Mail
} from 'lucide-react';
import { AgentId } from '../../types';
import { ApiService } from '../../services/apiService';
import { MaruEnso } from '../brand/MaruEnso';
import { useEngineConfig } from '../../context/EngineConfigContext';

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
  const { enabledAgents } = useEngineConfig();

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

  const groups = [
    {
      label: 'Principal',
      items: [
        { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
        { id: 'chat', label: 'Chat cognitivo', icon: MessageSquare },
        { id: 'agents', label: 'Agentes', icon: Users },
        { id: 'memory', label: 'Memoria', icon: Brain }
      ]
    },
    {
      label: 'Vida diaria',
      items: [
        { id: 'calendar', label: 'Calendario & Rutinas', icon: Calendar },
        { id: 'mail', label: 'Correo', icon: Mail },
        { id: 'notes', label: 'Notas', icon: FileText }
      ]
    }
  ];
  const specialistItems = [
    { id: 'health', label: 'Aya / Sumaq — Salud', icon: HeartPulse, agents: ['aya', 'sumaq'] as AgentId[] },
    { id: 'legal', label: 'Inti — Legal', icon: Scale, agents: ['inti'] as AgentId[] },
    { id: 'kipu', label: 'Kipu — Desarrollo', icon: Code2, agents: ['kipu'] as AgentId[] },
    { id: 'pacha', label: 'Pacha — Clima', icon: CloudRain, agents: ['pacha'] as AgentId[] },
    { id: 'emergency', label: 'Tupac — Emergencia', icon: ShieldAlert, agents: ['tupac'] as AgentId[] },
    { id: 'yaku', label: 'Yaku — Perú', icon: Landmark, agents: ['yaku'] as AgentId[] }
  ].filter((item) => item.agents.some((a) => enabledAgents.includes(a)));

  const renderItem = (item: { id: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onSelectTab(item.id)}
        title={item.label}
        className={`w-full min-h-10 flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm text-left transition-colors ${
          isActive
            ? 'bg-[var(--maru-primary-soft)] text-[var(--maru-primary)] font-semibold'
            : 'text-[var(--maru-text-muted)] hover:bg-[var(--maru-surface-muted)] hover:text-[var(--maru-text)]'
        }`}
      >
        <Icon size={18} className="shrink-0" />
        <span className="hidden md:block truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="w-20 md:w-64 bg-[var(--maru-surface)] text-[var(--maru-text)] flex flex-col h-screen border-r border-[var(--maru-border-soft)] shrink-0 select-none overflow-y-auto">
      <div className="flex-1">
        <div className="p-4 md:p-5 border-b border-[var(--maru-border-soft)] flex items-center justify-center md:justify-start gap-3">
          <MaruEnso size={40} showName={false} className="shrink-0" />
          <div className="hidden md:block">
            <div className="font-display font-bold text-lg tracking-[0.1em] flex items-center gap-1 text-[var(--maru-text)]">
              MARU OS
            </div>
            <p className="text-[11px] text-[var(--maru-text-muted)] italic font-sans">con alma.</p>
          </div>
        </div>

        <nav className="p-3 space-y-4">
          {groups.map(group => (
            <section key={group.label}>
              <div className="hidden md:block px-3 mb-1.5 text-[10px] font-mono uppercase tracking-[.15em] text-[var(--maru-text-dim)]">
                {group.label}
              </div>
              <div className="space-y-1">{group.items.map(renderItem)}</div>
            </section>
          ))}
          <details className="maru-disclosure hidden md:block">
            <summary className="px-3 text-[var(--maru-text-muted)]">Especialistas</summary>
            <div className="space-y-1 mt-1">{specialistItems.map(renderItem)}</div>
          </details>
          <div className="md:hidden space-y-1">{specialistItems.map(renderItem)}</div>
          <section>
            <div className="hidden md:block px-3 mb-1.5 text-[10px] font-mono uppercase tracking-[.15em] text-[var(--maru-text-dim)]">Sistema</div>
            {renderItem({ id: 'settings', label: 'Ajustes', icon: Settings })}
          </section>
          <button
            onClick={onLogout}
            className="w-full min-h-10 flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm text-[var(--maru-danger)] hover:bg-red-50"
            title="Cerrar sesión"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="hidden md:block">Cerrar sesión</span>
          </button>
        </nav>
      </div>

      <details className="maru-disclosure border-t border-[var(--maru-border-soft)] p-3 text-xs font-mono bg-[var(--maru-bg-elevated)]">
        <summary className="px-1">
          <span className="flex items-center gap-2 text-[var(--maru-text-muted)]">
            <Cpu size={14} className="text-[var(--maru-gold)]" />
            <span className="hidden md:inline">Motor local</span>
          </span>
          <span className="hidden md:inline">
          {ollamaActive === null ? (
            <span className="text-[10px] text-[var(--maru-text-dim)]">Verificando</span>
          ) : ollamaActive ? (
            <span className="maru-chip maru-status-success">
              <CheckCircle2 size={12} /> Activo · {modelsCount}
            </span>
          ) : (
            <span className="maru-chip maru-status-danger">
              <XCircle size={12} /> Sin conexión
            </span>
          )}
          </span>
        </summary>

        {ollamaActive && (
          <div className="hidden md:block space-y-1 pt-2">
            {[
              { name: 'e2b-q4→e2b', ram: '3–7G', role: 'Rápido' },
              { name: 'e4b-q4→e4b', ram: '5–10G', role: 'Cerebro' },
              { name: '12b-q4→12b', ram: '7–8G', role: 'Visión' },
              { name: 'cloud→31b', ram: 'Cloud', role: 'Nube liviana' }
            ].map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[var(--maru-surface)] border border-[var(--maru-border-soft)]"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[var(--maru-text-muted)]">{m.name}</span>
                </span>
                <span className="text-[var(--maru-text-dim)] text-[9px]">{m.ram}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setIsOfflineMode(!isOfflineMode)}
          className={`hidden md:flex mt-2 w-full items-center justify-between px-2.5 py-2 rounded-lg text-[11px] transition-colors border ${
            isOfflineMode
              ? 'bg-[var(--maru-gold)]/15 text-[var(--maru-gold)] border-[var(--maru-gold)]/35'
              : 'bg-emerald-50 text-[var(--maru-success)] border-emerald-200'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Radio size={12} />
            <span>{isOfflineMode ? '100% Offline' : 'Modo Híbrido'}</span>
          </span>
          {isOfflineMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
        </button>

        {isEphemeralMode && (
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-red-50 text-[var(--maru-danger)] border border-red-200">
            <Flame size={12} className="animate-pulse" />
            <span className="font-semibold text-[10px]">Modo Efímero ON</span>
          </div>
        )}
      </details>
    </aside>
  );
};
