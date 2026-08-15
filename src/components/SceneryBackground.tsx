import React, { useEffect, useState } from 'react';
import { AtmosphereMode, HrtcTicket } from '../types';
import { Sparkles, Sun, Moon, CloudFog, Sunset, Compass, Clock } from 'lucide-react';

interface SceneryBackgroundProps {
  atmosphere: AtmosphereMode;
  currentTicket: HrtcTicket;
  onTicketClick: () => void;
  onOpenMoodScheduler?: () => void;
  isAutoSync?: boolean;
}

export const SceneryBackground: React.FC<SceneryBackgroundProps> = ({
  atmosphere,
  currentTicket,
  onTicketClick,
  onOpenMoodScheduler,
  isAutoSync = true
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      for (let i = 0; i < 5; i++) {
        createParticle(e.clientX, e.clientY);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const createParticle = (x: number, y: number) => {
    const p = document.createElement('div');
    p.className = 'snow-particle';
    const size = Math.random() * 4 + 2 + 'px';
    p.style.width = size;
    p.style.height = size;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.opacity = Math.random().toString();

    const destinationX = (Math.random() - 0.5) * 160;
    const duration = Math.random() * 1800 + 900;

    p.animate(
      [
        { transform: 'translate(0, 0)', opacity: 1 },
        { transform: `translate(${destinationX}px, 100vh)`, opacity: 0 }
      ],
      {
        duration: duration,
        easing: 'cubic-bezier(0, .9, .57, 1)'
      }
    );

    document.body.appendChild(p);
    setTimeout(() => p.remove(), duration);
  };

  // Background filter & scenery wallpaper depending on atmosphere
  let filterStyle = 'grayscale(15%) contrast(110%)';
  let overlayGradient = 'linear-gradient(to bottom, rgba(10,15,13,0.7), rgba(10,15,13,0.92))';
  let bgImageUrl =
    'https://images.unsplash.com/photo-1544239649-4238bf7bd7d5?q=80&w=2070&auto=format&fit=crop'; // Misty pine valley

  if (atmosphere === 'sunset') {
    filterStyle = 'contrast(115%) sepia(25%) saturate(120%)';
    overlayGradient =
      'linear-gradient(to bottom, rgba(40,15,18,0.62), rgba(12,8,14,0.92))';
    bgImageUrl =
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop'; // Golden sunset valley
  } else if (atmosphere === 'night') {
    filterStyle = 'brightness(65%) contrast(125%)';
    overlayGradient =
      'linear-gradient(to bottom, rgba(4,7,12,0.85), rgba(4,7,12,0.98))';
    bgImageUrl =
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop'; // Starlit mountain peaks
  } else if (atmosphere === 'snow') {
    filterStyle = 'brightness(95%) contrast(105%) saturate(105%)';
    overlayGradient =
      'linear-gradient(to bottom, rgba(18,24,30,0.55), rgba(10,15,13,0.88))';
    bgImageUrl =
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop'; // Snow-capped Himalayan passes
  }

  const getAtmoIcon = () => {
    switch (atmosphere) {
      case 'sunset':
        return <Sunset className="w-3.5 h-3.5 text-orange-400" />;
      case 'snow':
        return <Sun className="w-3.5 h-3.5 text-sky-400" />;
      case 'night':
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      case 'mist':
      default:
        return <CloudFog className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <>
      {/* High-Resolution Mountain Scenery */}
      <div
        className="fixed inset-0 z-[-2] bg-cover bg-center transition-all duration-1000 pointer-events-none"
        style={{
          backgroundImage: `${overlayGradient}, url('${bgImageUrl}')`,
          filter: filterStyle
        }}
      />

      {/* Drifting Mist / Fog Layer */}
      <div
        className="fixed inset-0 z-[-1] pointer-events-none opacity-25 animate-mist"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/fog.png')",
          backgroundRepeat: 'repeat'
        }}
      />

      {/* Atmospheric Mode & Mood Scheduler Badge (Top Center) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={onOpenMoodScheduler}
          className="px-4 py-1.5 bg-[#0a0f0d]/80 hover:bg-[#141e1a]/90 border border-amber-500/30 hover:border-amber-400/60 rounded-full backdrop-blur-xl text-xs font-mono-space tracking-widest text-amber-200/90 transition flex items-center gap-2 cursor-pointer shadow-[0_10px_25px_rgba(0,0,0,0.6)] group"
          title="Open Mood Scheduler (Auto-syncs scenery with local time)"
        >
          {getAtmoIcon()}
          <span className="font-semibold text-white group-hover:text-amber-300">
            ATMOSPHERE: {atmosphere.toUpperCase()}
          </span>
          <span className="text-white/30">•</span>
          <span className="text-amber-300/80 text-[11px] hidden sm:inline">{timeStr}</span>
          {isAutoSync && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
          )}
        </button>
      </div>

      {/* Vintage Top-Left Status Tag */}
      <div className="fixed top-5 left-5 z-10 hidden sm:block font-mono-space text-[10px] p-3 border border-amber-500/20 bg-black/40 backdrop-blur-xl text-white/80 leading-relaxed rounded-xl shadow-lg">
        <div className="text-amber-400 font-bold mb-0.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>STATUS: IN TRANSIT</span>
        </div>
        <div className="text-white/70">
          ROUTE: {currentTicket.origin.toUpperCase()} → {currentTicket.destination.toUpperCase()}
        </div>
        <div className="text-white/50">BUS: {currentTicket.busNo || 'HP-65-A-1994'}</div>
        <div className="text-white/50">TEMP: {currentTicket.temperature}</div>
      </div>

      {/* Vintage Top-Right HRTC Ticket Tag */}
      <button
        onClick={onTicketClick}
        className="fixed top-5 right-5 z-10 hidden sm:block font-mono-space text-[10px] p-3 border border-amber-500/20 bg-black/40 backdrop-blur-xl text-white/80 text-right leading-relaxed hover:border-amber-500/60 transition cursor-pointer group rounded-xl shadow-lg"
      >
        <div className="text-amber-400 font-bold mb-0.5 group-hover:text-amber-300">
          HRTC TICKET: #{currentTicket.ticketNumber} 🎫
        </div>
        <div className="italic text-white/80 font-garamond text-xs">"Safar Khubsurat Hai"</div>
        <div className="text-white/40 text-[9px]">EST. 1994 • CLICK TO VIEW</div>
      </button>
    </>
  );
};
