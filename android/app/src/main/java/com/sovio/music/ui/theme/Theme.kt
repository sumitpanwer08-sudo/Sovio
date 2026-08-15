package com.sovio.music.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val DarkEmerald = Color(0xFF0D1310)
val ForestGreen = Color(0xFF132018)
val EmeraldPrimary = Color(0xFF34D399)
val AmberAccent = Color(0xFFFBBF24)
val SurfaceDark = Color(0xFF18221B)
val TextPrimary = Color(0xFFE6F4EA)
val TextSecondary = Color(0xFF9CA3AF)

private val SovioColorScheme = darkColorScheme(
    primary = EmeraldPrimary,
    secondary = AmberAccent,
    background = DarkEmerald,
    surface = SurfaceDark,
    onPrimary = Color.Black,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

@Composable
fun SovioMusicTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = SovioColorScheme,
        content = content
    )
}
