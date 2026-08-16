package com.sovio.music.network

import com.google.gson.JsonParser
import com.sovio.music.model.SongItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.net.URLEncoder
import java.util.concurrent.TimeUnit
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec

class JioSaavnRepository {

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val desKey = "38346591".toByteArray(Charsets.UTF_8)

    suspend fun searchSongs(query: String): List<SongItem> = withContext(Dispatchers.IO) {
        try {
            val encodedQuery = URLEncoder.encode(query, "UTF-8")
            val url = "https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=$encodedQuery&p=1&n=30"
            
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 14)")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                parseJioSaavnResponse(body)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun normalizeTitle(title: String): String {
        return title.lowercase()
            .replace(Regex("\\(.*?\\)"), "")
            .replace(Regex("\\[.*?\\]"), "")
            .replace(Regex("(?i)-?\\s*(from|audio|lyrics|official|video|soundtrack|lo-fi|lofi|remix|version|reprise|acoustic).*"), "")
            .replace(Regex("[^a-z0-9]"), "")
            .trim()
    }

    private fun deduplicateSongs(songs: List<SongItem>): List<SongItem> {
        val seenIds = mutableSetOf<String>()
        val seenKeys = mutableSetOf<String>()
        val uniqueList = mutableListOf<SongItem>()

        for (song in songs) {
            val idKey = song.id.lowercase().trim()
            if (idKey.isNotEmpty() && seenIds.contains(idKey)) continue

            val cleanTitle = normalizeTitle(song.title)
            val primaryArtist = song.artist.split(",", "/", "&", "|").firstOrNull()?.lowercase()?.replace(Regex("[^a-z0-9]"), "") ?: ""
            val compositeKey = "${cleanTitle}_$primaryArtist"

            if (cleanTitle.isNotEmpty() && seenKeys.contains(compositeKey)) continue

            if (idKey.isNotEmpty()) seenIds.add(idKey)
            if (cleanTitle.isNotEmpty()) seenKeys.add(compositeKey)

            uniqueList.add(song)
        }
        return uniqueList
    }

    private fun parseJioSaavnResponse(jsonStr: String): List<SongItem> {
        val resultList = mutableListOf<SongItem>()
        try {
            val jsonObject = JsonParser.parseString(jsonStr).asJsonObject
            val resultsArray = jsonObject.getAsJsonArray("results") ?: return emptyList()

            for (element in resultsArray) {
                val item = element.asJsonObject
                val id = item.get("id")?.asString ?: "saavn_${System.currentTimeMillis()}"
                val songName = item.get("song")?.asString ?: "Unknown Track"
                val album = item.get("album")?.asString ?: ""
                val primaryArtists = item.get("primary_artists")?.asString ?: "Artist"
                val year = item.get("year")?.asString ?: "2024"
                val durationSec = item.get("duration")?.asString?.toIntOrNull() ?: 240
                val durationFormatted = String.format("%d:%02d", durationSec / 60, durationSec % 60)
                
                var image = item.get("image")?.asString ?: ""
                image = image.replace("150x150", "500x500").replace("http://", "https://")

                val encryptedUrl = item.get("encrypted_media_url")?.asString ?: ""
                val audioStreamUrl = if (encryptedUrl.isNotEmpty()) decryptUrl(encryptedUrl) else null

                if (audioStreamUrl != null) {
                    val hqAudio = audioStreamUrl.replace("_96.mp4", "_320.mp4")
                        .replace("_160.mp4", "_320.mp4")

                    resultList.add(
                        SongItem(
                            id = "jiosaavn-$id",
                            title = songName.replace("&quot;", "\"").replace("&amp;", "&"),
                            artist = primaryArtists.replace("&quot;", "\"").replace("&amp;", "&"),
                            movie = album.replace("&quot;", "\"").replace("&amp;", "&"),
                            year = year,
                            category = "jiosaavn",
                            duration = durationFormatted,
                            audioFileUrl = hqAudio,
                            imageUrl = image,
                            source = "jiosaavn"
                        )
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return deduplicateSongs(resultList)
    }

    private fun decryptUrl(encryptedBase64: String): String? {
        return try {
            val cipher = Cipher.getInstance("DES/ECB/PKCS5Padding")
            val keySpec = SecretKeySpec(desKey, "DES")
            cipher.init(Cipher.DECRYPT_MODE, keySpec)
            val decodedBytes = android.util.Base64.decode(encryptedBase64, android.util.Base64.DEFAULT)
            val decryptedBytes = cipher.doFinal(decodedBytes)
            String(decryptedBytes, Charsets.UTF_8)
        } catch (e: Exception) {
            null
        }
    }
}
