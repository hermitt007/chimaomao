// YouTube utilities for client-side operations

export interface YouTubeVideoInfo {
  videoId: string
  title: string
  author: string
  duration: number
  thumbnail: string
  hasDownload: boolean
  embedUrl: string
  previewOnly?: boolean
}

// Extract YouTube video ID from URL
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Get YouTube video info from our API
export async function getYouTubeInfo(url: string): Promise<YouTubeVideoInfo> {
  const response = await fetch("/api/youtube/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, action: "info" }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Error getting YouTube info")
  }

  const data = await response.json()

  return {
    videoId: data.videoId,
    title: data.title || "Video de YouTube",
    author: data.author || "Unknown",
    duration: data.duration || 0,
    thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${data.videoId}/maxresdefault.jpg`,
    hasDownload: data.hasDownload ?? true,
    embedUrl: data.embedUrl || `https://www.youtube.com/embed/${data.videoId}`,
    previewOnly: data.previewOnly || false,
  }
}

export async function downloadYouTubeVideo(url: string, onProgress?: (progress: number) => void): Promise<Blob> {
  onProgress?.(10)

  const response = await fetch("/api/youtube/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, action: "download" }),
  })

  onProgress?.(30)

  // Check if response is JSON (error or directUrl) or binary (video)
  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    const data = await response.json()

    // If we got a direct URL, try to fetch it client-side
    if (data.directUrl) {
      onProgress?.(40)
      console.log("[v0] Trying direct URL download...")

      try {
        const directResponse = await fetch(data.directUrl)
        if (directResponse.ok) {
          onProgress?.(70)
          const blob = await directResponse.blob()
          onProgress?.(100)
          return blob
        }
      } catch (err) {
        console.log("[v0] Direct URL download failed:", err)
      }
    }

    // If error, throw it
    if (data.error) {
      throw new Error(data.error)
    }

    throw new Error("No se pudo descargar el video")
  }

  // Response is binary video data
  if (!response.ok) {
    throw new Error("Error al descargar el video de YouTube")
  }

  onProgress?.(60)

  const blob = await response.blob()

  // Verify we got a video
  if (blob.size < 1000) {
    throw new Error("El archivo descargado es muy pequeño. Intenta con otro video.")
  }

  onProgress?.(100)
  return blob
}

// Create object URL from YouTube video for use in video element
export async function getYouTubeVideoAsObjectUrl(
  url: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const blob = await downloadYouTubeVideo(url, onProgress)
  return URL.createObjectURL(blob)
}

// Format duration from seconds to MM:SS
export function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
