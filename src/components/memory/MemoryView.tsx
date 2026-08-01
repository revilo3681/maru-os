import React, { useEffect, useRef, useState } from 'react';
import { StorageService } from '../../services/storageService';
import { getAiPanelEvents, KNOWLEDGE_UPDATED_EVENT } from '../../services/knowledgeSync';
import { KnowledgeEdge, KnowledgeNode } from '../../types';
import { Network, Clock, Database, Layers, ShieldCheck, GitBranch } from 'lucide-react';
import { AGENTS_CATALOG } from '../../data/agentsData';
import { KnowledgeVaultPanel } from './KnowledgeVaultPanel';

const TYPE_COLOR: Record<KnowledgeNode['type'], string> = {
  user: '#B8924A',
  allergy: '#FF3B30',
  medication: '#007AFF',
  condition: '#FF9500',
  location: '#4A9B9D',
  risk: '#C0392B',
  agent: '#5856D6',
  note: '#8E8E93',
  event: '#34C759',
  habit: '#FF9500',
  project: '#5856D6',
  document: '#B8924A',
  mail: '#007AFF',
  preference: '#4A9B9D'
};

interface SimNode extends KnowledgeNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function buildTimeline() {
  const profile = StorageService.getProfile();
  const health = StorageService.getHealth();
  const panelEvents = getAiPanelEvents(12).map((ev) => ({
    at: ev.at.slice(0, 16).replace('T', ' '),
    agent: ev.agentId ? ev.agentId.toUpperCase() : 'Panel',
    text: ev.text,
    sender: 'system' as const
  }));
  const messages = AGENTS_CATALOG.flatMap((a) =>
    StorageService.getAgentMessages(a.id).slice(-3).map((m) => ({
      at: m.timestamp,
      agent: a.name,
      text: m.content.slice(0, 120),
      sender: m.sender
    }))
  );
  const events = StorageService.getCalendarEvents().slice(0, 5).map((e) => ({
    at: `${e.date} ${e.time}`,
    agent: 'Agenda',
    text: e.title,
    sender: 'system' as const
  }));

  return [
    { at: 'Perfil', agent: 'Sistema', text: `${profile.name} · ${profile.occupation}`, sender: 'system' },
    ...health.allergies.map((a) => ({ at: 'Salud', agent: 'Aya', text: `Alergia: ${a}`, sender: 'system' as const })),
    ...health.currentMedications.map((m) => ({
      at: 'Salud',
      agent: 'Aya',
      text: `Medicamento: ${m.name} ${m.dose}`,
      sender: 'system' as const
    })),
    ...panelEvents,
    ...events,
    ...messages.slice(-12)
  ];
}

export const MemoryView: React.FC = () => {
  const profile = StorageService.getProfile();

  const buildTree = (graphNodes: KnowledgeNode[]) => {
    const health = StorageService.getHealth();
    const loc = StorageService.getLocation();
    const habits = StorageService.getHabits();
    return {
      root: StorageService.getProfile().name || 'Usuario',
      branches: [
        {
          title: 'Salud',
          leaves: [
            ...health.allergies.map((a) => `Alergia: ${a}`),
            ...health.chronicConditions.map((c) => `Condición: ${c}`),
            ...health.currentMedications.map(
              (m) => `${m.name} ${m.dose}${m.purpose ? ` · ${m.purpose}` : ''}`
            )
          ]
        },
        {
          title: 'Lugar',
          leaves: [`${loc.city}${loc.district ? `, ${loc.district}` : ''}`, loc.country, loc.timezone]
        },
        {
          title: 'Hábitos',
          leaves: habits.map((h) => `${h.title} @ ${h.time} (${h.frequency})`)
        },
        {
          title: 'Grafo',
          leaves: graphNodes.map((n) => `${n.type}: ${n.label}${n.details ? ` — ${n.details}` : ''}`)
        },
        {
          title: 'Actividad IA',
          leaves: getAiPanelEvents(8).map((e) => e.text)
        },
        {
          title: 'Agentes',
          leaves: AGENTS_CATALOG.map((a) => `${a.name} — ${a.specialty}`)
        }
      ]
    };
  };

  const [graph, setGraph] = useState(() => StorageService.getKnowledgeGraph());
  const [timeline, setTimeline] = useState(() => buildTimeline());
  const [knowledgeTree, setKnowledgeTree] = useState(() =>
    buildTree(StorageService.getKnowledgeGraph().nodes)
  );
  const { nodes, edges } = graph;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<KnowledgeNode | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const simRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<KnowledgeEdge[]>(edges);
  const hoverRef = useRef<string | null>(null);
  const selectedRef = useRef<KnowledgeNode | null>(null);

  useEffect(() => {
    const onUpd = () => {
      const next = StorageService.getKnowledgeGraph();
      setGraph(next);
      setTimeline(buildTimeline());
      setKnowledgeTree(buildTree(next.nodes));
    };
    window.addEventListener(KNOWLEDGE_UPDATED_EVENT, onUpd);
    return () => window.removeEventListener(KNOWLEDGE_UPDATED_EVENT, onUpd);
  }, []);

  useEffect(() => {
    hoverRef.current = hoverId;
  }, [hoverId]);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const w = 900;
    const h = 520;
    simRef.current = nodes.map((n, i) => {
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      const r = 120 + (i % 3) * 40;
      return {
        ...n,
        x: w / 2 + Math.cos(angle) * r,
        y: h / 2 + Math.sin(angle) * r,
        vx: 0,
        vy: 0
      };
    });
    edgesRef.current = edges;
  }, [nodes, edges]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || 800;
      const h = 520;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const sims = simRef.current;
      const hover = hoverRef.current;
      const sel = selectedRef.current;

      for (let i = 0; i < sims.length; i++) {
        for (let j = i + 1; j < sims.length; j++) {
          const a = sims[i];
          const b = sims[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const min = 90;
          if (dist < min) {
            const f = ((min - dist) / min) * 0.25;
            dx /= dist;
            dy /= dist;
            a.vx -= dx * f;
            a.vy -= dy * f;
            b.vx += dx * f;
            b.vy += dy * f;
          }
        }
      }
      for (const e of edgesRef.current) {
        const a = sims.find((n) => n.id === e.source);
        const b = sims.find((n) => n.id === e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (dist - 160) * 0.004;
        a.vx += (dx / dist) * f;
        a.vy += (dy / dist) * f;
        b.vx -= (dx / dist) * f;
        b.vy -= (dy / dist) * f;
      }
      for (const n of sims) {
        n.vx += (w / 2 - n.x) * 0.0008;
        n.vy += (h / 2 - n.y) * 0.0008;
        // Amortiguación fuerte para evitar el “temblor” del grafo
        n.vx *= 0.72;
        n.vy *= 0.72;
        if (Math.abs(n.vx) < 0.02) n.vx = 0;
        if (Math.abs(n.vy) < 0.02) n.vy = 0;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(40, Math.min(w - 40, n.x));
        n.y = Math.max(40, Math.min(h - 40, n.y));
      }

      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) / 1.2);
      g.addColorStop(0, '#1a2f3a');
      g.addColorStop(1, '#0d171c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.arc((i * 97) % w, (i * 53) % h, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const e of edgesRef.current) {
        const a = sims.find((n) => n.id === e.source);
        const b = sims.find((n) => n.id === e.target);
        if (!a || !b) continue;
        const active = hover === a.id || hover === b.id || sel?.id === a.id || sel?.id === b.id;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = active ? 'rgba(184,146,74,0.85)' : 'rgba(74,155,157,0.35)';
        ctx.lineWidth = active ? 2 : 1;
        ctx.stroke();
        ctx.fillStyle = active ? 'rgba(245,241,232,0.7)' : 'rgba(245,241,232,0.35)';
        ctx.font = '10px ui-monospace, monospace';
        ctx.fillText(e.label, (a.x + b.x) / 2, (a.y + b.y) / 2 - 4);
      }

      for (const n of sims) {
        const color = TYPE_COLOR[n.type] || '#4A9B9D';
        const active = hover === n.id || sel?.id === n.id;
        ctx.beginPath();
        ctx.arc(n.x, n.y, active ? 22 : 16, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = active ? 1 : 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#F5F1E8';
        ctx.font = 'bold 11px "Iowan Old Style", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label.slice(0, 16), n.x, n.y + 34);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const hit = simRef.current.find((n) => Math.hypot(n.x - x, n.y - y) < 22);
      setHoverId(hit?.id || null);
      canvas.style.cursor = hit ? 'pointer' : 'default';
    };
    const onClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const hit = simRef.current.find((n) => Math.hypot(n.x - x, n.y - y) < 22);
      setSelected(hit || null);
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div className="maru-page space-y-5">
      <div className="space-y-1">
        <div className="maru-eyebrow">Memoria local</div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--maru-text)]">
          Memoria cognitiva
        </h1>
        <p className="text-sm text-[var(--maru-text-muted)]">
          Grafo vivo estilo Obsidian · relaciones, medicamentos y línea de tiempo de lo aprendido.
        </p>
      </div>

      <details className="maru-disclosure maru-panel px-5">
        <summary>Capas de memoria</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {[
            { icon: Database, title: 'Perfil local', body: `Usuario ${profile.name}, hábitos y ajustes` },
            { icon: Layers, title: 'Vector / RAG', body: 'Conversaciones y bóveda documental' },
            { icon: Network, title: 'Grafo', body: 'Alergias, medicamentos, ubicación' },
            { icon: ShieldCheck, title: 'Perú offline', body: 'SENAMHI, IGP, MINSA, INEI' }
          ].map((c) => (
            <div key={c.title} className="p-3 rounded-xl bg-[var(--maru-surface-muted)] border border-[var(--maru-border-soft)]">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--maru-text)] mb-1">
                <c.icon size={14} /> {c.title}
              </div>
              <p className="text-xs text-[var(--maru-text-muted)]">{c.body}</p>
            </div>
          ))}
        </div>
      </details>

      <KnowledgeVaultPanel />

      <div className="maru-panel !p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--maru-border-soft)]">
          <div className="flex items-center gap-2 text-sm font-display font-semibold">
            <Network className="text-[#B8924A]" size={18} /> Grafo de conocimiento
          </div>
          <span className="text-xs font-mono text-[var(--maru-text-muted)]">
            {nodes.length} nodos · {edges.length} enlaces
          </span>
        </div>
        <div className="relative">
          <canvas ref={canvasRef} className="w-full block" />
          {selected && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm p-3 rounded-xl bg-black/70 text-white backdrop-blur border border-white/10">
              <div className="text-[10px] uppercase font-mono tracking-wide" style={{ color: TYPE_COLOR[selected.type] }}>
                {selected.type}
              </div>
              <div className="font-bold text-sm mt-0.5">{selected.label}</div>
              {selected.details && <p className="text-xs text-white/70 mt-1">{selected.details}</p>}
              <div className="text-[11px] text-white/50 mt-2">
                Relaciones:{' '}
                {edges
                  .filter((e) => e.source === selected.id || e.target === selected.id)
                  .map((e) => e.label)
                  .join(', ') || 'ninguna'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="maru-panel space-y-3">
        <div className="flex items-center gap-2 text-sm font-display font-semibold border-b border-[var(--maru-border-soft)] pb-2">
          <GitBranch size={16} className="text-[#5A8F6B]" /> Árbol de lo que MARU sabe de ti
        </div>
        <div className="pl-2">
          <div className="font-bold text-[var(--maru-text)] mb-2">🌱 {knowledgeTree.root}</div>
          <div className="space-y-3 border-l-2 border-[var(--maru-border-soft)] ml-2 pl-4">
            {knowledgeTree.branches.map((b) => (
              <div key={b.title}>
                <div className="text-xs font-bold uppercase tracking-wide text-[var(--maru-primary)] mb-1">
                  ├─ {b.title}
                </div>
                <ul className="space-y-1">
                  {(b.leaves.length ? b.leaves : ['(sin datos aún)']).map((leaf, i) => (
                    <li key={`${b.title}-${i}`} className="text-sm text-[var(--maru-text-muted)] pl-3">
                      └─ {leaf}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="maru-panel space-y-3">
        <div className="flex items-center gap-2 text-sm font-display font-semibold border-b border-[var(--maru-border-soft)] pb-2">
          <Clock size={16} className="text-[#4A9B9D]" /> Línea de tiempo de lo aprendido
        </div>
        <div className="relative pl-4 space-y-3 before:absolute before:left-1 before:top-1 before:bottom-1 before:w-px before:bg-[var(--maru-border-soft)]">
          {timeline.map((item, i) => (
            <div key={i} className="relative pl-4">
              <span className="absolute left-[-3px] top-1.5 w-2 h-2 rounded-full bg-[#B8924A]" />
              <div className="text-[10px] font-mono text-[var(--maru-text-muted)]">{item.at} · {item.agent}</div>
              <div className="text-sm text-[var(--maru-text)]">{item.text}{item.text.length >= 120 ? '…' : ''}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
