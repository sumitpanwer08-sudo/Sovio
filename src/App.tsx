import React, { useState, useEffect, useRef } from 'react';
import { TopNavHeader } from './components/TopNavHeader';
import { ProfessionalMusicDashboard } from './components/ProfessionalMusicDashboard';
import { VintageRadio } from './components/VintageRadio';
import { PlayerBar } from './components/PlayerBar';
import { AmbientMixerModal } from './components/AmbientMixerModal';
import { HrtcTicketModal } from './components/HrtcTicketModal';
import { PahadiRjModal } from './components/PahadiRjModal';
import { SceneryBackground } from './components/SceneryBackground';
import { DriveMemoryModal } from './components/DriveMemoryModal';
import { SongSearchModal } from './components/SongSearchModal';
import { SongTimeAdjustModal } from './components/SongTimeAdjustModal';
import { LyricsOverlay } from './components/LyricsOverlay';
import { MoodSchedulerModal, getMoodInfoForTime } from './components/MoodSchedulerModal';
import { DownloadsModal } from './components/DownloadsModal';
import {
  RADIO_STATIONS,
  PAHADI_QUOTES,
  ALL_SONGS_CATALOG
} from './data/pahadiData';
import {
  RadioStation,
  HrtcTicket,
  AmbientSound,
  AtmosphereMode,
  TrackInfo,
  SongItem
} from './types';
import { soundscapeEngine } from './services/soundscapeEngine';
import { getStoredToken, saveMemoryToDrive } from './services/driveService';
import { getJioSaavnTrending, getJioSaavnStreamCandidates, deduplicateSongs } from './services/jiosaavnService';
import {
  downloadSongForOffline,
  downloadSongToDevice,
  isSongDownloaded
} from './services/offlineStorageService';
import { webAudioVisualizerService } from './services/webAudioVisualizer';
import {
  startBackgroundAudioKeepAlive,
  pauseBackgroundAudioKeepAlive,
  updateMediaSession,
  toggleScreenWakeLock
} from './services/backgroundPlayService';

export function App() {
  // Main radio player state
  const [currentStation, setCurrentStation] = useState<RadioStation>(RADIO_STATIONS[0]);
  const [currentPlaylist, setCurrentPlaylist] = useState<SongItem[]>(RADIO_STATIONS[0].songs || ALL_SONGS_CATALOG);
  const [currentSong, setCurrentSong] = useState<SongItem | null>(RADIO_STATIONS[0].songs[0] || ALL_SONGS_CATALOG[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [keepScreenAwake, setKeepScreenAwake] = useState<boolean>(false);
  const [currentQuote, setCurrentQuote] = useState<string>(PAHADI_QUOTES[0]);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [trackInfo, setTrackInfo] = useState<TrackInfo>({
    title: `${RADIO_STATIONS[0].songs[0]?.title || 'JioSaavn Stream'} • ${RADIO_STATIONS[0].songs[0]?.artist || 'JioSaavn HD'}`,
    author: RADIO_STATIONS[0].songs[0]?.artist || 'JioSaavn HD'
  });
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  // YouTube Player Ref & Pending Song Queue Ref & HTML5 Audio Ref
  const playerRef = useRef<any>(null);
  const pendingSongRef = useRef<SongItem | null>(null);
  const html5AudioRef = useRef<HTMLAudioElement | null>(null);
  const errorRetryCountRef = useRef<number>(0);
  const streamCandidatesRef = useRef<string[]>([]);
  const streamCandidateIndexRef = useRef<number>(0);

  // Auto-recovery notice banner
  const [playbackNotice, setPlaybackNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<any>(null);

  const showPlaybackNotice = (msg: string) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setPlaybackNotice(msg);
    noticeTimerRef.current = setTimeout(() => {
      setPlaybackNotice(null);
    }, 4500);
  };
  
  // Top Nav active tab state
  const [activeTab, setActiveTab] = useState<'stations' | 'discover' | 'downloads' | 'soundscape' | 'ticket'>('stations');

  // Mood & Atmosphere state (defaults to current time of day)
  const [atmosphere, setAtmosphere] = useState<AtmosphereMode>(() => getMoodInfoForTime().atmosphere);
  const [isAutoSyncAtmosphere, setIsAutoSyncAtmosphere] = useState<boolean>(true);

  // Modals state
  const [isMoodSchedulerOpen, setIsMoodSchedulerOpen] = useState<boolean>(false);
  const [isMixerOpen, setIsMixerOpen] = useState<boolean>(false);
  const [isTicketOpen, setIsTicketOpen] = useState<boolean>(false);
  const [isRjOpen, setIsRjOpen] = useState<boolean>(false);
  const [isDriveOpen, setIsDriveOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isTimeAdjustOpen, setIsTimeAdjustOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState<boolean>(false);
  const [isDownloadingCurrent, setIsDownloadingCurrent] = useState<boolean>(false);
  const [isCurrentDownloaded, setIsCurrentDownloaded] = useState<boolean>(false);

  // Check if current song is already downloaded
  useEffect(() => {
    let isMounted = true;
    if (currentSong?.id) {
      isSongDownloaded(currentSong.id).then((downloaded) => {
        if (isMounted) setIsCurrentDownloaded(downloaded);
      });
    } else {
      setIsCurrentDownloaded(false);
    }
    return () => {
      isMounted = false;
    };
  }, [currentSong?.id]);

  // Google Drive token
  const [driveToken, setDriveToken] = useState<string | null>(getStoredToken());

  // Ticket state
  const [ticket, setTicket] = useState<HrtcTicket>({
    ticketNumber: '99281',
    passengerName: 'Traveller',
    route: 'Shimla → Manali',
    origin: 'Shimla',
    destination: 'Manali',
    fare: '₹340',
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    seatNo: '14',
    temperature: '7°C',
    busNo: 'HP 63 A 9928'
  });

  // Ambient soundscape layers
  const [ambientSounds, setAmbientSounds] = useState<AmbientSound[]>([
    { id: 'rain', name: 'Rain on Tin Roof', icon: 'CloudRain', volume: 0.3, isPlaying: false },
    { id: 'wind', name: 'Deodar Pine Wind', icon: 'Wind', volume: 0.3, isPlaying: false },
    { id: 'bonfire', name: 'Evening Bonfire Crackle', icon: 'Flame', volume: 0.3, isPlaying: false },
    { id: 'stream', name: 'Mountain River Stream', icon: 'Waves', volume: 0.3, isPlaying: false },
    { id: 'hrtc', name: 'HRTC Engine Hum', icon: 'Bus', volume: 0.3, isPlaying: false }
  ]);

  // Android Hardware Back Navigation Integration
  const isAnyModalOpen =
    isSearchOpen ||
    isMixerOpen ||
    isTicketOpen ||
    isMoodSchedulerOpen ||
    isLyricsOpen ||
    isDriveOpen ||
    isTimeAdjustOpen ||
    isRjOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
      window.history.pushState({ modal: true }, '');
    }

    const handlePopState = () => {
      if (isSearchOpen) setIsSearchOpen(false);
      else if (isMixerOpen) setIsMixerOpen(false);
      else if (isTicketOpen) setIsTicketOpen(false);
      else if (isMoodSchedulerOpen) setIsMoodSchedulerOpen(false);
      else if (isLyricsOpen) setIsLyricsOpen(false);
      else if (isDriveOpen) setIsDriveOpen(false);
      else if (isTimeAdjustOpen) setIsTimeAdjustOpen(false);
      else if (isRjOpen) setIsRjOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    isSearchOpen,
    isMixerOpen,
    isTicketOpen,
    isMoodSchedulerOpen,
    isLyricsOpen,
    isDriveOpen,
    isTimeAdjustOpen,
    isRjOpen
  ]);

  // Auto-Sync Atmosphere based on local time
  useEffect(() => {
    if (!isAutoSyncAtmosphere) return;

    const checkAndSyncAtmosphere = () => {
      const mood = getMoodInfoForTime();
      setAtmosphere(mood.atmosphere);
    };

    checkAndSyncAtmosphere();
    const interval = setInterval(checkAndSyncAtmosphere, 30000);
    return () => clearInterval(interval);
  }, [isAutoSyncAtmosphere]);

  // 1. Load YouTube Iframe API with full error resilience and continuous polling
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initPlayer(currentSong ? currentSong.videoId : ALL_SONGS_CATALOG[0].videoId);
    };

    if (window.YT && window.YT.Player) {
      initPlayer(currentSong ? currentSong.videoId : ALL_SONGS_CATALOG[0].videoId);
    } else {
      // Polling fallback to guarantee initialization
      const poll = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(poll);
          initPlayer(currentSong ? currentSong.videoId : ALL_SONGS_CATALOG[0].videoId);
        }
      }, 200);
      return () => clearInterval(poll);
    }
  }, []);

  const initPlayer = (videoIdOrList: string) => {
    if (playerRef.current) return;

    const initialId = videoIdOrList || ALL_SONGS_CATALOG[0].videoId;

    try {
      playerRef.current = new window.YT.Player('youtube-player-element', {
        height: '100%',
        width: '100%',
        videoId: initialId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          enablejsapi: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3
        },
        events: {
          onReady: (event: any) => {
            if (playerRef.current?.setVolume) {
              try {
                playerRef.current.setVolume(volume * 100);
              } catch (e) {}
            }
            if (pendingSongRef.current) {
              const pending = pendingSongRef.current;
              pendingSongRef.current = null;
              handlePlaySong(pending);
            } else {
              updateTrackData();
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              errorRetryCountRef.current = 0;
              updateTrackData();
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              nextTrack();
            }
          },
          onError: (e: any) => {
            const errorCode = e && e.data !== undefined ? String(e.data) : 'unknown';
            console.warn(`YouTube playback auto-recovery notice (Error code: ${errorCode}), auto-advancing track.`);
            soundscapeEngine.playHarmonicResonance(392);
            const songTitle = currentSong ? currentSong.title : 'Song';
            if (e && (e.data === 101 || e.data === 150)) {
              showPlaybackNotice(`⚠️ "${songTitle}" embed restricted. Auto-playing next melody...`);
            } else if (e && (e.data === 100 || e.data === 2)) {
              showPlaybackNotice(`⚠️ "${songTitle}" unavailable. Auto-switching track...`);
            } else {
              showPlaybackNotice(`Auto-tuning to next mountain melody...`);
            }
            if (errorRetryCountRef.current < 8) {
              errorRetryCountRef.current += 1;
              setTimeout(() => {
                nextTrack();
              }, 700);
            }
          }
        }
      });
    } catch (err: any) {
      console.warn('YouTube Player initialization notice:', err?.message || String(err));
    }
  };

  // Direct YouTube URL / Video ID Player
  const handleDirectPlayUrl = (urlOrId: string) => {
    if (!urlOrId || typeof urlOrId !== 'string') return;
    const clean = urlOrId.trim();
    let vidId = clean;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const match = clean.match(regExp);
    if (match && match[1]) {
      vidId = match[1];
    }

    const customItem: SongItem = {
      id: `direct-yt-${Date.now()}`,
      title: `YouTube Live Track (${vidId.substring(0, 8)})`,
      artist: 'Direct YouTube Stream',
      movie: 'Web Stream',
      year: '2024',
      category: 'soulful',
      duration: '4:00',
      videoId: vidId,
      custom: true
    };

    handlePlaySong(customItem);
  };

  // 2. Track Data & Progress Polling
  const updateTrackData = () => {
    try {
      if (playerRef.current && playerRef.current.getVideoData) {
        const data = playerRef.current.getVideoData();
        if (data && data.title) {
          if (!currentSong || currentSong.videoId !== data.video_id) {
            const found = ALL_SONGS_CATALOG.find((s) => s.videoId === data.video_id);
            if (found) {
              setCurrentSong(found);
              setTrackInfo({
                title: `${found.title} • ${found.artist || found.movie || 'Sovio Radio'}`,
                author: found.artist || 'Sovio Radio'
              });
            } else {
              setTrackInfo({ title: data.title, author: data.author || 'Sovio Radio' });
            }
          }
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlaying) return;

      // Handle HTML5 audio time tracking
      if (currentSong?.audioFileUrl && html5AudioRef.current) {
        try {
          const curr = html5AudioRef.current.currentTime || 0;
          const dur = html5AudioRef.current.duration || 0;
          setCurrentTime(curr);
          setDuration(dur);
          if (dur > 0) {
            setProgressPercent((curr / dur) * 100);
          }
        } catch (e) {}
        return;
      }

      // Handle YouTube player time tracking
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const curr = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setCurrentTime(curr);
          setDuration(dur);
          if (dur > 0) {
            setProgressPercent((curr / dur) * 100);
          }
        } catch (e) {}
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimerRemaining === null) return;
    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (playerRef.current && playerRef.current.pauseVideo) {
            try {
              playerRef.current.pauseVideo();
            } catch (e) {}
          }
          setIsPlaying(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerRemaining]);

  // Rotating Quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => {
        const next = (prev + 1) % PAHADI_QUOTES.length;
        setCurrentQuote(PAHADI_QUOTES[next]);
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard Shortcuts (Spacebar, Arrows, Search /, Mood M, Lyrics L, Time Adjust T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          setIsSearchOpen(false);
          setIsMixerOpen(false);
          setIsTicketOpen(false);
          setIsRjOpen(false);
          setIsDriveOpen(false);
          setIsTimeAdjustOpen(false);
          setIsLyricsOpen(false);
          setIsMoodSchedulerOpen(false);
        }
        return;
      }

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMoodSchedulerOpen((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsLyricsOpen((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsTimeAdjustOpen((prev) => !prev);
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.shiftKey && e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkipSeconds(10);
      } else if (e.shiftKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkipSeconds(-10);
      } else if (e.code === 'ArrowRight') {
        nextTrack();
      } else if (e.code === 'ArrowLeft') {
        prevTrack();
      } else if (e.key === 'j' || e.key === 'J') {
        handleSkipSeconds(-10);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMixerOpen(false);
        setIsTicketOpen(false);
        setIsRjOpen(false);
        setIsDriveOpen(false);
        setIsTimeAdjustOpen(false);
        setIsLyricsOpen(false);
        setIsMoodSchedulerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentSong, currentTime, duration]);

  // Master Play/Pause Toggle
  const togglePlay = () => {
    if (currentSong?.audioFileUrl && html5AudioRef.current) {
      if (html5AudioRef.current.paused) {
        html5AudioRef.current.volume = volume;
        html5AudioRef.current.muted = false;
        html5AudioRef.current.playbackRate = playbackSpeed;
        startBackgroundAudioKeepAlive();
        html5AudioRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        pauseBackgroundAudioKeepAlive();
        html5AudioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (!playerRef.current) {
      setIsPlaying(!isPlaying);
      return;
    }

    try {
      const state = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
      if (state === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
        pauseBackgroundAudioKeepAlive();
        setIsPlaying(false);
      } else {
        startBackgroundAudioKeepAlive();
        if (playerRef.current.playVideo) {
          playerRef.current.playVideo();
        }
        setIsPlaying(true);
      }
    } catch (e) {
      setIsPlaying(!isPlaying);
    }
  };

  // Screen Wake Lock toggle
  const handleToggleScreenAwake = async () => {
    const nextState = !keepScreenAwake;
    const success = await toggleScreenWakeLock(nextState);
    setKeepScreenAwake(success);
  };

  // OS Media Session & Background Audio Sync
  useEffect(() => {
    updateMediaSession({
      song: currentSong,
      isPlaying,
      onPlay: () => {
        startBackgroundAudioKeepAlive();
        if (currentSong?.audioFileUrl && html5AudioRef.current) {
          html5AudioRef.current.play().catch(() => {});
        } else {
          playerRef.current?.playVideo();
        }
        setIsPlaying(true);
      },
      onPause: () => {
        pauseBackgroundAudioKeepAlive();
        if (currentSong?.audioFileUrl && html5AudioRef.current) {
          html5AudioRef.current.pause();
        } else {
          playerRef.current?.pauseVideo();
        }
        setIsPlaying(false);
      },
      onNext: () => nextTrack(),
      onPrev: () => prevTrack(),
      onSeek: handleSeek,
      onSkipSeconds: handleSkipSeconds,
      currentTime,
      duration,
      playbackSpeed
    });
  }, [currentSong, isPlaying, currentTime, duration, playbackSpeed]);

  // Page visibility watcher to keep audio active in background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isPlaying) {
        startBackgroundAudioKeepAlive();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);

  // Seek time handler
  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    if (currentSong?.audioFileUrl && html5AudioRef.current) {
      try {
        html5AudioRef.current.currentTime = seconds;
      } catch (e) {}
    } else if (playerRef.current && playerRef.current.seekTo) {
      try {
        playerRef.current.seekTo(seconds, true);
        if (duration > 0) {
          setProgressPercent((seconds / duration) * 100);
        }
      } catch (e) {}
    }
  };

  // Jump seconds forward or backward
  const handleSkipSeconds = (delta: number) => {
    const maxDur = duration > 0 ? duration : 300;
    const target = Math.max(0, Math.min(maxDur, currentTime + delta));
    handleSeek(target);
  };

  // Volume Handler
  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (playerRef.current && playerRef.current.setVolume) {
      try {
        playerRef.current.setVolume(clamped * 100);
      } catch (e) {}
    }
    if (html5AudioRef.current) {
      html5AudioRef.current.volume = clamped;
    }
  };

  // Playback speed handler
  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (html5AudioRef.current) {
      html5AudioRef.current.playbackRate = speed;
    }
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      try {
        playerRef.current.setPlaybackRate(speed);
      } catch (e) {}
    }
  };

  // Sleep timer handler
  const handleSetSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(minutes * 60);
    }
  };

  // HTML5 Audio Failover & Error Handler
  const handleAudioError = () => {
    if (
      streamCandidatesRef.current.length > 0 &&
      streamCandidateIndexRef.current < streamCandidatesRef.current.length - 1
    ) {
      streamCandidateIndexRef.current += 1;
      const nextCandidate = streamCandidatesRef.current[streamCandidateIndexRef.current];
      if (html5AudioRef.current) {
        html5AudioRef.current.src = nextCandidate;
        html5AudioRef.current.volume = volume;
        html5AudioRef.current.muted = false;
        html5AudioRef.current.playbackRate = playbackSpeed;
        html5AudioRef.current.load();
        html5AudioRef.current.play().catch(() => {});
      }
      return;
    }

    const songTitle = currentSong ? currentSong.title : 'Audio stream';
    showPlaybackNotice(`⚠️ "${songTitle}" stream unreachable. Auto-playing next track...`);
    soundscapeEngine.playHarmonicResonance(392);
    setTimeout(() => {
      nextTrack();
    }, 600);
  };

  // Play a specific Song with guaranteed playback
  const handlePlaySong = (song: SongItem) => {
    if (!song) return;
    setCurrentSong(song);
    errorRetryCountRef.current = 0;
    setTrackInfo({
      title: `${song.title} • ${song.artist || song.movie || 'Sovio Radio'}`,
      author: song.artist || 'Sovio Radio'
    });
    soundscapeEngine.playTuningStatic();

    // Check for offline/custom audio file or JioSaavn/Audius stream
    if (song.audioFileUrl) {
      if (playerRef.current && playerRef.current.pauseVideo) {
        try { playerRef.current.pauseVideo(); } catch (e) {}
      }

      if (song.id.startsWith('jiosaavn-') || song.source === 'jiosaavn') {
        streamCandidatesRef.current = getJioSaavnStreamCandidates(song.audioFileUrl);
      } else {
        streamCandidatesRef.current = [song.audioFileUrl];
      }
      streamCandidateIndexRef.current = 0;

      if (html5AudioRef.current) {
        const initialSrc = streamCandidatesRef.current[0] || song.audioFileUrl;
        html5AudioRef.current.src = initialSrc;
        html5AudioRef.current.currentTime = 0;
        html5AudioRef.current.volume = volume;
        html5AudioRef.current.muted = false;
        html5AudioRef.current.playbackRate = playbackSpeed;
        webAudioVisualizerService.connectMediaElement(html5AudioRef.current);
        webAudioVisualizerService.resume();

        html5AudioRef.current.load();
        const playPromise = html5AudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err: any) => {
              console.warn('HTML5 initial stream note, testing next candidate:', err?.message || String(err));
              handleAudioError();
            });
        }
      }
      startBackgroundAudioKeepAlive();
      setIsPlaying(true);
      return;
    }

    // Normal YouTube video stream
    if (html5AudioRef.current && !html5AudioRef.current.paused) {
      html5AudioRef.current.pause();
    }

    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      try {
        playerRef.current.loadVideoById({
          videoId: song.videoId,
          startSeconds: 0
        });
        startBackgroundAudioKeepAlive();
        setIsPlaying(true);
      } catch (e: any) {
        console.warn('Error loading video by ID, queueing:', e?.message || String(e));
        pendingSongRef.current = song;
      }
    } else {
      pendingSongRef.current = song;
      setIsPlaying(true);
    }
  };

  // Add song to active queue (No duplicates)
  const handleAddToQueue = (song: SongItem) => {
    setCurrentPlaylist((prev) => deduplicateSongs([song, ...prev]));
    soundscapeEngine.playTuningStatic();
  };

  // Next Track in playlist
  const nextTrack = () => {
    soundscapeEngine.playTuningStatic();
    const songList = currentStation.songs && currentStation.songs.length > 0 ? currentStation.songs : currentPlaylist;
    const currentIndex = currentSong
      ? songList.findIndex((s) => s.id === currentSong.id)
      : 0;
    const nextIndex = (currentIndex + 1) % songList.length;
    const nextSong = songList[nextIndex];
    handlePlaySong(nextSong);
  };

  // Previous Track in playlist
  const prevTrack = () => {
    soundscapeEngine.playTuningStatic();
    const songList = currentStation.songs && currentStation.songs.length > 0 ? currentStation.songs : currentPlaylist;
    const currentIndex = currentSong
      ? songList.findIndex((s) => s.id === currentSong.id)
      : 0;
    const prevIndex = (currentIndex - 1 + songList.length) % songList.length;
    const prevSong = songList[prevIndex];
    handlePlaySong(prevSong);
  };

  // Switch Station
  const handleSelectStation = async (st: RadioStation) => {
    setCurrentStation(st);
    if (st.defaultQuotes && st.defaultQuotes.length > 0) {
      setCurrentQuote(st.defaultQuotes[0]);
    }

    if (st.id.startsWith('station-jiosaavn')) {
      let category = 'bollywood';
      if (st.id === 'station-jiosaavn-live') category = 'arijit';
      else if (st.id === 'station-jiosaavn-trending') category = 'bollywood';
      else if (st.id === 'station-jiosaavn-pahadi') category = 'pahadi';

      try {
        const saavnTracks = await getJioSaavnTrending(category);
        if (saavnTracks && saavnTracks.length > 0) {
          const uniqueTracks = deduplicateSongs(saavnTracks);
          const updatedStation: RadioStation = {
            ...st,
            songs: uniqueTracks
          };
          setCurrentStation(updatedStation);
          setCurrentPlaylist(uniqueTracks);
          handlePlaySong(uniqueTracks[0]);
          return;
        }
      } catch (err: any) {
        console.warn('JioSaavn station dynamic tracks loader notice:', err?.message || String(err));
      }
    }

    if (st.songs && st.songs.length > 0) {
      const uniqueStationSongs = deduplicateSongs(st.songs);
      setCurrentPlaylist(uniqueStationSongs);
      handlePlaySong(uniqueStationSongs[0]);
    } else if (playerRef.current && playerRef.current.loadPlaylist) {
      try {
        playerRef.current.loadPlaylist({
          listType: 'playlist',
          list: st.playlistId,
          index: 0
        });
        setIsPlaying(true);
      } catch (e) {}
    }
  };

  // Soundscape layer volume toggle
  const handleSoundChange = (id: string, volume: number, enabled: boolean) => {
    setAmbientSounds((prev) =>
      prev.map((s) => (s.id === id ? { ...s, volume, isPlaying: enabled } : s))
    );
    soundscapeEngine.setSoundVolume(id, volume, enabled);
  };

  // Atmosphere mode change
  const handleSetAtmosphere = (mode: AtmosphereMode) => {
    setAtmosphere(mode);
  };

  // Save song to Google Drive
  const handleSaveSongToDrive = async (song: SongItem) => {
    if (!driveToken) {
      setIsDriveOpen(true);
      return;
    }
    try {
      const songTitle = typeof song?.title === 'string' ? song.title : 'Pahadi Melody';
      const songArtist = typeof song?.artist === 'string' ? song.artist : (typeof song?.movie === 'string' ? song.movie : 'Sovio Radio');
      const songMovie = typeof song?.movie === 'string' ? song.movie : 'Bollywood / Folk';
      const songYear = typeof song?.year === 'string' ? song.year : 'N/A';
      const songCat = typeof song?.category === 'string' ? song.category : 'Soulful';

      await saveMemoryToDrive(driveToken, {
        title: `Song Memory: ${songTitle} (${songArtist})`,
        content: `Listening to "${songTitle}" by ${songArtist} amidst mountain mist. Movie/Album: ${songMovie}, Year: ${songYear}, Mood: ${songCat}.`,
        location: 'Sovio Mountain Radio',
        tags: [songArtist, 'Pahadi Radio', songCat, 'Favorites']
      });
    } catch (err: any) {
      console.error('Song memory save error:', err?.message || String(err));
    }
  };

  // Save ticket to Google Drive
  const handleSaveTicketToDrive = async (title: string, content: string) => {
    if (!driveToken) {
      setIsDriveOpen(true);
      return;
    }
    try {
      const safeTitle = typeof title === 'string' ? title : `HRTC_Ticket_${ticket?.ticketNumber || 'Pass'}`;
      const safeContent = typeof content === 'string' ? content : 'HRTC Bus Journey Ticket';
      const safeOrigin = typeof ticket?.origin === 'string' ? ticket.origin : 'Shimla';

      await saveMemoryToDrive(driveToken, {
        title: safeTitle,
        content: safeContent,
        location: safeOrigin,
        tags: ['HRTC', 'Ticket', 'Bus Journey']
      });
    } catch (err: any) {
      console.error('Ticket save error:', err?.message || String(err));
    }
  };

  // Download current song (Saves to offline database and device file storage)
  const handleDownloadCurrentSong = async () => {
    if (!currentSong) return;
    setIsDownloadingCurrent(true);
    soundscapeEngine.playButtonClick();
    try {
      // 1. Cache to IndexedDB for zero-internet playback
      await downloadSongForOffline(currentSong);
      setIsCurrentDownloaded(true);

      // 2. Trigger browser download to device phone/PC downloads folder
      await downloadSongToDevice(currentSong);

      setPlaybackNotice(`"${currentSong.title}" saved to Offline Library & Device Downloads!`);
      setTimeout(() => setPlaybackNotice(null), 4000);
    } catch (err: any) {
      console.error('Download error:', err?.message || String(err));
      setPlaybackNotice('Download error, please try again.');
      setTimeout(() => setPlaybackNotice(null), 3000);
    } finally {
      setIsDownloadingCurrent(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col justify-start items-center pb-28 select-none">
      
      {/* Background Scenery & Live Atmosphere */}
      <SceneryBackground
        atmosphere={atmosphere}
        currentTicket={ticket}
        onTicketClick={() => setIsTicketOpen(true)}
        onOpenMoodScheduler={() => setIsMoodSchedulerOpen(true)}
        isAutoSync={isAutoSyncAtmosphere}
      />

      {/* Top Professional Navigation Header */}
      <TopNavHeader
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'discover') setIsSearchOpen(true);
          else if (tab === 'downloads') setIsDownloadsOpen(true);
          else if (tab === 'soundscape') setIsMixerOpen(true);
          else if (tab === 'ticket') setIsTicketOpen(true);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenLyrics={() => setIsLyricsOpen(true)}
        onOpenMoodScheduler={() => setIsMoodSchedulerOpen(true)}
        onOpenRj={() => setIsRjOpen(true)}
        atmosphere={atmosphere}
        isPlaying={isPlaying}
      />

      {/* Professional Music Studio Dashboard */}
      <ProfessionalMusicDashboard
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'discover') setIsSearchOpen(true);
          else if (tab === 'downloads') setIsDownloadsOpen(true);
          else if (tab === 'soundscape') setIsMixerOpen(true);
          else if (tab === 'ticket') setIsTicketOpen(true);
        }}
        currentStation={currentStation}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onSelectStation={handleSelectStation}
        stations={RADIO_STATIONS}
        onPlaySong={handlePlaySong}
        onNextTrack={nextTrack}
        onPrevTrack={prevTrack}
        onDownloadCurrentSong={handleDownloadCurrentSong}
        isDownloadingCurrent={isDownloadingCurrent}
        isCurrentDownloaded={isCurrentDownloaded}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenLyrics={() => setIsLyricsOpen(true)}
        onOpenMoodScheduler={() => setIsMoodSchedulerOpen(true)}
        onOpenDownloads={() => setIsDownloadsOpen(true)}
        onOpenTimeAdjust={() => setIsTimeAdjustOpen(true)}
        quoteText={currentQuote}
        currentTime={currentTime}
        duration={duration}
        progressPercent={progressPercent}
        onSeek={handleSeek}
        atmosphere={atmosphere}
        ambientSounds={ambientSounds}
        onSoundChange={handleSoundChange}
        ticket={ticket}
        onOpenTicket={() => setIsTicketOpen(true)}
        trendingSongs={ALL_SONGS_CATALOG}
      />

      {/* Floating Bottom Studio Player Bar */}
      <PlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onNextTrack={nextTrack}
        onPrevTrack={prevTrack}
        trackInfo={trackInfo}
        progressPercent={progressPercent}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        onSkipSeconds={handleSkipSeconds}
        onOpenTimeAdjust={() => setIsTimeAdjustOpen(true)}
        playbackSpeed={playbackSpeed}
        sleepTimerRemaining={sleepTimerRemaining}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onOpenMixer={() => setIsMixerOpen(true)}
        onOpenTicket={() => setIsTicketOpen(true)}
        onOpenRj={() => setIsRjOpen(true)}
        onOpenDrive={() => setIsDriveOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenLyrics={() => setIsLyricsOpen(true)}
        onOpenMoodScheduler={() => setIsMoodSchedulerOpen(true)}
        onOpenDownloads={() => setIsDownloadsOpen(true)}
        onDownloadCurrentSong={handleDownloadCurrentSong}
        isDownloadingCurrent={isDownloadingCurrent}
        isCurrentDownloaded={isCurrentDownloaded}
        atmosphere={atmosphere}
        isAutoSync={isAutoSyncAtmosphere}
      />

      {/* Mood Scheduler Modal (Circadian Lighting & Genre Matching) */}
      <MoodSchedulerModal
        isOpen={isMoodSchedulerOpen}
        onClose={() => setIsMoodSchedulerOpen(false)}
        currentAtmosphere={atmosphere}
        onSetAtmosphere={handleSetAtmosphere}
        isAutoSync={isAutoSyncAtmosphere}
        onToggleAutoSync={setIsAutoSyncAtmosphere}
        onPlaySong={handlePlaySong}
        onSelectStation={handleSelectStation}
      />

      {/* Synchronized Lyrics & Sing-Along Overlay */}
      <LyricsOverlay
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        currentSong={currentSong}
        trackInfo={trackInfo}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        onSkipSeconds={handleSkipSeconds}
        onNextTrack={nextTrack}
        onPrevTrack={prevTrack}
      />

      {/* Song Time Adjust & Sleep Timer Modal */}
      <SongTimeAdjustModal
        isOpen={isTimeAdjustOpen}
        onClose={() => setIsTimeAdjustOpen(false)}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={handlePlaybackSpeedChange}
        sleepTimerRemaining={sleepTimerRemaining}
        onSetSleepTimer={handleSetSleepTimer}
        trackInfo={trackInfo}
        keepScreenAwake={keepScreenAwake}
        onToggleScreenAwake={handleToggleScreenAwake}
      />

      {/* Universal Search, Singer Playlists & Add Song Modal */}
      <SongSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentSongId={currentSong?.id}
        isPlaying={isPlaying}
        onPlaySong={handlePlaySong}
        onAddToQueue={handleAddToQueue}
        onSaveToDrive={handleSaveSongToDrive}
        onDirectPlayUrl={handleDirectPlayUrl}
      />

      {/* Ambient Soundscapes Mixer */}
      <AmbientMixerModal
        isOpen={isMixerOpen}
        onClose={() => setIsMixerOpen(false)}
        sounds={ambientSounds}
        onSoundChange={handleSoundChange}
      />

      {/* HRTC Bus Ticket Modal */}
      <HrtcTicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        ticket={ticket}
        onUpdateTicket={setTicket}
        onSaveToDrive={handleSaveTicketToDrive}
        isDriveConnected={!!driveToken}
      />

      {/* AI RJ Modal */}
      <PahadiRjModal
        isOpen={isRjOpen}
        onClose={() => setIsRjOpen(false)}
        onSetQuote={setCurrentQuote}
      />

      {/* Google Drive Memory Modal */}
      <DriveMemoryModal
        isOpen={isDriveOpen}
        onClose={() => setIsDriveOpen(false)}
        token={driveToken}
        onTokenReceived={setDriveToken}
      />

      {/* Offline Music Downloads Modal */}
      <DownloadsModal
        isOpen={isDownloadsOpen}
        onClose={() => setIsDownloadsOpen(false)}
        currentSongId={currentSong?.id}
        isPlaying={isPlaying}
        onPlaySong={handlePlaySong}
      />

      {/* Dedicated Invisible Audio Engine (Kept active in viewport with negative z-index to prevent browser throttle) */}
      <div
        className="fixed bottom-0 right-0 pointer-events-none overflow-hidden"
        style={{
          position: 'fixed',
          bottom: '0px',
          right: '0px',
          width: '200px',
          height: '120px',
          opacity: 0.001,
          zIndex: -999,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      >
        <div id="youtube-player-element" className="w-full h-full" />
      </div>

      {/* Fallback Native HTML5 Audio with Automatic Error Failover */}
      <audio
        ref={html5AudioRef}
        preload="auto"
        onEnded={nextTrack}
        onError={handleAudioError}
        onPause={() => {
          if (currentSong?.audioFileUrl) setIsPlaying(false);
        }}
        onPlay={() => {
          if (currentSong?.audioFileUrl) setIsPlaying(true);
        }}
      />

      {/* Floating Audio Playback Recovery Toast */}
      {playbackNotice && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#120f0a]/95 backdrop-blur-xl border border-amber-500/60 rounded-xl text-amber-200 text-xs sm:text-sm font-mono-space shadow-[0_8px_30px_rgba(0,0,0,0.85),0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-2.5 animate-bounce select-none pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
          <span>{playbackNotice}</span>
        </div>
      )}
    </div>
  );
}

export default App;
