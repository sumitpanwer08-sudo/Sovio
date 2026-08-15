import CryptoJS from 'crypto-js';
import { SongItem } from '../types';

// Helper to decrypt JioSaavn encrypted_media_url directly in client if needed
export function decryptClientJioSaavnUrl(encryptedMediaUrl: string): string | null {
  if (!encryptedMediaUrl) return null;
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedMediaUrl)
    });
    const decrypted = CryptoJS.DES.decrypt(
      cipherParams,
      key,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    const url = decrypted.toString(CryptoJS.enc.Utf8);
    if (!url || !url.startsWith('http')) return null;
    return url;
  } catch (e) {
    return null;
  }
}

// Clean HTML entities from JioSaavn text
export function cleanSaavnString(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Searches JioSaavn catalog (80M+ songs)
 */
export async function searchJioSaavnSongs(
  query: string,
  page: number = 1,
  limit: number = 25
): Promise<SongItem[]> {
  if (!query || !query.trim()) return [];

  // 1. Try internal backend proxy route first
  try {
    const res = await fetch(
      `/api/jiosaavn/search?query=${encodeURIComponent(query.trim())}&page=${page}&limit=${limit}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results;
      }
    }
  } catch (err: any) {
    console.warn('JioSaavn server search fallback note:', err?.message || String(err));
  }

  // 2. Direct client fallback with client decryption if backend is unreachable
  try {
    const saavnUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=${encodeURIComponent(
      query.trim()
    )}&p=${page}&n=${limit}`;
    const resp = await fetch(saavnUrl);
    if (resp.ok) {
      const data = await resp.json();
      const rawSongs = data.results || [];
      return rawSongs
        .map((raw: any) => {
          const rawUrl = decryptClientJioSaavnUrl(raw.encrypted_media_url);
          const highQualityUrl = rawUrl
            ? rawUrl.replace(/_96\.mp4|_160\.mp4|_320\.mp4/, '_320.mp4')
            : undefined;
          const mediumQualityUrl = rawUrl
            ? rawUrl.replace(/_96\.mp4|_160\.mp4|_320\.mp4/, '_160.mp4')
            : undefined;

          let coverArt = raw.image || '';
          if (coverArt) {
            coverArt = coverArt.replace('150x150.jpg', '500x500.jpg').replace('50x50.jpg', '500x500.jpg');
          }

          let durFormatted = '3:45';
          if (raw.duration) {
            const totalSec = parseInt(raw.duration, 10);
            if (!isNaN(totalSec) && totalSec > 0) {
              const m = Math.floor(totalSec / 60);
              const s = totalSec % 60;
              durFormatted = `${m}:${s < 10 ? '0' : ''}${s}`;
            }
          }

          return {
            id: `jiosaavn-${raw.id}`,
            title: cleanSaavnString(raw.song || raw.title || 'Mountain Melody'),
            artist: cleanSaavnString(raw.singers || raw.primary_artists || raw.artist || 'Pahadi Artist'),
            movie: cleanSaavnString(raw.album || raw.album_name || 'Pahadi Classics'),
            year: raw.year ? String(raw.year) : '2024',
            category: 'folk' as const,
            duration: durFormatted,
            videoId: '',
            audioFileUrl: highQualityUrl || mediumQualityUrl || rawUrl,
            imageUrl: coverArt,
            source: 'jiosaavn' as const,
            custom: true
          };
        })
        .filter((s: SongItem) => Boolean(s.audioFileUrl));
    }
  } catch (err: any) {
    console.warn('JioSaavn direct client fallback note:', err?.message || String(err));
  }

  return [];
}

/**
 * Fetch curated trending tracks from JioSaavn by category
 */
export async function getJioSaavnTrending(category: string = 'pahadi'): Promise<SongItem[]> {
  try {
    const res = await fetch(`/api/jiosaavn/trending?category=${encodeURIComponent(category)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results;
      }
    }
  } catch (err: any) {
    console.warn('JioSaavn trending fetch note:', err?.message || String(err));
  }

  // Fallback search
  return searchJioSaavnSongs(category, 1, 20);
}

/**
 * Generates stream candidates from high to low quality + proxy fallbacks
 */
export function getJioSaavnStreamCandidates(audioUrl: string): string[] {
  if (!audioUrl) return [];
  const hq = audioUrl.replace(/_96\.mp4|_160\.mp4|_320\.mp4/, '_320.mp4');
  const mq = audioUrl.replace(/_96\.mp4|_160\.mp4|_320\.mp4/, '_160.mp4');
  const lq = audioUrl.replace(/_96\.mp4|_160\.mp4|_320\.mp4/, '_96.mp4');

  const proxyHq = `/api/audio-proxy?url=${encodeURIComponent(hq)}`;
  const proxyMq = `/api/audio-proxy?url=${encodeURIComponent(mq)}`;
  const proxyLq = `/api/audio-proxy?url=${encodeURIComponent(lq)}`;

  return Array.from(new Set([hq, mq, proxyHq, proxyMq, lq, proxyLq, audioUrl]));
}

/**
 * Fetch lyrics from JioSaavn for a song
 */
export async function getJioSaavnLyrics(songId: string): Promise<string | null> {
  const cleanId = songId.replace(/^jiosaavn-/, '');
  try {
    const res = await fetch(`/api/jiosaavn/lyrics?id=${encodeURIComponent(cleanId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.lyrics) {
        return data.lyrics;
      }
    }
  } catch (e) {}

  return null;
}
