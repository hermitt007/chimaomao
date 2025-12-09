export interface YouTubeVideoInfo {
  videoId: string
  title: string
  thumbnail: string
  embedUrl: string
}

export function parseYouTubeUrl(url: string): YouTubeVideoInfo | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      return {
        videoId,
        title: "Video de YouTube",
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0`,
      }
    }
  }

  return null
}

export function getYouTubeThumbnail(videoId: string, quality: "default" | "medium" | "high" | "max" = "max"): string {
  const qualityMap = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    max: "maxresdefault",
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}
