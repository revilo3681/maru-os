export type AgentId = 'aya' | 'inti' | 'kipu' | 'sumaq' | 'pacha' | 'tupac' | 'yaku';

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  recoveryPhrase: string[];
  recoveryPhraseConfirmed: boolean;
  passwordHint?: string;
  createdAt: string;
}

export type CommunicationTone = 'warm' | 'formal' | 'direct' | 'friend';

export interface UserProfile {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  occupation: string;
  personalityDesc: string;
  communicationTone: CommunicationTone;
  customContext?: string;
  /** Foto de perfil (data URL) */
  avatarDataUrl?: string;
}

export type HabitFrequencyMode = 'daily' | 'weekdays' | 'custom_days' | 'weekly' | 'always';
export type MedForm = 'pastilla' | 'jarabe' | 'gotas' | 'inyeccion' | 'crema' | 'otro';
export type MedDoseUnit = 'mg' | 'ml' | 'g' | 'mcg' | 'UI' | 'cucharada' | 'comp' | 'gota';

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  /** Enfermedad / bloque al que pertenece */
  condition?: string;
  /** Horas de toma HH:mm */
  scheduleTimes?: string[];
  startDate?: string;
  endDate?: string;
  /** Días de duración del tratamiento */
  durationDays?: number;
  /** Foto de receta (data URL), obligatoria si hay alerta de sobredosis */
  recipePhotoDataUrl?: string;
  /** Unidades por toma (para alerta de exceso) */
  pillsPerDose?: number;
  form?: MedForm;
  doseAmount?: number;
  doseUnit?: MedDoseUnit;
  /** Para qué sirve / referencia */
  purpose?: string;
  frequencyMode?: HabitFrequencyMode;
  lastTakenAt?: string;
}

export interface HealthProfile {
  allergies: string[];
  currentMedications: Medication[];
  chronicConditions: string[];
  bloodType: string;
  emergencyContact: string;
  /** Teléfono WhatsApp del contacto (solo dígitos, con código país) */
  emergencyWhatsApp?: string;
}

export interface LocationProfile {
  country: string;
  city: string;
  district: string;
  timezone: string;
}

export interface Habit {
  id: string;
  title: string;
  time: string;
  frequency: string;
  /** Modo de recurrencia editable */
  frequencyMode?: HabitFrequencyMode;
  /** Días de la semana 0=Dom … 6=Sáb cuando frequencyMode = custom_days */
  daysOfWeek?: number[];
  linkedMedication?: string;
  completed: boolean;
  streak: number;
  category: 'health' | 'hygiene' | 'fitness' | 'wellness' | 'mind' | 'custom';
}

export interface Agent {
  id: AgentId;
  name: string;
  quechuaMeaning: string;
  specialty: string;
  catchphrase: string;
  description: string;
  modelPreferred: string;
  voiceTone: string;
  colorPrimary: string;
  colorAccent: string;
  particleType: 'blue' | 'silver' | 'matrix' | 'petals' | 'leaves' | 'red' | 'gold';
  enabled: boolean;
}

export interface FileAttachment {
  name: string;
  type: 'image' | 'pdf' | 'excel' | 'code' | 'audio' | 'video' | 'text';
  mimeType: string;
  url?: string;
  dataBase64?: string;
  sizeFormatted?: string;
}

export interface UpgradeRequestInfo {
  recommendedModel: string;
  currentModel: string;
  ramRequired: string;
  reason: string;
}

export interface ChatMessage {
  id: string;
  timestamp: string;
  sender: 'user' | 'maru';
  agentId?: AgentId;
  agentName?: string;
  content: string;
  thinkingSteps?: string[];
  modelUsed?: string;
  modelRAM?: string;
  isLocal?: boolean;
  decisionReason?: string;
  isFinal?: boolean;
  fileAttachment?: FileAttachment;
  userRating?: 'liked' | 'disliked';
  doNotSave?: boolean;
  sourceInfo?: string;
  upgradeRequest?: UpgradeRequestInfo;
  gmailDraftNotification?: GmailDraftNotification;
}

export type KnowledgeNodeType =
  | 'user'
  | 'allergy'
  | 'medication'
  | 'condition'
  | 'location'
  | 'risk'
  | 'agent'
  | 'note'
  | 'event'
  | 'habit'
  | 'project'
  | 'document'
  | 'mail'
  | 'preference';

export interface KnowledgeNode {
  id: string;
  label: string;
  type: KnowledgeNodeType;
  details?: string;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  title: string;
  type: 'medication' | 'habit' | 'appointment' | 'routine';
  completed?: boolean;
  details?: string;
}

export interface WeatherData {
  city: string;
  temperature: number;
  condition: 'Soleado' | 'Nublado' | 'Lluvia' | 'Tormenta' | 'Nevado';
  humidity: number;
  aqi: number;
  source: string;
  timestamp: string;
}

export interface HuaicoRiskData {
  city: string;
  riskPercent: number;
  level: 'Bajo' | 'Moderado' | 'Alto' | 'Peligro Crítico';
  safeZoneName: string;
  safeZoneDist: string;
  source: string;
}

export interface SismoData {
  magnitude: number;
  epicenter: string;
  depth: string;
  time: string;
  source: string;
}

export interface MinsaGuide {
  condition: string;
  diagnosis: string;
  treatment: string;
  precautions: string[];
}

export interface PeruSeedData {
  weatherMap: Record<string, WeatherData>;
  huaicoMap: Record<string, HuaicoRiskData>;
  sismoLatest: SismoData;
  minsaGuides: MinsaGuide[];
  ineiCities: Record<string, { population: string; povertyRate: string; idh: string; waterAccess: string }>;
  safeZones: Record<string, Array<{ name: string; address: string; dist: string }>>;
}

export interface AppSettings {
  ephemeralMode: boolean;
  voiceReadoutEnabled: boolean;
  autoAgentRouting: boolean;
  themeMode: 'auto' | 'day' | 'night';
  privacyLocalOnly: boolean;
  /** Personalización de colores de interfaz */
  uiAccent?: string;
  uiPrimary?: string;
  uiBg?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown text o JSON de hoja
  createdAt: string;
  updatedAt: string;
  kind?: 'text' | 'sheet';
  /** Matriz de celdas cuando kind = sheet */
  sheet?: string[][];
}

export interface GmailDraftNotification {
  id: string;
  sender: string;
  subject: string;
  suggestedDraft: string;
  timestamp: string;
}
