import { AgentId } from '../types';

export type VoiceGender = 'female' | 'male';

export interface AgentVoiceProfile {
  gender: VoiceGender;
  pitch: number;
  rate: number;
  /**
   * Índice estable dentro del grupo de voces del mismo género:
   * garantiza que dos agentes del mismo género elijan voces distintas
   * cuando el sistema tenga más de una voz disponible.
   */
  voiceIndex: number;
  /** Nombres de voces preferidas (subcadenas, sin distinción de mayúsculas), en orden de prioridad */
  preferredNames: string[];
  /** Voz Edge TTS (cuando el backend /tts está disponible) */
  edgeVoice: string;
}

/**
 * Mapa de voz por agente (item 2.3 / 4):
 * - Aya: femenina suave · Inti: masculina formal · Kipu: masculina joven/rápida
 * - Sumaq: femenina cálida/melódica · Pacha: femenina profunda/poética
 * - Tupac: masculina firme · Yaku: masculina orgullosa/cálida
 */
export const AGENT_VOICE_PROFILES: Record<AgentId, AgentVoiceProfile> = {
  aya:   { gender: 'female', pitch: 1.1,  rate: 0.95, voiceIndex: 0, preferredNames: ['paulina', 'mónica', 'monica'], edgeVoice: 'es-PE-CamilaNeural' },
  inti:  { gender: 'male',   pitch: 0.9,  rate: 0.98, voiceIndex: 0, preferredNames: ['jorge', 'carlos'], edgeVoice: 'es-PE-AlexNeural' },
  kipu:  { gender: 'male',   pitch: 1.05, rate: 1.15, voiceIndex: 1, preferredNames: ['diego', 'pablo'], edgeVoice: 'es-MX-JorgeNeural' },
  sumaq: { gender: 'female', pitch: 1.2,  rate: 0.9,  voiceIndex: 1, preferredNames: ['mónica', 'monica', 'luciana'], edgeVoice: 'es-ES-ElviraNeural' },
  pacha: { gender: 'female', pitch: 0.85, rate: 0.85, voiceIndex: 2, preferredNames: ['angélica', 'angelica', 'soledad'], edgeVoice: 'es-AR-ElenaNeural' },
  tupac: { gender: 'male',   pitch: 0.8,  rate: 1.0,  voiceIndex: 2, preferredNames: ['juan', 'andrés', 'andres'], edgeVoice: 'es-ES-AlvaroNeural' },
  yaku:  { gender: 'male',   pitch: 1.0,  rate: 1.0,  voiceIndex: 3, preferredNames: ['enrique', 'raúl', 'raul'], edgeVoice: 'es-CO-GonzaloNeural' }
};

/** Tab de especialista asociado a cada agente (para filtrar sidebar) */
export const AGENT_PANEL_TAB: Partial<Record<AgentId, string>> = {
  aya: 'health',
  sumaq: 'health',
  inti: 'legal',
  kipu: 'kipu',
  pacha: 'pacha',
  tupac: 'emergency',
  yaku: 'yaku'
};

/** Nombres típicos de voces femeninas en español (macOS, Windows, Google) */
export const FEMALE_VOICE_NAMES = [
  'mónica', 'monica', 'paulina', 'marisol', 'angélica', 'angelica', 'luciana',
  'isabela', 'camila', 'francisca', 'elena', 'helena', 'sabina', 'esperanza',
  'soledad', 'ximena', 'dalia', 'larissa', 'penélope', 'penelope', 'lupe',
  'renata', 'laura', 'elvira', 'abril', 'carlota', 'female', 'mujer'
];

/** Nombres típicos de voces masculinas en español (macOS, Windows, Google) */
export const MALE_VOICE_NAMES = [
  'jorge', 'diego', 'juan', 'carlos', 'andrés', 'andres', 'pablo', 'raúl', 'raul',
  'enrique', 'álvaro', 'alvaro', 'gonzalo', 'emilio', 'sebastián', 'sebastian',
  'mario', 'hernán', 'hernan', 'tomás', 'tomas', 'gerardo', 'liberto', 'saúl',
  'saul', 'male', 'hombre'
];
