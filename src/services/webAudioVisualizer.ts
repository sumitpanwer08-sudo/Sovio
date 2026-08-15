// Web Audio API visualizer engine & analyser manager

export interface AudioFrequencyAnalysis {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  averageVolume: number;
  bassEnergy: number;
  midEnergy: number;
  trebleEnergy: number;
  peakLevel: number;
  isRealStream: boolean;
}

class WebAudioVisualizerService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private connectedElement: HTMLAudioElement | null = null;
  private isSourceConnected = false;
  private fftSize = 128;
  private dataArray: Uint8Array = new Uint8Array(64);
  private timeArray: Uint8Array = new Uint8Array(64);
  private synthPhase = 0;
  private lastAvgVolume = 0;

  public init() {
    if (this.audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = this.fftSize;
        this.analyser.smoothingTimeConstant = 0.82;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeArray = new Uint8Array(this.analyser.frequencyBinCount);
      }
    } catch (err: any) {
      console.warn('Web Audio API Analyser initialization notice:', err?.message || String(err));
    }
  }

  public connectMediaElement(element: HTMLAudioElement | null) {
    // Note: To avoid browser CORS audio muting on external CDNs (like saavncdn/audius),
    // we do not route the media element through createMediaElementSource unless requested.
    // The visualizer uses high-fidelity harmonic simulation synchronized with playback state.
    if (!element) return;
    this.init();
  }

  public resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  /**
   * Samples current audio frame from AnalyserNode or produces synthesized analog tube resonance
   */
  public sample(isPlaying: boolean, volume = 1, playbackSpeed = 1, currentTime = 0): AudioFrequencyAnalysis {
    const binCount = this.analyser ? this.analyser.frequencyBinCount : 64;
    if (this.dataArray.length !== binCount) {
      this.dataArray = new Uint8Array(binCount);
      this.timeArray = new Uint8Array(binCount);
    }

    let hasRealData = false;

    if (this.analyser && this.isSourceConnected && isPlaying) {
      try {
        this.analyser.getByteFrequencyData(this.dataArray);
        this.analyser.getByteTimeDomainData(this.timeArray);

        // Check if data is non-zero
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
          sum += this.dataArray[i];
        }
        if (sum > 10) {
          hasRealData = true;
        }
      } catch (e) {
        hasRealData = false;
      }
    }

    // If real source is quiet/cross-origin or not attached, generate organic analog spectrum
    if (!hasRealData) {
      this.synthPhase += (isPlaying ? 0.08 : 0.01) * playbackSpeed;
      const t = this.synthPhase;
      const beat = Math.sin(t * 3.2) * 0.5 + 0.5;
      const subBeat = Math.cos(t * 1.6 + 0.5) * 0.5 + 0.5;
      const melodyMod = Math.sin(t * 0.8 + currentTime * 0.5) * 0.4 + 0.6;
      const baseAmp = isPlaying ? Math.max(0.25, volume) : 0.04;

      for (let i = 0; i < binCount; i++) {
        const normIndex = i / binCount;
        let val = 0;

        if (isPlaying) {
          // Low frequencies (Bass & Drums)
          if (normIndex < 0.25) {
            val = (Math.sin(t * 4 + i * 0.8) * 0.35 + 0.65) * (beat * 0.6 + 0.4);
            val += Math.sin(t * 6 + i) * 0.2;
          }
          // Mid frequencies (Vocals & Strings)
          else if (normIndex < 0.7) {
            val = (Math.cos(t * 2.5 + i * 0.5) * 0.3 + 0.55) * melodyMod;
            val += Math.sin(t * 5 + i * 1.2) * 0.25 * subBeat;
          }
          // High frequencies (Air & Cymbals)
          else {
            val = (Math.sin(t * 7 + i * 0.9) * 0.25 + 0.4) * (Math.random() * 0.3 + 0.7);
          }

          // Natural frequency rolloff
          val *= (1 - normIndex * 0.35) * baseAmp;
          this.dataArray[i] = Math.min(255, Math.max(0, Math.floor(val * 240)));
          this.timeArray[i] = Math.min(255, Math.max(0, Math.floor(128 + val * 100 * Math.sin(t * 8 + i * 0.5))));
        } else {
          // Idle ambient tube warmth
          const idleVal = (Math.sin(t + i * 0.2) * 0.05 + 0.05) * 255;
          this.dataArray[i] = Math.floor(idleVal);
          this.timeArray[i] = 128;
        }
      }
    }

    // Calculate band energies
    let total = 0;
    let bass = 0;
    let mid = 0;
    let treble = 0;
    let peak = 0;

    const bassEnd = Math.floor(binCount * 0.25);
    const midEnd = Math.floor(binCount * 0.7);

    for (let i = 0; i < binCount; i++) {
      const val = this.dataArray[i];
      total += val;
      if (val > peak) peak = val;
      if (i < bassEnd) bass += val;
      else if (i < midEnd) mid += val;
      else treble += val;
    }

    const avg = total / binCount;
    // Exponential smoothing for volume meter
    this.lastAvgVolume += (avg - this.lastAvgVolume) * 0.15;

    return {
      frequencyData: this.dataArray,
      timeDomainData: this.timeArray,
      averageVolume: this.lastAvgVolume / 255,
      bassEnergy: bass / (bassEnd || 1) / 255,
      midEnergy: mid / (midEnd - bassEnd || 1) / 255,
      trebleEnergy: treble / (binCount - midEnd || 1) / 255,
      peakLevel: peak / 255,
      isRealStream: hasRealData
    };
  }
}

export const webAudioVisualizerService = new WebAudioVisualizerService();
