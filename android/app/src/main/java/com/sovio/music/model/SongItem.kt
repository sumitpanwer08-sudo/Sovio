package com.sovio.music.model

data class SongItem(
    val id: String,
    val title: String,
    val artist: String = "Arijit Singh",
    val movie: String = "Bollywood Melodies",
    val year: String = "2024",
    val category: String = "soulful",
    val duration: String = "4:00",
    val videoId: String = "",
    val audioFileUrl: String? = null,
    val imageUrl: String? = null,
    val source: String = "jiosaavn"
)

data class RadioStation(
    val id: String,
    val name: String,
    val tagline: String,
    val frequency: String,
    val songs: List<SongItem>,
    val defaultQuotes: List<String>
)

data class AmbientSound(
    val id: String,
    val name: String,
    val iconName: String,
    val volume: Float = 0.3f,
    val isPlaying: Boolean = false
)
