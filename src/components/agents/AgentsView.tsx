import React from 'react';
import { AGENTS_CATALOG } from '../../data/agentsData';
import { AgentSphere3D } from '../canvas/AgentSphere3D';
import { AgentId } from '../../types';
import { Volume2, MessageSquare, CheckCircle2 } from 'lucide-react';
import { AudioService } from '../../services/audioService';

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
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[var(--maru-bg-elevated)] text-[var(--maru-text)]">
      <div className="space-y-2 max-w-2xl">
        <div className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--maru-gold)]">
          Ecosistema MARU OS
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
          Los 7 Agentes Cognitivos
        </h1>
        <p className="text-sm text-[var(--maru-text-muted)] leading-relaxed">
          Cada agente posee su propia voz, especialidad, modelo optimizado y esfera 3D reactiva.
          Selecciona uno para conversar en el manantial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENTS_CATALOG.map((agent) => {
          const isSelected = activeAgentId === agent.id;
          return (
            <div
              key={agent.id}
              className={`rounded-xl p-6 space-y-4 flex flex-col justify-between transition-all border ${
                isSelected
                  ? 'bg-[var(--maru-surface)] border-[var(--maru-gold)]/50 shadow-[0_0_32px_rgba(212,175,55,0.12)]'
                  : 'bg-[var(--maru-surface)]/60 border-[var(--maru-border-soft)] hover:border-[var(--maru-gold)]/25'
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
                    <h3 className="font-display font-bold text-xl text-white">{agent.name}</h3>
                    {isSelected && <CheckCircle2 size={16} className="text-[var(--maru-gold)]" />}
                  </div>
                  <p className="text-xs font-mono text-[var(--maru-gold)]">{agent.quechuaMeaning}</p>
                  <p className="text-xs font-semibold text-[var(--maru-text-muted)]">{agent.specialty}</p>
                </div>

                <p className="text-xs text-[var(--maru-gold-soft)] italic font-serif text-center">
                  &ldquo;{agent.catchphrase}&rdquo;
                </p>

                <p className="text-xs text-[var(--maru-text-muted)] leading-relaxed">
                  {agent.description}
                </p>

                <div className="p-2.5 bg-[var(--maru-void)]/60 rounded-lg text-[11px] font-mono text-[var(--maru-text-dim)] space-y-1 border border-[var(--maru-border-soft)]">
                  <div>
                    <strong className="text-[var(--maru-text-muted)]">Modelo:</strong> {agent.modelPreferred}
                  </div>
                  <div>
                    <strong className="text-[var(--maru-text-muted)]">Voz:</strong> {agent.voiceTone}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() =>
                    AudioService.speakText(`Hola, soy ${agent.name}. ${agent.catchphrase}`, agent.id)
                  }
                  className="p-2.5 border border-[var(--maru-border-soft)] rounded-lg text-[var(--maru-text-muted)] hover:text-white hover:border-[var(--maru-gold)]/40 transition-colors"
                  title="Escuchar muestra de voz"
                >
                  <Volume2 size={16} />
                </button>

                <button
                  onClick={() => {
                    onSelectAgent(agent.id);
                    onNavigateToChat();
                  }}
                  className="flex-1 py-2.5 maru-btn-gold rounded-lg text-xs font-display flex items-center justify-center gap-2"
                >
                  <MessageSquare size={14} />
                  <span>Conversar con {agent.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
