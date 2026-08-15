import React, { useState, useEffect, useRef } from 'react';
import {
  Mic2,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Sparkles,
  Search,
  Languages,
  Type,
  RefreshCw,
  Music,
  Radio,
  Check,
  Disc
} from 'lucide-react';
import { LyricsData, LyricLine, SongItem, TrackInfo } from '../types';
import { fetchLyrics } from '../services/lyricsService';

interface LyricsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: SongItem | null;
  trackInfo: TrackInfo;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSkipSeconds: (delta: number) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
}

export const LyricsOverlay: React.FC<LyricsOverlayProps> = ({
  isOpen,
  onClose,
  currentSong,
  trackInfo,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onSkipSeconds,
  onNextTrack,
  onPrevTrack
}) => {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showTranslations, setShowTranslations] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('large');
  const [isKaraokeMode, setIsKaraokeMode] = useState<boolean>(true);
  const [isUserScrolling, setIsUserScrolling] = useState<boolean>(false);
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');
  const [isSearchingCustom, setIsSearchingCustom] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Active line index
  const activeIndex = React.useMemo(() => {
    if (!lyricsData || !lyricsData.lines || lyricsData.lines.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyricsData.lines.length; i++) {
      if (currentTime >= lyricsData.lines[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyricsData, currentTime]);

  // Fetch lyrics whenever song changes or modal opens
  useEffect(() => {
    if (!isOpen) return;

    const title = currentSong?.title || trackInfo.title || 'Mountain Melodies';
    const artist = currentSong?.artist || trackInfo.author || '';

    let isMounted = true;
    setIsLoading(true);

    fetchLyrics({
      title,
      artist,
      duration: duration || 240,
      songId: currentSong?.id
    })
      .then((data) => {
        if (isMounted) {
          setLyricsData(data);
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        console.warn('Lyrics fetch error:', err?.message || String(err));
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentSong?.id, currentSong?.title, trackInfo.title]);

  // Auto-scroll active line into center
  useEffect(() => {
    if (!isOpen || isUserScrolling || activeIndex === -1) return;

    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex, isOpen, isUserScrolling]);

  // Detect user manual scroll to pause auto-center temporarily
  const handleScroll = () => {
    setIsUserScrolling(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 4000);
  };

  // Re-sync to active line
  const handleResumeSync = () => {
    setIsUserScrolling(false);
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Custom search lyrics
  const handleSearchLyricsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchQuery.trim()) return;

    setIsLoading(true);
    const data = await fetchLyrics({
      title: customSearchQuery.trim(),
      artist: '',
      duration: duration || 240
    });
    setLyricsData(data);
    setIsLoading(false);
    setIsSearchingCustom(false);
  };

  if (!isOpen) return null;

  const displayTitle = currentSong?.title || trackInfo.title.split('•')[0].trim();
  const displayArtist = currentSong?.artist || currentSong?.movie || trackInfo.author || 'Mountain Melody';

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="lyrics-overlay-modal"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/90 backdrop-blur-2xl text-white select-none animate-fadeIn overflow-hidden"
    >
      {/* Subtle Background Glow Accent */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-amber-500/30 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[160px]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex-shrink-0">
            <Mic2 className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-garamond text-xl sm:text-2xl font-bold text-white truncate drop-shadow-sm">
                {displayTitle}
              </h2>
              {lyricsData?.synced && (
                <span className="font-mono-space text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Synced
                </span>
              )}
            </div>
            <p className="font-mono-space text-xs text-amber-200/70 truncate flex items-center gap-2">
              <span>{displayArtist}</span>
              {currentSong?.year && <span>• {currentSong.year}</span>}
              {lyricsData?.source && (
                <span className="text-white/40 uppercase text-[9px]">[{lyricsData.source.replace('_', ' ')}]</span>
              )}
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Custom Lyrics Search Button */}
          <button
            onClick={() => setIsSearchingCustom(!isSearchingCustom)}
            className={`p-2 rounded-full border transition cursor-pointer ${
              isSearchingCustom
                ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title="Search different lyrics / song name"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Translation Toggle */}
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className={`px-3 py-1.5 rounded-full font-mono-space text-xs border transition flex items-center gap-1.5 cursor-pointer ${
              showTranslations
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
            }`}
            title="Toggle Hindi/English lyric meaning & translation"
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Meaning</span>
          </button>

          {/* Font Size Toggle */}
          <button
            onClick={() => {
              if (fontSize === 'normal') setFontSize('large');
              else if (fontSize === 'large') setFontSize('xl');
              else setFontSize('normal');
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title={`Font Size: ${fontSize}`}
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Close Overlay */}
          <button
            id="close-lyrics-button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-red-500/30 border border-white/20 text-white hover:border-red-400 hover:text-red-300 transition cursor-pointer ml-1"
            title="Close Lyrics (Esc or L)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Optional Search Bar dropdown */}
      {isSearchingCustom && (
        <form
          onSubmit={handleSearchLyricsSubmit}
          className="relative z-20 w-full max-w-md mx-auto px-4 pt-3 flex gap-2 animate-fadeIn"
        >
          <input
            type="text"
            value={customSearchQuery}
            onChange={(e) => setCustomSearchQuery(e.target.value)}
            placeholder="Type song title (e.g. Kesariya, Tum Hi Ho)..."
            className="flex-1 px-4 py-2 bg-black/80 border border-amber-500/40 rounded-xl text-white text-xs font-mono-space focus:outline-none focus:border-amber-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono-space rounded-xl cursor-pointer"
          >
            Find
          </button>
        </form>
      )}

      {/* Main Lyrics Body Container (Scrollable) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-6 sm:px-12 py-16 overflow-y-auto scroll-smooth space-y-6 sm:space-y-8 text-center scrollbar-thin scrollbar-thumb-amber-500/20"
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white/60 py-20">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="font-mono-space text-xs tracking-widest text-amber-200/80">
              SEARCHING MOUNTAIN LYRICS DATABASE...
            </p>
          </div>
        ) : !lyricsData || lyricsData.lines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-white/60 py-20">
            <Music className="w-12 h-12 text-white/20" />
            <p className="font-garamond text-xl text-white/80">No synchronized lyrics found for this melody</p>
            <button
              onClick={() => setIsSearchingCustom(true)}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono-space rounded-full cursor-pointer"
            >
              Search by Song Title
            </button>
          </div>
        ) : (
          lyricsData.lines.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            let fontClass = 'text-xl sm:text-2xl';
            if (fontSize === 'large') fontClass = 'text-2xl sm:text-3xl';
            if (fontSize === 'xl') fontClass = 'text-3xl sm:text-4xl';

            return (
              <div
                key={`${line.time}-${idx}`}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.time)}
                className={`group cursor-pointer transition-all duration-500 py-1.5 px-4 rounded-2xl ${
                  isActive
                    ? 'scale-105 my-4 bg-amber-500/10 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                    : isPast
                    ? 'opacity-40 hover:opacity-80'
                    : 'opacity-50 hover:opacity-90'
                }`}
                title={`Jump to ${formatSecs(line.time)}`}
              >
                {/* Main Lyric Line */}
                <p
                  className={`font-garamond font-semibold tracking-wide transition-colors duration-300 ${fontClass} ${
                    isActive
                      ? 'text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] font-bold'
                      : 'text-white/70 group-hover:text-white'
                  }`}
                >
                  {line.text}
                </p>

                {/* Optional Poetic Meaning / Translation */}
                {showTranslations && line.translation && (
                  <p
                    className={`font-mono-space text-xs sm:text-sm mt-1 transition-opacity italic duration-300 ${
                      isActive
                        ? 'text-amber-100/90 drop-shadow'
                        : 'text-white/40 group-hover:text-white/70'
                    }`}
                  >
                    "{line.translation}"
                  </p>
                )}

                {/* Timestamp Pill on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center justify-center gap-1 text-[10px] font-mono-space text-amber-400/80">
                  <Play className="w-2.5 h-2.5 fill-amber-400" />
                  <span>{formatSecs(line.time)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Sync Resume Toast (Shown when user manually scrolled away) */}
      {isUserScrolling && activeIndex !== -1 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <button
            onClick={handleResumeSync}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-mono-space rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.8)] flex items-center gap-2 cursor-pointer transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sync to Active Lyric ({formatSecs(currentTime)})</span>
          </button>
        </div>
      )}

      {/* Bottom Mini Player Controls Bar */}
      <footer className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 py-3 border-t border-white/10 bg-black/70 backdrop-blur-xl rounded-t-3xl flex-shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {/* Progress Bar with Time */}
        <div className="flex items-center gap-3 mb-2 font-mono-space text-xs text-white/50">
          <span>{formatSecs(currentTime)}</span>
          <div
            onClick={(e) => {
              if (duration <= 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              onSeek(ratio * duration);
            }}
            className="flex-1 h-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer relative overflow-hidden group"
          >
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full relative"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-200 rounded-full shadow-[0_0_8px_#f59e0b] opacity-0 group-hover:opacity-100 transition" />
            </div>
          </div>
          <span>{formatSecs(duration)}</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onSkipSeconds(-10)}
            className="p-2 text-white/60 hover:text-white transition cursor-pointer"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onPrevTrack}
            className="p-2 text-white/70 hover:text-white transition cursor-pointer"
            title="Previous Track"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-11 h-11 rounded-full bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)] transition active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={onNextTrack}
            className="p-2 text-white/70 hover:text-white transition cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={() => onSkipSeconds(10)}
            className="p-2 text-white/60 hover:text-white transition cursor-pointer"
            title="Forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
