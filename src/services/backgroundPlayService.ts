// Background Play & Media Session Service for Sovio Mountain Radio
// Enables continuous background audio playback when tab is hidden, minimized, or screen is locked

import { SongItem } from '../types';

let keepAliveAudio: HTMLAudioElement | null = null;
let wakeLockSentinel: any = null;

// Tiny 0.5s silent WAV base64 string to keep HTML5 audio pipeline alive in background
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * Initializes the background audio keep-alive pipeline
 */
export function initBackgroundAudioKeepAlive(): HTMLAudioElement {
  if (!keepAliveAudio && typeof window !== 'undefined') {
    keepAliveAudio = new Audio(SILENT_WAV_BASE64);
    keepAliveAudio.loop = true;
    keepAliveAudio.volume = 0.01; // subtle non-zero volume so mobile browsers register as active media
  }
  return keepAliveAudio!;
}

/**
 * Starts background keep-alive audio (must be triggered within user interaction)
 */
export function startBackgroundAudioKeepAlive() {
  try {
    const audio = initBackgroundAudioKeepAlive();
    if (audio.paused) {
      audio.play().catch((e: any) => {
        console.warn('Background keep-alive start note:', e?.message || String(e));
      });
    }
  } catch (e) {}
}

/**
 * Pauses background keep-alive audio
 */
export function pauseBackgroundAudioKeepAlive() {
  try {
    if (keepAliveAudio && !keepAliveAudio.paused) {
      keepAliveAudio.pause();
    }
  } catch (e) {}
}

/**
 * Updates OS Media Session controls (Lock Screen, Notification Bar, Bluetooth Headset controls)
 */
export function updateMediaSession(params: {
  song?: SongItem | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek?: (seconds: number) => void;
  onSkipSeconds?: (delta: number) => void;
  currentTime?: number;
  duration?: number;
  playbackSpeed?: number;
}) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  const {
    song,
    isPlaying,
    onPlay,
    onPause,
    onNext,
    onPrev,
    onSeek,
    onSkipSeconds,
    currentTime = 0,
    duration = 0,
    playbackSpeed = 1
  } = params;

  try {
    // 1. Set Track Metadata for Lock Screen & Notification Center
    const title = song?.title || 'Sovio Mountain Radio';
    const artist = song?.artist || 'Mountain Acoustic Melodies';
    const album = song?.movie
      ? `${song.movie} • Sovio Radio`
      : 'Sovio Radio • Pahadi Station';

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork: [
        {
          src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=512&auto=format&fit=crop&q=80',
          sizes: '512x512',
          type: 'image/jpeg'
        },
        {
          src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=256&auto=format&fit=crop&q=80',
          sizes: '256x256',
          type: 'image/jpeg'
        }
      ]
    });

    // 2. Set Playback State
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // 3. Register Action Handlers for Bluetooth / Lock Screen / Headset Buttons
    navigator.mediaSession.setActionHandler('play', () => {
      startBackgroundAudioKeepAlive();
      onPlay();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      pauseBackgroundAudioKeepAlive();
      onPause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      onPrev();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      onNext();
    });

    if (onSeek) {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          onSeek(details.seekTime);
        }
      });
    }

    if (onSkipSeconds) {
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        onSkipSeconds(-(details.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        onSkipSeconds(details.seekOffset || 10);
      });
    }

    // 4. Update Position State on lock screen
    if (
      'setPositionState' in navigator.mediaSession &&
      duration > 0 &&
      currentTime >= 0 &&
      currentTime <= duration
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(1, duration),
          playbackRate: playbackSpeed,
          position: Math.min(currentTime, duration)
        });
      } catch (e) {}
    }
  } catch (err: any) {
    console.warn('MediaSession update warning:', err?.message || String(err));
  }
}

/**
 * Screen Wake Lock (keeps display active if enabled by user)
 */
export async function toggleScreenWakeLock(enable: boolean): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }

  try {
    if (enable) {
      if (!wakeLockSentinel) {
        wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
        });
      }
      return true;
    } else {
      if (wakeLockSentinel) {
        await wakeLockSentinel.release();
        wakeLockSentinel = null;
      }
      return false;
    }
  } catch (err: any) {
    console.warn('Wake lock error:', err?.message || String(err));
    return false;
  }
}
