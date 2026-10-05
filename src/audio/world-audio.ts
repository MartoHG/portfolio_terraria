import type { SectionId } from '../content/types';

const MASTER_LEVEL = 0.025;
const RAMP_SECONDS = 1.6;
const EXTERIOR_SECTIONS = new Set<SectionId>(['about', 'projects']);

type AudioContextWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

/** A small, original Web Audio soundscape. It creates no context until start() is called. */
export class WorldAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private windGain: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private started = false;
  private disposed = false;
  private muted = false;
  private availableState: boolean;
  private section: SectionId = 'about';
  private visibilityBound = false;

  private readonly handleVisibility = () => {
    if (!this.context || !this.started) return;
    if (document.hidden || this.muted) {
      void this.context.suspend().catch(() => undefined);
    } else {
      void this.context.resume().catch(() => undefined);
    }
  };

  constructor() {
    if (typeof window === 'undefined') {
      this.availableState = false;
      return;
    }
    const audioWindow = window as AudioContextWindow;
    this.availableState = Boolean(audioWindow.AudioContext || audioWindow.webkitAudioContext);
  }

  get available(): boolean {
    return this.availableState && !this.disposed;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  async start(): Promise<void> {
    if (!this.available || this.disposed) return;
    const audioWindow = window as AudioContextWindow;
    const AudioContextConstructor = audioWindow.AudioContext || audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) {
      this.availableState = false;
      return;
    }

    try {
      if (!this.context) this.createSoundscape(new AudioContextConstructor());
      this.started = true;
      this.bindVisibility();
      this.applySectionMix(0);
      if (document.hidden || this.muted) {
        await this.context?.suspend();
      } else {
        await this.context?.resume();
      }
    } catch {
      this.availableState = false;
      this.disposeContext();
    }
  }

  setSection(section: SectionId): void {
    this.section = section;
    if (this.started && this.context?.state === 'running') this.applySectionMix(RAMP_SECONDS);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.context || !this.started) return;
    const now = this.context.currentTime;
    this.master?.gain.setTargetAtTime(muted ? 0 : MASTER_LEVEL, now, 0.045);
    this.handleVisibility();
  }

  playTeleport(): void {
    if (!this.canPlayEffect()) return;
    const context = this.context!;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.28);
    oscillator.frequency.exponentialRampToValueAtTime(247, now + 0.72);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.15, now + 0.06);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);
    oscillator.connect(envelope).connect(this.master!);
    oscillator.start(now);
    oscillator.stop(now + 0.8);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  playDoor(): void {
    if (!this.canPlayEffect()) return;
    const context = this.context!;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(155, now);
    oscillator.frequency.exponentialRampToValueAtTime(224, now + 0.12);
    oscillator.frequency.exponentialRampToValueAtTime(112, now + 0.42);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(230, now + 0.42);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.11, now + 0.035);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
    oscillator.connect(filter).connect(envelope).connect(this.master!);
    oscillator.start(now);
    oscillator.stop(now + 0.48);
    oscillator.onended = () => {
      oscillator.disconnect();
      filter.disconnect();
      envelope.disconnect();
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.availableState = false;
    if (this.visibilityBound && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibility);
      this.visibilityBound = false;
    }
    this.disposeContext();
  }

  private createSoundscape(context: AudioContext): void {
    this.context = context;
    const master = context.createGain();
    this.master = master;
    master.gain.value = this.muted ? 0 : MASTER_LEVEL;
    master.connect(context.destination);

    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;

    const windSource = context.createBufferSource();
    windSource.buffer = buffer;
    windSource.loop = true;
    const windHighPass = context.createBiquadFilter();
    windHighPass.type = 'highpass';
    windHighPass.frequency.value = 55;
    const windLowPass = context.createBiquadFilter();
    windLowPass.type = 'lowpass';
    windLowPass.frequency.value = 720;
    this.windGain = context.createGain();
    this.windGain.gain.value = 0;
    windSource.connect(windHighPass).connect(windLowPass).connect(this.windGain).connect(master);
    windSource.start();

    const waterSource = context.createBufferSource();
    waterSource.buffer = buffer;
    waterSource.loop = true;
    const waterHighPass = context.createBiquadFilter();
    waterHighPass.type = 'highpass';
    waterHighPass.frequency.value = 70;
    const waterLowPass = context.createBiquadFilter();
    waterLowPass.type = 'lowpass';
    waterLowPass.frequency.value = 360;
    this.waterGain = context.createGain();
    this.waterGain.gain.value = 0;
    waterSource.connect(waterHighPass).connect(waterLowPass).connect(this.waterGain).connect(master);
    waterSource.start();

    const modulation = context.createOscillator();
    const modulationDepth = context.createGain();
    modulation.type = 'sine';
    modulation.frequency.value = 0.07;
    modulationDepth.gain.value = 0.06;
    modulation.connect(modulationDepth).connect(this.waterGain.gain);
    modulation.start();

    this.padGain = context.createGain();
    this.padGain.gain.value = 0;
    this.createPadVoice(context, 110, 0.07, this.padGain);
    this.createPadVoice(context, 164.81, 0.035, this.padGain);
  }

  private createPadVoice(context: AudioContext, frequency: number, level: number, bus: GainNode): void {
    const oscillator = context.createOscillator();
    const voiceGain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    voiceGain.gain.value = level;
    oscillator.connect(voiceGain).connect(bus).connect(this.master!);
    oscillator.start();
  }

  private applySectionMix(ramp: number): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    const exterior = EXTERIOR_SECTIONS.has(this.section);
    this.rampGain(this.windGain, exterior ? 0.34 : 0.025, now, ramp);
    this.rampGain(this.waterGain, exterior ? 0.018 : 0.27, now, ramp);
    this.rampGain(this.padGain, 0.075, now, ramp);
  }

  private rampGain(node: GainNode | null, value: number, now: number, ramp: number): void {
    if (!node) return;
    node.gain.cancelScheduledValues(now);
    node.gain.setTargetAtTime(value, now, Math.max(0.01, ramp / 4));
  }

  private canPlayEffect(): boolean {
    return Boolean(this.started && !this.muted && !document.hidden && this.context?.state === 'running' && this.master);
  }

  private bindVisibility(): void {
    if (this.visibilityBound) return;
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.visibilityBound = true;
  }

  private disposeContext(): void {
    const context = this.context;
    if (!context) return;
    this.context = null;
    this.master = null;
    this.windGain = null;
    this.waterGain = null;
    this.padGain = null;
    void context.close().catch(() => undefined);
  }
}
