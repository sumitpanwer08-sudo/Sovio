// Web Audio API ambient noise generator for Pahadi soundscapes

class PahadiSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private nodes: Map<string, { gain: GainNode; stop: () => void }> = new Map();

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- 1. Rain Generator ---
  private startRain(): { gain: GainNode; stop: () => void } {
    if (!this.ctx) throw new Error('No audio context');

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // Pink-ish white noise
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter for tin-roof rain effect
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.2;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();

    return {
      gain,
      stop: () => {
        try { noise.stop(); } catch(e){}
      }
    };
  }

  // --- 2. Pine Wind Generator ---
  private startWind(): { gain: GainNode; stop: () => void } {
    if (!this.ctx) throw new Error('No audio context');

    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise
      lastOut = data[i];
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 2.0;

    // LFO to modulate wind frequency
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.15; // Slow howling wind
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 250;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.value = 0.25;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    lfo.start();

    return {
      gain,
      stop: () => {
        try { noise.stop(); lfo.stop(); } catch(e){}
      }
    };
  }

  // --- 3. Bonfire Crackle Generator ---
  private startBonfire(): { gain: GainNode; stop: () => void } {
    if (!this.ctx) throw new Error('No audio context');

    const gain = this.ctx.createGain();
    gain.gain.value = 0.2;
    gain.connect(this.ctx.destination);

    // Create random crackle impulses
    let isRunning = true;
    const scheduleCrackle = () => {
      if (!isRunning || !this.ctx) return;

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = 100 + Math.random() * 400;
      oscGain.gain.setValueAtTime(0.15 + Math.random() * 0.2, this.ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.02 + Math.random() * 0.05);

      osc.connect(oscGain);
      oscGain.connect(gain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);

      const nextDelay = 80 + Math.random() * 300;
      setTimeout(scheduleCrackle, nextDelay);
    };

    scheduleCrackle();

    return {
      gain,
      stop: () => {
        isRunning = false;
      }
    };
  }

  // --- 4. River Stream Generator ---
  private startStream(): { gain: GainNode; stop: () => void } {
    if (!this.ctx) throw new Error('No audio context');

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1.0;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.2;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();

    return {
      gain,
      stop: () => {
        try { noise.stop(); } catch(e){}
      }
    };
  }

  // --- 5. HRTC Bus Engine Hum ---
  private startHrtc(): { gain: GainNode; stop: () => void } {
    if (!this.ctx) throw new Error('No audio context');

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 55; // Deep diesel engine rumbles

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.25;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();

    return {
      gain,
      stop: () => {
        try { osc.stop(); } catch(e){}
      }
    };
  }

  public setSoundVolume(id: string, volume: number, enabled: boolean) {
    this.initCtx();
    if (!enabled || volume <= 0) {
      if (this.nodes.has(id)) {
        this.nodes.get(id)!.stop();
        this.nodes.delete(id);
      }
      return;
    }

    if (!this.nodes.has(id)) {
      let created: { gain: GainNode; stop: () => void } | null = null;
      if (id === 'rain') created = this.startRain();
      else if (id === 'wind') created = this.startWind();
      else if (id === 'bonfire') created = this.startBonfire();
      else if (id === 'stream') created = this.startStream();
      else if (id === 'hrtc') created = this.startHrtc();

      if (created) {
        this.nodes.set(id, created);
      }
    }

    const sound = this.nodes.get(id);
    if (sound && this.ctx) {
      sound.gain.gain.setValueAtTime(Math.max(0.001, volume * 0.4), this.ctx.currentTime);
    }
  }

  public playTuningStatic() {
    this.initCtx();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.25; // 250ms static burst
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.12;

    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  // Harmonic chord resonance for smooth transitions & fallback melody
  public playHarmonicResonance(freq: number = 440) {
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  public playButtonClick() {
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch(e) {}
  }

  public stopAll() {
    this.nodes.forEach((sound) => sound.stop());
    this.nodes.clear();
  }
}

export const soundscapeEngine = new PahadiSoundscapeEngine();
