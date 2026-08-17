import React from 'react';
import {
  Radio,
  Search,
  Download,
  Trees,
  Ticket,
  Mic2,
  Sunset,
  CloudFog,
  Sun,
  Moon,
  Sparkles,
  Volume2
} from 'lucide-react';
import { AtmosphereMode } from '../types';
import { soundscapeEngine } from '../services/soundscapeEngine';

interface TopNavHeaderProps {
  activeTab: 'stations' | 'discover' | 'downloads' | 'soundscape' | 'ticket';
  onSelectTab: (tab: 'stations' | 'discover' | 'downloads' | 'soundscape' | 'ticket') => void;
  onOpenSearch: () => void;
  onOpenLyrics: () => void;
  onOpenMoodScheduler: () => void;
  onOpenRj: () => void;
  atmosphere: AtmosphereMode;
  isPlaying: boolean;
}

export const TopNavHeader: React.FC<TopNavHeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSearch,
  onOpenLyrics,
  onOpenMoodScheduler,
  onOpenRj,
  atmosphere,
  isPlaying
}) => {
  const getAtmoData = () => {
    switch (atmosphere) {
      case 'sunset':
        return { label: 'Sunset', icon: Sunset, color: 'text-orange-400', border: 'border-orange-500/30' };
      case 'snow':
        return { label: 'Alpine', icon: Sun, color: 'text-sky-300', border: 'border-sky-500/30' };
      case 'night':
        return { label: 'Starlight', icon: Moon, color: 'text-indigo-300', border: 'border-indigo-500/30' };
      case 'mist':
      default:
        return { label: 'Mist', icon: CloudFog, color: 'text-emerald-400', border: 'border-emerald-500/30' };
    }
  };

  const atmo = getAtmoData();
  const AtmoIcon = atmo.icon;

  const navItems: Array<{ id: 'stations' | 'discover' | 'downloads' | 'soundscape' | 'ticket'; label: string; icon: any }> = [
    { id: 'stations', label: 'Radio Stations', icon: Radio },
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'soundscape', label: 'Soundscape', icon: Trees },
    { id: 'ticket', label: 'HRTC Pass', icon: Ticket }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080d0b]/85 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 select-none shadow-2xl">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => onSelectTab('stations')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-[#c5a059] p-0.5 shadow-[0_0_15px_rgba(52,211,153,0.35)] flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-[#0a0f0d] rounded-[10px] flex items-center justify-center">
              <span className="font-garamond text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-amber-200">
                S
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-garamond text-xl font-bold tracking-[3px] text-white group-hover:text-emerald-300 transition uppercase leading-none">
                Sovio
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="font-mono-space text-[9px] tracking-wider text-[#c5a059] uppercase hidden sm:block">
              Studio Hi-Res Audio
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation Links (Single-row contract) */}
      <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundscapeEngine.playButtonClick();
                onSelectTab(item.id);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-mono-space text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_12px_rgba(52,211,153,0.25)] font-semibold'
                  : 'bg-white/[0.03] text-white/70 hover:text-white border-transparent hover:border-white/10 hover:bg-white/[0.07]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-white/60'}`} />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Actions & Quick Triggers */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Quick Search Shortcut */}
        <button
          onClick={onOpenSearch}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/40 text-white/80 hover:text-white font-mono-space text-xs transition cursor-pointer flex items-center gap-1.5"
          title="Search songs & artists (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline text-white/60">Search</span>
          <span className="hidden lg:inline text-[9px] bg-white/10 px-1.5 py-0.2 rounded text-white/50">/</span>
        </button>

        {/* Atmosphere Trigger */}
        <button
          onClick={onOpenMoodScheduler}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border ${atmo.border} text-white/90 font-mono-space text-xs transition cursor-pointer flex items-center gap-1.5`}
          title="Mood & Mountain Atmosphere"
        >
          <AtmoIcon className={`w-3.5 h-3.5 ${atmo.color}`} />
          <span className="hidden xl:inline">{atmo.label}</span>
        </button>

        {/* Synchronized Lyrics */}
        <button
          onClick={onOpenLyrics}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-amber-300 font-mono-space text-xs transition cursor-pointer flex items-center gap-1.5"
          title="Open Synchronized Lyrics & Karaoke"
        >
          <Mic2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden xl:inline">Lyrics</span>
        </button>

        {/* AI RJ Quote Trigger */}
        <button
          onClick={onOpenRj}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 hover:border-teal-400 text-teal-300 font-mono-space text-xs transition cursor-pointer flex items-center gap-1.5"
          title="Pahadi AI RJ Dialogue"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden xl:inline">RJ</span>
        </button>
      </div>
    </header>
  );
};
