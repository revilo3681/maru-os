/* eslint-disable @typescript-eslint/no-explicit-any */
import { AgentId } from '../types';

export class AudioService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static recognition: any = null;
  private static isSpeaking = false;
  private static onAudioLevelCallback: ((level: number) => void) | null = null;
  private static animationFrameId: number | null = null;

  static initSpeechRecognition(onResult: (text: string) => void, onError?: (err: any) => void) {
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
        if (onError) onError(err);
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
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition already started or error:', e);
      }
    }
  }

  static stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
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

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-PE';

    // Agent specific voice modulation
    switch (agentId) {
      case 'aya':
        utterance.pitch = 1.1;
        utterance.rate = 0.95;
        break;
      case 'inti':
        utterance.pitch = 0.9;
        utterance.rate = 0.98;
        break;
      case 'kipu':
        utterance.pitch = 1.0;
        utterance.rate = 1.15;
        break;
      case 'sumaq':
        utterance.pitch = 1.2;
        utterance.rate = 0.9;
        break;
      case 'pacha':
        utterance.pitch = 0.85;
        utterance.rate = 0.85;
        break;
      case 'tupac':
        utterance.pitch = 0.8;
        utterance.rate = 1.0;
        break;
      case 'yaku':
        utterance.pitch = 1.05;
        utterance.rate = 1.0;
        break;
    }

    // Attempt to pick a Spanish voice if available
    const voices = this.synth.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es') || v.lang.startsWith('es-PE') || v.lang.startsWith('es-MX') || v.lang.startsWith('es-ES'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.simulateAudioLevelPulse();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.stopAudioLevelPulse();
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.stopAudioLevelPulse();
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
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
    const pulse = () => {
      if (!this.isSpeaking) return;
      const level = 0.3 + Math.random() * 0.7;
      if (this.onAudioLevelCallback) this.onAudioLevelCallback(level);
      this.animationFrameId = requestAnimationFrame(pulse);
    };
    pulse();
  }

  private static stopAudioLevelPulse() {
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
