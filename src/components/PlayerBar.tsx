import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sliders,
  Ticket,
  Sparkles,
  FolderDown,
  Music,
  Search,
  Clock,
  RotateCcw,
  RotateCw,
  Mic2,
  Sunset,
  CloudFog,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Radio,
  Disc3,
  Activity,
  BarChart3,
  Waves,
  Gauge
} from 'lucide-react';
import { AtmosphereMode, TrackInfo, SongItem } from '../types';
import { MountainWaveVisualizer } from './MountainWaveVisualizer';
import { VintageGoldVisualizer, VisualizerMode } from './VintageGoldVisualizer';
import { soundscapeEngine } from '../services/soundscapeEngine';

interface PlayerBarProps {
  currentSong?: SongItem | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  trackInfo: TrackInfo;
  progressPercent: number;
  currentTime?: number;
  duration?: number;
  onSeek?: (seconds: number) => void;
  onSkipSeconds?: (delta: number) => void;
  onOpenTimeAdjust?: () => void;
  playbackSpeed?: number;
  sleepTimerRemaining?: number | null;
  volume?: number;
  onVolumeChange?: (val: number) => void;
  onOpenMixer: () => void;
  onOpenTicket: () => void;
  onOpenRj: () => void;
  onOpenDrive: () => void;
  onOpenSearch?: () => void;
  onOpenLyrics?: () => void;
  onOpenMoodScheduler?: () => void;
  atmosphere?: AtmosphereMode;
  isAutoSync?: boolean;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  trackInfo,
  progressPercent,
  currentTime = 0,
  duration = 0,
  onSeek,
  onSkipSeconds,
  onOpenTimeAdjust,
  playbackSpeed = 1,
  sleepTimerRemaining = null,
  volume = 1,
  onVolumeChange,
  onOpenMixer,
  onOpenTicket,
  onOpenRj,
  onOpenDrive,
  onOpenSearch,
  onOpenLyrics,
  onOpenMoodScheduler,
  atmosphere = 'mist',
  isAutoSync = true
}) => {
  const [hoverTime, setHoverTime] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVisualizerExpanded, setIsVisualizerExpanded] = useState<boolean>(false);

  const formatTime = (secs: number): string => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverTime(formatTime(ratio * duration));
  };

  const getAtmosphereIcon = () => {
    switch (atmosphere) {
      case 'sunset':
        return <Sunset className="w-4 h-4 text-orange-400" />;
      case 'snow':
        return <Sun className="w-4 h-4 text-sky-400" />;
      case 'night':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'mist':
      default:
        return <CloudFog className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <>
      {/* Expanded Vintage Gold Vacuum Tube HUD Tray (When Toggled) */}
      {isVisualizerExpanded && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[94%] max-w-[760px] bg-[#0c0a06]/95 backdrop-blur-2xl border-2 border-[#c5a059]/50 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(197,160,89,0.2)] z-40 animate-fadeIn select-none">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#c5a059]/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#c5a059]/15 border border-[#c5a059]/30 text-amber-300">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-garamond text-base sm:text-lg font-bold text-amber-200 flex items-center gap-2">
                  <span>Web Audio API Gold Visualizer</span>
                  <span className="text-[10px] font-mono-space px-2 py-0.5 rounded-full bg-[#c5a059]/20 text-amber-300 border border-[#c5a059]/30">
                    Accent Gold Edition
                  </span>
                </h4>
                <p className="font-mono-space text-[10px] text-amber-300/60">
                  Real-time audio frequency analyser • Click to toggle visual modes
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundscapeEngine.playButtonClick();
                setIsVisualizerExpanded(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-200 text-xs font-mono-space border border-white/10 transition cursor-pointer"
            >
              Close HUD
            </button>
          </div>

          <div className="h-28 sm:h-36 w-full">
            <VintageGoldVisualizer
              isPlaying={isPlaying}
              volume={volume}
              playbackSpeed={playbackSpeed}
              currentTime={currentTime}
              className="w-full h-full"
              showModeControls={true}
            />
          </div>
        </div>
      )}

      {/* Main Bottom Player Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[96%] max-w-[960px] bg-[#0d1210]/92 backdrop-blur-2xl border border-amber-500/30 rounded-2xl sm:rounded-full px-3.5 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-40 transition-all gap-2 md:gap-3.5 select-none">
        
        {/* Left: Track Info, Integrated Accent-Gold Visualizer & Interactive Progress Bar */}
        <div className="w-full md:w-[45%] min-w-0 flex flex-col justify-center relative">
          {/* Subtle Background Mountain Wave Visualizer */}
          <div className="absolute inset-0 -top-1 -bottom-1 pointer-events-none opacity-30 overflow-hidden rounded-xl">
            <MountainWaveVisualizer
              isPlaying={isPlaying}
              atmosphere={atmosphere}
              playbackSpeed={playbackSpeed}
              className="w-full h-full"
            />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-2 mb-1">
            <div
              onClick={onOpenSearch}
              className="flex items-center gap-2 min-w-0 cursor-pointer group flex-1"
              title="Click to search catalog or view song details"
            >
              {/* Artwork or Spinning Disc */}
              {currentSong?.imageUrl ? (
                <div className="relative w-6 h-6 rounded-md overflow-hidden flex-shrink-0 border border-amber-500/40">
                  <img
                    src={currentSong.imageUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                  {isPlaying && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
              ) : (
                <div className="relative flex-shrink-0 flex items-center justify-center">
                  <Disc3
                    className={`w-4 h-4 text-amber-400 transition-transform duration-1000 ${
                      isPlaying ? 'animate-spin' : 'opacity-60'
                    }`}
                  />
                  {isPlaying && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
              )}
              
              <div className="min-w-0 flex items-center gap-1.5">
                <div className="font-mono-space text-xs text-amber-200/90 tracking-wider truncate group-hover:text-amber-300 font-medium">
                  {trackInfo.title || 'Sovio Mountain Radio'}
                </div>
                {currentSong?.source === 'jiosaavn' && (
                  <span className="font-mono-space text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 py-0.2 rounded hidden sm:inline">
                    JioSaavn HD
                  </span>
                )}
              </div>
            </div>

            {/* Time & Speed indicator */}
            <div className="flex items-center gap-1.5 flex-shrink-0 font-mono-space text-[10px] text-white/60">
              {onOpenTimeAdjust ? (
                <button
                  onClick={onOpenTimeAdjust}
                  className="hover:text-amber-300 transition flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 border border-white/10 cursor-pointer"
                  title="Open Song Time & Speed Adjust (T)"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-white/30">/</span>
                  <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
                  {playbackSpeed !== 1 && (
                    <span className="text-amber-300 text-[9px] font-bold">({playbackSpeed}x)</span>
                  )}
                  {sleepTimerRemaining !== null && (
                    <span className="text-emerald-400 text-[9px] font-bold">
                      ⏳{Math.ceil(sleepTimerRemaining / 60)}m
                    </span>
                  )}
                </button>
              ) : (
                <span>{formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '--:--'}</span>
              )}
            </div>
          </div>
          
          {/* Middle Row: Inline Accent-Gold Audio Visualizer Dock */}
          <div className="relative z-10 flex items-center gap-2 mb-1">
            <div className="flex-1 h-[22px] rounded-lg overflow-hidden">
              <VintageGoldVisualizer
                isPlaying={isPlaying}
                volume={volume}
                playbackSpeed={playbackSpeed}
                currentTime={currentTime}
                compact={true}
                showModeControls={false}
                className="w-full h-full"
              />
            </div>

            {/* Quick Mode Switcher Pill */}
            <button
              onClick={() => setIsVisualizerExpanded((prev) => !prev)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono-space border transition cursor-pointer flex items-center gap-1 flex-shrink-0 ${
                isVisualizerExpanded
                  ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-[0_0_8px_#f59e0b]'
                  : 'bg-black/60 text-amber-300 border-[#c5a059]/40 hover:bg-[#c5a059]/20'
              }`}
              title="Click to expand full gold visualizer HUD"
            >
              <Activity className="w-2.5 h-2.5" />
              <span>VU</span>
            </button>
          </div>

          {/* Interactive Seek Bar with Glowing Gradient */}
          <div
            onClick={handleProgressBarClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverTime(null)}
            className="relative z-10 w-full h-[5px] hover:h-[7px] bg-white/10 rounded-full cursor-pointer group transition-all"
            title="Click to seek time in track"
          >
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 transition-all duration-200 rounded-full group-hover:shadow-[0_0_10px_#f59e0b]"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
            {/* Handle dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-amber-200 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `${Math.min(99, Math.max(0, progressPercent))}%` }}
            />
            {/* Hover Time Pill */}
            {hoverTime && (
              <div
                className="absolute -top-7 px-2 py-0.5 bg-black/90 text-amber-300 text-[9px] font-mono-space rounded border border-amber-500/40 pointer-events-none -translate-x-1/2 shadow-lg"
                style={{ left: `${Math.min(95, Math.max(5, progressPercent))}%` }}
              >
                {hoverTime}
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Playback Transport Controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Rewind 10s */}
          {onSkipSeconds && (
            <button
              onClick={() => onSkipSeconds(-10)}
              className="text-white/60 hover:text-amber-300 transition cursor-pointer p-1.5 rounded-full hover:bg-white/5 relative group"
              title="Rewind 10 seconds (Shift + Left / J)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[8px] font-mono-space font-bold absolute bottom-0.5 right-0.5 text-white/50 group-hover:text-amber-300">10</span>
            </button>
          )}

          {/* Previous Track */}
          <button
            onClick={onPrevTrack}
            className="text-white/70 hover:text-white transition cursor-pointer p-1.5 rounded-full hover:bg-white/5"
            title="Previous Track (Left Arrow)"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Master Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.45)] cursor-pointer active:scale-95 mx-0.5"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={onNextTrack}
            className="text-white/70 hover:text-white transition cursor-pointer p-1.5 rounded-full hover:bg-white/5"
            title="Next Track (Right Arrow)"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Forward 10s */}
          {onSkipSeconds && (
            <button
              onClick={() => onSkipSeconds(10)}
              className="text-white/60 hover:text-amber-300 transition cursor-pointer p-1.5 rounded-full hover:bg-white/5 relative group"
              title="Forward 10 seconds (Shift + Right)"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[8px] font-mono-space font-bold absolute bottom-0.5 right-0.5 text-white/50 group-hover:text-amber-300">10</span>
            </button>
          )}
        </div>

        {/* Right: Adjusted Professional Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 flex-wrap justify-center">
          {/* Audio Visualizer Mode Button */}
          <button
            onClick={() => {
              soundscapeEngine.playButtonClick();
              setIsVisualizerExpanded((prev) => !prev);
            }}
            className={`p-2 rounded-full transition cursor-pointer relative group border ${
              isVisualizerExpanded
                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_#f59e0b]'
                : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/25 border-amber-500/30'
            }`}
            title="Toggle Web Audio API Visualizer HUD (Accent Gold)"
          >
            <Activity className="w-4 h-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] font-mono-space px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg z-50">
              Gold Visualizer
            </span>
          </button>

          {/* Mood Scheduler Trigger Button */}
          {onOpenMoodScheduler && (
            <button
              onClick={onOpenMoodScheduler}
              className="p-2 text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 rounded-full transition cursor-pointer relative group shadow-sm"
              title="Atmosphere & Mood Scheduler (Auto-sync with local time)"
            >
              {getAtmosphereIcon()}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] font-mono-space px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg z-50">
                Mood Scheduler
              </span>
            </button>
          )}

          {/* Synchronized Lyrics & Sing-Along Modal */}
          {onOpenLyrics && (
            <button
              onClick={onOpenLyrics}
              className="p-2 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 rounded-full transition cursor-pointer relative group"
              title="Synchronized Lyrics & Karaoke Sing-Along (L)"
            >
              <Mic2 className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] font-mono-space px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg z-50">
                Lyrics (L)
              </span>
            </button>
          )}

          {/* Ambient Soundscapes Mixer */}
          <button
            onClick={onOpenMixer}
            className="p-2 text-white/70 hover:text-amber-300 hover:bg-white/10 rounded-full transition cursor-pointer relative group"
            title="Ambient Soundscapes (Rain, Pine Wind, Bonfire, HRTC Bus)"
          >
            <Sliders className="w-4 h-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] font-mono-space px-2 py-0.5 rounded border border-white/10 text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg z-50">
              Mixer
            </span>
          </button>

          {/* HRTC Mountain Bus Ticket */}
          <button
            onClick={onOpenTicket}
            className="p-2 text-white/70 hover:text-amber-300 hover:bg-white/10 rounded-full transition cursor-pointer relative group"
            title="HRTC Mountain Journey Ticket"
          >
            <Ticket className="w-4 h-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] font-mono-space px-2 py-0.5 rounded border border-white/10 text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg z-50">
              Bus Ticket
            </span>
          </button>

          {/* Pahadi AI RJ Storyteller */}
          <button
            onClick={onOpenRj}
            className="p-2 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 rounded-full transition cursor-pointer relative group"
            title="Pahadi Radio RJ & Mountain Stories"
          >
            <Sparkles className="w-4 h-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] font-mono-space px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg z-50">
              Pahadi RJ
            </span>
          </button>

          {/* Google Drive Cloud Memories */}
          <button
            onClick={onOpenDrive}
            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full transition cursor-pointer relative group"
            title="Save Memories to Google Drive"
          >
            <FolderDown className="w-4 h-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] font-mono-space px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg z-50">
              Drive Memory
            </span>
          </button>

          {/* Universal Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="p-2 text-white/70 hover:text-amber-300 hover:bg-white/10 rounded-full transition cursor-pointer relative group"
              title="Search Catalog & Playlists (/ or Ctrl+K)"
            >
              <Search className="w-4 h-4" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] font-mono-space px-2 py-0.5 rounded border border-white/10 text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg z-50">
                Search
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

