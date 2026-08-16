import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import CryptoJS from "crypto-js";

// Helper to decrypt JioSaavn encrypted_media_url using DES-ECB
function decryptJioSaavnMediaUrl(encryptedMediaUrl: string): string | null {
  if (!encryptedMediaUrl) return null;
  try {
    const key = CryptoJS.enc.Utf8.parse("38346591");
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
    if (!url || !url.startsWith("http")) return null;
    return url;
  } catch (e) {
    return null;
  }
}

// Clean HTML entities from JioSaavn text
function cleanJioSaavnText(str: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

// Normalize title to catch duplicate variations
function normalizeTitle(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/-?\s*(from|audio|lyrics|official|video|soundtrack|lo-fi|lofi|remix|version|reprise|acoustic).*/gi, "")
    .replace(/[^a-z0-9\u0900-\u097F]/gi, "")
    .trim();
}

function deduplicateSongsList(songs: any[]): any[] {
  if (!Array.isArray(songs)) return [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const uniqueList: any[] = [];

  for (const song of songs) {
    if (!song || !song.title) continue;

    const idKey = String(song.id || "").trim().toLowerCase();
    if (idKey && seenIds.has(idKey)) continue;

    const cleanTitle = normalizeTitle(song.title);
    const primaryArtist = String(song.artist || "")
      .split(/[,/&|]/)[0]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const key = `${cleanTitle}__${primaryArtist}`;
    if (cleanTitle && seenTitles.has(key)) continue;

    if (idKey) seenIds.add(idKey);
    if (cleanTitle) seenTitles.add(key);

    uniqueList.push(song);
  }

  return uniqueList;
}

function formatJioSaavnSong(raw: any) {
  const rawUrl = decryptJioSaavnMediaUrl(raw.encrypted_media_url);
  // Get 320kbps or fallback 160kbps stream URL
  const highQualityUrl = rawUrl
    ? rawUrl.replace(/_96\.mp4|_160\.mp4|_320\.mp4/, "_320.mp4")
    : undefined;
  const mediumQualityUrl = rawUrl
    ? rawUrl.replace(/_96\.mp4|_160\.mp4|_320\.mp4/, "_160.mp4")
    : undefined;

  // High resolution cover art
  let coverArt = raw.image || "";
  if (coverArt) {
    coverArt = coverArt.replace("150x150.jpg", "500x500.jpg").replace("50x50.jpg", "500x500.jpg");
  }

  // Format duration into mm:ss
  let durFormatted = "3:45";
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
    title: cleanJioSaavnText(raw.song || raw.title || "Mountain Melody"),
    artist: cleanJioSaavnText(raw.singers || raw.primary_artists || raw.artist || "Pahadi Artist"),
    movie: cleanJioSaavnText(raw.album || raw.album_name || "Pahadi Classics"),
    year: raw.year ? String(raw.year) : "2024",
    category: "folk" as const,
    duration: durFormatted,
    videoId: "",
    audioFileUrl: highQualityUrl || mediumQualityUrl || rawUrl,
    imageUrl: coverArt,
    hasLyrics: raw.has_lyrics === "true" || raw.has_lyrics === true,
    lyricsSnippet: raw.lyrics_snippet ? cleanJioSaavnText(raw.lyrics_snippet) : undefined,
    source: "jiosaavn" as const,
    custom: true
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // --- API ROUTE: JioSaavn Search (80M+ Songs) ---
  app.get("/api/jiosaavn/search", async (req, res) => {
    try {
      const query = String(req.query.query || "pahadi").trim();
      const page = parseInt(String(req.query.page || "1"), 10) || 1;
      const limit = parseInt(String(req.query.limit || "20"), 10) || 20;

      const saavnUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=${encodeURIComponent(query)}&p=${page}&n=${limit}`;
      const resp = await fetch(saavnUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (!resp.ok) {
        return res.json({ results: [], total: 0 });
      }

      const data = await resp.json();
      const rawSongs = data.results || [];
      const formatted = rawSongs.map(formatJioSaavnSong).filter((s: any) => Boolean(s.audioFileUrl));
      const uniqueResults = deduplicateSongsList(formatted);

      res.json({
        results: uniqueResults,
        total: uniqueResults.length,
        query
      });
    } catch (err: any) {
      console.error("JioSaavn search API error:", err?.message || String(err));
      res.status(500).json({ error: "Failed to search JioSaavn", results: [] });
    }
  });

  // --- API ROUTE: Direct Audio Stream Proxy (Bypasses CDN CORS & device restrictions) ---
  app.get("/api/audio-proxy", async (req, res) => {
    try {
      const audioUrl = String(req.query.url || "").trim();
      if (!audioUrl || !audioUrl.startsWith("http")) {
        return res.status(400).send("Invalid audio URL");
      }

      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.jiosaavn.com/"
      };

      if (req.headers.range) {
        headers["Range"] = req.headers.range;
      }

      const response = await fetch(audioUrl, { headers });

      if (!response.ok && response.status !== 206) {
        return res.status(response.status).send("Failed to stream audio");
      }

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Range, Origin, Content-Type");
      res.setHeader("Accept-Ranges", "bytes");

      const contentType = response.headers.get("content-type") || "audio/mp4";
      res.setHeader("Content-Type", contentType);

      const contentLength = response.headers.get("content-length");
      if (contentLength) res.setHeader("Content-Length", contentLength);

      const contentRange = response.headers.get("content-range");
      if (contentRange) res.setHeader("Content-Range", contentRange);

      res.status(response.status);

      if (response.body) {
        const reader = response.body.getReader();
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (!res.writableEnded) {
                res.write(Buffer.from(value));
              }
            }
            if (!res.writableEnded) res.end();
          } catch (streamErr) {
            if (!res.writableEnded) res.end();
          }
        };
        pump();
      } else {
        res.end();
      }
    } catch (err: any) {
      console.error("Audio proxy error:", err?.message || String(err));
      if (!res.headersSent) {
        res.status(500).send("Audio streaming proxy error");
      }
    }
  });

  // --- API ROUTE: Direct Audio Download Proxy (Forces File Download to Device) ---
  app.get("/api/download", async (req, res) => {
    try {
      const audioUrl = String(req.query.url || "").trim();
      let filename = String(req.query.filename || "Sovio_Mountain_Song").trim();

      if (!audioUrl || !audioUrl.startsWith("http")) {
        return res.status(400).send("Invalid audio URL");
      }

      // Sanitize filename
      filename = filename.replace(/[^a-zA-Z0-9_\-\.\s]/g, "").trim();
      if (!filename.endsWith(".m4a") && !filename.endsWith(".mp3")) {
        filename += ".m4a";
      }

      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.jiosaavn.com/"
      };

      const response = await fetch(audioUrl, { headers });

      if (!response.ok) {
        return res.status(response.status).send("Failed to fetch audio for download");
      }

      const contentType = response.headers.get("content-type") || "audio/mp4";
      const contentLength = response.headers.get("content-length");

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);

      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }

      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.writableEnded) {
            res.write(Buffer.from(value));
          }
        }
        if (!res.writableEnded) res.end();
      } else {
        res.end();
      }
    } catch (err: any) {
      console.error("Audio download error:", err?.message || String(err));
      if (!res.headersSent) {
        res.status(500).send("Failed to process audio download");
      }
    }
  });

  // --- API ROUTE: JioSaavn Curated Trending & Categories ---
  app.get("/api/jiosaavn/trending", async (req, res) => {
    try {
      const category = String(req.query.category || "pahadi").toLowerCase();
      let query = "pahadi songs";
      if (category === "himachali") query = "himachali nati pahadi";
      else if (category === "garhwali") query = "garhwali songs narendra singh negi";
      else if (category === "kumaoni") query = "kumaoni lokgeet inder arya";
      else if (category === "arijit") query = "arijit singh acoustic soulful";
      else if (category === "mohit") query = "mohit chauhan pahadi himachali";
      else if (category === "jubin") query = "jubin nautiyal uttarakhand pahadi";
      else if (category === "retro") query = "evergreen pahadi old classics";
      else if (category === "bollywood") query = "bollywood evergreen acoustic sukoon";

      const saavnUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=${encodeURIComponent(query)}&p=1&n=30`;
      const resp = await fetch(saavnUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      if (!resp.ok) {
        return res.json({ results: [] });
      }

      const data = await resp.json();
      const rawSongs = data.results || [];
      const formatted = rawSongs.map(formatJioSaavnSong).filter((s: any) => Boolean(s.audioFileUrl));
      const uniqueResults = deduplicateSongsList(formatted);

      res.json({ results: uniqueResults, category });
    } catch (err: any) {
      console.error("JioSaavn trending error:", err?.message || String(err));
      res.status(500).json({ error: "Failed to fetch JioSaavn trending", results: [] });
    }
  });

  // --- API ROUTE: JioSaavn Lyrics ---
  app.get("/api/jiosaavn/lyrics", async (req, res) => {
    try {
      const id = String(req.query.id || "").replace(/^jiosaavn-/, "");
      if (!id) {
        return res.status(400).json({ error: "Missing song ID" });
      }

      const lyricsUrl = `https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&_format=json&_marker=0&cc=in&lyrics_id=${encodeURIComponent(id)}`;
      const resp = await fetch(lyricsUrl);
      if (!resp.ok) {
        return res.json({ lyrics: null });
      }

      const data = await resp.json();
      if (data && data.lyrics) {
        const clean = data.lyrics
          .replace(/<br\s*[\/]?>/gi, "\n")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&#039;/g, "'");
        return res.json({ lyrics: clean, source: "jiosaavn" });
      }
      res.json({ lyrics: null });
    } catch (err: any) {
      console.error("JioSaavn lyrics error:", err?.message || String(err));
      res.json({ lyrics: null });
    }
  });

  // Initialize Gemini AI lazily inside handler
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    return new GoogleGenAI({ apiKey });
  };

  // --- API ROUTE: Gemini Pahadi RJ & Storyteller ---
  app.post("/api/gemini/pahadi-rj", async (req, res) => {
    try {
      const { type, topic, location = "Shimla" } = req.body;
      const ai = getAiClient();

      let systemPrompt = `You are "Kaka Ji" (or Chacha Ji), a warm, wise, vintage Pahadi Radio Jockey broadcasting from a quiet hilltop station in ${location}, Himachal Pradesh/Uttarakhand. 
You speak in a blend of gentle Hindi, English, and authentic Pahadi expressions (like 'Kiyan ho', 'Dagdi', 'Mijaj', 'Bhaloo', 'Jula').
Keep responses concise, atmospheric, nostalgic, and deeply poetic—evoking chai, pine breeze, cold mountain sunshine, HRTC bus rides, rain on tin roofs, and ancient Himalayan folklore.`;

      let promptText = "";
      if (type === "quote") {
        promptText = "Share a short, deeply poetic 1-2 sentence Pahadi nostalgia quote in Hindi & English.";
      } else if (type === "announcement") {
        promptText = `Make a nostalgic 3-sentence radio broadcast announcement for passengers traveling on the HRTC bus route near ${location}.`;
      } else if (type === "story") {
        promptText = `Tell a short nostalgic story or legend (4-5 sentences) about ${topic || "snowfall in the deodar forests"}.`;
      } else if (type === "recipe") {
        promptText = `Share a quick nostalgic Pahadi recipe introduction (like Siddu, Dham, Madra, or Gahat Soup) with warmth and passion.`;
      } else {
        promptText = topic || "Say hello to the mountain listeners tuning in today.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nTask: ${promptText}` }] }
        ]
      });

      const text = response.text || "Pahadon ki thandi dhoop jaisa sukoon...";
      res.json({ text });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate Pahadi RJ broadcast",
        fallbackText: "\"Pahadon ki thandi dhoop jaisa sukoon...\""
      });
    }
  });

  // --- API ROUTE: Google Drive Proxy - Save Memory Log ---
  app.post("/api/drive/save", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Missing Authorization header" });
      }

      const { title, content, tags, location } = req.body;
      const safeTitle = typeof title === 'string' ? title : String(title || 'Pahadi_Memory');
      const safeContent = typeof content === 'string' ? content : String(content || '');
      const safeLocation = typeof location === 'string' ? location : 'Shimla';
      const safeTags = Array.isArray(tags) ? tags.map((t) => String(t)) : [];

      // 1. Search for existing folder "Sovio_Pahadi_Memories" (or fallback to "Panwar_Pahadi_Memories")
      const folderSearchRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=" +
          encodeURIComponent("(name = 'Sovio_Pahadi_Memories' or name = 'Panwar_Pahadi_Memories') and mimeType = 'application/vnd.google-apps.folder' and trashed = false"),
        {
          headers: { Authorization: authHeader }
        }
      );

      let folderId = "";
      if (folderSearchRes.ok) {
        const folderData = await folderSearchRes.json();
        if (folderData.files && folderData.files.length > 0) {
          folderId = folderData.files[0].id;
        }
      }

      // 2. If folder doesn't exist, create it
      if (!folderId) {
        const createFolderRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: "Sovio_Pahadi_Memories",
            mimeType: "application/vnd.google-apps.folder"
          })
        });

        if (createFolderRes.ok) {
          const newFolder = await createFolderRes.json();
          folderId = newFolder.id;
        }
      }

      // 3. Create the file inside the folder using Multipart Upload
      const metadata = {
        name: `${safeTitle}_${Date.now()}.json`,
        parents: folderId ? [folderId] : [],
        mimeType: "application/json"
      };

      const memoryObject = {
        title: safeTitle,
        content: safeContent,
        tags: safeTags,
        location: safeLocation,
        timestamp: new Date().toISOString(),
        source: "SOVIO Pahadi Nostalgia App"
      };

      const boundary = "-------314159265358979323846";
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(memoryObject, null, 2) +
        close_delim;

      const saveRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        }
      );

      if (!saveRes.ok) {
        const errText = await saveRes.text();
        throw new Error(`Drive upload failed: ${errText}`);
      }

      const fileData = await saveRes.json();
      res.json({ success: true, file: fileData });
    } catch (error: any) {
      console.error("Drive save error:", error);
      res.status(500).json({ error: error.message || "Failed to save to Google Drive" });
    }
  });

  app.get("/api/drive/memories", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Missing Authorization header" });
      }

      // Search for folder
      const folderSearchRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=" +
          encodeURIComponent("(name = 'Sovio_Pahadi_Memories' or name = 'Panwar_Pahadi_Memories') and mimeType = 'application/vnd.google-apps.folder' and trashed = false"),
        {
          headers: { Authorization: authHeader }
        }
      );

      if (!folderSearchRes.ok) {
        return res.json({ memories: [] });
      }

      const folderData = await folderSearchRes.json();
      if (!folderData.files || folderData.files.length === 0) {
        return res.json({ memories: [] });
      }

      const folderId = folderData.files[0].id;

      // List JSON files inside folder
      const filesRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and trashed = false`)}&fields=files(id,name,createdTime)&orderBy=createdTime desc`,
        {
          headers: { Authorization: authHeader }
        }
      );

      if (!filesRes.ok) {
        return res.json({ memories: [] });
      }

      const filesData = await filesRes.json();

      // Fetch contents of the recent files (up to 10)
      const recentFiles = (filesData.files || []).slice(0, 10);
      const memories = await Promise.all(
        recentFiles.map(async (file: any) => {
          try {
            const contentRes = await fetch(
              `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
              { headers: { Authorization: authHeader } }
            );
            if (contentRes.ok) {
              const memory = await contentRes.json();
              return { ...memory, id: file.id };
            }
          } catch (e) {
            // fallback if not valid json
          }
          return { id: file.id, title: file.name, timestamp: file.createdTime };
        })
      );

      res.json({ memories: memories.filter(Boolean) });
    } catch (error: any) {
      console.error("Drive list error:", error);
      res.status(500).json({ error: error.message || "Failed to list Google Drive memories" });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SOVIO Pahadi Nostalgia server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
