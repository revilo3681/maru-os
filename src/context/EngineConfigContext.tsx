import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiService, EngineConfig } from '../services/apiService';
import { AGENTS_CATALOG } from '../data/agentsData';

const DEFAULT_CONFIG: EngineConfig = {
  engineMode: 'manual',
  manualModel: 'gemma4:e2b-mlx',
  enabledAgents: AGENTS_CATALOG.map((a) => a.id)
};

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
    const remote = await ApiService.getConfig();
    if (remote && mountedRef.current) {
      setConfig({
        engineMode: remote.engineMode ?? DEFAULT_CONFIG.engineMode,
        manualModel: remote.manualModel ?? DEFAULT_CONFIG.manualModel,
        enabledAgents: remote.enabledAgents ?? DEFAULT_CONFIG.enabledAgents
      });
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      if (mountedRef.current) setLoading(false);
    })();
  }, [refresh]);

  const save = useCallback(async (partial: Partial<EngineConfig>) => {
    // Actualización optimista para que la UI responda al instante
    setConfig((prev) => ({ ...prev, ...partial }));
    const persisted = await ApiService.saveConfig(partial);
    if (persisted && mountedRef.current) {
      setConfig({
        engineMode: persisted.engineMode ?? DEFAULT_CONFIG.engineMode,
        manualModel: persisted.manualModel ?? DEFAULT_CONFIG.manualModel,
        enabledAgents: persisted.enabledAgents ?? DEFAULT_CONFIG.enabledAgents
      });
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
