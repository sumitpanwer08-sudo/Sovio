import React from 'react';
import { X, CloudRain, Wind, Flame, Waves, Bus, Volume2, VolumeX } from 'lucide-react';
import { AmbientSound } from '../types';

interface AmbientMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sounds: AmbientSound[];
  onSoundChange: (id: string, volume: number, isPlaying: boolean) => void;
}

export const AmbientMixerModal: React.FC<AmbientMixerModalProps> = ({
  isOpen,
  onClose,
  sounds,
  onSoundChange
}) => {
  if (!isOpen) return null;

  const getIcon = (id: string) => {
    switch (id) {
      case 'rain': return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'wind': return <Wind className="w-5 h-5 text-cyan-300" />;
      case 'bonfire': return <Flame className="w-5 h-5 text-amber-500" />;
      case 'stream': return <Waves className="w-5 h-5 text-teal-300" />;
      case 'hrtc': return <Bus className="w-5 h-5 text-red-400" />;
      default: return <Volume2 className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#121815] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div>
            <h2 className="font-garamond text-2xl font-semibold text-amber-200">
              Mountain Soundscape Layer Mixer
            </h2>
            <p className="font-mono-space text-[10px] text-white/50 tracking-wider">
              LAYER AMBIENT NATURE NOISE WITH YOUR RADIO
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sound Controls List */}
        <div className="space-y-5">
          {sounds.map((snd) => (
            <div
              key={snd.id}
              className="p-3.5 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-2 hover:border-amber-500/30 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getIcon(snd.id)}
                  <span className="font-mono-space text-xs tracking-wider font-medium text-white/90">
                    {snd.name}
                  </span>
                </div>

                <button
                  onClick={() => onSoundChange(snd.id, snd.volume, !snd.isPlaying)}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono-space tracking-wider transition cursor-pointer border ${
                    snd.isPlaying
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
                  }`}
                >
                  {snd.isPlaying ? 'ACTIVE' : 'MUTED'}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => onSoundChange(snd.id, 0, false)}
                  className="text-white/40 hover:text-white transition cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={snd.isPlaying ? snd.volume : 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onSoundChange(snd.id, val, val > 0);
                  }}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center font-mono-space text-[10px] text-white/40">
          🔊 Synthesized real-time using Web Audio API
        </div>
      </div>
    </div>
  );
};
