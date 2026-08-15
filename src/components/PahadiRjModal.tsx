import React, { useState } from 'react';
import { X, Sparkles, Radio, BookOpen, Utensils, MessageSquare, Loader2, Volume2 } from 'lucide-react';

interface PahadiRjModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetQuote: (quote: string) => void;
}

export const PahadiRjModal: React.FC<PahadiRjModalProps> = ({
  isOpen,
  onClose,
  onSetQuote
}) => {
  const [activeTab, setActiveTab] = useState<'announcement' | 'story' | 'recipe' | 'custom'>('announcement');
  const [topicInput, setTopicInput] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('Shimla');
  const [broadcastText, setBroadcastText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async (type: string | any) => {
    setIsLoading(true);
    setBroadcastText('');

    const safeType = typeof type === 'string' ? type : 'announcement';
    const safeTopic = typeof topicInput === 'string' ? topicInput.trim() : 'snowfall in pine forests';
    const safeLocation = typeof locationInput === 'string' ? locationInput.trim() : 'Shimla';

    try {
      const res = await fetch('/api/gemini/pahadi-rj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: safeType,
          topic: safeTopic || 'snowfall in pine forests',
          location: safeLocation || 'Shimla'
        })
      });

      const data = await res.json();
      const text = typeof data?.text === 'string' ? data.text : 'Pahadon ki thandi dhoop jaisa sukoon...';
      setBroadcastText(text);
      if (safeType === 'quote') {
        onSetQuote(text);
      }
    } catch (err: any) {
      console.error('Failed to fetch Pahadi RJ commentary:', err?.message || String(err));
      setBroadcastText('"Pahadon ki thandi dhoop jaisa sukoon..." (Station static signal)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#141a16] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400" />
            <h2 className="font-garamond text-2xl font-semibold text-amber-200">
              Kaka Ji — AI Pahadi RJ Studio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="font-mono-space text-xs text-white/60 mb-4">
          Broadcast live Pahadi announcements, mountain legends, and nostalgic quotes powered by Gemini AI.
        </p>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mb-4 font-mono-space text-[10px]">
          <button
            onClick={() => setActiveTab('announcement')}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'announcement'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-black/30 text-white/60 border-white/10 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Radio Announcement</span>
          </button>

          <button
            onClick={() => setActiveTab('story')}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'story'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-black/30 text-white/60 border-white/10 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pahadi Legend</span>
          </button>

          <button
            onClick={() => setActiveTab('recipe')}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'recipe'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-black/30 text-white/60 border-white/10 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Pahadi Recipe</span>
          </button>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3 mb-4 font-mono-space text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-amber-300/80 mb-1 uppercase">Location / Station</label>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
                placeholder="e.g. Manali, Kasol, Almora"
              />
            </div>

            <div>
              <label className="block text-[10px] text-amber-300/80 mb-1 uppercase">Topic / Details</label>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
                placeholder="e.g. First snowfall, Siddu, Chai"
              />
            </div>
          </div>

          <button
            onClick={() => handleGenerate(activeTab)}
            disabled={isLoading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 text-black font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Kaka Ji is Tuning In...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Broadcast Commentary</span>
              </>
            )}
          </button>
        </div>

        {/* Output Commentary Box */}
        {broadcastText && (
          <div className="p-4 bg-black/60 border border-amber-500/30 rounded-xl relative">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="font-mono-space text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                ON-AIR BROADCAST:
              </span>
              <button
                onClick={() => {
                  onSetQuote(broadcastText);
                  onClose();
                }}
                className="text-[9px] font-mono-space text-amber-300 hover:text-white underline cursor-pointer"
              >
                Set as Radio Display Quote
              </button>
            </div>
            <p className="font-garamond italic text-lg text-white/90 leading-relaxed">
              "{broadcastText}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
