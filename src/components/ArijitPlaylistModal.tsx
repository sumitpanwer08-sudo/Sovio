import React, { useState } from 'react';
import { SongItem } from '../types';
import { ARIJIT_SINGH_FULL_PLAYLIST } from '../data/pahadiData';
import { X, Search, Play, Pause, Disc, Heart, FolderDown, Music, Sparkles, Filter } from 'lucide-react';
import { soundscapeEngine } from '../services/soundscapeEngine';

interface ArijitPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSongId?: string;
  isPlaying: boolean;
  onPlaySong: (song: SongItem) => void;
  onSaveToDrive?: (song: SongItem) => void;
}

export const ArijitPlaylistModal: React.FC<ArijitPlaylistModalProps> = ({
  isOpen,
  onClose,
  currentSongId,
  isPlaying,
  onPlaySong,
  onSaveToDrive
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<string[]>(['as-1', 'as-2', 'as-6']);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredSongs = ARIJIT_SINGH_FULL_PLAYLIST.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.movie && song.movie.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (song.year && song.year.includes(searchQuery));

    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'favorites'
        ? favorites.includes(song.id)
        : song.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSelectSong = (song: SongItem) => {
    soundscapeEngine.playTuningStatic();
    onPlaySong(song);
  };

  const categories = [
    { id: 'all', label: 'All Songs' },
    { id: 'romantic', label: 'Romantic' },
    { id: 'travel', label: 'Mountain & Travel' },
    { id: 'soulful', label: 'Soulful & Nostalgia' },
    { id: 'monsoon', label: 'Monsoon Rain' },
    { id: 'favorites', label: `Favorites (${favorites.length})` }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#181512] border border-amber-500/30 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#241c14] to-[#16120e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-garamond text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                Arijit Singh Songbook
                <span className="font-mono-space text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Full Playlist ({ARIJIT_SINGH_FULL_PLAYLIST.length})
                </span>
              </h2>
              <p className="font-mono-space text-xs text-amber-200/60 tracking-wider">
                Soulful Melodies, Mountain Wanderlust & Bollywood Hits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 pt-4 pb-2 bg-[#1c1712]/70 border-b border-white/5 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by song name, movie (e.g. Kesariya, Manali, Aashiqui 2)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs font-mono-space focus:outline-none focus:border-amber-400/60 transition placeholder:text-white/30"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full font-mono-space text-[11px] whitespace-nowrap transition cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-black/30 text-white/60 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Song List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {filteredSongs.length === 0 ? (
            <div className="text-center py-12 text-white/40 font-mono-space text-xs">
              No songs found matching "{searchQuery}" in this category.
            </div>
          ) : (
            filteredSongs.map((song, index) => {
              const isSelected = currentSongId === song.id;
              const isFav = favorites.includes(song.id);

              return (
                <div
                  key={song.id}
                  onClick={() => handleSelectSong(song)}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-[0_0_15px_rgba(197,160,89,0.15)]'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
                  }`}
                >
                  {/* Left: Index / Play Icon & Song Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0">
                      {isSelected ? (
                        isPlaying ? (
                          <div className="flex items-end gap-0.5 h-3.5">
                            <div className="w-0.5 bg-amber-400 h-3 animate-pulse" />
                            <div className="w-0.5 bg-amber-400 h-2 animate-pulse" style={{ animationDelay: '150ms' }} />
                            <div className="w-0.5 bg-amber-400 h-3.5 animate-pulse" style={{ animationDelay: '300ms' }} />
                          </div>
                        ) : (
                          <Pause className="w-3.5 h-3.5 text-amber-400" />
                        )
                      ) : (
                        <span className="font-mono-space text-xs text-white/40 group-hover:hidden">
                          {index + 1}
                        </span>
                      )}
                      <Play className={`w-3.5 h-3.5 text-amber-300 hidden ${!isSelected ? 'group-hover:block' : ''}`} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm truncate ${isSelected ? 'text-amber-300 font-semibold' : 'text-white'}`}>
                          {song.title}
                        </span>
                        {song.year && (
                          <span className="font-mono-space text-[10px] text-white/30">
                            {song.year}
                          </span>
                        )}
                      </div>
                      <div className="font-mono-space text-[11px] text-white/50 truncate flex items-center gap-2 mt-0.5">
                        <span>{song.movie || 'Arijit Singh'}</span>
                        {song.category && (
                          <>
                            <span className="text-white/20">•</span>
                            <span className="text-amber-200/50 uppercase text-[9px] px-1.5 py-0.2 bg-amber-500/10 rounded border border-amber-500/20">
                              {song.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Duration & Actions */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                    <span className="font-mono-space text-xs text-white/40">
                      {song.duration}
                    </span>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => toggleFavorite(song.id, e)}
                      className={`p-1.5 rounded-lg transition ${
                        isFav ? 'text-rose-400 hover:text-rose-300' : 'text-white/30 hover:text-white/70'
                      }`}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400' : ''}`} />
                    </button>

                    {/* Save to Google Drive */}
                    {onSaveToDrive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSaveToDrive(song);
                          setCopiedId(song.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="p-1.5 rounded-lg text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/10 transition"
                        title="Save song memory to Google Drive"
                      >
                        <FolderDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#14100c] border-t border-white/10 flex items-center justify-between text-xs font-mono-space text-white/50">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-amber-400" />
            <span>Select any track to tune the radio instantly</span>
          </div>
          <button
            onClick={() => {
              if (filteredSongs.length > 0) {
                handleSelectSong(filteredSongs[0]);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-amber-300" />
            Play Playlist
          </button>
        </div>
      </div>
    </div>
  );
};
