/**
 * High-fidelity Web Audio API sound synthesizer for Battle Royale combat
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.7;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Gunshots
  public playGunshot(type: 'pistol' | 'smg' | 'ar' | 'shotgun' | 'sniper' | 'heavy') {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, t);
    masterGain.connect(this.ctx.destination);

    if (type === 'sniper') {
      // Powerful punch + long echo
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

      gain.gain.setValueAtTime(1.0, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

      // White noise blast
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1200;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      osc.connect(gain);
      gain.connect(masterGain);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      osc.start(t);
      osc.stop(t + 0.45);
      noise.start(t);
      noise.stop(t + 0.4);
    } else if (type === 'shotgun') {
      // Heavy wide blast
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 0.25);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(1.2, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(t);
      noise.stop(t + 0.25);
    } else if (type === 'ar' || type === 'heavy') {
      // Rapid assault punch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

      gain.gain.setValueAtTime(0.85, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(masterGain);
      noise.connect(noiseGain);
      noiseGain.connect(masterGain);

      osc.start(t);
      osc.stop(t + 0.15);
      noise.start(t);
      noise.stop(t + 0.15);
    } else {
      // SMG or Pistol: snappy pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(type === 'smg' ? 440 : 380, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  // Reload sound
  public playReload() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volume * 0.7;
    masterGain.connect(this.ctx.destination);

    // Click 1 (mag drop)
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.frequency.setValueAtTime(800, t);
    osc1.frequency.exponentialRampToValueAtTime(200, t + 0.08);
    g1.gain.setValueAtTime(0.4, t);
    g1.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc1.connect(g1);
    g1.connect(masterGain);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // Click 2 (mag insert)
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.frequency.setValueAtTime(500, t + 0.35);
    osc2.frequency.exponentialRampToValueAtTime(950, t + 0.42);
    g2.gain.setValueAtTime(0.5, t + 0.35);
    g2.gain.exponentialRampToValueAtTime(0.01, t + 0.42);
    osc2.connect(g2);
    g2.connect(masterGain);
    osc2.start(t + 0.35);
    osc2.stop(t + 0.42);

    // Slide rack
    const osc3 = this.ctx.createOscillator();
    const g3 = this.ctx.createGain();
    osc3.frequency.setValueAtTime(1100, t + 0.6);
    osc3.frequency.exponentialRampToValueAtTime(400, t + 0.72);
    g3.gain.setValueAtTime(0.6, t + 0.6);
    g3.gain.exponentialRampToValueAtTime(0.01, t + 0.72);
    osc3.connect(g3);
    g3.connect(masterGain);
    osc3.start(t + 0.6);
    osc3.stop(t + 0.72);
  }

  // Bullet hit sound
  public playHit(isHeadshot: boolean) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volume;
    masterGain.connect(this.ctx.destination);

    if (isHeadshot) {
      // High pitch metallic ping / ding!
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600, t);
      osc.frequency.exponentialRampToValueAtTime(2400, t + 0.12);
      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.25);
    } else {
      // Flesh thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  // Elimination / Kill sound
  public playElimination() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volume * 0.9;
    masterGain.connect(this.ctx.destination);

    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.15);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.15);
    });
  }

  // Explosion (barrel or grenade)
  public playExplosion() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volume * 1.3;
    masterGain.connect(this.ctx.destination);

    // Deep sub-bass boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.8);
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.8);

    // Noise rumble
    const bufferSize = this.ctx.sampleRate * 0.7;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + 0.7);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(t);
    noise.stop(t + 0.7);
  }

  // Gloo wall placement
  public playGlooWall() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volume * 0.8;
    masterGain.connect(this.ctx.destination);

    // Crystalline ice impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.25);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Medkit heal sound
  public playHeal() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volume * 0.6;
    masterGain.connect(this.ctx.destination);

    const chords = [523.25, 659.25, 783.99, 1046.5];
    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.3);
    });
  }

  // Storm zone siren warning
  public playZoneWarning() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volume * 0.5;
    masterGain.connect(this.ctx.destination);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(650, t + 0.3);
    osc.frequency.linearRampToValueAtTime(400, t + 0.6);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  // Free Fire iconic "BOOYAH!" fanfare celebration
  public playBooyah() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volume * 0.9;
    masterGain.connect(this.ctx.destination);

    // Brass triumphal chords
    const notes = [
      { f: 523.25, time: 0, dur: 0.2 }, // C5
      { f: 523.25, time: 0.2, dur: 0.2 }, // C5
      { f: 659.25, time: 0.4, dur: 0.25 }, // E5
      { f: 783.99, time: 0.65, dur: 0.35 }, // G5
      { f: 1046.5, time: 1.0, dur: 0.8 }, // C6 (long triumphant)
    ];

    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = n.f;

      gain.gain.setValueAtTime(0.5, t + n.time);
      gain.gain.exponentialRampToValueAtTime(0.01, t + n.time + n.dur);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2500;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(t + n.time);
      osc.stop(t + n.time + n.dur);
    });
  }

  // UI click
  public playClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
    gain.gain.setValueAtTime(this.volume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

export const soundEngine = new SoundEngine();
