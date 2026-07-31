/* eslint-disable @typescript-eslint/no-explicit-any */
import { AgentId } from '../types';
import { AGENT_VOICE_PROFILES, FEMALE_VOICE_NAMES, MALE_VOICE_NAMES, VoiceGender } from '../data/agentVoices';

export class AudioService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static recognition: any = null;
  private static isSpeaking = false;
  /** true mientras el pulso visual de nivel (mic o TTS) está activo */
  private static pulseActive = false;
  private static onAudioLevelCallback: ((level: number) => void) | null = null;
  private static animationFrameId: number | null = null;
  /** Contador de sesión: cada llamada a speakText invalida la anterior (sin solapamientos) */
  private static speakSession = 0;
  private static voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
  private static agentVoiceCache: Partial<Record<AgentId, SpeechSynthesisVoice | null>> = {};

  /**
   * Las voces se cargan de forma asíncrona en la mayoría de navegadores:
   * espera a `onvoiceschanged` (con timeout de seguridad) antes de hablar.
   */
  private static ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
    if (!this.synth) return Promise.resolve([]);
    const immediate = this.synth.getVoices();
    if (immediate.length > 0) return Promise.resolve(immediate);
    if (this.voicesPromise) return this.voicesPromise;

    this.voicesPromise = new Promise((resolve) => {
      const synth = this.synth as SpeechSynthesis;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        synth.removeEventListener('voiceschanged', finish);
        resolve(synth.getVoices());
      };
      synth.addEventListener('voiceschanged', finish);
      // Timeout de seguridad si el navegador nunca dispara el evento
      setTimeout(finish, 1500);
    });
    return this.voicesPromise;
  }

  private static classifyVoiceGender(voice: SpeechSynthesisVoice): VoiceGender | 'unknown' {
    const name = voice.name.toLowerCase();
    if (FEMALE_VOICE_NAMES.some((n) => name.includes(n))) return 'female';
    if (MALE_VOICE_NAMES.some((n) => name.includes(n))) return 'male';
    return 'unknown';
  }

  /**
   * Elige una voz española REAL y distinta por agente:
   * 1) voz preferida por nombre; 2) índice estable dentro del grupo de su género
   * (dos agentes de género distinto nunca comparten voz si hay al menos una por género);
   * 3) fallback a cualquier voz es-*.
   */
  private static resolveVoiceForAgent(agentId: AgentId, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (agentId in this.agentVoiceCache) return this.agentVoiceCache[agentId] ?? null;

    const profile = AGENT_VOICE_PROFILES[agentId];
    const spanish = voices.filter((v) => v.lang.toLowerCase().startsWith('es'));
    let chosen: SpeechSynthesisVoice | null = null;

    if (spanish.length > 0 && profile) {
      // 1. Voz preferida explícita por nombre
      for (const preferred of profile.preferredNames) {
        chosen = spanish.find((v) => v.name.toLowerCase().includes(preferred)) || null;
        if (chosen) break;
      }

      // 2. Voz estable dentro del grupo del género correspondiente
      if (!chosen) {
        const sameGender = spanish.filter((v) => this.classifyVoiceGender(v) === profile.gender);
        const unknown = spanish.filter((v) => this.classifyVoiceGender(v) === 'unknown');
        // Si no hay voces del género, usa las de género desconocido antes que cruzar de género
        const pool = sameGender.length > 0 ? sameGender : unknown;
        if (pool.length > 0) {
          chosen = pool[profile.voiceIndex % pool.length];
        }
      }

      // 3. Fallback: cualquier voz en español, distribuida por índice
      if (!chosen) {
        chosen = spanish[profile.voiceIndex % spanish.length];
      }
    }

    this.agentVoiceCache[agentId] = chosen;
    return chosen;
  }

  static initSpeechRecognition(
    onResult: (text: string) => void,
    onError?: (err: any) => void,
    onEnd?: () => void
  ) {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser');
      return null;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-PE';

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        onResult(transcript);
      };

      this.recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        this.stopAudioLevelPulse();
        if (onError) onError(err);
      };

      this.recognition.onend = () => {
        this.stopAudioLevelPulse();
        if (onEnd) onEnd();
      };

      return this.recognition;
    } catch (e) {
      console.error('Failed to init speech recognition:', e);
      return null;
    }
  }

  static startListening() {
    if (this.recognition) {
      try {
        this.simulateAudioLevelPulse();
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition already started or error:', e);
        this.stopAudioLevelPulse();
      }
    }
  }

  static stopListening() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn('Error stopping media recorder:', e);
      }
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
    this.stopAudioLevelPulse();
  }

  private static mediaRecorder: MediaRecorder | null = null;
  private static mediaStream: MediaStream | null = null;

  /**
   * Graba audio y lo manda a /stt (Whisper local si está instalado).
   * Si falla, cae a Web Speech API.
   */
  static async startWhisperOrSpeech(
    onResult: (text: string) => void,
    onError?: (err: unknown) => void,
    onEnd?: () => void
  ): Promise<'whisper' | 'webspeech' | null> {
    // Intentar MediaRecorder → backend Whisper
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';
        const chunks: BlobPart[] = [];
        this.mediaRecorder = mimeType
          ? new MediaRecorder(this.mediaStream, { mimeType })
          : new MediaRecorder(this.mediaStream);

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        this.mediaRecorder.onstop = async () => {
          this.stopAudioLevelPulse();
          this.mediaStream?.getTracks().forEach((t) => t.stop());
          this.mediaStream = null;
          const blob = new Blob(chunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
          this.mediaRecorder = null;

          if (blob.size < 800) {
            // Demasiado corto → fallback webspeech no aplica aquí; solo end
            if (onEnd) onEnd();
            return;
          }

          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const { ApiService } = await import('./apiService');
              const dataBase64 = reader.result as string;
              const res = await ApiService.transcribeAudio(dataBase64, blob.type || 'audio/webm');
              if (res?.text) {
                onResult(res.text);
                if (onEnd) onEnd();
                return;
              }
            } catch {
              /* fall through */
            }
            // Fallback: Web Speech en una segunda pasada corta
            const recognition = this.initSpeechRecognition(onResult, onError, onEnd);
            if (recognition) {
              this.startListening();
            } else if (onEnd) {
              onEnd();
            }
          };
          reader.readAsDataURL(blob);
        };

        this.simulateAudioLevelPulse();
        this.mediaRecorder.start();
        // Auto-stop a los 8s para no grabar infinito
        window.setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }, 8000);
        return 'whisper';
      } catch (e) {
        console.warn('MediaRecorder STT failed, using Web Speech:', e);
        this.mediaStream?.getTracks().forEach((t) => t.stop());
        this.mediaStream = null;
      }
    }

    const recognition = this.initSpeechRecognition(onResult, onError, onEnd);
    if (!recognition) {
      if (onError) onError(new Error('STT no disponible'));
      return null;
    }
    this.startListening();
    return 'webspeech';
  }

  /**
   * Conecta un <audio> (Edge TTS) al analizador Web Audio para pulsar el nivel real.
   * Si el navegador bloquea el AudioContext, cae al pulso simulado.
   */
  static attachAnalyserToAudio(audio: HTMLAudioElement) {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) {
        this.isSpeaking = true;
        this.simulateAudioLevelPulse();
        return;
      }
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      this.isSpeaking = true;
      this.pulseActive = true;
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!this.pulseActive) return;
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const level = Math.min(1, (sum / data.length) / 140);
        if (this.onAudioLevelCallback) this.onAudioLevelCallback(0.15 + level * 0.85);
        this.animationFrameId = requestAnimationFrame(tick);
      };
      const start = () => {
        if (ctx.state === 'suspended') void ctx.resume();
        tick();
      };
      audio.addEventListener('play', start, { once: true });
      audio.addEventListener('ended', () => {
        this.isSpeaking = false;
        this.stopAudioLevelPulse();
        void ctx.close().catch(() => undefined);
      }, { once: true });
      if (!audio.paused) start();
    } catch (e) {
      console.warn('Audio analyser unavailable, using simulated pulse:', e);
      this.isSpeaking = true;
      this.simulateAudioLevelPulse();
    }
  }

  static speakText(text: string, agentId: AgentId = 'aya', onEnd?: () => void) {
    if (!this.synth) return;

    // Clean text from markdown formatting or code blocks for clean reading
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Código fuente omitido en lectura de voz.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~]/g, '')
      .replace(/\n+/g, ' ');

    this.synth.cancel(); // stop current speech
    const session = ++this.speakSession; // invalida cualquier lectura previa en curso
    this.isSpeaking = true;
    this.simulateAudioLevelPulse();

    const profile = AGENT_VOICE_PROFILES[agentId] || AGENT_VOICE_PROFILES.aya;

    // Split text by punctuation marks that require a pause
    const segments = cleanText.split(/([.!?;:]+)/).filter(Boolean);

    this.ensureVoicesLoaded().then((voices) => {
      // Si mientras cargaban voces se pidió otra lectura o se detuvo, abortar
      if (session !== this.speakSession || !this.isSpeaking) return;

      const agentVoice = this.resolveVoiceForAgent(agentId, voices);

      const playSegment = (index: number) => {
        if (!this.synth || !this.isSpeaking || session !== this.speakSession) return;
        if (index >= segments.length) {
          this.isSpeaking = false;
          this.stopAudioLevelPulse();
          if (onEnd) onEnd();
          return;
        }

        const segmentText = segments[index] + (segments[index + 1] && /^[.!?;:]+$/.test(segments[index + 1]) ? segments[index + 1] : '');
        const skipNext = segments[index + 1] && /^[.!?;:]+$/.test(segments[index + 1]);

        if (!segmentText.trim()) {
          playSegment(index + (skipNext ? 2 : 1));
          return;
        }

        const utterance = new SpeechSynthesisUtterance(segmentText.trim());
        utterance.lang = agentVoice?.lang || 'es-PE';
        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;
        if (agentVoice) {
          utterance.voice = agentVoice;
        }

        utterance.onend = () => {
          if (!this.isSpeaking || session !== this.speakSession) return;
          // Add a slight artificial pause (200ms) for logical punctuation
          setTimeout(() => {
            playSegment(index + (skipNext ? 2 : 1));
          }, 200);
        };

        utterance.onerror = (e) => {
          console.warn('Speech synthesis error on segment:', e);
          if (!this.isSpeaking || session !== this.speakSession) return;
          playSegment(index + (skipNext ? 2 : 1));
        };

        this.synth.speak(utterance);
      };

      playSegment(0);
    });
  }

  /**
   * Saludo hablado de bienvenida (item 17): usa la voz calmada de Aya por defecto.
   * Cancela cualquier lectura previa; nunca se solapa.
   */
  static speakGreeting(text: string, agentId: AgentId = 'aya', onEnd?: () => void) {
    this.speakText(text, agentId, onEnd);
  }

  static stopSpeech() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.stopAudioLevelPulse();
    }
  }

  static registerAudioLevelCallback(cb: (level: number) => void) {
    this.onAudioLevelCallback = cb;
  }

  private static simulateAudioLevelPulse() {
    this.pulseActive = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    const pulse = () => {
      if (!this.pulseActive) return;
      const level = 0.3 + Math.random() * 0.7;
      if (this.onAudioLevelCallback) this.onAudioLevelCallback(level);
      this.animationFrameId = requestAnimationFrame(pulse);
    };
    pulse();
  }

  private static stopAudioLevelPulse() {
    this.pulseActive = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.onAudioLevelCallback) {
      this.onAudioLevelCallback(0);
    }
  }

  static playEmergencyAlertSound() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // AudioContext fallback
    }
  }

  static playPomodoroBell() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      // AudioContext fallback
    }
  }
}
