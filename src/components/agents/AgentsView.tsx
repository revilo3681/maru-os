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
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#F5F1E8] text-[#2C3E50]">
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-wider text-[#4A9B9D]">Ecosistema MARU OS</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E3A5F]">
          Los 7 Agentes Cognitivos
        </h1>
        <p className="text-xs text-[#6B7F8C]">
          Cada agente posee su propia voz, especialidad, modelo optimizado y esfera 3D reactiva.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENTS_CATALOG.map((agent) => {
          const isSelected = activeAgentId === agent.id;
          return (
            <div
              key={agent.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between transition-all ${
                isSelected ? 'border-[#4A9B9D] ring-2 ring-[#4A9B9D]/30' : 'border-[#E3DCCB] hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                {/* 3D Sphere Visualizer */}
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
                    <h3 className="font-serif font-bold text-xl text-[#1E3A5F]">{agent.name}</h3>
                    {isSelected && <CheckCircle2 size={16} className="text-[#4A9B9D]" />}
                  </div>
                  <p className="text-xs font-mono text-[#B8924A]">{agent.quechuaMeaning}</p>
                  <p className="text-xs font-semibold text-[#4A9B9D]">{agent.specialty}</p>
                </div>

                <p className="text-xs text-[#6B7F8C] italic font-serif text-center">
                  "{agent.catchphrase}"
                </p>

                <p className="text-xs text-[#2C3E50] leading-relaxed">
                  {agent.description}
                </p>

                <div className="p-2.5 bg-[#F5F1E8] rounded-xl text-[11px] font-mono text-[#6B7F8C] space-y-1">
                  <div>🧠 <strong>Modelo:</strong> {agent.modelPreferred}</div>
                  <div>🎤 <strong>Voz:</strong> {agent.voiceTone}</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => AudioService.speakText(`Hola, soy ${agent.name}. ${agent.catchphrase}`, agent.id)}
                  className="p-2.5 border border-[#E3DCCB] rounded-xl text-[#2C3E50] hover:bg-[#F5F1E8] transition-colors"
                  title="Escuchar muestra de voz"
                >
                  <Volume2 size={16} />
                </button>

                <button
                  onClick={() => {
                    onSelectAgent(agent.id);
                    onNavigateToChat();
                  }}
                  className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#2C3E50] text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 shadow transition-colors"
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
