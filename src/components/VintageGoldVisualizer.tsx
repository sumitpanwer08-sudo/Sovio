import React, { useEffect, useRef, useState } from 'react';
import { webAudioVisualizerService } from '../services/webAudioVisualizer';
import { Activity, Radio, BarChart3, Waves, Gauge, Sparkles } from 'lucide-react';
import { soundscapeEngine } from '../services/soundscapeEngine';

export type VisualizerMode = 'bars' | 'wave' | 'vumeter' | 'peaks';

interface VintageGoldVisualizerProps {
  isPlaying: boolean;
  volume?: number;
  playbackSpeed?: number;
  currentTime?: number;
  className?: string;
  compact?: boolean;
  showModeControls?: boolean;
}

export const VintageGoldVisualizer: React.FC<VintageGoldVisualizerProps> = ({
  isPlaying,
  volume = 1,
  playbackSpeed = 1,
  currentTime = 0,
  className = '',
  compact = false,
  showModeControls = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('bars');
  const [sensitivity, setSensitivity] = useState<number>(1.2);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  // Peak hold state for vacuum tube bars
  const peakHoldRef = useRef<number[]>([]);
  const peakDecayRef = useRef<number[]>([]);
  
  // Needle smoothing for VU meter mode
  const needleLeftRef = useRef<number>(0);
  const needleRightRef = useRef<number>(0);

  // Cycle through visualizer modes
  const handleToggleMode = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundscapeEngine.playButtonClick();
    setMode((prev) => {
      if (prev === 'bars') return 'wave';
      if (prev === 'wave') return 'vumeter';
      if (prev === 'vumeter') return 'peaks';
      return 'bars';
    });
  };

  useEffect(() => {
    webAudioVisualizerService.init();
    if (isPlaying) {
      webAudioVisualizerService.resume();
    }
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (width === 0 || height === 0) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Handle HiDPI screens
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      // Sample Web Audio analysis
      const analysis = webAudioVisualizerService.sample(
        isPlaying,
        volume,
        playbackSpeed,
        currentTime
      );

      ctx.clearRect(0, 0, width, height);

      // --- Draw Vintage Radio Accent-Gold Background Grid & Vignette ---
      ctx.save();
      
      // Vintage warm background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, 'rgba(20, 16, 8, 0.45)');
      bgGrad.addColorStop(1, 'rgba(10, 8, 4, 0.75)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle warm gold gridlines
      ctx.strokeStyle = 'rgba(197, 160, 89, 0.08)';
      ctx.lineWidth = 1;
      const gridStepX = Math.max(12, width / 12);
      const gridStepY = Math.max(8, height / 4);

      ctx.beginPath();
      for (let x = gridStepX; x < width; x += gridStepX) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = gridStepY; y < height; y += gridStepY) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Accent Gold Palette definition
      const goldBright = '#fbbf24';     // Warm radiant gold
      const goldMid = '#c5a059';        // Vintage accent gold
      const goldDeep = '#b45309';       // Antique brass
      const goldGlow = 'rgba(245, 158, 11, 0.35)'; // Tube glow
      const goldPeak = '#fef08a';       // High-frequency filament spark

      // ========================================================
      // MODE 1: ANALOG VACUUM TUBE FREQUENCY BARS
      // ========================================================
      if (mode === 'bars') {
        const numBars = compact ? 14 : 20;
        const totalGap = width * 0.2;
        const barWidth = (width - totalGap) / numBars;
        const barGap = totalGap / (numBars + 1);
        const data = analysis.frequencyData;
        const step = Math.floor(data.length / numBars);

        // Initialize peak hold buffers
        if (peakHoldRef.current.length !== numBars) {
          peakHoldRef.current = new Array(numBars).fill(0);
          peakDecayRef.current = new Array(numBars).fill(0);
        }

        for (let i = 0; i < numBars; i++) {
          const dataIndex = Math.min(data.length - 1, i * step);
          const rawVal = data[dataIndex] / 255;
          const boost = (1 + (numBars - i) * 0.04) * sensitivity;
          const targetHeight = Math.min(height * 0.92, rawVal * height * boost);
          const x = barGap + i * (barWidth + barGap);

          // Update peak holds
          if (targetHeight > (peakHoldRef.current[i] || 0)) {
            peakHoldRef.current[i] = targetHeight;
            peakDecayRef.current[i] = 0;
          } else {
            peakDecayRef.current[i] = (peakDecayRef.current[i] || 0) + 0.35;
            peakHoldRef.current[i] = Math.max(0, (peakHoldRef.current[i] || 0) - peakDecayRef.current[i]);
          }

          const currentBarH = Math.max(2, targetHeight);
          const y = height - currentBarH - 2;

          // Draw Segmented Vacuum Tube Bar
          const segments = Math.max(3, Math.floor(height / (compact ? 5 : 6)));
          const segHeight = (height - 4) / segments;

          for (let s = 0; s < segments; s++) {
            const segY = height - (s + 1) * segHeight;
            if (segY + segHeight < y) continue; // Unlit segment

            const segFraction = s / segments;
            let segColor: string;

            if (segFraction > 0.85) {
              segColor = goldPeak; // High peak filament
            } else if (segFraction > 0.6) {
              segColor = goldBright;
            } else if (segFraction > 0.3) {
              segColor = goldMid;
            } else {
              segColor = goldDeep;
            }

            ctx.fillStyle = segColor;
            ctx.shadowColor = goldGlow;
            ctx.shadowBlur = isPlaying ? 6 : 1;

            // Draw segment with rounded corners
            const pad = 1;
            ctx.fillRect(x, segY + pad, barWidth, segHeight - pad * 2);
          }

          // Draw Floating Peak Line
          const peakY = height - peakHoldRef.current[i] - 3;
          if (peakY > 0 && peakY < height - 4) {
            ctx.fillStyle = goldPeak;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.fillRect(x, peakY, barWidth, 1.5);
          }
        }
      }

      // ========================================================
      // MODE 2: CRT OSCILLOSCOPE / CARRIER WAVEFORM
      // ========================================================
      else if (mode === 'wave') {
        const timeData = analysis.timeDomainData;
        const sliceWidth = width / (timeData.length - 1);
        const midY = height / 2;

        ctx.shadowColor = 'rgba(245, 158, 11, 0.75)';
        ctx.shadowBlur = isPlaying ? 10 : 3;

        // Primary Golden Carrier Wave
        ctx.beginPath();
        ctx.strokeStyle = goldBright;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] - 128) / 128;
          const waveAmp = (v * (height * 0.42) * sensitivity);
          const x = i * sliceWidth;
          const y = midY + waveAmp;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Secondary Ghost Phosphor Wave (Sub-harmonic trail)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.35)';
        ctx.lineWidth = 1;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] - 128) / 128;
          const waveAmp = (v * (height * 0.28) * sensitivity);
          const x = i * sliceWidth;
          const y = midY - waveAmp * 0.75;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Central Zero-Reference Dashed Line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.2)';
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;
        ctx.moveTo(0, midY);
        ctx.lineTo(width, midY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ========================================================
      // MODE 3: DUAL VINTAGE ANALOG BRASS VU METERS
      // ========================================================
      else if (mode === 'vumeter') {
        const meterWidth = (width - 12) / 2;
        const radius = Math.min(meterWidth * 0.8, height * 1.1);

        // Smooth left and right needle responses
        const targetL = Math.min(1, (analysis.averageVolume * 1.1 + analysis.bassEnergy * 0.3) * sensitivity);
        const targetR = Math.min(1, (analysis.averageVolume * 1.05 + analysis.midEnergy * 0.35) * sensitivity);
        needleLeftRef.current += (targetL - needleLeftRef.current) * 0.16;
        needleRightRef.current += (targetR - needleRightRef.current) * 0.16;

        const drawVUMeter = (centerX: number, label: string, value: number) => {
          const centerY = height * 0.95;
          const minAngle = -Math.PI * 0.72;
          const maxAngle = -Math.PI * 0.28;
          const angleRange = maxAngle - minAngle;
          const needleAngle = minAngle + value * angleRange;

          // Meter Face Arc
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 0.75, minAngle - 0.05, maxAngle + 0.05);
          ctx.strokeStyle = 'rgba(197, 160, 89, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // dB Scale Markings (-20, -10, -5, 0, +3 dB)
          const marks = [
            { pos: 0.1, label: '-20' },
            { pos: 0.35, label: '-10' },
            { pos: 0.6, label: '-5' },
            { pos: 0.8, label: '0', isRed: true },
            { pos: 1.0, label: '+3', isRed: true }
          ];

          marks.forEach((m) => {
            const a = minAngle + m.pos * angleRange;
            const x1 = centerX + Math.cos(a) * (radius * 0.7);
            const y1 = centerY + Math.sin(a) * (radius * 0.7);
            const x2 = centerX + Math.cos(a) * (radius * 0.78);
            const y2 = centerY + Math.sin(a) * (radius * 0.78);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = m.isRed ? '#f87171' : goldMid;
            ctx.lineWidth = m.isRed ? 1.5 : 1;
            ctx.stroke();

            if (!compact && height > 40) {
              const tx = centerX + Math.cos(a) * (radius * 0.6);
              const ty = centerY + Math.sin(a) * (radius * 0.6);
              ctx.font = '8px monospace';
              ctx.fillStyle = m.isRed ? '#f87171' : 'rgba(197, 160, 89, 0.7)';
              ctx.textAlign = 'center';
              ctx.fillText(m.label, tx, ty);
            }
          });

          // Meter Label (L / R)
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = goldMid;
          ctx.textAlign = 'center';
          ctx.fillText(label, centerX, height * 0.32);

          // Brass Needle
          const needleLen = radius * 0.76;
          const tipX = centerX + Math.cos(needleAngle) * needleLen;
          const tipY = centerY + Math.sin(needleAngle) * needleLen;

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(tipX, tipY);
          ctx.strokeStyle = value > 0.82 ? '#ef4444' : goldBright;
          ctx.shadowColor = value > 0.82 ? '#ef4444' : goldGlow;
          ctx.shadowBlur = 5;
          ctx.lineWidth = 1.6;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Pivot Brass Cap
          ctx.beginPath();
          ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
          ctx.fillStyle = goldDeep;
          ctx.fill();

          // Peak Overload LED
          if (value > 0.85) {
            ctx.beginPath();
            ctx.arc(centerX + meterWidth * 0.32, height * 0.25, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
            ctx.fill();
          }
        };

        drawVUMeter(meterWidth * 0.5 + 4, 'VU • LEFT', needleLeftRef.current);
        drawVUMeter(meterWidth * 1.5 + 8, 'VU • RIGHT', needleRightRef.current);
      }

      // ========================================================
      // MODE 4: HIMALAYAN GOLDEN RIDGE SPECTRUM
      // ========================================================
      else if (mode === 'peaks') {
        const data = analysis.frequencyData;
        const points = 32;
        const step = Math.floor(data.length / points);
        const slice = width / (points - 1);
        const baseY = height - 2;

        // Draw 3 layered golden mountain harmonic ridges
        const layers = [
          { color: 'rgba(180, 83, 9, 0.35)', scale: 0.55, shift: 0.8, fill: 'rgba(180, 83, 9, 0.15)' },
          { color: 'rgba(217, 119, 6, 0.55)', scale: 0.75, shift: 1.2, fill: 'rgba(217, 119, 6, 0.22)' },
          { color: 'rgba(251, 191, 36, 0.85)', scale: 1.0, shift: 1.0, fill: 'rgba(197, 160, 89, 0.28)' }
        ];

        layers.forEach((layer) => {
          ctx.beginPath();
          ctx.moveTo(0, baseY);

          for (let i = 0; i < points; i++) {
            const dataIdx = Math.min(data.length - 1, Math.floor(i * step * layer.shift) % data.length);
            const val = (data[dataIdx] / 255) * sensitivity;
            const h = val * (height * 0.82) * layer.scale;
            const x = i * slice;
            const y = baseY - Math.max(3, h);

            if (i === 0) ctx.lineTo(x, y);
            else {
              const prevX = (i - 1) * slice;
              const prevDataIdx = Math.min(data.length - 1, Math.floor((i - 1) * step * layer.shift) % data.length);
              const prevVal = (data[prevDataIdx] / 255) * sensitivity;
              const prevY = baseY - Math.max(3, prevVal * (height * 0.82) * layer.scale);
              const cx = (prevX + x) / 2;
              const cy = (prevY + y) / 2;
              ctx.quadraticCurveTo(prevX, prevY, cx, cy);
            }
          }

          ctx.lineTo(width, baseY);
          ctx.closePath();

          ctx.fillStyle = layer.fill;
          ctx.fill();

          ctx.strokeStyle = layer.color;
          ctx.shadowColor = goldGlow;
          ctx.shadowBlur = isPlaying ? 5 : 0;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        });
      }

      // Outer Bezel Accent-Gold Glow Border
      ctx.restore();
      ctx.strokeStyle = isHovered ? 'rgba(245, 158, 11, 0.55)' : 'rgba(197, 160, 89, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, volume, playbackSpeed, currentTime, mode, sensitivity, compact, isHovered]);

  const getModeIcon = () => {
    switch (mode) {
      case 'bars':
        return <BarChart3 className="w-3.5 h-3.5 text-amber-400" />;
      case 'wave':
        return <Waves className="w-3.5 h-3.5 text-amber-400" />;
      case 'vumeter':
        return <Gauge className="w-3.5 h-3.5 text-amber-400" />;
      case 'peaks':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'bars':
        return 'Vacuum Tube EQ';
      case 'wave':
        return 'Phosphor Wave';
      case 'vumeter':
        return 'Analog VU Meter';
      case 'peaks':
        return 'Pahadi Spectrum';
    }
  };

  return (
    <div
      onClick={handleToggleMode}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group rounded-xl overflow-hidden cursor-pointer select-none border border-[#c5a059]/30 bg-[#0e0c08]/85 backdrop-blur-md shadow-[inset_0_1px_4px_rgba(0,0,0,0.8),0_0_12px_rgba(197,160,89,0.12)] transition-all hover:border-[#c5a059]/60 ${className}`}
      title="Web Audio API Gold Visualizer — Click to switch mode (EQ Bars • Waveform • VU Meter • Golden Peaks)"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />

      {/* Top Overlay Badge & Interactive Switcher */}
      {showModeControls && (
        <div className="absolute top-1 left-2 right-2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/85 border border-[#c5a059]/40 text-[9px] font-mono-space text-amber-300 backdrop-blur-md shadow">
            {getModeIcon()}
            <span>{getModeLabel()}</span>
          </div>

          <div className="flex items-center gap-1 font-mono-space text-[8px] text-amber-200/80 bg-black/85 px-1.5 py-0.5 rounded border border-[#c5a059]/30">
            <span>WebAudio API</span>
          </div>
        </div>
      )}

      {/* Subtle Live Audio Pulse Dot in Corner */}
      <div className="absolute bottom-1 right-1.5 flex items-center gap-1 pointer-events-none">
        <span
          className={`w-1.5 h-1.5 rounded-full transition-all ${
            isPlaying
              ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-pulse'
              : 'bg-amber-600/40'
          }`}
        />
      </div>
    </div>
  );
};
