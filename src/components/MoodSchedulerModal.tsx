import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  CloudFog,
  Snowflake,
  Sunset,
  Clock,
  Sparkles,
  Play,
  Check,
  Compass,
  Radio,
  Sliders,
  ChevronRight,
  X
} from 'lucide-react';
import { AtmosphereMode, RadioStation, SongItem } from '../types';
import { ALL_SONGS_CATALOG, RADIO_STATIONS } from '../data/pahadiData';

interface MoodSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAtmosphere: AtmosphereMode;
  onSetAtmosphere: (mode: AtmosphereMode) => void;
  isAutoSync: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  onPlaySong: (song: SongItem) => void;
  onSelectStation: (station: RadioStation) => void;
}

export interface MoodPeriodInfo {
  period: 'morning' | 'afternoon' | 'sunset' | 'night';
  title: string;
  subtitle: string;
  timeRange: string;
  atmosphere: AtmosphereMode;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  borderAccent: string;
  recommendedGenres: Array<NonNullable<SongItem['category']>>;
  suggestedStationId: string;
  quote: string;
}

export const getMoodInfoForTime = (date: Date = new Date()): MoodPeriodInfo => {
  const hour = date.getHours();

  // Morning / Alpine Dawn: 05:00 - 10:59
  if (hour >= 5 && hour < 11) {
    return {
      period: 'morning',
      title: 'Alpine Dawn & Dew',
      subtitle: 'Morning Raagas, Acoustic Mountain Guitars & Crisp Dew',
      timeRange: '05:00 AM – 11:00 AM',
      atmosphere: 'mist',
      icon: CloudFog,
      color: 'text-amber-300',
      bgGradient: 'from-amber-950/40 via-emerald-950/20 to-black/60',
      borderAccent: 'border-amber-500/40',
      recommendedGenres: ['acoustic', 'monsoon', 'soulful'],
      suggestedStationId: 'station-4', // Rain & Flute Meditations
      quote: 'Pahad ki thandi subah aur ek pyaali adrak wali chai.'
    };
  }

  // Afternoon / High Passes: 11:00 - 16:59
  if (hour >= 11 && hour < 17) {
    return {
      period: 'afternoon',
      title: 'High Passes & Pine Trails',
      subtitle: 'Wanderlust Roadtrips, Bright Sun & Mountain Folk',
      timeRange: '11:00 AM – 05:00 PM',
      atmosphere: 'snow',
      icon: Sun,
      color: 'text-sky-300',
      bgGradient: 'from-sky-950/40 via-slate-900/30 to-black/60',
      borderAccent: 'border-sky-500/40',
      recommendedGenres: ['travel', 'folk', 'acoustic'],
      suggestedStationId: 'station-2', // Mohit Chauhan Mountain Nostalgia
      quote: 'Ghumte pahaad, behti hawayein aur anjaan raaste.'
    };
  }

  // Golden Hour / Valley Sunset: 17:00 - 20:59
  if (hour >= 17 && hour < 21) {
    return {
      period: 'sunset',
      title: 'Valley Sunset & Amber Glow',
      subtitle: 'Warm Twilight, Romantic Melodies & Campfire Longing',
      timeRange: '05:00 PM – 09:00 PM',
      atmosphere: 'sunset',
      icon: Sunset,
      color: 'text-orange-300',
      bgGradient: 'from-orange-950/50 via-rose-950/30 to-black/70',
      borderAccent: 'border-orange-500/40',
      recommendedGenres: ['romantic', 'soulful', 'acoustic'],
      suggestedStationId: 'station-1', // Arijit Singh Valley Melodies
      quote: 'Shaam ka suraj pahaadon ki god mein dhalta hua.'
    };
  }

  // Starlit Night: 21:00 - 04:59
  return {
    period: 'night',
    title: 'Starlight Peaks & Midnight Cabin',
    subtitle: 'Deep Silence, Vintage Ghazals, Lo-Fi & Warm Bonfire',
    timeRange: '09:00 PM – 05:00 AM',
    atmosphere: 'night',
    icon: Moon,
    color: 'text-indigo-300',
    bgGradient: 'from-indigo-950/50 via-purple-950/20 to-black/80',
    borderAccent: 'border-indigo-500/40',
    recommendedGenres: ['soulful', 'retro', 'ghazal'],
    suggestedStationId: 'station-3', // Kishore Kumar Retro Valley
    quote: 'Taaron se bhara aasmaan aur dur se aati nadi ki aawaz.'
  };
};

export const ALL_MOOD_PERIODS: MoodPeriodInfo[] = [
  {
    period: 'morning',
    title: 'Alpine Dawn',
    subtitle: 'Morning Raagas & Acoustic Dew',
    timeRange: '05:00 – 11:00',
    atmosphere: 'mist',
    icon: CloudFog,
    color: 'text-emerald-300',
    bgGradient: 'from-emerald-950/50 to-black/80',
    borderAccent: 'border-emerald-500/40',
    recommendedGenres: ['acoustic', 'monsoon', 'soulful'],
    suggestedStationId: 'station-4',
    quote: 'Fresh mountain breeze & misty pines.'
  },
  {
    period: 'afternoon',
    title: 'Pine Trails',
    subtitle: 'Wanderlust & Folk Roadtrips',
    timeRange: '11:00 – 17:00',
    atmosphere: 'snow',
    icon: Sun,
    color: 'text-sky-300',
    bgGradient: 'from-sky-950/50 to-black/80',
    borderAccent: 'border-sky-500/40',
    recommendedGenres: ['travel', 'folk', 'acoustic'],
    suggestedStationId: 'station-2',
    quote: 'Sun-kissed pine needles & open highway.'
  },
  {
    period: 'sunset',
    title: 'Valley Sunset',
    subtitle: 'Golden Amber & Romantic Tunes',
    timeRange: '17:00 – 21:00',
    atmosphere: 'sunset',
    icon: Sunset,
    color: 'text-orange-300',
    bgGradient: 'from-orange-950/50 to-black/80',
    borderAccent: 'border-orange-500/40',
    recommendedGenres: ['romantic', 'soulful'],
    suggestedStationId: 'station-1',
    quote: 'Golden rays dancing on the high ridges.'
  },
  {
    period: 'night',
    title: 'Starlight Peaks',
    subtitle: 'Deep Night, Ghazals & Lo-Fi',
    timeRange: '21:00 – 05:00',
    atmosphere: 'night',
    icon: Moon,
    color: 'text-indigo-300',
    bgGradient: 'from-indigo-950/50 to-black/80',
    borderAccent: 'border-indigo-500/40',
    recommendedGenres: ['soulful', 'retro', 'ghazal'],
    suggestedStationId: 'station-3',
    quote: 'Moonlight over snow-dusted summits.'
  }
];

export const MoodSchedulerModal: React.FC<MoodSchedulerModalProps> = ({
  isOpen,
  onClose,
  currentAtmosphere,
  onSetAtmosphere,
  isAutoSync,
  onToggleAutoSync,
  onPlaySong,
  onSelectStation
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [activeMood, setActiveMood] = useState<MoodPeriodInfo>(getMoodInfoForTime());

  // Update clock and active mood continuously
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setActiveMood(getMoodInfoForTime(now));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const ActiveIcon = activeMood.icon;

  const handleApplyPeriod = (period: MoodPeriodInfo) => {
    onSetAtmosphere(period.atmosphere);
    const matchedStation = RADIO_STATIONS.find((s) => s.id === period.suggestedStationId);
    if (matchedStation) {
      onSelectStation(matchedStation);
    }
  };

  const handlePlayGenreSong = (genre: string) => {
    const matchingSongs = ALL_SONGS_CATALOG.filter((s) => s.category === genre);
    if (matchingSongs.length > 0) {
      const randomSong = matchingSongs[Math.floor(Math.random() * matchingSongs.length)];
      onPlaySong(randomSong);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-[#121614] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden text-white">
        
        {/* Subtle Background Glow Accent */}
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-garamond text-2xl sm:text-3xl font-semibold tracking-wide text-white">
                Atmosphere & Mood Scheduler
              </h2>
              <p className="font-mono-space text-xs text-white/50 tracking-wider">
                Circadian Lighting & Genre Match for Mountain Living
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Time & Auto-Sync Bar */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-black/60 border border-white/10 text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono-space text-sm font-bold tracking-widest text-amber-300">
                LOCAL TIME: {currentTimeStr || '12:00:00 PM'}
              </div>
              <div className="font-mono-space text-[11px] text-white/60">
                Current Cycle: <span className="text-white font-medium">{activeMood.title}</span> ({activeMood.timeRange})
              </div>
            </div>
          </div>

          {/* Auto-Sync Toggle Button */}
          <button
            onClick={() => onToggleAutoSync(!isAutoSync)}
            className={`px-4 py-2 rounded-full font-mono-space text-xs tracking-wider font-semibold transition-all duration-300 flex items-center gap-2 cursor-pointer border ${
              isAutoSync
                ? 'bg-emerald-500/20 border-emerald-400/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'bg-white/5 border-white/15 text-white/50 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAutoSync ? 'bg-emerald-400 animate-ping' : 'bg-white/30'}`} />
            <span>AUTO-SYNC: {isAutoSync ? 'ENABLED' : 'MANUAL'}</span>
          </button>
        </div>

        {/* Active Mood Showcase Banner */}
        <div
          className={`p-5 rounded-2xl bg-gradient-to-r ${activeMood.bgGradient} border ${activeMood.borderAccent} mb-6 relative overflow-hidden transition-all duration-500`}
        >
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <ActiveIcon className={`w-6 h-6 ${activeMood.color}`} />
              <div>
                <span className="font-mono-space text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-white/80">
                  Recommended for Right Now
                </span>
                <h3 className="font-garamond text-xl font-bold text-white mt-1">
                  {activeMood.title}
                </h3>
              </div>
            </div>

            <button
              onClick={() => handleApplyPeriod(activeMood)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono-space text-xs font-bold tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 flex-shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Apply & Play</span>
            </button>
          </div>

          <p className="font-mono-space text-xs text-white/80 mb-3 relative z-10">
            {activeMood.subtitle}
          </p>

          <p className="font-garamond italic text-sm text-amber-200/90 border-l-2 border-amber-400/50 pl-3 my-2">
            "{activeMood.quote}"
          </p>

          {/* Suggested Genres for Current Mood */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 relative z-10">
            <span className="font-mono-space text-[10px] text-white/50 uppercase tracking-wider">
              Suggested Genres:
            </span>
            {activeMood.recommendedGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => handlePlayGenreSong(genre)}
                className="px-3 py-1 rounded-lg bg-black/40 hover:bg-amber-500/20 border border-white/15 hover:border-amber-400/50 text-white hover:text-amber-300 font-mono-space text-[11px] uppercase tracking-wider transition cursor-pointer flex items-center gap-1 group"
                title={`Play a ${genre} song now`}
              >
                <Play className="w-2.5 h-2.5 group-hover:fill-amber-300 fill-white" />
                <span>{genre}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4 Moods Grid */}
        <div className="mb-2">
          <div className="font-mono-space text-xs text-white/50 tracking-wider uppercase mb-3 flex items-center justify-between">
            <span>Atmospheric Mood Profiles</span>
            <span>Click to switch atmosphere</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_MOOD_PERIODS.map((period) => {
              const PeriodIcon = period.icon;
              const isSelected = currentAtmosphere === period.atmosphere;

              return (
                <div
                  key={period.period}
                  onClick={() => handleApplyPeriod(period)}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? `bg-white/10 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]`
                      : `bg-black/30 border-white/10 hover:border-white/30 hover:bg-white/5`
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl border ${period.borderAccent} bg-black/40 flex-shrink-0`}
                    >
                      <PeriodIcon className={`w-4 h-4 ${period.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-garamond text-base font-semibold text-white truncate">
                          {period.title}
                        </span>
                        <span className="font-mono-space text-[9px] text-white/40">
                          ({period.timeRange})
                        </span>
                      </div>
                      <div className="font-mono-space text-[10px] text-white/60 truncate">
                        {period.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-[0_0_8px_#f59e0b]">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 transition group-hover:translate-x-0.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono-space text-white/40">
          <span>Himalayan Circadian Clock v2.4</span>
          <span className="text-amber-300/80">Auto-transitions scenery at sunrise & dusk</span>
        </div>
      </div>
    </div>
  );
};
