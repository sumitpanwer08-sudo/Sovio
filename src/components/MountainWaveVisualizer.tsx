import React, { useEffect, useRef } from 'react';
import { AtmosphereMode } from '../types';

interface MountainWaveVisualizerProps {
  isPlaying: boolean;
  atmosphere?: AtmosphereMode;
  playbackSpeed?: number;
  className?: string;
}

export const MountainWaveVisualizer: React.FC<MountainWaveVisualizerProps> = ({
  isPlaying,
  atmosphere = 'mist',
  playbackSpeed = 1,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const smoothedAmplitudeRef = useRef<number>(0.15);

  // Dynamic ridge colors matching Pahadi atmosphere themes
  const getAtmosphereColors = () => {
    switch (atmosphere) {
      case 'sunset':
        return {
          ridge1: 'rgba(251, 146, 60, 0.55)', // Warm orange
          ridge2: 'rgba(244, 63, 94, 0.40)',  // Rose
          ridge3: 'rgba(217, 119, 6, 0.25)',  // Amber glow
          baseline: 'rgba(251, 146, 60, 0.15)'
        };
      case 'snow':
        return {
          ridge1: 'rgba(56, 189, 248, 0.60)', // Sky ice blue
          ridge2: 'rgba(224, 242, 254, 0.45)', // Snow white tint
          ridge3: 'rgba(14, 165, 233, 0.25)', // Deep glacier
          baseline: 'rgba(56, 189, 248, 0.15)'
        };
      case 'night':
        return {
          ridge1: 'rgba(129, 140, 248, 0.55)', // Indigo moonlight
          ridge2: 'rgba(168, 85, 247, 0.38)',  // Purple shadow
          ridge3: 'rgba(99, 102, 241, 0.25)',  // Starlight blue
          baseline: 'rgba(129, 140, 248, 0.12)'
        };
      case 'mist':
      default:
        return {
          ridge1: 'rgba(245, 158, 11, 0.65)', // Amber pine
          ridge2: 'rgba(217, 119, 6, 0.40)',  // Mountain gold
          ridge3: 'rgba(180, 83, 9, 0.25)',   // Deep deodar
          baseline: 'rgba(245, 158, 11, 0.15)'
        };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let targetAmp = isPlaying ? 0.75 : 0.12;

    const render = () => {
      // Responsive canvas resolution matching device pixel ratio
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * 2 || canvas.height !== height * 2) {
        canvas.width = width * 2;
        canvas.height = height * 2;
        ctx.scale(2, 2);
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth amplitude transitions for gentle breathing mountain waves
      targetAmp = isPlaying ? 0.65 + Math.sin(phaseRef.current * 1.5) * 0.22 : 0.1;
      smoothedAmplitudeRef.current += (targetAmp - smoothedAmplitudeRef.current) * 0.06;

      const speedFactor = isPlaying ? 0.028 * playbackSpeed : 0.006;
      phaseRef.current += speedFactor;

      const colors = getAtmosphereColors();
      const midY = height * 0.58;

      // Draw 3 layered harmonic mountain ridges with organic peak harmonics
      const drawMountainRidge = (
        color: string,
        wavelength: number,
        harmonicRatio: number,
        ampScale: number,
        phaseOffset: number,
        strokeWidth: number
      ) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const step = 3;
        for (let x = 0; x <= width; x += step) {
          const normX = x / width;
          // Mountain valley envelope: tapered slightly at edges, elevated in mid-peaks
          const envelope = Math.sin(normX * Math.PI) * 0.85 + 0.15;

          // Compound mountain harmonic wave (resembles mountain ridgelines)
          const primaryWave = Math.sin(normX * wavelength + phaseRef.current + phaseOffset);
          const secondaryRidge = Math.sin(normX * wavelength * 2.2 - phaseRef.current * 1.3 + phaseOffset) * 0.45;
          const subtleMicroPeak = Math.sin(normX * wavelength * 4.1 + phaseRef.current * 0.8) * 0.18;

          const waveY = (primaryWave + secondaryRidge + subtleMicroPeak) *
            smoothedAmplitudeRef.current *
            ampScale *
            envelope *
            (height * 0.42);

          const y = midY - waveY;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      };

      // 1. Far background ridge (softer, wider)
      drawMountainRidge(colors.ridge3, 4.2, 0.4, 0.55, 1.8, 1.2);

      // 2. Middle mountain ridge
      drawMountainRidge(colors.ridge2, 5.8, 0.6, 0.78, 0.9, 1.5);

      // 3. Crisp foreground ridge with glowing tip
      drawMountainRidge(colors.ridge1, 7.2, 0.8, 1.0, 0, 1.8);

      // Add gentle peak micro-stars when playing enthusiastically
      if (isPlaying) {
        ctx.fillStyle = colors.ridge1;
        const peakX = width * (0.35 + Math.sin(phaseRef.current * 0.4) * 0.25);
        const peakY = midY - smoothedAmplitudeRef.current * height * 0.4 * (0.8 + Math.cos(phaseRef.current) * 0.2);
        ctx.beginPath();
        ctx.arc(peakX, peakY, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, atmosphere, playbackSpeed]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden pointer-events-none select-none ${className}`}
      title={isPlaying ? 'Mountain Audio Waveform (Active Sync)' : 'Mountain Audio Waveform (Idle)'}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
