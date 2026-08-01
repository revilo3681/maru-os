/**
 * Universal IA injector: panels → StorageService graph → MemoryView → agent chat.
 *
 * When specialist panels mutate important user data, call `notifyPanelChange`
 * (or a domain helper). That:
 *  1. Persists via StorageService / localStorage (caller still owns writes)
 *  2. Rebuilds / merges knowledge-graph nodes for the domain
 *  3. Pushes a local AI activity event (visible in Health / Memory timelines)
 *  4. Queues a short context snippet injected into the next chat message
 *     for the relevant agent
 */

import {
  AgentId,
  CalendarEvent,
  Habit,
  HealthProfile,
  KnowledgeEdge,
  KnowledgeNode,
  LocationProfile,
  Note,
  UserProfile
} from '../types';
import { StorageService } from './storageService';

export type SyncDomain =
  | 'health'
  | 'profile'
  | 'location'
  | 'habits'
  | 'calendar'
  | 'notes'
  | 'kipu'
  | 'mail'
  | 'legal'
  | 'emergency'
  | 'settings'
  | 'pacha'
  | 'yaku';

export interface AiPanelEvent {
  at: string;
  text: string;
  domain: SyncDomain;
  agentId?: AgentId;
}

const AI_EVENTS_KEY = 'maru_ai_panel_events';
const PENDING_CTX_KEY = 'maru_pending_chat_context';
const EVENT_NAME = 'maru:knowledge-updated';

const DOMAIN_AGENT: Partial<Record<SyncDomain, AgentId>> = {
  health: 'aya',
  habits: 'sumaq',
  calendar: 'sumaq',
  notes: 'kipu',
  kipu: 'kipu',
  mail: 'inti',
  legal: 'inti',
  emergency: 'tupac',
  location: 'pacha',
  pacha: 'pacha',
  yaku: 'yaku',
  profile: 'yaku',
  settings: 'yaku'
};

function emitUpdated(detail?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

export function getAiPanelEvents(limit = 40): AiPanelEvent[] {
  try {
    const raw = localStorage.getItem(AI_EVENTS_KEY);
    const list = raw ? (JSON.parse(raw) as AiPanelEvent[]) : [];
    return Array.isArray(list) ? list.slice(0, limit) : [];
  } catch {
    return [];
  }
}

export function pushAiPanelEvent(
  text: string,
  domain: SyncDomain,
  agentId?: AgentId
): AiPanelEvent[] {
  const ev: AiPanelEvent = {
    at: new Date().toISOString(),
    text,
    domain,
    agentId: agentId || DOMAIN_AGENT[domain]
  };
  const next = [ev, ...getAiPanelEvents()].slice(0, 40);
  localStorage.setItem(AI_EVENTS_KEY, JSON.stringify(next));
  return next;
}

type PendingMap = Partial<Record<AgentId, string[]>>;

function loadPending(): PendingMap {
  try {
    return JSON.parse(localStorage.getItem(PENDING_CTX_KEY) || '{}') as PendingMap;
  } catch {
    return {};
  }
}

export function queueChatContext(agentId: AgentId, snippet: string): void {
  const clean = snippet.trim();
  if (!clean) return;
  const map = loadPending();
  const list = map[agentId] || [];
  list.unshift(clean);
  map[agentId] = list.slice(0, 8);
  localStorage.setItem(PENDING_CTX_KEY, JSON.stringify(map));
}

/** Consume (and clear) pending panel context for an agent. */
export function consumeChatContext(agentId: AgentId): string {
  const map = loadPending();
  const list = map[agentId] || [];
  if (!list.length) return '';
  delete map[agentId];
  localStorage.setItem(PENDING_CTX_KEY, JSON.stringify(map));
  return (
    `\n[ACTUALIZACIÓN DESDE PANEL — ${agentId.toUpperCase()}]\n` +
    list.map((s) => `- ${s}`).join('\n') +
    '\nUsa estos datos actualizados del usuario en tu respuesta.\n'
  );
}

/** Peek without clearing (e.g. Memory timeline). */
export function peekChatContext(agentId: AgentId): string[] {
  return loadPending()[agentId] || [];
}

export function notifyPanelChange(opts: {
  domain: SyncDomain;
  summary: string;
  agentId?: AgentId;
  /** Extra graph nodes to merge under a stable id prefix */
  nodes?: KnowledgeNode[];
  edges?: KnowledgeEdge[];
  nodePrefix?: string;
}): void {
  const agentId = opts.agentId || DOMAIN_AGENT[opts.domain];
  pushAiPanelEvent(opts.summary, opts.domain, agentId);
  if (agentId) queueChatContext(agentId, opts.summary);
  if (opts.nodePrefix && opts.nodes) {
    StorageService.replaceNodesByPrefix(opts.nodePrefix, opts.nodes, opts.edges || []);
  }
  emitUpdated({ domain: opts.domain, summary: opts.summary });
}

// ── Domain helpers ────────────────────────────────────────────────

export function syncHealthChange(health: HealthProfile, summary: string): void {
  StorageService.saveHealth(health);
  notifyPanelChange({ domain: 'health', summary, agentId: 'aya' });
}

export function syncProfileChange(profile: UserProfile, summary: string): void {
  StorageService.saveProfile(profile);
  notifyPanelChange({ domain: 'profile', summary, agentId: 'yaku' });
}

export function syncLocationChange(location: LocationProfile, summary: string): void {
  StorageService.saveLocation(location);
  notifyPanelChange({
    domain: 'location',
    summary,
    agentId: 'pacha',
    nodePrefix: 'node-risk',
    nodes: [
      {
        id: 'node-risk',
        label: `Riesgo · ${location.city}`,
        type: 'risk',
        details: `${location.district || location.city}, ${location.country}`
      }
    ],
    edges: [{ id: 'e-loc-risk', source: 'node-loc', target: 'node-risk', label: 'TIENE_RIESGO' }]
  });
}

export function syncHabitsChange(habits: Habit[], summary: string): void {
  StorageService.saveHabits(habits);
  const nodes: KnowledgeNode[] = habits.slice(0, 12).map((h, i) => ({
    id: `node-habit-${i}`,
    label: h.title,
    type: 'habit',
    details: `${h.time} · ${h.frequency}`
  }));
  const edges: KnowledgeEdge[] = nodes.map((n, i) => ({
    id: `e-habit-${i}`,
    source: 'node-user',
    target: n.id,
    label: 'TIENE_HABITO'
  }));
  notifyPanelChange({
    domain: 'habits',
    summary,
    agentId: 'sumaq',
    nodePrefix: 'node-habit-',
    nodes,
    edges
  });
}

export function syncCalendarChange(events: CalendarEvent[], summary: string): void {
  StorageService.saveCalendarEvents(events);
  const upcoming = [...events]
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 10);
  const nodes: KnowledgeNode[] = upcoming.map((ev, i) => ({
    id: `node-event-${i}`,
    label: ev.title,
    type: 'event',
    details: `${ev.date} ${ev.time} · ${ev.type}`
  }));
  const edges: KnowledgeEdge[] = nodes.map((n, i) => ({
    id: `e-event-${i}`,
    source: 'node-user',
    target: n.id,
    label: 'TIENE_EVENTO'
  }));
  notifyPanelChange({
    domain: 'calendar',
    summary,
    agentId: 'sumaq',
    nodePrefix: 'node-event-',
    nodes,
    edges
  });
}

export function syncNotesChange(notes: Note[], summary: string): void {
  const nodes: KnowledgeNode[] = notes.slice(0, 10).map((n, i) => ({
    id: `node-note-${i}`,
    label: n.title || 'Nota',
    type: 'note',
    details: (n.content || '').slice(0, 80)
  }));
  const edges: KnowledgeEdge[] = nodes.map((n, i) => ({
    id: `e-note-${i}`,
    source: 'node-user',
    target: n.id,
    label: 'ESCRIBIO_NOTA'
  }));
  notifyPanelChange({
    domain: 'notes',
    summary,
    agentId: 'kipu',
    nodePrefix: 'node-note-',
    nodes,
    edges
  });
}

export function syncKipuProjects(
  projects: Array<{ id: string; name: string; files: Array<{ name: string }> }>,
  summary: string
): void {
  const nodes: KnowledgeNode[] = projects.slice(0, 8).map((p, i) => ({
    id: `node-project-${i}`,
    label: p.name,
    type: 'project',
    details: `${p.files.length} archivo(s)`
  }));
  const edges: KnowledgeEdge[] = nodes.map((n, i) => ({
    id: `e-project-${i}`,
    source: 'node-user',
    target: n.id,
    label: 'TIENE_PROYECTO'
  }));
  notifyPanelChange({
    domain: 'kipu',
    summary,
    agentId: 'kipu',
    nodePrefix: 'node-project-',
    nodes,
    edges
  });
}

export function syncMailDraft(summary: string, subject?: string): void {
  const nodes: KnowledgeNode[] = subject
    ? [
        {
          id: 'node-mail-0',
          label: subject.slice(0, 40) || 'Borrador',
          type: 'mail',
          details: summary.slice(0, 80)
        }
      ]
    : [];
  const edges: KnowledgeEdge[] = nodes.map((n) => ({
    id: 'e-mail-0',
    source: 'node-user',
    target: n.id,
    label: 'BORRADOR_CORREO'
  }));
  notifyPanelChange({
    domain: 'mail',
    summary,
    agentId: 'inti',
    nodePrefix: 'node-mail-',
    nodes,
    edges
  });
}

export function syncLegalDocument(name: string): void {
  const nid = `node-doc-${Date.now()}`;
  notifyPanelChange({
    domain: 'legal',
    summary: `Documento legal indexado: ${name}`,
    agentId: 'inti',
    nodePrefix: 'node-doc-',
    nodes: [
      {
        id: nid,
        label: name.slice(0, 48),
        type: 'document',
        details: 'Bóveda Inti (RAG local)'
      }
    ],
    edges: [
      {
        id: `e-${nid}`,
        source: 'node-user',
        target: nid,
        label: 'SUBIO_DOCUMENTO'
      }
    ]
  });
}

export function syncEmergencyContact(label: string): void {
  notifyPanelChange({
    domain: 'emergency',
    summary: `Contacto de emergencia actualizado: ${label}`,
    agentId: 'tupac',
    nodePrefix: 'node-emerg-',
    nodes: [
      {
        id: 'node-emerg-0',
        label: label.slice(0, 48) || 'Contacto emergencia',
        type: 'preference',
        details: 'Contacto rápido Tupac'
      }
    ],
    edges: [
      {
        id: 'e-emerg-0',
        source: 'node-user',
        target: 'node-emerg-0',
        label: 'CONTACTO_EMERGENCIA'
      }
    ]
  });
}

export function syncSettingsChange(summary: string): void {
  notifyPanelChange({
    domain: 'settings',
    summary,
    agentId: 'yaku',
    nodePrefix: 'node-pref-',
    nodes: [
      {
        id: 'node-pref-0',
        label: 'Preferencias UI',
        type: 'preference',
        details: summary.slice(0, 80)
      }
    ],
    edges: [
      {
        id: 'e-pref-0',
        source: 'node-user',
        target: 'node-pref-0',
        label: 'CONFIGURO'
      }
    ]
  });
}

export function syncPachaWeather(opts: {
  city: string;
  temperature?: number | string;
  condition?: string;
  humidity?: number | string;
  precipMm?: number | string;
  source?: string;
}): void {
  const temp = opts.temperature ?? '—';
  const cond = opts.condition || '—';
  const summary = `Clima actualizado en ${opts.city}: ${temp}°C, ${cond}${
    opts.humidity != null ? `, humedad ${opts.humidity}%` : ''
  }${opts.precipMm != null ? `, precip ${opts.precipMm} mm` : ''}${
    opts.source ? ` (${opts.source})` : ''
  }`;
  notifyPanelChange({
    domain: 'pacha',
    summary,
    agentId: 'pacha',
    nodePrefix: 'node-weather-',
    nodes: [
      {
        id: 'node-weather-0',
        label: `Clima · ${opts.city}`,
        type: 'risk',
        details: `${temp}°C · ${cond}`
      }
    ],
    edges: [
      {
        id: 'e-weather-0',
        source: 'node-loc',
        target: 'node-weather-0',
        label: 'CLIMA_ACTUAL'
      }
    ]
  });
}

export function syncYakuTranslation(opts: {
  sourceLang: string;
  targetLang: string;
  sample: string;
}): void {
  const sample = opts.sample.trim().slice(0, 60);
  const summary = `Traducción Yaku ${opts.sourceLang} → ${opts.targetLang}: «${sample}»`;
  notifyPanelChange({
    domain: 'yaku',
    summary,
    agentId: 'yaku',
    nodePrefix: 'node-trans-',
    nodes: [
      {
        id: 'node-trans-0',
        label: `${opts.sourceLang}→${opts.targetLang}`,
        type: 'preference',
        details: sample
      }
    ],
    edges: [
      {
        id: 'e-trans-0',
        source: 'node-user',
        target: 'node-trans-0',
        label: 'TRADUJO'
      }
    ]
  });
}

export function syncAgentsChange(enabledIds: AgentId[], summary?: string): void {
  const labels = enabledIds.join(', ') || 'ninguno';
  notifyPanelChange({
    domain: 'settings',
    summary: summary || `Especialistas activos: ${labels}`,
    agentId: 'yaku',
    nodePrefix: 'node-agents-',
    nodes: [
      {
        id: 'node-agents-0',
        label: 'Agentes activos',
        type: 'preference',
        details: labels
      }
    ],
    edges: [
      {
        id: 'e-agents-0',
        source: 'node-user',
        target: 'node-agents-0',
        label: 'CONFIGURO_AGENTES'
      }
    ]
  });
}

export function syncDashboardHabit(habitTitle: string, completed: boolean): void {
  notifyPanelChange({
    domain: 'habits',
    summary: completed
      ? `Hábito completado desde Inicio: ${habitTitle}`
      : `Hábito marcado pendiente desde Inicio: ${habitTitle}`,
    agentId: 'sumaq',
    nodePrefix: 'node-dash-habit-',
    nodes: [
      {
        id: 'node-dash-habit-0',
        label: habitTitle.slice(0, 48),
        type: 'habit',
        details: completed ? 'Completado hoy (Inicio)' : 'Pendiente (Inicio)'
      }
    ],
    edges: [
      {
        id: 'e-dash-habit-0',
        source: 'node-user',
        target: 'node-dash-habit-0',
        label: 'ACTUALIZO_HABITO'
      }
    ]
  });
}

export const KNOWLEDGE_UPDATED_EVENT = EVENT_NAME;
