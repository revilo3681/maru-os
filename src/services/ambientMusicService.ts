/**
 * Música ambiente local generada con Web Audio (sin archivos externos).
 * Capas mezclables: río, aves, cascada.
 */

export type AmbientLayerId = 'river' | 'birds' | 'waterfall';

type LayerNodes = {
  gain: GainNode;
  stop: () => void;
};

class AmbientMusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layers: Partial<Record<AmbientLayerId, LayerNodes>> = {};
  private playing = false;
  private volumes: Record<AmbientLayerId, number> = {
    river: 0.45,
    birds: 0.35,
    waterfall: 0.25
  };
  private masterVolume = 0.55;

  isPlaying() {
    return this.playing;
  }

  getVolumes() {
    return { master: this.masterVolume, ...this.volumes };
  }

  private ensureCtx() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.masterVolume;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private noiseBuffer(seconds = 2): AudioBuffer {
    const ctx = this.ensureCtx();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private startNoiseLayer(
    id: AmbientLayerId,
    filterType: BiquadFilterType,
    frequency: number,
    q: number,
    volume: number
  ) {
    const ctx = this.ensureCtx();
    if (!this.master) return;
    this.stopLayer(id);

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(3);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = q;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();

    this.layers[id] = {
      gain,
      stop: () => {
        try {
          src.stop();
          src.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {
          /* ignore */
        }
      }
    };
  }

  private startBirdsLayer(volume: number) {
    const ctx = this.ensureCtx();
    if (!this.master) return;
    this.stopLayer('birds');

    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(this.master);

    let alive = true;
    const chirp = () => {
      if (!alive || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      const f0 = 1800 + Math.random() * 2200;
      osc.frequency.setValueAtTime(f0, now);
      osc.frequency.exponentialRampToValueAtTime(f0 * (0.7 + Math.random() * 0.5), now + 0.12);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(g);
      g.connect(gain);
      osc.start(now);
      osc.stop(now + 0.16);
      const wait = 400 + Math.random() * 2200;
      window.setTimeout(chirp, wait);
    };
    chirp();

    this.layers.birds = {
      gain,
      stop: () => {
        alive = false;
        try {
          gain.disconnect();
        } catch {
          /* ignore */
        }
      }
    };
  }

  private stopLayer(id: AmbientLayerId) {
    this.layers[id]?.stop();
    delete this.layers[id];
  }

  async play() {
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    this.startNoiseLayer('river', 'lowpass', 720, 0.7, this.volumes.river);
    this.startNoiseLayer('waterfall', 'bandpass', 1400, 0.9, this.volumes.waterfall);
    this.startBirdsLayer(this.volumes.birds);
    this.playing = true;
  }

  stop() {
    (Object.keys(this.layers) as AmbientLayerId[]).forEach((id) => this.stopLayer(id));
    this.playing = false;
  }

  setMasterVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.masterVolume;
  }

  setLayerVolume(id: AmbientLayerId, v: number) {
    this.volumes[id] = Math.max(0, Math.min(1, v));
    if (this.layers[id]) this.layers[id]!.gain.gain.value = this.volumes[id];
  }
}

export const AmbientMusicService = new AmbientMusicEngine();
