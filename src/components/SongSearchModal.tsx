import React, { useState, useMemo, useEffect } from 'react';
import { SongItem } from '../types';
import {
  ALL_SONGS_CATALOG,
  ARIJIT_SINGH_FULL_PLAYLIST,
  MOHIT_CHAUHAN_PLAYLIST,
  SINGER_PROFILES
} from '../data/pahadiData';
import {
  Search,
  X,
  Play,
  Pause,
  Plus,
  Heart,
  Music,
  FolderDown,
  Trash2,
  ListPlus,
  Flame,
  Check,
  CheckCircle2,
  FolderPlus,
  Radio,
  Sparkles,
  Loader2,
  Download,
  Headphones,
  Disc3,
  BookmarkPlus
} from 'lucide-react';
import { soundscapeEngine } from '../services/soundscapeEngine';
import { searchJioSaavnSongs, getJioSaavnTrending, deduplicateSongs } from '../services/jiosaavnService';
import {
  downloadSongForOffline,
  isSongDownloaded,
  downloadSongToDevice,
  getAllDownloadedSongs,
  DownloadedSong,
  deleteDownloadedSong
} from '../services/offlineStorageService';

interface SongSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSongId?: string;
  isPlaying: boolean;
  onPlaySong: (song: SongItem) => void;
  onAddToQueue?: (song: SongItem) => void;
  onSaveToDrive?: (song: SongItem) => void;
  onDirectPlayUrl?: (urlOrId: string) => void;
}

const CUSTOM_SONGS_STORAGE_KEY = 'sovio_custom_user_songs';
const FAVORITES_STORAGE_KEY = 'sovio_favorite_songs';

const JIOSAAVN_GENRES = [
  { id: 'arijit', label: '🎙️ Arijit Singh Hits' },
  { id: 'mohit', label: '🎸 Mohit Chauhan Melodies' },
  { id: 'pahadi', label: '🏔️ Pahadi & Mountain Vibes' },
  { id: 'bollywood', label: '✨ Bollywood Sukoon' },
  { id: 'romantic', label: '❤️ Romantic Hits' },
  { id: 'garhwali', label: '🌊 Garhwali & Kumaoni' }
];

export const SongSearchModal: React.FC<SongSearchModalProps> = ({
  isOpen,
  onClose,
  currentSongId,
  isPlaying,
  onPlaySong,
  onAddToQueue,
  onSaveToDrive,
  onDirectPlayUrl
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'jiosaavn' | 'arijit' | 'mohit' | 'downloads' | 'add'>('jiosaavn');

  // JioSaavn state
  const [jioSaavnTracks, setJioSaavnTracks] = useState<SongItem[]>([]);
  const [jioSaavnLoading, setJioSaavnLoading] = useState<boolean>(false);
  const [selectedJioSaavnGenre, setSelectedJioSaavnGenre] = useState<string>('arijit');
  const [downloadingSongId, setDownloadingSongId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [downloadedItems, setDownloadedItems] = useState<DownloadedSong[]>([]);

  // Custom added songs state from localStorage
  const [customSongs, setCustomSongs] = useState<SongItem[]>(() => {
    try {
      const saved =
        localStorage.getItem(CUSTOM_SONGS_STORAGE_KEY) ||
        localStorage.getItem('panwar_custom_user_songs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Favorite song IDs
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved =
        localStorage.getItem(FAVORITES_STORAGE_KEY) ||
        localStorage.getItem('panwar_favorite_songs');
      return saved ? JSON.parse(saved) : ['as-1', 'as-2', 'mc-1', 'mc-2'];
    } catch (e) {
      return ['as-1', 'as-2', 'mc-1', 'mc-2'];
    }
  });

  // Add Song Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newArtist, setNewArtist] = useState<string>('');
  const [newMovie, setNewMovie] = useState<string>('');
  const [newYear, setNewYear] = useState<string>('2024');
  const [newCategory, setNewCategory] = useState<SongItem['category']>('soulful');
  const [newDuration, setNewDuration] = useState<string>('4:15');
  const [newVideoUrl, setNewVideoUrl] = useState<string>('');
  const [addedSuccessMsg, setAddedSuccessMsg] = useState<string | null>(null);
  const [queuedId, setQueuedId] = useState<string | null>(null);
  const [savedLibraryId, setSavedLibraryId] = useState<string | null>(null);

  // Load initial JioSaavn trending tracks on mount or when switching to jiosaavn tab
  useEffect(() => {
    if (activeTab === 'jiosaavn' && jioSaavnTracks.length === 0) {
      loadJioSaavnCategory(selectedJioSaavnGenre);
    }
  }, [activeTab]);

  const loadJioSaavnCategory = async (genreKey: string) => {
    setJioSaavnLoading(true);
    try {
      const tracks = await getJioSaavnTrending(genreKey);
      setJioSaavnTracks(deduplicateSongs(tracks));
    } catch (err: any) {
      console.warn('JioSaavn category fetch note:', err?.message || String(err));
    } finally {
      setJioSaavnLoading(false);
    }
  };

  // JioSaavn Live Search effect (debounced)
  useEffect(() => {
    if (activeTab !== 'jiosaavn') return;
    if (!searchQuery.trim()) {
      loadJioSaavnCategory(selectedJioSaavnGenre);
      return;
    }

    const timer = setTimeout(async () => {
      setJioSaavnLoading(true);
      try {
        const results = await searchJioSaavnSongs(searchQuery.trim(), 1, 30);
        setJioSaavnTracks(deduplicateSongs(results));
      } catch (err: any) {
        console.warn('JioSaavn search error:', err?.message || String(err));
      } finally {
        setJioSaavnLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedJioSaavnGenre, activeTab]);

  // Active base song pool depending on tab (Strictly deduplicated)
  const activePlaylist = useMemo(() => {
    if (activeTab === 'arijit') {
      return deduplicateSongs(ARIJIT_SINGH_FULL_PLAYLIST);
    }
    if (activeTab === 'mohit') {
      return deduplicateSongs(MOHIT_CHAUHAN_PLAYLIST);
    }
    return deduplicateSongs([...customSongs, ...ALL_SONGS_CATALOG]);
  }, [activeTab, customSongs]);

  // Filter songs for current tab (Strictly deduplicated)
  const filteredSongs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activePlaylist;
    const filtered = activePlaylist.filter((song) => {
      return (
        song.title.toLowerCase().includes(q) ||
        (song.artist && song.artist.toLowerCase().includes(q)) ||
        (song.movie && song.movie.toLowerCase().includes(q)) ||
        (song.category && song.category.toLowerCase().includes(q))
      );
    });
    return deduplicateSongs(filtered);
  }, [activePlaylist, searchQuery]);

  // Extract YouTube video ID from various formats
  const extractVideoId = (url: string): string => {
    if (!url) return '';
    const cleanUrl = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
      return cleanUrl;
    }
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const match = cleanUrl.match(regExp);
    if (match && match[1]) {
      return match[1];
    }
    return cleanUrl;
  };

  // Toggle favorite
  const handleToggleFavorite = (songId: string, e?: React.MouseEvent) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (typeof songId !== 'string') return;
    setFavorites((prev) => {
      const next = prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId];
      try {
        const safeList = next.filter((item) => typeof item === 'string');
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(safeList));
      } catch (err) {}
      return next;
    });
  };

  // Add custom song handler
  const handleAddCustomSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newVideoUrl.trim()) return;

    const vidId = extractVideoId(newVideoUrl);
    const newSong: SongItem = {
      id: `custom-${Date.now()}`,
      title: String(newTitle).trim(),
      artist: String(newArtist).trim() || 'Arijit / Mohit / Mountain Artist',
      movie: String(newMovie).trim() || 'Single',
      year: String(newYear).trim() || '2024',
      category: newCategory,
      duration: String(newDuration).trim() || '4:00',
      videoId: vidId,
      custom: true
    };

    const updated = [newSong, ...customSongs];
    setCustomSongs(updated);
    try {
      const safeCustom = updated.map((s) => ({
        id: String(s.id),
        title: String(s.title),
        artist: String(s.artist || ''),
        movie: String(s.movie || ''),
        year: String(s.year || ''),
        category: s.category || 'romantic',
        duration: String(s.duration || '4:00'),
        videoId: String(s.videoId || ''),
        custom: true
      }));
      localStorage.setItem(CUSTOM_SONGS_STORAGE_KEY, JSON.stringify(safeCustom));
    } catch (err) {}

    setAddedSuccessMsg(`"${newSong.title}" added to your playlist!`);
    setNewTitle('');
    setNewArtist('');
    setNewMovie('');
    setNewVideoUrl('');

    setTimeout(() => {
      setAddedSuccessMsg(null);
      setActiveTab('jiosaavn');
    }, 1500);
  };

  // Save song directly to user library
  const handleSaveToUserLibrary = (song: SongItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const exists = customSongs.find((s) => s.id === song.id);
    if (!exists) {
      const safeSong: SongItem = {
        id: String(song.id),
        title: String(song.title || 'Mountain Melody'),
        artist: String(song.artist || 'Arijit / Mohit'),
        movie: String(song.movie || 'Hits'),
        year: String(song.year || '2024'),
        category: song.category || 'romantic',
        duration: String(song.duration || '4:00'),
        videoId: String(song.videoId || ''),
        audioFileUrl: song.audioFileUrl ? String(song.audioFileUrl) : undefined,
        imageUrl: song.imageUrl ? String(song.imageUrl) : undefined,
        source: song.source || 'jiosaavn',
        custom: true
      };
      const updated = [safeSong, ...customSongs];
      setCustomSongs(updated);
      try {
        localStorage.setItem(CUSTOM_SONGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {}
    }
    setSavedLibraryId(song.id);
    setTimeout(() => setSavedLibraryId(null), 1800);
  };

  // Download song for offline listening
  const handleDownloadSong = async (song: SongItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!song.audioFileUrl) return;

    setDownloadingSongId(song.id);
    try {
      await downloadSongForOffline(song);
      setDownloadSuccessId(song.id);
      setTimeout(() => setDownloadSuccessId(null), 2500);
    } catch (err: any) {
      console.warn('Offline download note:', err?.message || String(err));
    } finally {
      setDownloadingSongId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-gradient-to-b from-[#18201a] via-[#101412] to-[#0a0d0c] border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-black font-bold shadow-lg shadow-emerald-900/30">
              <Headphones className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-garamond text-xl sm:text-2xl font-bold tracking-wide text-white flex items-center gap-2">
                <span>Music Studio & Playlists</span>
                <span className="text-[10px] font-mono-space px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  JioSaavn • Arijit • Mohit
                </span>
              </h2>
              <p className="font-mono-space text-xs text-white/50">
                Stream 80M+ JioSaavn songs, Arijit Singh and Mohit Chauhan hits
              </p>
            </div>
          </div>

          {/* Tab Switchers */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* JioSaavn Primary Tab */}
            <button
              onClick={() => {
                soundscapeEngine.playButtonClick();
                setActiveTab('jiosaavn');
              }}
              className={`px-3 py-1.5 rounded-xl font-mono-space text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                activeTab === 'jiosaavn'
                  ? 'bg-emerald-400 text-black font-bold border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.35)]'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
              title="Search & stream 80 Million+ tracks via JioSaavn HD Cloud"
            >
              <Disc3 className={`w-3.5 h-3.5 ${activeTab === 'jiosaavn' ? 'animate-spin' : ''}`} />
              <span>🟢 JioSaavn (80M+)</span>
            </button>

            {/* Arijit Singh Tab */}
            <button
              onClick={() => {
                soundscapeEngine.playButtonClick();
                setActiveTab('arijit');
              }}
              className={`px-3 py-1.5 rounded-xl font-mono-space text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                activeTab === 'arijit'
                  ? 'bg-amber-400 text-black font-bold border-amber-300 shadow-sm'
                  : 'bg-black/40 text-amber-200/80 border-amber-500/30 hover:bg-amber-500/15'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>🎙️ Arijit Singh ({ARIJIT_SINGH_FULL_PLAYLIST.length})</span>
            </button>

            {/* Mohit Chauhan Tab */}
            <button
              onClick={() => {
                soundscapeEngine.playButtonClick();
                setActiveTab('mohit');
              }}
              className={`px-3 py-1.5 rounded-xl font-mono-space text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                activeTab === 'mohit'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold border-orange-400 shadow-sm'
                  : 'bg-black/40 text-orange-300 border-orange-500/20 hover:bg-orange-500/15'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>🎸 Mohit Chauhan ({MOHIT_CHAUHAN_PLAYLIST.length})</span>
            </button>

            {/* Offline Downloads Tab */}
            <button
              onClick={async () => {
                soundscapeEngine.playButtonClick();
                setActiveTab('downloads');
                try {
                  const dl = await getAllDownloadedSongs();
                  setDownloadedItems(dl);
                } catch (e) {}
              }}
              className={`px-3 py-1.5 rounded-xl font-mono-space text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                activeTab === 'downloads'
                  ? 'bg-teal-400 text-black font-bold border-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.4)]'
                  : 'bg-black/40 text-teal-300 border-teal-500/30 hover:bg-teal-500/15'
              }`}
              title="View and play all downloaded songs offline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>📥 Downloads {downloadedItems.length > 0 ? `(${downloadedItems.length})` : ''}</span>
            </button>

            {/* Add Custom Tab */}
            <button
              onClick={() => {
                soundscapeEngine.playButtonClick();
                setActiveTab('add');
              }}
              className={`px-2.5 py-1.5 rounded-xl font-mono-space text-xs transition cursor-pointer flex items-center gap-1 border ${
                activeTab === 'add'
                  ? 'bg-white text-black font-bold border-white shadow-sm'
                  : 'bg-black/40 text-white/50 border-white/10 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Song</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- TAB CONTENT: JIOSAAVN 80M+ CATALOG --- */}
        {activeTab === 'jiosaavn' && (
          <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-5">
            {/* JioSaavn Hero Banner */}
            <div className="mb-3.5 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-[#0d1f16] to-black/60 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex-shrink-0">
                  <Disc3 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-garamond text-base sm:text-lg font-bold text-emerald-200 flex items-center gap-2">
                    <span>🟢 JioSaavn HD Cloud Audio</span>
                    <span className="text-[10px] font-mono-space text-emerald-300 font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                      320 KBPS • Full Catalog
                    </span>
                  </h3>
                  <p className="font-mono-space text-[11px] text-white/60">
                    Play any song by Arijit Singh, Mohit Chauhan, or any Bollywood / Pahadi melody instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadJioSaavnCategory(selectedJioSaavnGenre)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-mono-space text-xs border border-emerald-500/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Refresh Hits</span>
                </button>
              </div>
            </div>

            {/* JioSaavn Live Search Bar */}
            <div className="mb-3 flex-shrink-0 relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-emerald-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any song, singer, album (e.g. 'Arijit Singh', 'Mohit Chauhan', 'Kesariya', 'Tum Se Hi', 'Phir Se Ud Chala')..."
                className="w-full pl-12 pr-10 py-3 bg-black/50 border border-emerald-500/30 focus:border-emerald-400 rounded-2xl text-sm font-mono-space text-white placeholder:text-white/40 outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1.5 text-white/40 hover:text-white rounded-full transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* JioSaavn Genre Chips */}
            <div className="mb-3 flex-shrink-0 flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5">
                {JIOSAAVN_GENRES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      soundscapeEngine.playButtonClick();
                      setSelectedJioSaavnGenre(g.id);
                      setSearchQuery('');
                      loadJioSaavnCategory(g.id);
                    }}
                    className={`px-3 py-1 rounded-full font-mono-space text-[11px] tracking-wider transition cursor-pointer whitespace-nowrap border ${
                      selectedJioSaavnGenre === g.id && !searchQuery
                        ? 'bg-emerald-400 text-black border-emerald-300 font-bold shadow-sm'
                        : 'bg-black/40 text-emerald-200/70 border-white/10 hover:border-emerald-400/40 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {jioSaavnLoading && (
                <div className="flex items-center gap-1.5 font-mono-space text-xs text-emerald-300 flex-shrink-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching JioSaavn...</span>
                </div>
              )}
            </div>

            {/* JioSaavn Stream List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
              {jioSaavnLoading && jioSaavnTracks.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-emerald-500/20 rounded-2xl bg-emerald-950/10">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                  <p className="font-garamond text-lg text-emerald-200">Connecting to JioSaavn Cloud Stream...</p>
                  <p className="font-mono-space text-xs text-white/40 mt-1">
                    Fetching high quality 320kbps audio streams
                  </p>
                </div>
              ) : jioSaavnTracks.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                  <Music className="w-8 h-8 text-emerald-400/40 mb-2" />
                  <p className="font-garamond text-lg text-white/70">No JioSaavn tracks found</p>
                  <p className="font-mono-space text-xs text-white/40 mt-1">
                    Try searching for your favorite artist, movie or song name.
                  </p>
                </div>
              ) : (
                jioSaavnTracks.map((song) => {
                  const isCurrent = currentSongId === song.id;
                  const isFav = favorites.includes(song.id);
                  const isDownloading = downloadingSongId === song.id;
                  const isDownloaded = downloadSuccessId === song.id || isSongDownloaded(song.id);
                  const isSavedLib = savedLibraryId === song.id;

                  return (
                    <div
                      key={song.id}
                      onClick={() => onPlaySong(song)}
                      className={`group p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-emerald-500/20 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                          : 'bg-black/40 border-emerald-500/15 hover:border-emerald-400/40 hover:bg-emerald-950/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Artwork / Play trigger */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black/60 border border-white/10 flex items-center justify-center">
                          {song.imageUrl ? (
                            <img
                              src={song.imageUrl}
                              alt={song.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Disc3 className="w-6 h-6 text-emerald-400" />
                          )}
                          <div
                            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition ${
                              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isCurrent && isPlaying ? (
                              <Pause className="w-5 h-5 text-emerald-300 fill-current" />
                            ) : (
                              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                            )}
                          </div>
                        </div>

                        {/* Song Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-garamond text-base sm:text-lg font-semibold truncate ${
                                isCurrent ? 'text-emerald-300' : 'text-white group-hover:text-emerald-200'
                              }`}
                            >
                              {song.title}
                            </span>
                            <span className="font-mono-space text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded flex-shrink-0">
                              HD 320k
                            </span>
                          </div>

                          <div className="font-mono-space text-[11px] text-white/50 truncate flex items-center gap-2">
                            <span className="text-emerald-200/80">{song.artist}</span>
                            {song.movie && (
                              <>
                                <span>•</span>
                                <span className="text-white/40 truncate">{song.movie}</span>
                              </>
                            )}
                            {song.year && (
                              <>
                                <span>•</span>
                                <span className="text-white/30">{song.year}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className="font-mono-space text-xs text-white/40 min-w-[36px] text-right">
                          {song.duration || '3:30'}
                        </span>

                        {/* Favorite Button */}
                        <button
                          onClick={(e) => handleToggleFavorite(song.id, e)}
                          className={`p-2 rounded-full transition cursor-pointer ${
                            isFav
                              ? 'text-rose-400 hover:text-rose-300'
                              : 'text-white/30 hover:text-rose-300 hover:bg-white/5'
                          }`}
                          title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400' : ''}`} />
                        </button>

                        {/* Add to Queue */}
                        {onAddToQueue && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToQueue(song);
                              setQueuedId(song.id);
                              setTimeout(() => setQueuedId(null), 1500);
                            }}
                            className="p-2 rounded-full text-white/40 hover:text-emerald-300 hover:bg-white/10 transition cursor-pointer"
                            title="Add to queue"
                          >
                            {queuedId === song.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ListPlus className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Save to My Library */}
                        <button
                          onClick={(e) => handleSaveToUserLibrary(song, e)}
                          className="p-2 rounded-full text-white/40 hover:text-amber-300 hover:bg-white/10 transition cursor-pointer"
                          title="Save to My Library"
                        >
                          {isSavedLib ? (
                            <Check className="w-4 h-4 text-amber-400" />
                          ) : (
                            <BookmarkPlus className="w-4 h-4" />
                          )}
                        </button>

                        {/* Offline Download Button */}
                        <button
                          onClick={(e) => handleDownloadSong(song, e)}
                          disabled={isDownloading}
                          className={`p-2 rounded-full transition cursor-pointer ${
                            isDownloaded
                              ? 'text-emerald-400'
                              : 'text-white/40 hover:text-teal-300 hover:bg-white/10'
                          }`}
                          title="Download for offline playback"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                          ) : isDownloaded ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: ARIJIT SINGH & MOHIT CHAUHAN PLAYLISTS --- */}
        {(activeTab === 'arijit' || activeTab === 'mohit') && (
          <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-5">
            {/* Artist Header Banner */}
            <div className={`mb-3.5 p-3 sm:p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 flex-shrink-0 animate-fadeIn ${
              activeTab === 'arijit'
                ? 'bg-gradient-to-r from-amber-950/40 via-[#1f1910] to-black/60 border-amber-500/30'
                : 'bg-gradient-to-r from-orange-950/40 via-[#23150d] to-black/60 border-orange-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border flex-shrink-0 ${
                  activeTab === 'arijit'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                }`}>
                  {activeTab === 'arijit' ? <Music className="w-6 h-6" /> : <Flame className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className={`font-garamond text-base sm:text-lg font-bold flex items-center gap-2 ${
                    activeTab === 'arijit' ? 'text-amber-200' : 'text-orange-200'
                  }`}>
                    <span>{activeTab === 'arijit' ? '🎙️ Arijit Singh Collection' : '🎸 Mohit Chauhan Mountain Melodies'}</span>
                    <span className="text-[10px] font-mono-space font-normal px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                      {filteredSongs.length} Master Tracks
                    </span>
                  </h3>
                  <p className="font-mono-space text-[11px] text-white/60">
                    {activeTab === 'arijit'
                      ? 'Kesariya, Tum Hi Ho, Channa Mereya, Apna Bana Le, Ilahi & Soulful Classics'
                      : 'Rockstar, Phir Se Ud Chala, Tum Se Hi, Matargashti, Masakali & Silk Route Melodies'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (filteredSongs.length > 0) {
                      onPlaySong(filteredSongs[0]);
                      if (onAddToQueue) {
                        filteredSongs.slice(1).forEach((s) => onAddToQueue(s));
                      }
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold font-mono-space text-xs transition cursor-pointer flex items-center gap-1.5 text-black ${
                    activeTab === 'arijit'
                      ? 'bg-amber-400 hover:bg-amber-300'
                      : 'bg-gradient-to-r from-orange-400 to-amber-400 hover:brightness-110'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play All Tracks</span>
                </button>
              </div>
            </div>

            {/* Search Filter for Artist Tracks */}
            <div className="mb-3 flex-shrink-0 relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${activeTab === 'arijit' ? 'Arijit Singh' : 'Mohit Chauhan'} tracks...`}
                className="w-full pl-12 pr-10 py-3 bg-black/40 border border-white/10 focus:border-amber-400/60 rounded-2xl text-sm font-mono-space text-white placeholder:text-white/40 outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1.5 text-white/40 hover:text-white rounded-full transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Song List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-0">
              {filteredSongs.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                  <Music className="w-8 h-8 text-white/20 mb-2" />
                  <p className="font-garamond text-lg text-white/70">No matching songs in this playlist</p>
                  <button
                    onClick={() => setActiveTab('jiosaavn')}
                    className="mt-3 px-4 py-2 rounded-xl bg-emerald-400 text-black font-bold font-mono-space text-xs hover:bg-emerald-300 transition cursor-pointer"
                  >
                    Search on JioSaavn (80M+ Songs)
                  </button>
                </div>
              ) : (
                filteredSongs.map((song) => {
                  const isCurrent = currentSongId === song.id;
                  const isFav = favorites.includes(song.id);

                  return (
                    <div
                      key={song.id}
                      onClick={() => onPlaySong(song)}
                      className={`group p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_18px_rgba(245,158,11,0.25)]'
                          : 'bg-black/30 border-white/10 hover:border-amber-400/30 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                            isCurrent
                              ? 'bg-amber-400 text-black shadow-md font-bold'
                              : 'bg-white/10 text-white/70 group-hover:bg-amber-400 group-hover:text-black'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-garamond text-base sm:text-lg font-semibold truncate ${
                                isCurrent ? 'text-amber-300' : 'text-white group-hover:text-amber-200'
                              }`}
                            >
                              {song.title}
                            </span>
                            <span className="font-mono-space text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded flex-shrink-0">
                              {song.category || 'Soulful'}
                            </span>
                          </div>

                          <div className="font-mono-space text-[11px] text-white/50 truncate flex items-center gap-2">
                            <span className="text-amber-200/80">{song.artist}</span>
                            {song.movie && (
                              <>
                                <span>•</span>
                                <span className="text-white/40 truncate">{song.movie}</span>
                              </>
                            )}
                            {song.year && (
                              <>
                                <span>•</span>
                                <span className="text-white/30">{song.year}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className="font-mono-space text-xs text-white/40 min-w-[36px] text-right">
                          {song.duration || '4:00'}
                        </span>

                        <button
                          onClick={(e) => handleToggleFavorite(song.id, e)}
                          className={`p-2 rounded-full transition cursor-pointer ${
                            isFav
                              ? 'text-rose-400 hover:text-rose-300'
                              : 'text-white/30 hover:text-rose-300 hover:bg-white/5'
                          }`}
                          title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400' : ''}`} />
                        </button>

                        {onAddToQueue && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToQueue(song);
                              setQueuedId(song.id);
                              setTimeout(() => setQueuedId(null), 1500);
                            }}
                            className="p-2 rounded-full text-white/30 hover:text-amber-300 hover:bg-white/5 transition cursor-pointer"
                            title="Add to queue"
                          >
                            {queuedId === song.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ListPlus className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: OFFLINE DOWNLOADS --- */}
        {activeTab === 'downloads' && (
          <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-5">
            <div className="mb-3.5 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-950/50 via-[#0d1d1f] to-black/60 border border-teal-500/30 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex-shrink-0">
                  <Download className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-garamond text-base sm:text-lg font-bold text-teal-200 flex items-center gap-2">
                    <span>Offline Stored Music</span>
                    <span className="text-[10px] font-mono-space text-teal-300 font-normal px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30">
                      {downloadedItems.length} Songs Downloaded
                    </span>
                  </h3>
                  <p className="font-mono-space text-[11px] text-white/60">
                    All these songs are stored offline on your device and can be played with zero internet.
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  const dl = await getAllDownloadedSongs();
                  setDownloadedItems(dl);
                }}
                className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 font-mono-space text-xs border border-teal-500/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {downloadedItems.length === 0 ? (
                <div className="h-60 flex flex-col items-center justify-center text-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <Download className="w-10 h-10 text-teal-400/50 mb-2" />
                  <h4 className="font-garamond text-lg font-bold text-white mb-1">No Offline Downloads Yet</h4>
                  <p className="font-mono-space text-xs text-white/50 max-w-sm mb-3">
                    Click the download icon on any JioSaavn or Bollywood song to save it for offline listening!
                  </p>
                  <button
                    onClick={() => setActiveTab('jiosaavn')}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono-space transition"
                  >
                    Browse JioSaavn Songs
                  </button>
                </div>
              ) : (
                downloadedItems.map((item) => {
                  const isCurrent = currentSongId === item.id;
                  const playableSong: SongItem = {
                    ...item.song,
                    audioFileUrl: item.audioUrl || item.song.audioFileUrl,
                    isOffline: true
                  };

                  return (
                    <div
                      key={item.id}
                      onClick={() => onPlaySong(playableSong)}
                      className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group ${
                        isCurrent
                          ? 'bg-teal-500/20 border-teal-400/80 shadow-[0_0_15px_rgba(45,212,191,0.2)]'
                          : 'bg-[#101b19]/60 hover:bg-[#152320] border-white/10 hover:border-teal-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center relative group-hover:border-teal-400/50">
                          {item.song.imageUrl ? (
                            <img
                              src={item.song.imageUrl}
                              alt={item.song.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music className="w-5 h-5 text-teal-400/70" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-garamond text-base font-bold text-white truncate group-hover:text-teal-300 transition">
                              {item.song.title}
                            </h4>
                            <span className="text-[9px] font-mono-space px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30 flex-shrink-0">
                              Offline Ready
                            </span>
                          </div>
                          <p className="font-mono-space text-xs text-white/50 truncate">
                            {item.song.artist || 'Pahadi Artist'} • {item.song.movie || 'Melody'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Play button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaySong(playableSong);
                          }}
                          className="p-2 rounded-full bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-black transition cursor-pointer"
                          title="Play Offline"
                        >
                          <Play className="w-4 h-4 ml-0.5" />
                        </button>

                        {/* Save to Device */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await downloadSongToDevice(playableSong);
                          }}
                          className="p-2 rounded-full bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-300 border border-white/10 transition cursor-pointer"
                          title="Save audio file to phone/PC"
                        >
                          <FolderDown className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await deleteDownloadedSong(item.id);
                            const updated = await getAllDownloadedSongs();
                            setDownloadedItems(updated);
                          }}
                          className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 border border-white/10 transition cursor-pointer"
                          title="Delete from offline storage"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: ADD CUSTOM SONG --- */}
        {activeTab === 'add' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200/90 text-xs font-mono-space flex items-center gap-3">
              <Plus className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>
                Add any song or mountain audio URL to your playlist. It will be saved locally on your device.
              </span>
            </div>

            {addedSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono-space flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{addedSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomSong} className="space-y-4">
              <div>
                <label className="block font-mono-space text-xs text-white/70 mb-1">
                  Song Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. O Saathi, Bedu Pako, Matargashti..."
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-sm font-mono-space text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-space text-xs text-white/70 mb-1">
                    Singer / Artist
                  </label>
                  <input
                    type="text"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="e.g. Arijit Singh, Mohit Chauhan"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-sm font-mono-space text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono-space text-xs text-white/70 mb-1">
                    Movie / Album
                  </label>
                  <input
                    type="text"
                    value={newMovie}
                    onChange={(e) => setNewMovie(e.target.value)}
                    placeholder="e.g. Bollywood Single, Mountain Hits"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-sm font-mono-space text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono-space text-xs text-white/70 mb-1">
                  YouTube Video Link or 11-char ID *
                </label>
                <input
                  type="text"
                  required
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or Video ID"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-sm font-mono-space text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('jiosaavn')}
                  className="px-4 py-2 rounded-xl text-xs font-mono-space text-white/60 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold font-mono-space text-xs transition cursor-pointer flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Save Song</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
