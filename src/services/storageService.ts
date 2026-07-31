import {
  UserAccount,
  UserProfile,
  HealthProfile,
  LocationProfile,
  Habit,
  ChatMessage,
  KnowledgeNode,
  KnowledgeEdge,
  CalendarEvent,
  AppSettings
} from '../types';

const STORAGE_KEYS = {
  ACCOUNT: 'maru_user_account',
  PROFILE: 'maru_user_profile',
  HEALTH: 'maru_health_profile',
  LOCATION: 'maru_location_profile',
  HABITS: 'maru_habits',
  MESSAGES: 'maru_chat_messages',
  NODES: 'maru_knowledge_nodes',
  EDGES: 'maru_knowledge_edges',
  EVENTS: 'maru_calendar_events',
  SETTINGS: 'maru_app_settings',
  ONBOARDED: 'maru_onboarded_status',
  POMODORO_CYCLES: 'maru_pomodoro_cycles'
};

// 12 BIP39-style words for seed generation
const SEED_WORD_POOL = [
  'manantial', 'piedra', 'quebrada', 'sol', 'andino', 'nieve', 'viento', 'agua',
  'condor', 'altura', 'tierra', 'fuego', 'puma', 'origen', 'cumbre', 'llama',
  'sendero', 'semilla', 'raiz', 'florecer', 'camino', 'estrella', 'valle', 'rio'
];

export function generate12WordSeed(): string[] {
  const shuffled = [...SEED_WORD_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 12);
}

export function mockHashPassword(password: string): string {
  // Simple deterministic hash for demo local security
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_maru_${Math.abs(hash)}_${password.length}`;
}

export const defaultProfile: UserProfile = {
  name: 'Oliver',
  age: 32,
  heightCm: 175,
  weightKg: 72,
  occupation: 'Tecnología',
  personalityDesc: 'Tranquilo pero energético, le gusta aprender y crear proyectos.',
  communicationTone: 'warm'
};

export const defaultHealth: HealthProfile = {
  allergies: ['Maní'],
  currentMedications: [
    { id: 'med-1', name: 'Amoxicilina', dose: '500mg', frequency: 'cada 8 horas' },
    { id: 'med-2', name: 'Losartán', dose: '50mg', frequency: 'cada 24 horas (8 PM)' }
  ],
  chronicConditions: ['Hipertensión arterial (controlada)'],
  bloodType: 'O+',
  emergencyContact: 'Ana Pérez - 999 123 456'
};

export const defaultLocation: LocationProfile = {
  country: 'Perú',
  city: 'Chosica',
  district: 'Lurigancho-Chosica',
  timezone: 'America/Lima (GMT-5)'
};

export const defaultHabits: Habit[] = [
  { id: 'h-1', title: 'Tomar Amoxicilina 500mg', time: '08:00', frequency: 'Diario', linkedMedication: 'Amoxicilina', completed: false, streak: 5, category: 'health' },
  { id: 'h-2', title: 'Cepillado dental', time: '07:00', frequency: 'Diario', completed: true, streak: 12, category: 'hygiene' },
  { id: 'h-3', title: 'Tomar 2L de agua', time: '12:00', frequency: 'Diario', completed: false, streak: 3, category: 'wellness' },
  { id: 'h-4', title: 'Ejercicio / Camina', time: '18:00', frequency: 'Lun, Mié, Vie', completed: false, streak: 2, category: 'fitness' },
  { id: 'h-5', title: 'Dormir a las 22:30', time: '22:30', frequency: 'Diario', completed: false, streak: 8, category: 'mind' }
];

export const defaultSettings: AppSettings = {
  ephemeralMode: false,
  voiceReadoutEnabled: true,
  autoAgentRouting: true,
  themeMode: 'auto',
  privacyLocalOnly: true
};

export class StorageService {
  static getAccount(): UserAccount | null {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
    return data ? JSON.parse(data) : null;
  }

  static saveAccount(account: UserAccount): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(account));
  }

  static getProfile(): UserProfile {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : defaultProfile;
  }

  static saveProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    this.updateGraphFromProfile(profile, this.getHealth(), this.getLocation());
  }

  static getHealth(): HealthProfile {
    const data = localStorage.getItem(STORAGE_KEYS.HEALTH);
    return data ? JSON.parse(data) : defaultHealth;
  }

  static saveHealth(health: HealthProfile): void {
    localStorage.setItem(STORAGE_KEYS.HEALTH, JSON.stringify(health));
    this.updateGraphFromProfile(this.getProfile(), health, this.getLocation());
  }

  static getLocation(): LocationProfile {
    const data = localStorage.getItem(STORAGE_KEYS.LOCATION);
    return data ? JSON.parse(data) : defaultLocation;
  }

  static saveLocation(location: LocationProfile): void {
    localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(location));
    this.updateGraphFromProfile(this.getProfile(), this.getHealth(), location);
  }

  static getHabits(): Habit[] {
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    return data ? JSON.parse(data) : defaultHabits;
  }

  static saveHabits(habits: Habit[]): void {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }

  static toggleHabit(id: string): Habit[] {
    const habits = this.getHabits().map(h => {
      if (h.id === id) {
        const nextCompleted = !h.completed;
        return {
          ...h,
          completed: nextCompleted,
          streak: nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1)
        };
      }
      return h;
    });
    this.saveHabits(habits);
    return habits;
  }

  static getMessages(): ChatMessage[] {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return data ? JSON.parse(data) : [];
  }

  static saveMessage(msg: ChatMessage): void {
    const settings = this.getSettings();
    if (settings.ephemeralMode || msg.doNotSave) return;
    const messages = this.getMessages();
    messages.push(msg);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }

  static deleteMessage(id: string): void {
    const messages = this.getMessages().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }

  static clearMessages(): void {
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
  }

  // ── Per-agent isolated chat histories ──────────────────────────────
  private static agentKey(agentId: string): string {
    return `maru_chat_${agentId}`;
  }

  static getAgentMessages(agentId: string): ChatMessage[] {
    const data = localStorage.getItem(this.agentKey(agentId));
    return data ? JSON.parse(data) : [];
  }

  static saveAgentMessage(agentId: string, msg: ChatMessage): void {
    const settings = this.getSettings();
    if (settings.ephemeralMode || msg.doNotSave) return;
    const messages = this.getAgentMessages(agentId);
    messages.push(msg);
    localStorage.setItem(this.agentKey(agentId), JSON.stringify(messages));
  }

  static saveAgentMessages(agentId: string, messages: ChatMessage[]): void {
    const settings = this.getSettings();
    if (settings.ephemeralMode) return;
    localStorage.setItem(this.agentKey(agentId), JSON.stringify(messages));
  }

  static deleteAgentMessage(agentId: string, id: string): void {
    const messages = this.getAgentMessages(agentId).filter(m => m.id !== id);
    localStorage.setItem(this.agentKey(agentId), JSON.stringify(messages));
  }

  static clearAgentMessages(agentId: string): void {
    localStorage.removeItem(this.agentKey(agentId));
  }

  static getKnowledgeGraph(): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const rawNodes = localStorage.getItem(STORAGE_KEYS.NODES);
    const rawEdges = localStorage.getItem(STORAGE_KEYS.EDGES);
    if (rawNodes && rawEdges) {
      return { nodes: JSON.parse(rawNodes), edges: JSON.parse(rawEdges) };
    }
    // Initialize initial knowledge graph based on defaults
    const profile = this.getProfile();
    const health = this.getHealth();
    const loc = this.getLocation();
    return this.buildInitialGraph(profile, health, loc);
  }

  private static buildInitialGraph(p: UserProfile, h: HealthProfile, l: LocationProfile) {
    const nodes: KnowledgeNode[] = [
      { id: 'node-user', label: p.name, type: 'user', details: `${p.age} años, ${p.occupation}` },
      { id: 'node-loc', label: l.city, type: 'location', details: `${l.district}, ${l.country}` },
      { id: 'node-risk', label: 'Riesgo Huaico', type: 'risk', details: 'Chosica (85% Alerta)' }
    ];
    const edges: KnowledgeEdge[] = [
      { id: 'e-1', source: 'node-user', target: 'node-loc', label: 'VIVE_EN' },
      { id: 'e-2', source: 'node-loc', target: 'node-risk', label: 'TIENE_RIESGO' }
    ];

    h.allergies.forEach((allergy, idx) => {
      const nid = `node-allergy-${idx}`;
      nodes.push({ id: nid, label: allergy, type: 'allergy', details: 'Reacción adversa' });
      edges.push({ id: `e-a-${idx}`, source: 'node-user', target: nid, label: 'TIENE_ALERGIA' });
    });

    h.currentMedications.forEach((med, idx) => {
      const nid = `node-med-${idx}`;
      nodes.push({ id: nid, label: med.name, type: 'medication', details: `${med.dose} ${med.frequency}` });
      edges.push({ id: `e-m-${idx}`, source: 'node-user', target: nid, label: 'TOMA_MEDICAMENTO' });
    });

    localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodes));
    localStorage.setItem(STORAGE_KEYS.EDGES, JSON.stringify(edges));
    return { nodes, edges };
  }

  private static updateGraphFromProfile(p: UserProfile, h: HealthProfile, l: LocationProfile) {
    this.buildInitialGraph(p, h, l);
  }

  static getCalendarEvents(): CalendarEvent[] {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (data) return JSON.parse(data);
    const todayStr = new Date().toISOString().split('T')[0];
    const initialEvents: CalendarEvent[] = [
      { id: 'ev-1', date: todayStr, time: '08:00', title: '💊 Amoxicilina 500mg', type: 'medication', completed: false },
      { id: 'ev-2', date: todayStr, time: '15:00', title: '📞 Reunión con equipo MARU', type: 'appointment', completed: false, details: 'Revisión de arquitectura' },
      { id: 'ev-3', date: todayStr, time: '19:00', title: '🧘 Meditación guiada con Sumaq', type: 'routine', completed: false }
    ];
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(initialEvents));
    return initialEvents;
  }

  static saveCalendarEvent(event: CalendarEvent): void {
    const events = this.getCalendarEvents();
    events.push(event);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  static saveCalendarEvents(events: CalendarEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  static getSettings(): AppSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : defaultSettings;
  }

  static saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static isOnboarded(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
  }

  static setOnboarded(status: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, status ? 'true' : 'false');
  }

  static getPomodoroCycles(): number {
    const val = localStorage.getItem(STORAGE_KEYS.POMODORO_CYCLES);
    return val ? parseInt(val, 10) : 0;
  }

  static incrementPomodoroCycle(): number {
    const current = this.getPomodoroCycles() + 1;
    localStorage.setItem(STORAGE_KEYS.POMODORO_CYCLES, current.toString());
    return current;
  }

  static exportAllDataJSON(): string {
    const data = {
      account: this.getAccount(),
      profile: this.getProfile(),
      health: this.getHealth(),
      location: this.getLocation(),
      habits: this.getHabits(),
      messages: this.getMessages(),
      knowledgeGraph: this.getKnowledgeGraph(),
      events: this.getCalendarEvents(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  static wipeAllData(): void {
    localStorage.clear();
  }
}
