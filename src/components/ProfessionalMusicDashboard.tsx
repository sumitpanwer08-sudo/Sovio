import React, { useState } from 'react';
import {
  Radio,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Download,
  Search,
  Sparkles,
  Music,
  Disc,
  Mic2,
  Volume2,
  HardDrive,
  Trees,
  Ticket,
  Flame,
  CloudRain,
  Wind,
  Waves,
  Bus,
  CheckCircle2,
  Upload,
  Clock,
  Gauge,
  Sliders,
  FolderDown,
  Trash2,
  Plus
} from 'lucide-react';
import { RadioStation, SongItem, AtmosphereMode, AmbientSound, HrtcTicket } from '../types';
import { soundscapeEngine } from '../services/soundscapeEngine';
import { MountainWaveVisualizer } from './MountainWaveVisualizer';
import { VintageGoldVisualizer } from './VintageGoldVisualizer';
import {
  downloadSongToDevice,
  getAllDownloadedSongs,
  DownloadedSong,
  deleteDownloadedSong
} from '../services/offlineStorageService';

interface ProfessionalMusicDashboardProps {
  activeTab: 'stations' | 'discover' | 'downloads' | 'soundscape' | 'ticket';
  onSelectTab: (tab: 'stations' | 'discover' | 'downloads' | 'soundscape' | 'ticket') => void;
  currentStation: RadioStation;
  currentSong: SongItem | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectStation: (station: RadioStation) => void;
  stations: RadioStation[];
  onPlaySong: (song: SongItem) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onDownloadCurrentSong: () => void;
  isDownloadingCurrent: boolean;
  isCurrentDownloaded: boolean;
  onOpenSearch: () => void;
  onOpenLyrics: () => void;
  onOpenMoodScheduler: () => void;
  onOpenDownloads: () => void;
  onOpenTimeAdjust: () => void;
  quoteText: string;
  currentTime: number;
  duration: number;
  progressPercent: number;
  onSeek: (percent: number) => void;
  atmosphere: AtmosphereMode;
  ambientSounds: AmbientSound[];
  onSoundChange: (id: 'rain' | 'wind' | 'bonfire' | 'stream' | 'hrtc', updates: { volume?: number; isPlaying?: boolean }) => void;
  ticket: HrtcTicket;
  onOpenTicket: () => void;
  trendingSongs: SongItem[];
}

export const ProfessionalMusicDashboard: React.FC<ProfessionalMusicDashboardProps> = ({
  activeTab,
  onSelectTab,
  currentStation,
  currentSong,
  isPlaying,
  onTogglePlay,
  onSelectStation,
  stations,
  onPlaySong,
  onNextTrack,
  onPrevTrack,
  onDownloadCurrentSong,
  isDownloadingCurrent,
  isCurrentDownloaded,
  onOpenSearch,
  onOpenLyrics,
  onOpenMoodScheduler,
  onOpenDownloads,
  onOpenTimeAdjust,
  quoteText,
  currentTime,
  duration,
  progressPercent,
  onSeek,
  atmosphere,
  ambientSounds,
  onSoundChange,
  ticket,
  onOpenTicket,
  trendingSongs
}) => {
  const [visualizerMode, setVisualizerMode] = useState<'wave' | 'gold'>('wave');
  const [dialRotation, setDialRotation] = useState<number>(0);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDialClick = () => {
    soundscapeEngine.playTuningStatic();
    const newRotation = dialRotation + 45;
    setDialRotation(newRotation);
    const currentIndex = stations.findIndex((s) => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % stations.length;
    onSelectStation(stations[nextIndex]);
  };

  const getSoundIcon = (id: string) => {
    switch (id) {
      case 'rain': return CloudRain;
      case 'wind': return Wind;
      case 'bonfire': return Flame;
      case 'stream': return Waves;
      case 'hrtc': return Bus;
      default: return Music;
    }
  };

  return (
    <main className="w-full max-w-6xl px-3 sm:px-6 py-4 flex flex-col gap-6 z-10 select-none">
      
      {/* ========================================================= */}
      {/* 1. HERO NOW-PLAYING MASTER STUDIO DECK                    */}
      {/* ========================================================= */}
      <section className="relative w-full rounded-3xl bg-gradient-to-br from-[#121915]/90 via-[#0d1310]/95 to-[#080c0a]/95 border border-emerald-500/25 p-4 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden backdrop-blur-2xl transition-all duration-300">
        
        {/* Subtle Ambient Studio Background Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#c5a059]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 sm:gap-8 justify-between">
          
          {/* Left Column: Hi-Res Artwork & Lossless Vinyl Deck */}
          <div className="flex items-center gap-5 sm:gap-6 w-full lg:w-auto">
            <div className="relative group flex-shrink-0">
              <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-black/60 border-2 border-emerald-500/30 overflow-hidden shadow-2xl relative flex items-center justify-center ${
                isPlaying ? 'ring-4 ring-emerald-400/20 shadow-[0_0_30px_rgba(52,211,153,0.3)]' : ''
              }`}>
                {currentSong?.imageUrl ? (
                  <img
                    src={currentSong.imageUrl}
                    alt={currentSong.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isPlaying ? 'scale-105' : 'scale-100 group-hover:scale-105'
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/40 to-black/80">
                    <Disc className={`w-12 h-12 text-emerald-400/70 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                  </div>
                )}

                {/* Overlaid Play Trigger on Artwork */}
                <button
                  onClick={onTogglePlay}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-lg transform transition active:scale-95">
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </div>
                </button>
              </div>

              {/* Live Broadcast Badge */}
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-black/90 border border-emerald-400/50 text-[9px] font-mono-space text-emerald-300 flex items-center gap-1 shadow-lg">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-white/40'}`} />
                <span>{isPlaying ? 'ON AIR' : 'PAUSED'}</span>
              </div>
            </div>

            {/* Song Meta & Audio Telemetry */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono-space text-emerald-300 font-bold uppercase tracking-wider">
                  320kbps Lossless HD
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono-space text-amber-300 font-medium">
                  {currentStation.frequency}
                </span>
                {currentSong?.isOffline && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/20 border border-teal-400/40 text-[10px] font-mono-space text-teal-200">
                    Offline Saved
                  </span>
                )}
              </div>

              <h2 className="font-garamond text-2xl sm:text-3xl font-bold text-white tracking-wide truncate mb-1">
                {currentSong?.title || currentStation.name}
              </h2>
              <p className="font-mono-space text-xs sm:text-sm text-white/70 truncate mb-3">
                {currentSong?.artist || 'JioSaavn HD Cloud Stream'} {currentSong?.movie ? `• ${currentSong.movie}` : ''}
              </p>

              {/* Progress Scrubber */}
              <div className="flex items-center gap-3">
                <span className="font-mono-space text-[11px] text-white/60 w-8 text-right">
                  {formatTime(currentTime)}
                </span>
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percent = (clickX / rect.width) * 100;
                    onSeek(Math.max(0, Math.min(100, percent)));
                  }}
                  className="flex-1 h-2 rounded-full bg-white/10 relative cursor-pointer group/bar overflow-hidden"
                >
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-[#c5a059] rounded-full relative transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-mono-space text-[11px] text-white/60 w-8">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Master Studio Visualizer & Analog Tuner Dial */}
          <div className="w-full lg:w-auto flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 sm:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-white/10">
            
            {/* Live Visualizer Box */}
            <div className="flex flex-col items-center gap-1.5 w-full sm:w-48">
              <div className="w-full h-16 bg-black/60 rounded-xl border border-white/10 p-1 flex items-center justify-center overflow-hidden relative">
                {visualizerMode === 'wave' ? (
                  <MountainWaveVisualizer isPlaying={isPlaying} />
                ) : (
                  <VintageGoldVisualizer isPlaying={isPlaying} />
                )}
              </div>
              <div className="flex items-center justify-between w-full font-mono-space text-[9px] text-white/50 px-1">
                <button
                  onClick={() => setVisualizerMode(visualizerMode === 'wave' ? 'gold' : 'wave')}
                  className="hover:text-emerald-300 transition underline cursor-pointer"
                >
                  Mode: {visualizerMode === 'wave' ? 'Mountain Spectrum' : 'Studio VU'}
                </button>
                <span className="text-emerald-400 font-semibold">SOVIO ENGINE</span>
              </div>
            </div>

            {/* Tactile Analog Tuner Dial */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0 mx-auto sm:mx-0">
              <div
                onClick={handleDialClick}
                className="w-16 h-16 rounded-full border-2 border-[#c5a059]/80 bg-gradient-to-br from-[#261f18] via-[#16120d] to-[#0a0806] shadow-[0_6px_20px_rgba(0,0,0,0.8)] flex items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95 hover:border-amber-400"
                style={{ transform: `rotate(${dialRotation}deg)` }}
                title="Click to tune frequency / switch station"
              >
                <div className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center relative">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                  <div className="absolute top-1 w-1 h-2.5 bg-[#c5a059] rounded-full" />
                </div>
              </div>
              <span className="font-mono-space text-[9px] text-amber-300/80 tracking-widest">
                TUNE DIAL
              </span>
            </div>

            {/* Quick Hero Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={onDownloadCurrentSong}
                disabled={isDownloadingCurrent}
                className={`px-3.5 py-2 rounded-xl font-mono-space text-xs border transition cursor-pointer flex items-center gap-2 ${
                  isCurrentDownloaded
                    ? 'bg-teal-500/20 text-teal-300 border-teal-400/50 shadow-[0_0_12px_rgba(45,212,191,0.3)]'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                }`}
                title="Download song to phone & offline library"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloadingCurrent ? 'Saving...' : isCurrentDownloaded ? 'Downloaded' : 'Download Song'}</span>
              </button>

              <button
                onClick={onOpenLyrics}
                className="px-3.5 py-2 rounded-xl font-mono-space text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition cursor-pointer flex items-center gap-2"
                title="Open Synchronized Lyrics"
              >
                <Mic2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Sing Lyrics</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Pahadi Quote Banner */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-white/70">
          <p className="font-garamond italic text-sm sm:text-base text-white/80 truncate flex-1">
            {quoteText}
          </p>
          <button
            onClick={() => {
              soundscapeEngine.playButtonClick();
              handleDialClick();
            }}
            className="text-[10px] font-mono-space text-amber-300/80 hover:text-amber-200 transition flex items-center gap-1 flex-shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Refresh Vibe</span>
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. TAB CONTENT: STATIONS & TRENDING HITS (DEFAULT)        */}
      {/* ========================================================= */}
      {activeTab === 'stations' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          
          {/* Section: Live Radio Channels */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="font-garamond text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>Live Studio Stations</span>
                  <span className="text-[10px] font-mono-space px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-normal">
                    Lossless 320kbps
                  </span>
                </h3>
                <p className="font-mono-space text-xs text-white/50">
                  Instant tuning across high-definition Cloud streams and mountain acoustics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {stations.map((st) => {
                const isActive = st.id === currentStation.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      soundscapeEngine.playTuningStatic();
                      onSelectStation(st);
                    }}
                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                      isActive
                        ? 'bg-gradient-to-br from-emerald-950/60 via-[#101b16] to-[#0a120e] border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.25)] ring-1 ring-emerald-400/40'
                        : 'bg-[#101713]/80 hover:bg-[#15201a] border-white/10 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-emerald-400 text-black font-bold' : 'bg-white/5 text-emerald-300 border border-white/10'
                        }`}>
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-garamond text-base font-bold text-white group-hover:text-emerald-300 transition">
                            {st.name}
                          </h4>
                          <span className="font-mono-space text-[10px] text-amber-300 font-semibold">
                            {st.frequency}
                          </span>
                        </div>
                      </div>

                      {isActive && isPlaying && (
                        <div className="flex items-end gap-0.5 h-3 px-1">
                          <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce" />
                          <span className="w-0.5 h-3.5 bg-emerald-400 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>

                    <p className="font-mono-space text-[11px] text-white/60 mb-3 line-clamp-2">
                      {st.tagline}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono-space text-white/40">
                      <span>{st.songs?.length || 15}+ Songs</span>
                      <span className="text-emerald-400 font-medium group-hover:underline">
                        {isActive ? 'Current Active Station' : 'Tune Station →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Trending Chartbusters & Quick Play */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="font-garamond text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>Trending Cloud Chartbusters</span>
                  <span className="text-[10px] font-mono-space px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-normal">
                    JioSaavn 80M+
                  </span>
                </h3>
                <p className="font-mono-space text-xs text-white/50">
                  Top viral Bollywood, Arijit Singh, Mohit Chauhan & Himalayan melodies
                </p>
              </div>

              <button
                onClick={onOpenSearch}
                className="text-xs font-mono-space text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Catalog</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {trendingSongs.slice(0, 8).map((song) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <div
                    key={song.id}
                    onClick={() => onPlaySong(song)}
                    className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group ${
                      isCurrent
                        ? 'bg-emerald-500/20 border-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                        : 'bg-[#111814]/70 hover:bg-[#16221c] border-white/10 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl bg-black/50 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center relative group-hover:border-emerald-400/50">
                        {song.imageUrl ? (
                          <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-5 h-5 text-emerald-400/70" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-garamond text-sm font-bold text-white truncate group-hover:text-emerald-300 transition">
                          {song.title}
                        </h4>
                        <p className="font-mono-space text-[10px] text-white/50 truncate">
                          {song.artist || 'Pahadi Artist'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await downloadSongToDevice(song);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-white/40 hover:text-emerald-300 border border-white/10 transition cursor-pointer flex-shrink-0"
                      title="Download to phone"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAB CONTENT: DISCOVER & LIVE SEARCH                    */}
      {/* ========================================================= */}
      {activeTab === 'discover' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <div className="p-4 sm:p-6 rounded-3xl bg-[#101713]/90 border border-emerald-500/30 flex flex-col gap-4">
            <div>
              <h3 className="font-garamond text-2xl font-bold text-white flex items-center gap-2">
                <span>Music Discovery & 80M+ JioSaavn Search</span>
              </h3>
              <p className="font-mono-space text-xs text-white/60">
                Type any song title, singer, movie name, or mood to stream instantly in 320kbps HD
              </p>
            </div>

            <button
              onClick={onOpenSearch}
              className="w-full p-4 rounded-2xl bg-black/50 hover:bg-black/70 border border-emerald-500/40 text-left flex items-center justify-between text-white/80 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                <span className="font-mono-space text-sm text-white/60 group-hover:text-white">
                  Click here to launch Universal Music Search Engine...
                </span>
              </div>
              <span className="font-mono-space text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Launch Search →
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB CONTENT: SOUNDSCAPE STUDIO                         */}
      {/* ========================================================= */}
      {activeTab === 'soundscape' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <div className="p-4 sm:p-6 rounded-3xl bg-[#101713]/90 border border-emerald-500/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-garamond text-2xl font-bold text-white flex items-center gap-2">
                  <span>🌲 Pahadi Ambient Soundscape Deck</span>
                  <span className="text-[10px] font-mono-space px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Mountain Layers
                  </span>
                </h3>
                <p className="font-mono-space text-xs text-white/60">
                  Blend authentic mountain acoustic environments on top of your favorite music
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {ambientSounds.map((sound) => {
                const Icon = getSoundIcon(sound.id);
                return (
                  <div
                    key={sound.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      sound.isPlaying
                        ? 'bg-emerald-950/40 border-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                        : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${sound.isPlaying ? 'bg-emerald-400 text-black' : 'bg-white/5 text-white/70'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-garamond text-base font-bold text-white">
                          {sound.name}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          soundscapeEngine.playButtonClick();
                          onSoundChange(sound.id, { isPlaying: !sound.isPlaying });
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono-space text-xs transition cursor-pointer border ${
                          sound.isPlaying
                            ? 'bg-emerald-500 text-black font-bold border-emerald-400'
                            : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                        }`}
                      >
                        {sound.isPlaying ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <Volume2 className="w-3.5 h-3.5 text-white/40" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={sound.volume}
                        onChange={(e) => onSoundChange(sound.id, { volume: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                      <span className="font-mono-space text-[10px] text-white/60 w-8 text-right">
                        {Math.round(sound.volume * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TAB CONTENT: OFFLINE DOWNLOADS & LOCAL MUSIC           */}
      {activeTab === 'downloads' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <div className="p-4 sm:p-6 rounded-3xl bg-[#101713]/90 border border-teal-500/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-garamond text-2xl font-bold text-white flex items-center gap-2">
                  <span>📥 Offline Downloads & Device Storage</span>
                </h3>
                <p className="font-mono-space text-xs text-white/60">
                  Manage all songs downloaded to your device for zero-internet playback
                </p>
              </div>

              <button
                onClick={onOpenDownloads}
                className="px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-mono-space text-xs transition cursor-pointer flex items-center gap-2"
              >
                <HardDrive className="w-4 h-4" />
                <span>Open Downloads Manager</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. TAB CONTENT: HRTC BUS PASS                             */}
      {activeTab === 'ticket' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <div className="p-4 sm:p-6 rounded-3xl bg-[#101713]/90 border border-amber-500/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-garamond text-2xl font-bold text-white flex items-center gap-2">
                  <span>🎫 HRTC Mountain Bus Pass & Memories</span>
                </h3>
                <p className="font-mono-space text-xs text-white/60">
                  Your authentic Himachal Roadways journey pass — backed up to Google Drive
                </p>
              </div>

              <button
                onClick={onOpenTicket}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono-space text-xs transition cursor-pointer flex items-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                <span>View & Edit Bus Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};
