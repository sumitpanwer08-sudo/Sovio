// Public Lyrics Fetching & Synchronization Service for Sovio Mountain Radio
// Connects to lrclib.net, public lyrics API, and fallback local synchronized Pahadi database

import { LyricsData, LyricLine, SongItem } from '../types';
import { LOCAL_LYRICS_DATABASE } from '../data/lyricsCatalog';

const CACHE_PREFIX = 'sovio_lyrics_cache_v1_';

/**
 * Parses standard LRC timestamped text into structured LyricLine[]
 * Format: [mm:ss.xx] Lyric text
 */
export function parseLrcString(lrcContent: string): LyricLine[] {
  if (!lrcContent) return [];
  const lines = lrcContent.split('\n');
  const parsed: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{0,3})\]/g;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Reset regex index
    timeRegex.lastIndex = 0;
    const matches = Array.from(trimmed.matchAll(timeRegex));

    if (matches.length > 0) {
      // Remove all timestamp tags from the text
      const cleanText = trimmed.replace(timeRegex, '').trim();
      if (!cleanText) continue;

      for (const match of matches) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
        const totalSeconds = min * 60 + sec + ms / 1000;

        parsed.push({
          time: totalSeconds,
          text: cleanText
        });
      }
    }
  }

  // Sort chronologically by time
  parsed.sort((a, b) => a.time - b.time);

  // If first lyric starts late, add an atmospheric intro marker
  if (parsed.length > 0 && parsed[0].time > 4) {
    parsed.unshift({
      time: 0,
      text: '♪ (Mountain Melodies & Acoustic Intro) ♪'
    });
  }

  return parsed;
}

/**
 * Generates timed lines from plain text lyrics distributed across song duration
 */
export function generateTimedLinesFromPlainLyrics(
  plainText: string,
  totalDurationSecs: number = 240
): LyricLine[] {
  if (!plainText) return [];
  const rawLines = plainText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('Paroles de la'));

  if (rawLines.length === 0) return [];

  const introOffset = 8;
  const availableTime = Math.max(30, totalDurationSecs - introOffset - 10);
  const timePerLine = availableTime / rawLines.length;

  const result: LyricLine[] = [
    {
      time: 0,
      text: '♪ (Acoustic Intro) ♪'
    }
  ];

  rawLines.forEach((text, index) => {
    result.push({
      time: Math.round(introOffset + index * timePerLine),
      text
    });
  });

  return result;
}

/**
 * Clean string for fuzzy title matching
 */
function cleanSongName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // remove parentheses like (Official Video)
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*$/i, '')
    .replace(/ft\..*$/i, '')
    .replace(/from\s+".*?"/gi, '')
    .replace(/lyrics|full song|audio|video|mountain wanderlust|lrc/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find local curated match
 */
function findLocalMatch(title: string): LyricsData | null {
  const clean = cleanSongName(title);

  for (const [key, data] of Object.entries(LOCAL_LYRICS_DATABASE)) {
    const cleanKey = cleanSongName(key);
    if (clean.includes(cleanKey) || cleanKey.includes(clean)) {
      return data;
    }
  }
  return null;
}

/**
 * Fetch lyrics from public API (LRCLIB or lyrics.ovh) or fallback database
 */
export async function fetchLyrics(params: {
  title: string;
  artist?: string;
  duration?: number;
  songId?: string;
}): Promise<LyricsData> {
  const { title, artist = '', duration = 240, songId = '' } = params;
  const cleanTitle = cleanSongName(title);
  const cleanArtist = cleanSongName(artist);
  const cacheKey = `${CACHE_PREFIX}${songId || cleanTitle}`;

  // 1. Check in-browser cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.lines && parsed.lines.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // 2. Check local curated database first (best quality with translations & chords)
  const localMatch = findLocalMatch(title);
  if (localMatch) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(localMatch));
    } catch (e) {}
    return localMatch;
  }

  // 3. Check JioSaavn Lyrics if song is from JioSaavn or has songId
  if (songId && songId.startsWith('jiosaavn-')) {
    try {
      const saavnLyricsRes = await fetch(`/api/jiosaavn/lyrics?id=${encodeURIComponent(songId.replace(/^jiosaavn-/, ''))}`);
      if (saavnLyricsRes.ok) {
        const saavnJson = await saavnLyricsRes.json();
        if (saavnJson && saavnJson.lyrics) {
          const lines = generateTimedLinesFromPlainLyrics(saavnJson.lyrics, duration);
          const data: LyricsData = {
            id: songId,
            title,
            artist,
            synced: false,
            lines,
            plainLyrics: saavnJson.lyrics,
            source: 'api'
          };
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              id: String(data.id),
              title: String(data.title),
              artist: String(data.artist || ''),
              synced: Boolean(data.synced),
              lines: data.lines.map((l) => ({
                time: Number(l.time),
                text: String(l.text),
                translation: l.translation ? String(l.translation) : undefined
              })),
              plainLyrics: data.plainLyrics ? String(data.plainLyrics) : undefined,
              source: 'api'
            }));
          } catch (e) {}
          return data;
        }
      }
    } catch (err: any) {
      console.warn('JioSaavn lyrics lookup note:', err?.message || String(err));
    }
  }

  // 4. Query Public API: LRCLIB (Free, open-source synced lyrics API)
  try {
    const query = encodeURIComponent(`${cleanTitle} ${cleanArtist}`.trim());
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(`https://lrclib.net/api/search?q=${query}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        // Find best match with synced lyrics
        const bestWithSynced = results.find((r) => r.syncedLyrics && r.syncedLyrics.length > 0);
        const item = bestWithSynced || results[0];

        if (item) {
          let lines: LyricLine[] = [];
          let isSynced = false;

          if (item.syncedLyrics) {
            lines = parseLrcString(item.syncedLyrics);
            isSynced = true;
          } else if (item.plainLyrics) {
            lines = generateTimedLinesFromPlainLyrics(item.plainLyrics, duration);
          }

          if (lines.length > 0) {
            const data: LyricsData = {
              id: item.id ? String(item.id) : songId || cleanTitle,
              title: item.trackName || title,
              artist: item.artistName || artist,
              synced: isSynced,
              lines,
              plainLyrics: item.plainLyrics,
              source: isSynced ? 'synced_lrc' : 'api'
            };

            try {
              localStorage.setItem(cacheKey, JSON.stringify({
                id: String(data.id),
                title: String(data.title),
                artist: String(data.artist || ''),
                synced: Boolean(data.synced),
                lines: data.lines.map((l) => ({
                  time: Number(l.time),
                  text: String(l.text),
                  translation: l.translation ? String(l.translation) : undefined
                })),
                plainLyrics: data.plainLyrics ? String(data.plainLyrics) : undefined,
                source: 'lrclib'
              }));
            } catch (e) {}
            return data;
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('LRCLIB API fetch note:', err?.message || String(err));
  }

  // 4. Secondary Public API: lyrics.ovh (Plain lyrics fallback)
  try {
    if (cleanArtist && cleanTitle) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.lyrics) {
          const lines = generateTimedLinesFromPlainLyrics(json.lyrics, duration);
          const data: LyricsData = {
            id: songId || cleanTitle,
            title,
            artist,
            synced: false,
            lines,
            plainLyrics: json.lyrics,
            source: 'api'
          };
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              id: String(data.id),
              title: String(data.title),
              artist: String(data.artist || ''),
              synced: Boolean(data.synced),
              lines: data.lines.map((l) => ({
                time: Number(l.time),
                text: String(l.text),
                translation: l.translation ? String(l.translation) : undefined
              })),
              plainLyrics: data.plainLyrics ? String(data.plainLyrics) : undefined,
              source: 'api'
            }));
          } catch (e) {}
          return data;
        }
      }
    }
  } catch (err: any) {
    console.warn('Lyrics.ovh fallback note:', err?.message || String(err));
  }

  // 5. Intelligent Mountain Acoustic Melodies Fallback (if no internet or offline)
  const defaultLines: LyricLine[] = [
    { time: 0, text: '♪ (Mountain Melodies & Pine Forest Breeze) ♪', translation: 'Feel the serenity of the Himalayas' },
    { time: 10, text: `Listening to "${title}"`, translation: `Melody by ${artist || 'Pahadi Radio'}` },
    { time: 25, text: 'Thandi hawaayein, lehraate cheed ke jungle...', translation: 'Cool mountain winds rustling through deodar trees...' },
    { time: 45, text: 'Pahadon ki goonj aur mithi dhun...', translation: 'Echoes of the valley carrying soulful notes...' },
    { time: 70, text: 'Saadgi mein hi sukoon hai...', translation: 'Peace is found in mountain simplicity...' },
    { time: 100, text: '♪ (Acoustic Guitar & Bansuri Interlude) ♪', translation: 'Let the rhythm guide your breath' },
    { time: 140, text: 'Ghar aaja pardesiya, O chaila...', translation: 'Return home to the serene peaks...' },
    { time: 180, text: '♪ (Harmonious Mountain Sunset Outro) ♪', translation: 'Sovio Mountain Radio' }
  ];

  return {
    id: songId || cleanTitle,
    title,
    artist: artist || 'Pahadi Radio',
    synced: true,
    lines: defaultLines,
    source: 'metadata'
  };
}
