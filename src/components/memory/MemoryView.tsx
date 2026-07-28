import React from 'react';
import { StorageService } from '../../services/storageService';
import { Brain, Network, Database, Layers, ShieldCheck } from 'lucide-react';

export const MemoryView: React.FC = () => {
  const { nodes, edges } = StorageService.getKnowledgeGraph();
  const profile = StorageService.getProfile();
  const health = StorageService.getHealth();
  const location = StorageService.getLocation();

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#F5F1E8] text-[#2C3E50]">
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-wider text-[#4A9B9D]">RAG & Multi-Capa Memory</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E3A5F]">
          Las 4 Capas de Memoria Cognitiva
        </h1>
        <p className="text-xs text-[#6B7F8C]">
          MARU OS organiza tu información en PostgreSQL (estructurado), Qdrant (vectorial), Neo4j (grafo) y SQLite (caché Perú).
        </p>
      </div>

      {/* 4 Memory Layers Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E3DCCB] shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#1E3A5F] font-bold">
            <Database size={16} className="text-[#1E3A5F]" />
            <span>Capa 1: PostgreSQL</span>
          </div>
          <p className="text-xs text-[#6B7F8C]">Estructurado: Perfil ({profile.name}), Hábitos y Ajustes.</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E3DCCB] shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#4A9B9D] font-bold">
            <Layers size={16} className="text-[#4A9B9D]" />
            <span>Capa 2: Qdrant Vector</span>
          </div>
          <p className="text-xs text-[#6B7F8C]">Embeddings semánticos para búsqueda en conversaciones.</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E3DCCB] shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#B8924A] font-bold">
            <Network size={16} className="text-[#B8924A]" />
            <span>Capa 3: Neo4j Grafo</span>
          </div>
          <p className="text-xs text-[#6B7F8C]">Relaciones entre Alergias, Medicamentos y Ubicación.</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E3DCCB] shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#5A8F6B] font-bold">
            <ShieldCheck size={16} className="text-[#5A8F6B]" />
            <span>Capa 4: SQLite Perú</span>
          </div>
          <p className="text-xs text-[#6B7F8C]">Caché offline SENAMHI, IGP, MINSA e INEI.</p>
        </div>
      </div>

      {/* Interactive Knowledge Graph View */}
      <div className="bg-white border border-[#E3DCCB] p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3DCCB] pb-3">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-[#1E3A5F]">
            <Network className="text-[#B8924A]" size={18} />
            <span>Grafo de Conocimiento (Neo4j View)</span>
          </div>
          <span className="text-xs font-mono text-[#6B7F8C]">{nodes.length} Nodos · {edges.length} Relaciones</span>
        </div>

        <div className="bg-[#1E3A5F] p-6 rounded-xl text-white space-y-4">
          <div className="text-xs font-mono text-[#4A9B9D]">Nodos Activos en Grafo:</div>
          <div className="flex flex-wrap gap-3">
            {nodes.map((node) => (
              <div key={node.id} className="p-3 bg-[#2C3E50] border border-[#4A9B9D]/40 rounded-xl text-xs space-y-1">
                <div className="font-bold text-[#B8924A] uppercase font-mono text-[10px]">{node.type}</div>
                <div className="font-semibold text-white">{node.label}</div>
                {node.details && <div className="text-[11px] text-[#F5F1E8]/70">{node.details}</div>}
              </div>
            ))}
          </div>

          <div className="text-xs font-mono text-[#4A9B9D] pt-2">Relaciones Traversadas:</div>
          <div className="space-y-1 text-xs font-mono text-[#F5F1E8]/80">
            {edges.map((edge) => {
              const srcNode = nodes.find(n => n.id === edge.source);
              const tgtNode = nodes.find(n => n.id === edge.target);
              return (
                <div key={edge.id} className="flex items-center gap-2">
                  <span className="text-[#B8924A]">{srcNode?.label || edge.source}</span>
                  <span className="text-white/40">──[{edge.label}]──►</span>
                  <span className="text-[#4A9B9D]">{tgtNode?.label || edge.target}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
