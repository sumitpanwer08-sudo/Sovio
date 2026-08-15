import React, { useState } from 'react';
import { RadioStation, AtmosphereMode } from '../types';
import {
  Radio,
  Volume2,
  Sparkles,
  Disc,
  Music,
  ListMusic,
  Search,
  Plus,
  Mic2,
  Sliders,
  Sunset,
  CloudFog,
  Sun,
  Moon,
  Activity,
  Compass
} from 'lucide-react';
import { soundscapeEngine } from '../services/soundscapeEngine';

interface VintageRadioProps {
  currentStation: RadioStation;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectStation: (station: RadioStation) => void;
  stations: RadioStation[];
  quoteText: string;
  onOpenSearch?: () => void;
  onOpenLyrics?: () => void;
  onOpenMoodScheduler?: () => void;
  atmosphere?: AtmosphereMode;
  isAutoSync?: boolean;
}

export const VintageRadio: React.FC<VintageRadioProps> = ({
  currentStation,
  isPlaying,
  onTogglePlay,
  onSelectStation,
  stations,
  quoteText,
  onOpenSearch,
  onOpenLyrics,
  onOpenMoodScheduler,
  atmosphere = 'mist',
  isAutoSync = true
}) => {
  const [dialRotation, setDialRotation] = useState<number>(0);

  const handleDialClick = () => {
    soundscapeEngine.playTuningStatic();
    const newRotation = dialRotation + 45;
    setDialRotation(newRotation);

    const currentIndex = stations.findIndex((s) => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % stations.length;
    onSelectStation(stations[nextIndex]);
  };

  const getAtmosphereLabel = () => {
    switch (atmosphere) {
      case 'sunset':
        return { label: 'Sunset Glow', icon: Sunset, color: 'text-orange-300' };
      case 'snow':
        return { label: 'Alpine Sun', icon: Sun, color: 'text-sky-300' };
      case 'night':
        return { label: 'Starlight Peaks', icon: Moon, color: 'text-indigo-300' };
      case 'mist':
      default:
        return { label: 'Morning Mist', icon: CloudFog, color: 'text-amber-300' };
    }
  };

  const atmo = getAtmosphereLabel();
  const AtmoIcon = atmo.icon;

  return (
    <div className="flex flex-col items-center justify-center z-10 w-full max-w-2xl px-4 select-none">
      
      {/* Top Professional Navigation & Search Capsule */}
      <div className="w-full max-w-lg mb-4 flex items-center gap-2 animate-fadeIn">
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="flex-1 px-4 py-2.5 bg-[#0e1411]/80 hover:bg-[#151f1a]/90 backdrop-blur-2xl border border-amber-500/30 hover:border-amber-400/60 rounded-full text-left flex items-center justify-between text-white/80 hover:text-white transition shadow-[0_10px_30px_rgba(0,0,0,0.6)] group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition flex-shrink-0" />
              <span className="font-mono-space text-xs truncate text-white/70 group-hover:text-white">
                Search songs, singers, playlists...
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span className="font-mono-space text-[10px] bg-white/10 text-amber-300/90 px-2 py-0.5 rounded border border-white/10 hidden sm:inline">
                / or Ctrl+K
              </span>
            </div>
          </button>
        )}

        {/* Mood Scheduler Quick Trigger Button */}
        {onOpenMoodScheduler && (
          <button
            onClick={onOpenMoodScheduler}
            className="px-3.5 py-2.5 rounded-full border border-amber-500/30 bg-[#0e1411]/80 hover:bg-amber-500/15 text-amber-300 backdrop-blur-2xl transition flex items-center gap-1.5 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.6)] group"
            title="Open Mood & Atmosphere Scheduler"
          >
            <AtmoIcon className={`w-4 h-4 ${atmo.color} group-hover:scale-110 transition`} />
            <span className="font-mono-space text-xs hidden sm:inline font-semibold">
              {atmo.label}
            </span>
          </button>
        )}

        {/* Synced Lyrics Sing-Along Button */}
        {onOpenLyrics && (
          <button
            onClick={onOpenLyrics}
            className="px-3.5 py-2.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 backdrop-blur-2xl transition flex items-center gap-1.5 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.6)] group"
            title="Open Synchronized Lyrics & Karaoke Sing-Along (L)"
          >
            <Mic2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition animate-pulse" />
            <span className="font-mono-space text-xs hidden sm:inline font-semibold">Lyrics</span>
          </button>
        )}
      </div>

      {/* Main Brand Title */}
      <h1 className="font-garamond text-6xl sm:text-8xl font-semibold tracking-[16px] sm:tracking-[22px] uppercase mb-1 text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30 drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
        Sovio
      </h1>
      
      <p className="font-mono-space text-xs sm:text-sm tracking-[6px] text-[#c5a059] uppercase mb-5 text-center drop-shadow-sm flex items-center justify-center gap-2">
        <span>The Mountain Soundscapes & Radio</span>
      </p>

      {/* Central Radio Console (High-End Vintage Studio Polish) */}
      <div className="relative w-full max-w-[360px] sm:max-w-[420px] h-[230px] sm:h-[250px] my-1 transition-transform duration-500 hover:scale-[1.015] group">
        <div className="w-full h-full bg-[#151917] rounded-3xl border-[5px] border-[#382b20] shadow-[0_30px_70px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col justify-between p-4 sm:p-5">
          
          {/* Top Panel: Frequency Display & Live Stereo VU Level */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 font-mono-space text-xs tracking-wider text-amber-200/90">
              <Radio className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="font-bold text-amber-300">{currentStation.frequency}</span>
              <span className="text-white/30">•</span>
              <span className="text-white/80 uppercase text-[10px] truncate max-w-[150px] font-medium">
                {currentStation.name}
              </span>
            </div>

            {/* Live Audio Visualizer / Status Beacon */}
            <div className="flex items-center gap-2.5">
              {/* Animated Mini Spectrum Bars */}
              <div className="flex items-end gap-0.5 h-3 px-1">
                <span
                  className={`w-0.5 bg-amber-400 rounded-full transition-all duration-150 ${
                    isPlaying ? 'h-3 animate-pulse' : 'h-1 opacity-40'
                  }`}
                />
                <span
                  className={`w-0.5 bg-amber-400 rounded-full transition-all duration-200 ${
                    isPlaying ? 'h-2 animate-bounce' : 'h-1 opacity-40'
                  }`}
                />
                <span
                  className={`w-0.5 bg-amber-400 rounded-full transition-all duration-300 ${
                    isPlaying ? 'h-3.5 animate-pulse' : 'h-1 opacity-40'
                  }`}
                />
              </div>

              <span className="font-mono-space text-[9px] text-white/50 tracking-widest">
                {isPlaying ? 'ON AIR' : 'IDLE'}
              </span>

              <div
                className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                  isPlaying
                    ? 'bg-amber-400 border-amber-300 shadow-[0_0_12px_#f59e0b] animate-pulse'
                    : 'bg-red-950/80 border-red-900 shadow-none'
                }`}
              />
            </div>
          </div>

          {/* Middle: Frequency Needle, Brass Grille & Tactile Tuner Dial */}
          <div className="relative flex-1 flex items-center justify-center my-2">
            {/* Vintage Acoustic Grille pattern */}
            <div
              className="absolute inset-0 rounded-xl opacity-35"
              style={{
                backgroundImage:
                  'radial-gradient(#3a2e24 15%, transparent 16%), radial-gradient(#261d15 15%, transparent 16%)',
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 4px 4px',
                backgroundColor: '#0f0d0b'
              }}
            />

            {/* Glowing Frequency Band Horizontal Track */}
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-10 bg-black/70 rounded-lg border border-amber-500/20 flex items-center justify-between px-3 z-0">
              <span className="font-mono-space text-[9px] text-amber-500/50">88</span>
              <span className="font-mono-space text-[9px] text-amber-500/50">92</span>
              <span className="font-mono-space text-[9px] text-amber-500/50">96</span>
              <span className="font-mono-space text-[9px] text-amber-500/50">100</span>
              <span className="font-mono-space text-[9px] text-amber-500/50">104</span>
              <span className="font-mono-space text-[9px] text-amber-500/50">108</span>
            </div>

            {/* Brass Tuning Dial Centerpiece */}
            <div className="z-10 flex flex-col items-center">
              <div
                onClick={handleDialClick}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-[#8c6d3b] bg-gradient-to-br from-[#2b2117] via-[#1c150f] to-[#0c0a08] shadow-[0_8px_25px_rgba(0,0,0,0.85),inset_0_2px_8px_rgba(255,255,255,0.2)] flex items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95 group-hover:border-[#c5a059]"
                style={{ transform: `rotate(${dialRotation}deg)` }}
                title="Click to tune frequency / switch station"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-white/10 flex items-center justify-center relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
                  <div className="absolute top-1.5 w-1.5 h-3.5 bg-[#c5a059] rounded-full shadow-sm" />
                </div>
              </div>
              <span className="font-mono-space text-[9px] text-amber-200/50 tracking-widest mt-1">
                TUNE FREQUENCY
              </span>
            </div>
          </div>

          {/* Bottom Brushed Metal Base */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 font-mono-space text-[9px] text-white/50">
            <span>CHASSIS: S-1994 MASTER</span>
            <span className="text-amber-300/80 font-bold tracking-widest uppercase">SOVIO ACOUSTICS</span>
            <span>HI-RES ANALOG</span>
          </div>
        </div>
      </div>

      {/* Station Preset Switchers & Quick Action Bar */}
      <div className="flex flex-wrap justify-center items-center gap-2 my-4 z-10 max-w-xl">
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="px-3.5 py-1.5 rounded-full font-mono-space text-[10px] tracking-wider transition-all duration-300 cursor-pointer border bg-gradient-to-r from-amber-600/30 to-amber-400/20 text-amber-300 border-amber-400/60 hover:border-amber-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-1.5 font-semibold"
            title="Search all songs & singers catalog"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Search Library</span>
          </button>
        )}

        {stations.map((st) => {
          const isActive = st.id === currentStation.id;
          const isTrending = st.id === 'station-trending-hits';
          return (
            <button
              key={st.id}
              onClick={() => {
                soundscapeEngine.playTuningStatic();
                onSelectStation(st);
              }}
              className={`px-3 py-1.5 rounded-full font-mono-space text-[10px] tracking-wider transition-all duration-300 cursor-pointer border flex items-center gap-1 ${
                isActive
                  ? 'bg-amber-500/25 text-amber-300 border-amber-400/80 shadow-[0_0_15px_rgba(197,160,89,0.35)] font-semibold'
                  : isTrending
                  ? 'bg-orange-500/15 text-orange-200 border-orange-500/40 hover:border-orange-400 hover:text-white hover:bg-orange-500/25'
                  : 'bg-[#0f1412]/80 text-white/70 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              <span>{st.name}</span>
              <span className="text-[9px] opacity-70">({st.frequency})</span>
            </button>
          );
        })}
      </div>

      {/* Rotating Pahadi Quote System */}
      <div className="h-16 flex items-center justify-center text-center px-4 mt-0.5 max-w-lg">
        <p className="font-garamond italic text-lg sm:text-xl text-white/85 transition-opacity duration-1000 drop-shadow-md">
          {quoteText}
        </p>
      </div>
    </div>
  );
};
