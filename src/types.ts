export interface SongItem {
  id: string;
  title: string;
  artist?: string;
  movie?: string;
  year?: string;
  category?: 'all' | 'romantic' | 'travel' | 'monsoon' | 'soulful' | 'acoustic' | 'folk' | 'retro' | 'ghazal';
  duration?: string;
  videoId: string;
  custom?: boolean;
  isOffline?: boolean;
  audioFileUrl?: string;
  imageUrl?: string;
  source?: 'jiosaavn' | 'audius' | 'youtube' | 'local';
}

export interface LyricLine {
  time: number; // in seconds (e.g. 14.5)
  text: string; // The lyric text
  translation?: string; // Hindi/English translation/meaning
  chord?: string; // Optional guitar chord
}

export interface LyricsData {
  id: string;
  title: string;
  artist: string;
  synced: boolean;
  lines: LyricLine[];
  plainLyrics?: string;
  source: 'synced_lrc' | 'api' | 'metadata' | 'karaoke';
  language?: string;
}

export interface RadioStation {
  id: string;
  name: string;
  tagline: string;
  frequency: string;
  playlistId: string; // YouTube playlist ID or fallback
  videoIds?: string[]; // Array of YouTube video IDs
  songs?: SongItem[];
  coverImage?: string;
  defaultQuotes: string[];
}

export interface TrackInfo {
  title: string;
  author?: string;
  duration?: number;
  currentTime?: number;
}

export interface AmbientSound {
  id: 'rain' | 'wind' | 'bonfire' | 'stream' | 'hrtc';
  name: string;
  icon: string; // Lucide icon identifier
  volume: number; // 0 to 1
  isPlaying: boolean;
}

export interface HrtcTicket {
  ticketNumber: string;
  passengerName: string;
  route: string;
  origin: string;
  destination: string;
  fare: string;
  date: string;
  seatNo: string;
  temperature: string;
  busNo?: string;
}

export interface PahadiMemory {
  id?: string;
  title: string;
  content: string;
  location: string;
  tags: string[];
  timestamp: string;
}

export type AtmosphereMode = 'mist' | 'sunset' | 'night' | 'snow';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
