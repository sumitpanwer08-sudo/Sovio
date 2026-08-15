import React, { useState, useEffect } from 'react';
import { X, HardDrive, FolderDown, Save, RefreshCw, CheckCircle, PlusCircle, Calendar, MapPin, Tag, Lock } from 'lucide-react';
import { requestDriveAccess, saveMemoryToDrive, fetchMemoriesFromDrive, getStoredToken } from '../services/driveService';
import { PahadiMemory } from '../types';

interface DriveMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onTokenReceived: (token: string) => void;
}

export const DriveMemoryModal: React.FC<DriveMemoryModalProps> = ({
  isOpen,
  onClose,
  token,
  onTokenReceived
}) => {
  const [memories, setMemories] = useState<PahadiMemory[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isLoadingMemories, setIsLoadingMemories] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Form State
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [location, setLocation] = useState<string>('Shimla, HP');
  const [tagsInput, setTagsInput] = useState<string>('Chai, Rain, HRTC');

  useEffect(() => {
    if (isOpen && token) {
      loadMemories(token);
    }
  }, [isOpen, token]);

  const handleConnect = () => {
    setIsConnecting(true);
    requestDriveAccess(
      (newToken) => {
        setIsConnecting(false);
        onTokenReceived(newToken);
        setStatusMessage('Connected to Google Drive!');
        loadMemories(newToken);
      },
      (err) => {
        setIsConnecting(false);
        setStatusMessage('Failed to connect to Google Drive.');
      }
    );
  };

  const loadMemories = async (currentToken: string) => {
    setIsLoadingMemories(true);
    try {
      const data = await fetchMemoriesFromDrive(currentToken);
      setMemories(data);
    } catch (err: any) {
      console.error('Failed to load drive memories:', err?.message || String(err));
    } finally {
      setIsLoadingMemories(false);
    }
  };

  const handleSaveMemory = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please provide both a title and memory log content.');
      return;
    }

    if (!token) {
      handleConnect();
      return;
    }

    setIsSaving(true);
    setStatusMessage('');

    try {
      const tagsArray = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      await saveMemoryToDrive(token, {
        title,
        content,
        location,
        tags: tagsArray
      });

      setStatusMessage('Memory successfully saved to Google Drive!');
      setTitle('');
      setContent('');
      loadMemories(token);
    } catch (err: any) {
      console.error('Save error:', err?.message || String(err));
      setStatusMessage(`Error: ${err?.message || 'Failed to save'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#121815] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-garamond text-2xl font-semibold text-emerald-300">
                Google Drive — Pahadi Memory Box
              </h2>
              <p className="font-mono-space text-[10px] text-white/50 tracking-wider">
                SYNC TRAVEL JOURNALS & NOSTALGIA LOGS TO GOOGLE DRIVE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drive Authorization Banner */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl mb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono-space text-emerald-200">
            {token ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Connected to Google Drive (Folder: Sovio_Pahadi_Memories)</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Connect your Google Account to save notes to your Drive</span>
              </>
            )}
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg font-mono-space text-[10px] transition cursor-pointer"
          >
            {isConnecting ? 'Connecting...' : token ? 'Re-authenticate' : 'Connect Google Drive'}
          </button>
        </div>

        {statusMessage && (
          <div className="mb-3 text-xs font-mono-space text-amber-300 px-3 py-1.5 bg-amber-500/10 rounded border border-amber-500/20">
            {statusMessage}
          </div>
        )}

        {/* Scrollable Form & Existing Memories */}
        <div className="overflow-y-auto pr-1 space-y-6 flex-1">
          {/* Create New Memory Form */}
          <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3 font-mono-space text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
              <PlusCircle className="w-4 h-4" />
              <span>Log a New Pahadi Memory</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-white/60 mb-1">Title / Caption</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Evening tea at Kasol riverbank"
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-white/60 mb-1">Mountain Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kasol, HP"
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-white/60 mb-1">Memory / Journal Entry</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                placeholder="Write your Pahadi travel memories, feelings, radio songs heard, or story..."
                className="w-full bg-black/50 border border-white/15 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-400 font-garamond text-base"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Tags: Chai, Rain, HRTC"
                className="w-1/2 bg-black/50 border border-white/15 rounded-lg px-3 py-1 text-[10px] text-white"
              />

              <button
                onClick={handleSaveMemory}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save to Drive'}</span>
              </button>
            </div>
          </div>

          {/* Sync / Saved Memories List */}
          <div>
            <div className="flex items-center justify-between mb-3 font-mono-space text-xs">
              <span className="text-emerald-300 font-bold uppercase tracking-wider">
                Saved Drive Memories ({memories.length})
              </span>
              <button
                onClick={() => token && loadMemories(token)}
                className="text-[10px] text-white/60 hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingMemories ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>

            {isLoadingMemories ? (
              <div className="text-center py-6 font-mono-space text-xs text-white/50">
                Fetching memories from Google Drive...
              </div>
            ) : memories.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-white/10 rounded-xl font-mono-space text-xs text-white/40">
                No saved memory logs found in Google Drive yet.
              </div>
            ) : (
              <div className="space-y-3">
                {memories.map((mem, i) => (
                  <div
                    key={mem.id || i}
                    className="p-4 bg-black/30 border border-white/10 rounded-xl space-y-1 hover:border-emerald-500/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-amber-200 text-sm font-mono-space">
                        {mem.title}
                      </h4>
                      <span className="text-[10px] text-white/40 font-mono-space flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {mem.location || 'Himachal'}
                      </span>
                    </div>
                    <p className="font-garamond italic text-white/80 text-sm py-1">
                      "{mem.content}"
                    </p>
                    {mem.timestamp && (
                      <div className="text-[9px] font-mono-space text-white/40 pt-1 border-t border-white/5">
                        Logged: {new Date(mem.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
