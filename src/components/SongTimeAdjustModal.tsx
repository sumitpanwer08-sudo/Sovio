import React, { useState, useEffect } from 'react';
import {
  Clock,
  X,
  RotateCcw,
  RotateCw,
  Gauge,
  Moon,
  Play,
  Pause,
  Sparkles,
  Timer,
  FastForward,
  Rewind,
  Check,
  Radio,
  Sun,
  Smartphone
} from 'lucide-react';
import { TrackInfo } from '../types';

interface SongTimeAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  sleepTimerRemaining: number | null;
  onSetSleepTimer: (minutes: number | null) => void;
  trackInfo: TrackInfo;
  keepScreenAwake?: boolean;
  onToggleScreenAwake?: () => void;
}

export const SongTimeAdjustModal: React.FC<SongTimeAdjustModalProps> = ({
  isOpen,
  onClose,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  playbackSpeed,
  onPlaybackSpeedChange,
  sleepTimerRemaining,
  onSetSleepTimer,
  trackInfo,
  keepScreenAwake = false,
  onToggleScreenAwake
}) => {
  const [sliderVal, setSliderVal] = useState<number>(currentTime);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    if (!isDragging) {
      setSliderVal(currentTime);
    }
  }, [currentTime, isDragging]);

  if (!isOpen) return null;

  const formatTime = (secs: number): string => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderVal(Number(e.target.value));
  };

  const handleSliderCommit = () => {
    setIsDragging(false);
    onSeek(sliderVal);
  };

  const handleSkip = (delta: number) => {
    const maxDur = duration > 0 ? duration : 300;
    const target = Math.max(0, Math.min(maxDur, currentTime + delta));
    onSeek(target);
  };

  const formatSleepTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const maxDuration = duration > 0 ? duration : 300;
  const progressPercent = maxDuration > 0 ? (sliderVal / maxDuration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-[#181410] border border-amber-500/30 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#241c14] to-[#16120e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-garamond text-xl font-bold text-white tracking-wide flex items-center gap-2">
                Song Time Adjust
              </h2>
              <p className="font-mono-space text-xs text-amber-200/60 tracking-wider">
                Scrub song position, speed, and mountain sleep timer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition p-2 rounded-xl hover:bg-white/10"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          
          {/* Currently Playing Card */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-3">
              <div className="font-mono-space text-[10px] text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Now Playing</span>
              </div>
              <h3 className="font-medium text-white text-sm truncate mt-0.5">
                {trackInfo.title || 'Mountain Radio Track'}
              </h3>
            </div>
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center font-bold transition transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg flex-shrink-0"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
            </button>
          </div>

          {/* Time Scrubber Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono-space text-xs text-white/70">
              <span className="text-amber-300 font-semibold text-sm">
                {formatTime(sliderVal)}
              </span>
              <span className="text-white/40 text-[11px]">
                {Math.round(progressPercent)}%
              </span>
              <span className="text-white/60">
                {formatTime(maxDuration)}
              </span>
            </div>

            {/* Range Scrubber */}
            <div className="relative flex items-center group">
              <input
                type="range"
                min={0}
                max={maxDuration}
                step={1}
                value={sliderVal}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                onChange={handleSliderChange}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
                className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${progressPercent}%, rgba(255,255,255,0.1) ${progressPercent}%, rgba(255,255,255,0.1) 100%)`
                }}
              />
            </div>
            <p className="text-[11px] font-mono-space text-white/40 text-center">
              Drag or click the slider to jump anywhere in the song
            </p>
          </div>

          {/* Quick Jump Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-mono-space text-white/60 uppercase tracking-wider">
              Quick Time Jump
            </label>
            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={() => onSeek(0)}
                className="py-2 px-1 bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 border border-white/10 hover:border-amber-500/40 rounded-xl font-mono-space text-[11px] transition flex flex-col items-center justify-center gap-1"
                title="Restart Song"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>0:00</span>
              </button>

              <button
                onClick={() => handleSkip(-30)}
                className="py-2 px-1 bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 border border-white/10 hover:border-amber-500/40 rounded-xl font-mono-space text-[11px] transition flex flex-col items-center justify-center gap-1"
                title="Rewind 30 Seconds"
              >
                <Rewind className="w-3.5 h-3.5" />
                <span>-30s</span>
              </button>

              <button
                onClick={() => handleSkip(-10)}
                className="py-2 px-1 bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 border border-white/10 hover:border-amber-500/40 rounded-xl font-mono-space text-[11px] transition flex flex-col items-center justify-center gap-1"
                title="Rewind 10 Seconds (Shift + Left)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>-10s</span>
              </button>

              <button
                onClick={() => handleSkip(10)}
                className="py-2 px-1 bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 border border-white/10 hover:border-amber-500/40 rounded-xl font-mono-space text-[11px] transition flex flex-col items-center justify-center gap-1"
                title="Forward 10 Seconds (Shift + Right)"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>+10s</span>
              </button>

              <button
                onClick={() => handleSkip(30)}
                className="py-2 px-1 bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 border border-white/10 hover:border-amber-500/40 rounded-xl font-mono-space text-[11px] transition flex flex-col items-center justify-center gap-1"
                title="Forward 30 Seconds"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>+30s</span>
              </button>
            </div>
          </div>

          {/* Playback Speed Controller */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono-space text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>Playback Speed</span>
              </label>
              <span className="font-mono-space text-xs text-amber-300 font-semibold">
                {playbackSpeed}x
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[0.75, 1.0, 1.25, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onPlaybackSpeedChange(spd)}
                  className={`py-2 rounded-xl font-mono-space text-xs transition border flex items-center justify-center gap-1 ${
                    playbackSpeed === spd
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 font-semibold shadow-sm'
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span>{spd === 0.75 ? '0.75x (Lo-Fi)' : `${spd}x`}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mountain Sleep Timer */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono-space text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mountain Sleep Timer</span>
              </label>
              {sleepTimerRemaining !== null && (
                <span className="font-mono-space text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                  {formatSleepTime(sleepTimerRemaining)} left
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Off', mins: null },
                { label: '15m', mins: 15 },
                { label: '30m', mins: 30 },
                { label: '45m', mins: 45 },
                { label: '60m', mins: 60 }
              ].map((opt, i) => {
                const isActive =
                  (opt.mins === null && sleepTimerRemaining === null) ||
                  (opt.mins !== null && sleepTimerRemaining !== null && Math.ceil(sleepTimerRemaining / 60) === opt.mins);

                return (
                  <button
                    key={i}
                    onClick={() => onSetSleepTimer(opt.mins)}
                    className={`py-2 rounded-xl font-mono-space text-xs transition border flex items-center justify-center ${
                      isActive
                        ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/50 font-semibold'
                        : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Playback & Lock Screen Controls Info & Wake Lock */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 flex-shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono-space text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Background Play Active
                  </span>
                  <span className="text-[10px] font-mono-space bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                    Lock Screen Enabled
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                  Songs will keep playing seamlessly when you switch tabs, minimize the browser, or lock your phone. Control playback directly from your lock screen, notification shade, or Bluetooth headset.
                </p>
              </div>
            </div>

            {onToggleScreenAwake && (
              <div className="flex items-center justify-between px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <Sun className={`w-4 h-4 ${keepScreenAwake ? 'text-amber-400' : 'text-white/40'}`} />
                  <span className="font-mono-space text-xs text-white/80">Keep Screen Awake</span>
                </div>
                <button
                  onClick={onToggleScreenAwake}
                  className={`px-3 py-1 rounded-lg font-mono-space text-xs border transition cursor-pointer ${
                    keepScreenAwake
                      ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 font-semibold'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  {keepScreenAwake ? 'Awake (ON)' : 'Allow Sleep (OFF)'}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#14100c] border-t border-white/10 flex items-center justify-between text-xs font-mono-space text-white/50">
          <span>Shortcuts: Shift + ← / → (Jump 10s)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg transition font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
