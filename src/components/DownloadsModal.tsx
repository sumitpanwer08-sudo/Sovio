import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  FolderDown,
  Trash2,
  Play,
  Pause,
  HardDrive,
  Music,
  CheckCircle2,
  X,
  Upload,
  Search,
  RefreshCw,
  Sparkles,
  Smartphone,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { SongItem } from '../types';
import {
  getAllDownloadedSongs,
  DownloadedSong,
  deleteDownloadedSong,
  clearAllDownloadedSongs,
  getOfflineStorageUsage,
  downloadSongToDevice,
  saveLocalAudioFileAsSong
} from '../services/offlineStorageService';
import { soundscapeEngine } from '../services/soundscapeEngine';

interface DownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSongId?: string;
  isPlaying: boolean;
  onPlaySong: (song: SongItem) => void;
}

export const DownloadsModal: React.FC<DownloadsModalProps> = ({
  isOpen,
  onClose,
  currentSongId,
  isPlaying,
  onPlaySong
}) => {
  const [downloadedSongs, setDownloadedSongs] = useState<DownloadedSong[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [storageInfo, setStorageInfo] = useState<{ count: number; totalMB: number }>({ count: 0, totalMB: 0 });
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load downloaded songs and storage metrics
  const loadData = async () => {
    setLoading(true);
    try {
      const [songs, storage] = await Promise.all([
        getAllDownloadedSongs(),
        getOfflineStorageUsage()
      ]);
      setDownloadedSongs(songs);
      setStorageInfo(storage);
    } catch (err) {
      console.error('Error loading downloaded songs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Filter downloaded songs by title or artist
  const filtered = downloadedSongs.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const t = (item.song.title || '').toLowerCase();
    const a = (item.song.artist || '').toLowerCase();
    const m = (item.song.movie || '').toLowerCase();
    return t.includes(q) || a.includes(q) || m.includes(q);
  });

  // Handle Play
  const handlePlay = (item: DownloadedSong) => {
    soundscapeEngine.playButtonClick();
    const playableSong: SongItem = {
      ...item.song,
      audioFileUrl: item.audioUrl || item.song.audioFileUrl,
      isOffline: true
    };
    onPlaySong(playableSong);
  };

  // Handle Export / Save to Device
  const handleSaveToDevice = async (item: DownloadedSong) => {
    setExportingId(item.id);
    soundscapeEngine.playButtonClick();
    try {
      const playableSong: SongItem = {
        ...item.song,
        audioFileUrl: item.audioUrl || item.song.audioFileUrl
      };
      await downloadSongToDevice(playableSong);
      setSuccessToast(`"${item.song.title}" saved to device downloads!`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      console.error('Failed to export to device:', err);
    } finally {
      setExportingId(null);
    }
  };

  // Handle Delete Single Song
  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundscapeEngine.playButtonClick();
    await deleteDownloadedSong(id);
    await loadData();
    setSuccessToast(`Removed "${title}" from offline downloads`);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Handle Clear All
  const handleClearAll = async () => {
    soundscapeEngine.playButtonClick();
    await clearAllDownloadedSongs();
    setShowClearConfirm(false);
    await loadData();
    setSuccessToast('All downloaded tracks cleared');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Handle Import Local Audio File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    soundscapeEngine.playButtonClick();
    setLoading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await saveLocalAudioFileAsSong(file, {
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Device Audio',
          movie: 'Imported Library'
        });
      }
      await loadData();
      setSuccessToast(`Successfully imported ${files.length} audio file(s) into offline library!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error('File import error:', err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-b from-[#18201a] via-[#101412] to-[#0a0d0c] border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Hidden File Input for Device Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.flac,.ogg"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black font-bold shadow-lg shadow-emerald-900/30">
              <Download className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-garamond text-xl sm:text-2xl font-bold tracking-wide text-white flex items-center gap-2">
                <span>Downloaded Songs & Offline Library</span>
                <span className="text-[10px] font-mono-space px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <WifiOff className="w-3 h-3 text-emerald-400" />
                  <span>100% Offline Ready</span>
                </span>
              </h2>
              <p className="font-mono-space text-xs text-white/60">
                Play stored songs anytime without internet or save directly to phone storage
              </p>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl font-mono-space text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition cursor-pointer flex items-center gap-1.5"
              title="Import audio files from your device storage"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import Local Audio</span>
            </button>

            <button
              onClick={() => {
                soundscapeEngine.playButtonClick();
                onClose();
              }}
              className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Storage Summary & Search Bar */}
        <div className="p-3 sm:p-4 bg-black/30 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          {/* Storage Stats */}
          <div className="flex items-center gap-3 font-mono-space text-xs text-white/70">
            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Offline Songs: <strong className="text-emerald-300">{storageInfo.count}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <span>Storage Used: <strong className="text-amber-300">{storageInfo.totalMB} MB</strong></span>
            </div>
          </div>

          {/* Clear All Action */}
          {downloadedSongs.length > 0 && (
            <div>
              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-300 font-mono-space">Delete all?</span>
                  <button
                    onClick={handleClearAll}
                    className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-mono-space text-[10px] transition cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 rounded bg-white/10 text-white/70 font-mono-space text-[10px] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-2.5 py-1 rounded-lg text-white/40 hover:text-red-400 text-xs font-mono-space transition flex items-center gap-1 cursor-pointer"
                  title="Clear all stored songs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search downloaded songs by title or artist..."
              className="w-full bg-[#121815] border border-emerald-500/20 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="mx-4 mt-2 p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-emerald-200 text-xs font-mono-space animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Main List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-white/50">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="font-mono-space text-xs">Loading offline library...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-garamond text-lg font-bold text-white mb-1">
                {searchQuery ? 'No matching downloaded songs found' : 'No Downloaded Songs Yet'}
              </h3>
              <p className="font-mono-space text-xs text-white/50 max-w-md mb-4">
                {searchQuery
                  ? 'Try a different search query or clear the filter.'
                  : 'You can download any song from the JioSaavn catalog or PlayerBar to listen offline anytime without internet!'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono-space transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Local Audio Files</span>
                </button>
              </div>
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = currentSongId === item.id;
              const sizeMB = (item.sizeBytes / (1024 * 1024)).toFixed(1);

              return (
                <div
                  key={item.id}
                  onClick={() => handlePlay(item)}
                  className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                      : 'bg-[#121915]/70 hover:bg-[#18221c] border-white/10 hover:border-emerald-500/30'
                  }`}
                >
                  {/* Left: Play Icon & Thumbnail / Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center relative group-hover:border-emerald-400/50">
                      {item.song.imageUrl ? (
                        <img
                          src={item.song.imageUrl}
                          alt={item.song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-5 h-5 text-emerald-400/70" />
                      )}

                      {isSelected && isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-garamond text-base font-bold text-white truncate group-hover:text-emerald-300 transition">
                          {item.song.title}
                        </h4>
                        <span className="text-[9px] font-mono-space px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                          Offline
                        </span>
                      </div>
                      <p className="font-mono-space text-xs text-white/60 truncate">
                        {item.song.artist || 'Pahadi Artist'} • {item.song.movie || 'Melodies'}
                      </p>
                    </div>
                  </div>

                  {/* Right: File Size & Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono-space text-white/40 hidden sm:inline">
                      {sizeMB} MB
                    </span>

                    {/* Play Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(item);
                      }}
                      className="p-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black transition cursor-pointer"
                      title={isSelected && isPlaying ? 'Playing' : 'Play Offline'}
                    >
                      {isSelected && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>

                    {/* Save to Device (.m4a/.mp3) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveToDevice(item);
                      }}
                      className="p-2 rounded-full bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition cursor-pointer relative"
                      title="Save / Export audio file directly to phone/PC storage"
                    >
                      <FolderDown className={`w-4 h-4 ${exportingId === item.id ? 'animate-bounce' : ''}`} />
                    </button>

                    {/* Delete from Offline Cache */}
                    <button
                      onClick={(e) => handleDelete(item.id, item.song.title, e)}
                      className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition cursor-pointer"
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

        {/* Footer info */}
        <div className="p-3 bg-black/50 border-t border-white/10 flex items-center justify-between text-[11px] font-mono-space text-white/50 px-5">
          <span>🎧 High-fidelity 320kbps offline audio caching</span>
          <span>SOVIO OFFLINE ENGINE</span>
        </div>
      </div>
    </div>
  );
};
