import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  CheckCircle2,
  HardDrive,
  Trash2,
  Play,
  Pause,
  Upload,
  Music,
  FolderDown,
  Sparkles,
  X,
  FileAudio,
  Radio,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { SongItem } from '../types';
import {
  getAllDownloadedSongs,
  downloadSongForOffline,
  deleteDownloadedSong,
  saveLocalAudioFileAsSong,
  triggerBrowserFileDownload,
  DownloadedSong
} from '../services/offlineStorageService';

interface OfflineSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSongId?: string;
  isPlaying: boolean;
  onPlaySong: (song: SongItem) => void;
}

export const OfflineSongsModal: React.FC<OfflineSongsModalProps> = ({
  isOpen,
  onClose,
  currentSongId,
  isPlaying,
  onPlaySong
}) => {
  const [downloadedSongs, setDownloadedSongs] = useState<DownloadedSong[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadOfflineSongs = async () => {
    setIsLoading(true);
    try {
      const items = await getAllDownloadedSongs();
      setDownloadedSongs(items);
    } catch (e: any) {
      console.error('Failed to load offline songs:', e?.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOfflineSongs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await deleteDownloadedSong(id);
    if (ok) {
      setDownloadedSongs((prev) => prev.filter((s) => s.id !== id));
      showStatus(`Removed "${title}" from offline storage`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await saveLocalAudioFileAsSong(file);
      }
      showStatus(`Imported ${files.length} audio file(s) into offline library!`);
      await loadOfflineSongs();
    } catch (err: any) {
      console.error('File import error:', err?.message || String(err));
      showStatus('Error saving audio file for offline play');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportFile = (item: DownloadedSong, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerBrowserFileDownload(item.song, item.blob);
    showStatus(`Downloading "${item.song.title}" audio file to your device!`);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalStorageUsed = downloadedSongs.reduce((sum, s) => sum + (s.sizeBytes || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-[#171410] border border-amber-500/30 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#221a13] via-[#1a140f] to-[#14100c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-garamond text-xl font-bold text-white tracking-wide flex items-center gap-2">
                Offline Songs Vault
                <span className="font-mono-space text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  {downloadedSongs.length} Ready Offline
                </span>
              </h2>
              <p className="font-mono-space text-xs text-amber-200/60 tracking-wider">
                Play in mountains without internet & download to your device
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition p-2 rounded-xl hover:bg-white/10 cursor-pointer"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner */}
        {statusMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-6 py-2 flex items-center gap-2 text-emerald-300 font-mono-space text-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Quick Storage Info & Upload Action Bar */}
        <div className="px-6 py-3 bg-[#1e1711]/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-space">
          <div className="flex items-center gap-3 text-white/60">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Storage Used:</span>
              <strong className="text-amber-300">{formatBytes(totalStorageUsed)}</strong>
            </span>
          </div>

          {/* Import MP3/WAV/Audio Files */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
              title="Upload your MP3, WAV or song files from device"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Importing...' : 'Import Device Audio'}</span>
            </button>
          </div>
        </div>

        {/* Songs List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2.5 bg-[#14110d]">
          {isLoading ? (
            <div className="text-center py-12 text-white/40 font-mono-space text-xs">
              Loading offline vault...
            </div>
          ) : downloadedSongs.length === 0 ? (
            <div className="text-center py-12 space-y-3 font-mono-space">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white">No Offline Songs Yet</h4>
              <p className="text-white/40 text-xs max-w-sm mx-auto">
                Open the Song Search menu and tap <Download className="w-3 h-3 inline text-amber-400 mx-1" /> to download any song for offline mountain journeys, or upload your own audio files above!
              </p>
            </div>
          ) : (
            downloadedSongs.map((item) => {
              const song = item.song;
              const isSelected = currentSongId === song.id;

              return (
                <div
                  key={item.id}
                  onClick={() => onPlaySong(song)}
                  className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/15'
                  }`}
                >
                  {/* Left: Play Icon & Metadata */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                          : 'bg-black/50 border-white/10 text-white/40 group-hover:border-amber-500/40 group-hover:text-amber-300'
                      }`}
                    >
                      {isSelected ? (
                        isPlaying ? (
                          <div className="flex items-end gap-0.5 h-3.5">
                            <div className="w-0.5 bg-amber-400 h-2.5 animate-pulse" />
                            <div
                              className="w-0.5 bg-amber-400 h-3.5 animate-pulse"
                              style={{ animationDelay: '150ms' }}
                            />
                            <div
                              className="w-0.5 bg-amber-400 h-2 animate-pulse"
                              style={{ animationDelay: '300ms' }}
                            />
                          </div>
                        ) : (
                          <Pause className="w-4 h-4 fill-current text-amber-400" />
                        )
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5 text-white/70 group-hover:text-amber-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-medium text-sm truncate ${
                            isSelected ? 'text-amber-300 font-semibold' : 'text-white'
                          }`}
                        >
                          {song.title}
                        </span>
                        <span className="font-mono-space text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Offline Ready
                        </span>
                      </div>
                      <div className="font-mono-space text-[11px] text-white/50 truncate flex items-center gap-2 mt-0.5">
                        <span className="text-amber-200/70">{song.artist || 'Singer'}</span>
                        {song.movie && (
                          <>
                            <span className="text-white/20">•</span>
                            <span className="truncate">{song.movie}</span>
                          </>
                        )}
                        <span className="text-white/20">•</span>
                        <span className="text-white/40">{formatBytes(item.sizeBytes)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {/* Download File to PC/Phone */}
                    <button
                      onClick={(e) => handleExportFile(item, e)}
                      className="p-2 rounded-lg text-white/40 hover:text-amber-300 hover:bg-amber-500/10 transition cursor-pointer"
                      title="Save/Download audio file to your device (.wav/.mp3)"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Delete offline song */}
                    <button
                      onClick={(e) => handleDelete(item.id, song.title, e)}
                      className="p-2 rounded-lg text-rose-400/40 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
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

        {/* Footer */}
        <div className="px-6 py-3 bg-[#14100c] border-t border-white/10 flex items-center justify-between text-xs font-mono-space text-white/50">
          <span>Plays seamlessly in offline valleys & remote trails</span>
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
