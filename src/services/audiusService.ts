import { SongItem } from '../types';

export const AUDIUS_APP_NAME = 'SovioMountainRadio';

export const FALLBACK_HOSTS = [
  'https://discoveryprovider.audius.co',
  'https://audius-discovery-1.cultur3stake.com',
  'https://audius-discovery-2.cultur3stake.com',
  'https://discovery-a.mainnet.audius-engine.co',
  'https://dn2.monophonic.digital',
  'https://blockdaemon-audius-discovery-02.bdnodes.net'
];

let selectedHost: string = FALLBACK_HOSTS[0];
let hostInitialized = false;

/**
 * Automatically resolves the fastest/best active Audius Discovery node
 */
export async function getAudiusHost(): Promise<string> {
  if (hostInitialized) return selectedHost;

  try {
    const res = await fetch('https://api.audius.co', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        selectedHost = data.data[Math.floor(Math.random() * data.data.length)];
        hostInitialized = true;
        return selectedHost;
      }
    }
  } catch (err: any) {
    console.warn('Audius host discovery fallback notice:', err?.message || String(err));
  }

  // Use primary fallback
  selectedHost = FALLBACK_HOSTS[0];
  hostInitialized = true;
  return selectedHost;
}

/**
 * Generates an array of stream URLs across multiple nodes for automatic failover
 */
export function getAudiusStreamCandidates(trackId: string): string[] {
  const cleanId = trackId.replace(/^audius-/, '');
  return FALLBACK_HOSTS.map(
    (host) => `${host}/v1/tracks/${cleanId}/stream?app_name=${AUDIUS_APP_NAME}`
  );
}

export interface AudiusTrackRaw {
  id: string;
  title: string;
  duration: number;
  genre?: string;
  mood?: string;
  user: {
    name: string;
    handle?: string;
  };
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  play_count?: number;
  favorite_count?: number;
}

/**
 * Format duration in seconds to mm:ss
 */
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '3:30';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Convert raw Audius track object to Sovio SongItem
 */
export function formatAudiusTrack(track: AudiusTrackRaw, host: string): SongItem {
  const streamUrl = `${host}/v1/tracks/${track.id}/stream?app_name=${AUDIUS_APP_NAME}`;
  const artwork =
    track.artwork?.['480x480'] ||
    track.artwork?.['150x150'] ||
    track.artwork?.['1000x1000'] ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';

  return {
    id: `audius-${track.id}`,
    title: track.title || 'Audius Track',
    artist: track.user?.name || 'Audius Artist',
    movie: track.genre ? `Audius • ${track.genre}` : 'Audius Decentralized Music',
    year: '2024',
    category: 'acoustic',
    duration: formatDuration(track.duration),
    videoId: `audius-${track.id}`,
    audioFileUrl: streamUrl,
    custom: true
  };
}

/**
 * Search Audius for tracks by keyword (artist, title, acoustic, chill, hindi, lofi, etc.)
 */
export async function searchAudiusTracks(query: string, limit = 20): Promise<SongItem[]> {
  if (!query || query.trim().length === 0) return [];
  try {
    const host = await getAudiusHost();
    const url = `${host}/v1/tracks/search?query=${encodeURIComponent(query.trim())}&app_name=${AUDIUS_APP_NAME}&limit=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Audius search HTTP error: ${res.status}`);

    const data = await res.json();
    if (Array.isArray(data.data)) {
      return data.data.map((t: AudiusTrackRaw) => formatAudiusTrack(t, host));
    }
    return [];
  } catch (err: any) {
    console.warn('Audius search error:', err?.message || String(err));
    return [];
  }
}

/**
 * Fetch Trending tracks from Audius with optional genre filter
 */
export async function getTrendingAudiusTracks(genre?: string, limit = 25): Promise<SongItem[]> {
  try {
    const host = await getAudiusHost();
    const genreParam = genre ? `&genre=${encodeURIComponent(genre)}` : '';
    const url = `${host}/v1/tracks/trending?app_name=${AUDIUS_APP_NAME}&limit=${limit}${genreParam}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Audius trending HTTP error: ${res.status}`);

    const data = await res.json();
    if (Array.isArray(data.data)) {
      return data.data.map((t: AudiusTrackRaw) => formatAudiusTrack(t, host));
    }
    return [];
  } catch (err: any) {
    console.warn('Audius trending error:', err?.message || String(err));
    return [];
  }
}

/**
 * Fetch underground or acoustic chill tracks suitable for Mountain Radio
 */
export async function getMountainAudiusTracks(): Promise<SongItem[]> {
  try {
    // Try acoustic, chill, ambient, lo-fi or trending
    const acoustic = await getTrendingAudiusTracks('Acoustic', 15);
    if (acoustic.length > 0) return acoustic;

    const general = await getTrendingAudiusTracks(undefined, 15);
    return general;
  } catch (e) {
    return [];
  }
}
