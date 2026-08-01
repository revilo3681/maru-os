import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiService, EngineConfig } from '../services/apiService';
import { AGENTS_CATALOG } from '../data/agentsData';

const LOCAL_KEY = 'maru_engine_config_local';

const DEFAULT_CONFIG: EngineConfig = {
  engineMode: 'manual',
  manualModel: 'gemma4:e2b-q4',
  enabledAgents: AGENTS_CATALOG.map((a) => a.id)
};

function loadLocalConfig(): EngineConfig | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EngineConfig;
    if (!parsed.enabledAgents?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistLocal(cfg: EngineConfig) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

export interface EngineConfigContextValue extends EngineConfig {
  /** true mientras se carga la configuración inicial del backend */
  loading: boolean;
  /** Vuelve a leer la configuración persistida del backend */
  refresh: () => Promise<void>;
  /** Guarda cambios parciales (persiste en backend y actualiza el estado local) */
  save: (partial: Partial<EngineConfig>) => Promise<void>;
}

const EngineConfigContext = createContext<EngineConfigContextValue>({
  ...DEFAULT_CONFIG,
  loading: false,
  refresh: async () => {},
  save: async () => {}
});

export const EngineConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<EngineConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const local = loadLocalConfig();
    if (local && mountedRef.current) setConfig(local);
    const remote = await ApiService.getConfig();
    if (remote && mountedRef.current) {
      const agents =
        remote.enabledAgents?.length
          ? remote.enabledAgents
          : local?.enabledAgents ?? DEFAULT_CONFIG.enabledAgents;
      const next = {
        engineMode: remote.engineMode ?? DEFAULT_CONFIG.engineMode,
        manualModel: remote.manualModel ?? DEFAULT_CONFIG.manualModel,
        enabledAgents: agents
      };
      setConfig(next);
      persistLocal(next);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      if (mountedRef.current) setLoading(false);
    })();
  }, [refresh]);

  const save = useCallback(async (partial: Partial<EngineConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      if (!next.enabledAgents?.length) {
        next.enabledAgents = [prev.enabledAgents[0] || AGENTS_CATALOG[0].id];
      }
      persistLocal(next);
      return next;
    });
    const persisted = await ApiService.saveConfig(partial);
    if (persisted && mountedRef.current) {
      const agents =
        persisted.enabledAgents?.length
          ? persisted.enabledAgents
          : loadLocalConfig()?.enabledAgents ?? DEFAULT_CONFIG.enabledAgents;
      const next = {
        engineMode: persisted.engineMode ?? DEFAULT_CONFIG.engineMode,
        manualModel: persisted.manualModel ?? DEFAULT_CONFIG.manualModel,
        enabledAgents: agents
      };
      setConfig(next);
      persistLocal(next);
    }
  }, []);

  const value = useMemo<EngineConfigContextValue>(
    () => ({ ...config, loading, refresh, save }),
    [config, loading, refresh, save]
  );

  return <EngineConfigContext.Provider value={value}>{children}</EngineConfigContext.Provider>;
};

export function useEngineConfig(): EngineConfigContextValue {
  return useContext(EngineConfigContext);
}
