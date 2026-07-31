import React from 'react';
import { AGENTS_CATALOG } from '../../data/agentsData';
import { AgentSphere3D } from '../canvas/AgentSphere3D';
import { AgentId } from '../../types';
import { Volume2, MessageSquare, CheckCircle2 } from 'lucide-react';
import { AudioService } from '../../services/audioService';
import { useEngineConfig } from '../../context/EngineConfigContext';

interface AgentsViewProps {
  activeAgentId: AgentId;
  onSelectAgent: (id: AgentId) => void;
  onNavigateToChat: () => void;
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  activeAgentId,
  onSelectAgent,
  onNavigateToChat
}) => {
  const { enabledAgents } = useEngineConfig();
  const agents = AGENTS_CATALOG.filter((a) => enabledAgents.includes(a.id));

  return (
    <div className="maru-page space-y-8">
      <div className="maru-page-header">
      <div className="space-y-2 max-w-2xl">
        <div className="maru-eyebrow">
          Ecosistema MARU OS
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--maru-text)] tracking-tight">
          Especialistas cognitivos
        </h1>
        <p className="text-sm text-[var(--maru-text-muted)] leading-relaxed">
          Elige una perspectiva. MARU conserva el contexto y coordina especialistas cuando lo necesitas.
          {agents.length < AGENTS_CATALOG.length && (
            <span className="block mt-1 text-[var(--maru-text-dim)]">
              {AGENTS_CATALOG.length - agents.length} desactivado(s) en Ajustes.
            </span>
          )}
        </p>
      </div>
      <button onClick={onNavigateToChat} className="maru-btn-primary">
        <MessageSquare size={16} /> Conversar con el agente seleccionado
      </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const isSelected = activeAgentId === agent.id;
          return (
            <div
              key={agent.id}
              className={`rounded-[var(--maru-radius-lg)] p-5 space-y-4 flex flex-col justify-between transition-all border ${
                isSelected
                  ? 'bg-[var(--maru-surface)] border-[var(--maru-primary)] shadow-[var(--maru-shadow-md)]'
                  : 'bg-[var(--maru-surface)] border-[var(--maru-border-soft)] hover:border-[var(--maru-primary)]/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-center py-2">
                  <AgentSphere3D
                    agentId={agent.id}
                    size={110}
                    isSelected={isSelected}
                    onClick={() => onSelectAgent(agent.id)}
                  />
                </div>

                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="font-display font-bold text-xl text-[var(--maru-text)]">{agent.name}</h3>
                    {isSelected && <CheckCircle2 size={16} className="text-[var(--maru-primary)]" />}
                  </div>
                  <p className="text-xs font-mono text-[var(--maru-gold)]">{agent.quechuaMeaning}</p>
                  <p className="text-xs font-semibold text-[var(--maru-text-muted)]">{agent.specialty}</p>
                </div>

                <p className="text-base text-[var(--maru-gold-deep)] italic font-serif text-center">
                  &ldquo;{agent.catchphrase}&rdquo;
                </p>

                <p className="text-xs text-[var(--maru-text-muted)] leading-relaxed">
                  {agent.description}
                </p>

                <details className="maru-disclosure bg-[var(--maru-surface-muted)] rounded-[10px] px-3 text-xs">
                  <summary>Detalles técnicos</summary>
                  <div className="pb-3 font-mono text-[11px] text-[var(--maru-text-muted)] space-y-1">
                  <div>
                    <strong className="text-[var(--maru-text-muted)]">Modelo:</strong> {agent.modelPreferred}
                  </div>
                  <div>
                    <strong className="text-[var(--maru-text-muted)]">Voz:</strong> {agent.voiceTone}
                  </div>
                  </div>
                </details>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() =>
                    AudioService.speakText(`Hola, soy ${agent.name}. ${agent.catchphrase}`, agent.id)
                  }
                  className="maru-btn-secondary px-3"
                  title="Escuchar muestra de voz"
                >
                  <Volume2 size={16} />
                </button>

                <button
                  onClick={() => {
                    onSelectAgent(agent.id);
                    onNavigateToChat();
                  }}
                  className={`flex-1 ${isSelected ? 'maru-btn-primary' : 'maru-btn-secondary'}`}
                >
                  <MessageSquare size={14} />
                  <span>{isSelected ? `Conversar con ${agent.name}` : `Elegir ${agent.name}`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
