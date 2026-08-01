import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  Flame,
  Volume2,
  KeyRound,
  Download,
  Trash2,
  AlertTriangle,
  Mail,
  Cpu,
  Users,
  RefreshCw,
  Zap,
  Scale,
  Eye,
  Cloud,
  HardDrive,
  Clock,
  Activity,
  Sun,
  Moon
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { applyThemeMode } from '../../services/themeService';
import { AppSettings, AgentId } from '../../types';
import { ApiService, ModelsResponse } from '../../services/apiService';
import { AGENTS_CATALOG } from '../../data/agentsData';
import { useEngineConfig } from '../../context/EngineConfigContext';
import { KnowledgeVaultPanel } from '../memory/KnowledgeVaultPanel';

interface SettingsViewProps {
  onWipeData: () => void;
}

/** Los 4 modelos seleccionables en modo Manual (cuantizado → fallback normal automático) */
const SELECTABLE_MODELS: { id: string; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'gemma4:e2b-q4', label: 'Gemma 4 · E2B (Q4)', desc: 'Cuantizado primero · si no hay Q4 usa gemma4:e2b · por defecto', icon: <Zap size={16} className="text-[#FF9500]" /> },
  { id: 'gemma4:e4b-q4', label: 'Gemma 4 · E4B (Q4)', desc: 'Cuantizado primero · si no hay Q4 usa gemma4:e4b', icon: <Scale size={16} className="text-[#007AFF]" /> },
  { id: 'gemma4:12b-q4', label: 'Gemma 4 · 12B (Q4)', desc: 'Cuantizado primero · si no hay Q4 usa gemma4:12b', icon: <Eye size={16} className="text-[#5856D6]" /> },
  { id: 'gemma4:cloud', label: 'Gemma 4 · Cloud', desc: 'Nube liviana (preferida) · fallback gemma4:31b-cloud', icon: <Cloud size={16} className="text-[#8E8E93]" /> }
];

export const SettingsView: React.FC<SettingsViewProps> = ({ onWipeData }) => {
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [showSeed, setShowSeed] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [gmailEmail, setGmailEmail] = useState(() => localStorage.getItem('maru_gmail_email') || '');
  const [gmailAppPass, setGmailAppPass] = useState(() => localStorage.getItem('maru_gmail_app_pass') || '');
  const [gmailSaved, setGmailSaved] = useState(false);

  // ── Motor de Inteligencia (Fase 2) ─────────────────────────────
  const engineConfig = useEngineConfig();
  const [models, setModels] = useState<ModelsResponse | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<'ok' | 'fail' | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const fetchModels = useCallback(async () => {
    const t0 = performance.now();
    const res = await ApiService.getModels();
    setLatencyMs(Math.round(performance.now() - t0));
    setModels(res);
    return res;
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleTestConnection = async () => {
    setCheckingConnection(true);
    setLastCheckResult(null);
    const res = await fetchModels();
    setLastCheckResult(res?.ollamaConnected ? 'ok' : 'fail');
    setCheckingConnection(false);
    setTimeout(() => setLastCheckResult(null), 5000);
  };

  const account = StorageService.getAccount();
  const daysWithMaru = (() => {
    if (!account?.createdAt) return 0;
    const ms = Date.now() - new Date(account.createdAt).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  })();
  const memoryEstimateMb = (() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        total += (localStorage.getItem(k) || '').length * 2;
      }
      return Math.max(1, Math.round(total / (1024 * 1024) * 10) / 10);
    } catch {
      return 0;
    }
  })();

  const ollamaConnected = models?.ollamaConnected ?? false;
  const installedModels = models?.installedModels ?? [];

  const isModelInstalled = (modelId: string): boolean => {
    const catalogEntry = models?.catalog?.find((c) => c.id === modelId);
    if (catalogEntry) return catalogEntry.installed;
    // Familia: Q4 o normal cuentan como disponibles
    const familyHints: Record<string, string[]> = {
      'gemma4:e2b-q4': ['gemma4:e2b-q4', 'gemma4:e2b'],
      'gemma4:e4b-q4': ['gemma4:e4b-q4', 'gemma4:e4b'],
      'gemma4:12b-q4': ['gemma4:12b-q4', 'gemma4:12b'],
      'gemma4:cloud': ['gemma4:cloud', 'gemma4:31b-cloud'],
      'gemma4:31b-cloud': ['gemma4:cloud', 'gemma4:31b-cloud']
    };
    const aliases = familyHints[modelId] || [modelId];
    return aliases.some((a) => installedModels.some((m) => m === a || m.startsWith(`${a}:`)));
  };

  const resolvedLabel = (modelId: string): string | null => {
    const entry = models?.catalog?.find((c) => c.id === modelId);
    if (entry?.resolvedName && entry.resolvedName !== modelId) {
      return `→ usa ${entry.resolvedName}`;
    }
    return null;
  };

  const handleToggleAgent = (agentId: AgentId) => {
    const current = engineConfig.enabledAgents;
    const turningOff = current.includes(agentId);
    if (turningOff && current.length <= 1) {
      // Mínimo 1 especialista activo
      return;
    }
    const next = turningOff
      ? current.filter((id) => id !== agentId)
      : [...current, agentId];
    void engineConfig.save({ enabledAgents: next });
    void import('../../services/knowledgeSync').then(({ syncAgentsChange }) => {
      syncAgentsChange(
        next,
        turningOff
          ? `Especialista desactivado: ${agentId}. Activos: ${next.join(', ')}`
          : `Especialista activado: ${agentId}. Activos: ${next.join(', ')}`
      );
    });
  };

  const handleToggleSettings = (key: keyof AppSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    StorageService.saveSettings(updated);
    setSettings(updated);
    void import('../../services/knowledgeSync').then(({ syncSettingsChange }) => {
      syncSettingsChange(`Ajuste «${String(key)}» → ${updated[key] ? 'activado' : 'desactivado'}`);
    });
  };

  const handleThemeMode = (themeMode: AppSettings['themeMode']) => {
    const updated = { ...settings, themeMode };
    StorageService.saveSettings(updated);
    applyThemeMode(themeMode);
    setSettings(updated);
    void import('../../services/knowledgeSync').then(({ syncSettingsChange }) => {
      syncSettingsChange(`Tema de interfaz: ${themeMode}`);
    });
  };

  const handleExportJSON = () => {
    const jsonStr = StorageService.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maru-os-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmWipe = () => {
    if (wipeConfirmText === 'BORRAR TODO') {
      StorageService.wipeAllData();
      onWipeData();
    }
  };

  return (
    <div className="maru-page space-y-6">
      <div className="space-y-1">
        <div className="maru-eyebrow">Configuración y privacidad</div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--maru-text)]">
          Ajustes del Sistema MARU OS
        </h1>
        <p className="text-xs text-[var(--maru-text-muted)]">
          Controla la privacidad, seguridad, modo efímero y exportación de tus datos.
        </p>
      </div>

      {/* Motor de Inteligencia (Fase 2 · item 2.1) */}
      <div className="maru-panel space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <Cpu className="text-[#5856D6]" size={20} />
          Motor de Inteligencia
        </h3>

        {/* Estado de Ollama en vivo */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#F2F2F7] rounded-xl">
          <div className="space-y-1">
            <div className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${ollamaConnected ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`}
              />
              {ollamaConnected ? '🟢 Ollama conectado' : '🔴 Ollama desconectado'}
            </div>
            <p className="text-xs text-[var(--maru-text-muted)]">
              {ollamaConnected
                ? `${installedModels.length} modelo${installedModels.length === 1 ? '' : 's'} disponible${installedModels.length === 1 ? '' : 's'} localmente`
                : 'No se pudo contactar al servidor local (puerto 11434).'}
            </p>
            {ollamaConnected && installedModels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {installedModels.map((m) => (
                  <span key={m} className="px-2 py-0.5 bg-white rounded-md text-[10px] font-mono text-[var(--maru-text-muted)] border border-[var(--maru-border-soft)]">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleTestConnection}
            disabled={checkingConnection}
            className="px-4 py-2 bg-white hover:bg-gray-50 border border-[var(--maru-border-soft)] text-[var(--maru-text)] text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={checkingConnection ? 'animate-spin' : ''} />
            {checkingConnection
              ? 'Probando...'
              : lastCheckResult === 'ok'
                ? '✓ Conexión verificada'
                : lastCheckResult === 'fail'
                  ? '✗ Sin conexión'
                  : 'Probar conexión'}
          </button>
        </div>

        {/* Selector de modo: Router vs Manual */}
        <div className="space-y-2">
          <div className="font-bold text-sm text-[var(--maru-text)]">Modo de selección de modelo</div>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F2F2F7] rounded-xl">
            <button
              onClick={() => engineConfig.save({ engineMode: 'router' })}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                engineConfig.engineMode === 'router'
                  ? 'bg-white text-[#5856D6] shadow-sm'
                  : 'text-[var(--maru-text-muted)] hover:text-[var(--maru-text)]'
              }`}
            >
              Router (Automático)
              <div className="font-normal text-[10px] mt-0.5 opacity-70">Q4 primero · si no hay, versión normal</div>
            </button>
            <button
              onClick={() => engineConfig.save({ engineMode: 'manual' })}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                engineConfig.engineMode === 'manual'
                  ? 'bg-white text-[#5856D6] shadow-sm'
                  : 'text-[var(--maru-text-muted)] hover:text-[var(--maru-text)]'
              }`}
            >
              Manual
              <div className="font-normal text-[10px] mt-0.5 opacity-70">Un modelo fijo · mismo fallback Q4→normal</div>
            </button>
          </div>
          <p className="text-[11px] text-[var(--maru-text-muted)]">
            Prioridad: cuantizado (Q4) → normal sin cuantizar. Cloud: <code className="font-mono">gemma4:cloud</code> antes que 31b.
          </p>
        </div>

        {/* Selector de modelo fijo (solo en modo Manual) */}
        {engineConfig.engineMode === 'manual' && (
          <div className="space-y-2">
            <div className="font-bold text-sm text-[var(--maru-text)]">Modelo fijo (familia)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SELECTABLE_MODELS.map((model) => {
                const isSelected =
                  engineConfig.manualModel === model.id ||
                  (model.id === 'gemma4:cloud' && engineConfig.manualModel === 'gemma4:31b-cloud');
                const installed = isModelInstalled(model.id);
                const resolved = resolvedLabel(model.id);
                return (
                  <button
                    key={model.id}
                    onClick={() => engineConfig.save({ manualModel: model.id })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#5856D6] bg-[#5856D6]/5 shadow-sm'
                        : 'border-[var(--maru-border-soft)] bg-[#F2F2F7] hover:border-[#5856D6]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-xs text-[var(--maru-text)]">
                        {model.icon}
                        {model.label}
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${installed ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'}`}
                        title={installed ? 'Familia disponible en Ollama' : 'No detectado en Ollama'}
                      />
                    </div>
                    <div className="text-[11px] text-[var(--maru-text-muted)] mt-1">{model.desc}</div>
                    <div className="text-[10px] font-mono text-[var(--maru-text-muted)] mt-1 opacity-70">{model.id}</div>
                    {resolved && (
                      <div className="text-[10px] font-mono text-[#34C759] mt-0.5">{resolved}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detalles del sistema (antes en Inicio) */}
      <div className="maru-panel space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <Activity className="text-[#4A9B9D]" size={20} />
          Detalles del sistema
        </h3>
        <p className="text-xs text-[var(--maru-text-muted)]">
          Métricas locales del motor. Antes aparecían en Inicio; ahora viven aquí en Ajustes.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            {
              icon: Users,
              label: 'Agentes activos',
              value: String(engineConfig.enabledAgents.length),
              accent: '#007AFF'
            },
            {
              icon: HardDrive,
              label: 'Memoria local',
              value: `${memoryEstimateMb} MB`,
              accent: '#5856D6'
            },
            {
              icon: Zap,
              label: 'Latencia Ollama',
              value: latencyMs != null ? `${latencyMs} ms` : '—',
              accent: '#FF9500'
            },
            {
              icon: Clock,
              label: 'Con MARU OS',
              value: daysWithMaru === 0 ? 'Hoy' : `${daysWithMaru} día${daysWithMaru === 1 ? '' : 's'}`,
              accent: '#5A8F6B'
            }
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="p-3 rounded-xl bg-[#F2F2F7] flex items-center gap-3">
                <div
                  className="p-2 rounded-[10px]"
                  style={{ backgroundColor: `${m.accent}18`, color: m.accent }}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-base font-bold font-mono text-[var(--maru-text)]">{m.value}</div>
                  <div className="text-[10px] text-[var(--maru-text-muted)]">{m.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Especialistas Activos (Fase 2 · item 2.2) */}
      <div className="maru-panel space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <Users className="text-[#007AFF]" size={20} />
          Especialistas Activos
        </h3>
        <p className="text-xs text-[var(--maru-text-muted)]">
          Activa o desactiva a los 7 especialistas de MARU. Los agentes desactivados no participarán del enrutado ni de los paneles.
          Siempre debe quedar al menos 1 activo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AGENTS_CATALOG.map((agent) => {
            const enabled = engineConfig.enabledAgents.includes(agent.id);
            return (
              <div
                key={agent.id}
                className="flex items-center justify-between gap-3 p-3 bg-[#F2F2F7] rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-display font-bold shrink-0"
                    style={{ backgroundColor: agent.colorPrimary, opacity: enabled ? 1 : 0.4 }}
                  >
                    {agent.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className={`font-bold text-sm truncate ${enabled ? 'text-[var(--maru-text)]' : 'text-[var(--maru-text-muted)]'}`}>
                      {agent.name}
                    </div>
                    <div className="text-[11px] text-[var(--maru-text-muted)] truncate">{agent.specialty}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleAgent(agent.id)}
                  disabled={enabled && engineConfig.enabledAgents.length <= 1}
                  title={
                    enabled && engineConfig.enabledAgents.length <= 1
                      ? 'Debe quedar al menos 1 especialista activo'
                      : undefined
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 disabled:opacity-40 ${
                    enabled ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Apariencia — tema claro / oscuro */}
      <div className="maru-panel space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <Sun className="text-[var(--maru-gold)]" size={20} />
          Apariencia
        </h3>
        <p className="text-xs text-[var(--maru-text-muted)]">
          Elige el tema de la interfaz. Se guarda en este dispositivo.
        </p>
        <div className="flex flex-wrap gap-2">
          {([
            { mode: 'day' as const, label: 'Claro', icon: Sun },
            { mode: 'night' as const, label: 'Oscuro', icon: Moon }
          ]).map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleThemeMode(mode)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-display font-semibold border transition-colors ${
                settings.themeMode === mode
                  ? 'border-[var(--maru-primary)] bg-[var(--maru-primary-soft)] text-[var(--maru-primary)]'
                  : 'border-[var(--maru-border)] bg-[var(--maru-surface)] text-[var(--maru-text-muted)] hover:border-[var(--maru-primary)]'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <KnowledgeVaultPanel />

      {/* Privacidad & Modo Efímero */}
      <div className="maru-panel space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <ShieldCheck className="text-[#34C759]" size={20} />
          Privacidad & Modos de Memoria
        </h3>

        <div className="space-y-3">
          {/* Ephemeral Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#F2F2F7] rounded-xl border border-transparent">
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                <Flame size={18} className="text-[#FF3B30]" />
                Modo Efímero (Sin Guardar Historial)
              </div>
              <p className="text-xs text-[var(--maru-text-muted)]">
                Cuando está activo, ninguna conversación o dato se guarda en PostgreSQL ni en el grafo RAG.
              </p>
            </div>
            <button
              onClick={() => handleToggleSettings('ephemeralMode')}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.ephemeralMode ? 'bg-[#FF3B30]' : 'bg-[#E5E5EA]'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.ephemeralMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Voice Readout Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#F2F2F7] rounded-xl border border-transparent">
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-[var(--maru-text)] flex items-center gap-2">
                <Volume2 size={18} className="text-[#007AFF]" />
                Lectura Automática de Voz (TTS)
              </div>
              <p className="text-xs text-[var(--maru-text-muted)]">
                MARU OS leerá cada respuesta generada con la voz del agente activo.
              </p>
            </div>
            <button
              onClick={() => handleToggleSettings('voiceReadoutEnabled')}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.voiceReadoutEnabled ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.voiceReadoutEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Gmail Integración Real */}
      <details className="maru-disclosure maru-panel px-6">
        <summary>Conexión con Gmail</summary>
        <div className="pt-3 space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <Mail className="text-[#FF3B30]" size={20} />
          Configuración avanzada de correo
        </h3>
        <p className="text-xs text-[var(--maru-text-muted)]">
          Ingresa tus credenciales o contraseña de aplicación (App Password de 16 dígitos de Google) para autorizar la lectura de notificaciones en segundo plano y la creación de borradores directos.
        </p>

        <div className="space-y-3 max-w-md text-xs">
          <div>
            <label className="block font-bold text-[var(--maru-text)] mb-1">Correo Gmail:</label>
            <input 
              type="email" 
              value={gmailEmail} 
              onChange={(e) => setGmailEmail(e.target.value)} 
              placeholder="tuusuario@gmail.com"
              className="w-full px-3 py-2 border border-transparent rounded-xl bg-[#F2F2F7] focus:border-[#007AFF] outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-[var(--maru-text)] mb-1">Contraseña de Aplicación / App Token:</label>
            <input 
              type="password" 
              value={gmailAppPass} 
              onChange={(e) => setGmailAppPass(e.target.value)} 
              placeholder="•••• •••• •••• ••••"
              className="w-full px-3 py-2 border border-transparent rounded-xl bg-[#F2F2F7] font-mono focus:border-[#007AFF] outline-none"
            />
          </div>
          <button 
            onClick={() => {
              localStorage.setItem('maru_gmail_email', gmailEmail);
              localStorage.setItem('maru_gmail_app_pass', gmailAppPass);
              setGmailSaved(true);
              setTimeout(() => setGmailSaved(false), 3000);
            }}
            className="px-4 py-2 bg-[#007AFF] hover:bg-[#0056B3] text-white rounded-xl font-bold transition-all shadow-sm"
          >
            {gmailSaved ? '✓ Credenciales Guardadas Localmente' : 'Guardar Credenciales Gmail'}
          </button>
        </div>
        </div>
      </details>

      {/* Account & Recovery Phrase */}
      <div className="bg-white border border-[var(--maru-border-soft)] p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <KeyRound className="text-[#FF9500]" size={20} />
          Seguridad & Frase de Recuperación
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <span className="font-bold text-[var(--maru-text)]">Usuario:</span> {account?.username || 'oliver_revilo'}
          </div>
          {account?.passwordHint && (
            <div>
              <span className="font-bold text-[var(--maru-text)]">Pista de Contraseña:</span> {account.passwordHint}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => setShowSeed(!showSeed)}
              className="px-4 py-2 border border-[var(--maru-border-soft)] rounded-xl text-xs font-mono text-[var(--maru-text)] hover:bg-[#F2F2F7]"
            >
              {showSeed ? 'Ocultar Frase de 12 Palabras' : '👁️ Ver Frase de 12 Palabras'}
            </button>

            {showSeed && account?.recoveryPhrase && (
              <div className="mt-3 p-4 bg-[#F2F2F7] text-[var(--maru-text)] rounded-xl font-mono grid grid-cols-3 sm:grid-cols-4 gap-2">
                {account.recoveryPhrase.map((word, idx) => (
                  <div key={idx} className="bg-white p-1.5 rounded shadow-sm">
                    <span className="text-[#007AFF]">{idx + 1}.</span> {word}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export & Destructive Actions */}
      <div className="bg-white border border-[var(--maru-border-soft)] p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-lg text-[var(--maru-text)] border-b border-[var(--maru-border-soft)] pb-2 flex items-center gap-2">
          <Download className="text-[var(--maru-text)]" size={20} />
          Exportar o Eliminar Datos
        </h3>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExportJSON}
            className="px-5 py-2.5 bg-[#F2F2F7] hover:bg-gray-200 text-[var(--maru-text)] text-xs font-medium rounded-xl flex items-center gap-2 shadow-sm"
          >
            <Download size={16} />
            <span>Exportar Todos mis Datos (JSON)</span>
          </button>

          <button
            onClick={() => setShowWipeModal(true)}
            className="px-5 py-2.5 bg-[#FF3B30] hover:bg-[#D32F2F] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm"
          >
            <Trash2 size={16} />
            <span>Borrar Todo Mi Historial y Cuenta</span>
          </button>
        </div>
      </div>

      {/* BORRAR TODO Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 bg-[#1C1C1E]/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 text-[var(--maru-text)]">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-display font-bold text-[#FF3B30]">
                ⚠️ ELIMINAR CUENTA Y DATOS PERMANENTEMENTE
              </h2>
              <p className="text-xs text-[var(--maru-text-muted)]">
                Esta acción eliminará para siempre tu usuario, historial, hábitos, perfil médico y nodos de memoria RAG en este dispositivo.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-[var(--maru-text)]">
                Escribe <strong className="text-[#FF3B30]">BORRAR TODO</strong> para confirmar:
              </label>
              <input
                type="text"
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                placeholder="BORRAR TODO"
                className="w-full px-4 py-2.5 border border-[#FF3B30] bg-[#FF3B30]/5 rounded-xl text-sm font-bold text-[#FF3B30] focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowWipeModal(false)}
                className="flex-1 py-2.5 bg-[#F2F2F7] hover:bg-gray-200 text-[var(--maru-text)] rounded-xl text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmWipe}
                disabled={wipeConfirmText !== 'BORRAR TODO'}
                className="flex-1 py-2.5 bg-[#FF3B30] hover:bg-[#D32F2F] disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                BORRAR TODO PARA SIEMPRE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
