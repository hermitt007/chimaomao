"use client"

import type React from "react"
import type { BackgroundVideoSelectorProps } from "@/types" // Import BackgroundVideoSelectorProps

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Check,
  Play,
  Link,
  Plus,
  X,
  AlertTriangle,
  VideoIcon,
  Upload,
  Loader2,
  Youtube,
  Download,
  Clock,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import type { BackgroundVideo } from "@/components/video-generator"
import { getYouTubeInfo, formatDuration, type YouTubeVideoInfo } from "@/lib/youtube-utils"

const categories = ["Custom", "Satisfactorio", "Subway S.", "Minecraft", "Fortnite", "GTA", "Roblox", "Abstract"]

const backgroundVideos: BackgroundVideo[] = [
  // Minecraft / Gaming style
  {
    id: "mc1",
    category: "Minecraft",
    thumbnail: "/dark-tunnel-parkour-minecraft.jpg",
    videoUrl: "https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4",
    title: "Parkour 1",
  },
  {
    id: "mc2",
    category: "Minecraft",
    thumbnail: "/night-sky-stars-building.jpg",
    videoUrl: "https://videos.pexels.com/video-files/1851190/1851190-uhd_2560_1440_24fps.mp4",
    title: "Night Sky",
  },
  {
    id: "mc3",
    category: "Minecraft",
    thumbnail: "/dark-cave-exploration-underground.jpg",
    videoUrl: "https://videos.pexels.com/video-files/2795173/2795173-uhd_2560_1440_25fps.mp4",
    title: "Cave",
  },
  {
    id: "mc4",
    category: "Minecraft",
    thumbnail: "/colorful-creative-flying-birds.jpg",
    videoUrl: "https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_24fps.mp4",
    title: "Creative",
  },
  // Subway Surfers style
  {
    id: "ss1",
    category: "Subway S.",
    thumbnail: "/neon-city-night-cyberpunk-running.jpg",
    videoUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
    title: "Neon City",
  },
  {
    id: "ss2",
    category: "Subway S.",
    thumbnail: "/train-speed-motion-blur-railway.jpg",
    videoUrl: "https://videos.pexels.com/video-files/1826896/1826896-uhd_2560_1440_24fps.mp4",
    title: "Train Speed",
  },
  {
    id: "ss3",
    category: "Subway S.",
    thumbnail: "/city-running-fast-motion-urban.jpg",
    videoUrl: "https://videos.pexels.com/video-files/2519660/2519660-uhd_2560_1440_24fps.mp4",
    title: "City Run",
  },
  {
    id: "ss4",
    category: "Subway S.",
    thumbnail: "/highway-speed-lights-night-driving.jpg",
    videoUrl: "https://videos.pexels.com/video-files/2547223/2547223-uhd_2560_1440_24fps.mp4",
    title: "Highway",
  },
  // Fortnite style
  {
    id: "fn1",
    category: "Fortnite",
    thumbnail: "/colorful-action-explosion-gaming.jpg",
    videoUrl: "https://videos.pexels.com/video-files/5752729/5752729-uhd_2560_1440_30fps.mp4",
    title: "Action",
  },
  {
    id: "fn2",
    category: "Fortnite",
    thumbnail: "/explosion-colorful-particles-fire.jpg",
    videoUrl: "https://videos.pexels.com/video-files/6981411/6981411-uhd_2560_1440_25fps.mp4",
    title: "Build",
  },
  // Satisfactorio
  {
    id: "sat1",
    category: "Satisfactorio",
    thumbnail: "/satisfying-colorful-slime-asmr.jpg",
    videoUrl: "https://videos.pexels.com/video-files/4065924/4065924-uhd_2560_1440_30fps.mp4",
    title: "Colors",
  },
  {
    id: "sat2",
    category: "Satisfactorio",
    thumbnail: "/satisfying-pastel-soap-cutting.jpg",
    videoUrl: "https://videos.pexels.com/video-files/5532771/5532771-uhd_2560_1440_25fps.mp4",
    title: "Pastel",
  },
  {
    id: "sat3",
    category: "Satisfactorio",
    thumbnail: "/water-flowing-satisfying-blue.jpg",
    videoUrl: "https://videos.pexels.com/video-files/1918465/1918465-uhd_2560_1440_24fps.mp4",
    title: "Water",
  },
  {
    id: "sat4",
    category: "Satisfactorio",
    thumbnail: "/ink-mixing-colorful-satisfying.jpg",
    videoUrl: "https://videos.pexels.com/video-files/4125223/4125223-uhd_2560_1440_25fps.mp4",
    title: "Ink Mix",
  },
  // GTA style
  {
    id: "gta1",
    category: "GTA",
    thumbnail: "/night-drive-city-lights-car.jpg",
    videoUrl: "https://videos.pexels.com/video-files/3015510/3015510-uhd_2560_1440_24fps.mp4",
    title: "Night Drive",
  },
  {
    id: "gta2",
    category: "GTA",
    thumbnail: "/placeholder.svg?height=160&width=90",
    videoUrl: "https://videos.pexels.com/video-files/2659172/2659172-uhd_2560_1440_30fps.mp4",
    title: "Chase",
  },
  {
    id: "gta3",
    category: "GTA",
    thumbnail: "/placeholder.svg?height=160&width=90",
    videoUrl: "https://videos.pexels.com/video-files/1580507/1580507-uhd_2732_1440_24fps.mp4",
    title: "Sunset",
  },
  // Roblox style
  {
    id: "rob1",
    category: "Roblox",
    thumbnail: "/placeholder.svg?height=160&width=90",
    videoUrl: "https://videos.pexels.com/video-files/5377684/5377684-uhd_2560_1440_25fps.mp4",
    title: "Colors",
  },
  {
    id: "rob2",
    category: "Roblox",
    thumbnail: "/placeholder.svg?height=160&width=90",
    videoUrl: "https://videos.pexels.com/video-files/4488162/4488162-uhd_2560_1440_25fps.mp4",
    title: "Fun",
  },
  // Abstract
  {
    id: "abs1",
    category: "Abstract",
    thumbnail: "/placeholder.svg?height=160&width=90",
    videoUrl: "https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4",
    title: "Gradient",
  },
  {
    id: "abs2",
    category: "Abstract",
    thumbnail: "/placeholder.svg?height=160&width=90",
    videoUrl: "https://videos.pexels.com/video-files/4065924/4065924-uhd_2560_1440_30fps.mp4",
    title: "Particles",
  },
  {
    id: "abs3",
    category: "Abstract",
    thumbnail: "/placeholder.svg?height=160&width=90",
    videoUrl: "https://videos.pexels.com/video-files/4125223/4125223-uhd_2560_1440_25fps.mp4",
    title: "Smoke",
  },
]

export function BackgroundVideoSelector({ selectedVideo, setSelectedVideo }: BackgroundVideoSelectorProps) {
  const [activeCategory, setActiveCategory] = useState("Minecraft")
  const [customVideoUrl, setCustomVideoUrl] = useState("")
  const [customVideos, setCustomVideos] = useState<BackgroundVideo[]>([])
  const [urlError, setUrlError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const [youtubePreview, setYoutubePreview] = useState<YouTubeVideoInfo | null>(null)
  const [youtubeDownloading, setYoutubeDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const filteredVideos =
    activeCategory === "Custom" ? customVideos : backgroundVideos.filter((v) => v.category === activeCategory)

  const handleYoutubePreview = async () => {
    if (!youtubeUrl.trim()) {
      setUrlError("Ingresa una URL de YouTube")
      return
    }

    const isYoutubeUrl = youtubeUrl.includes("youtube.com") || youtubeUrl.includes("youtu.be")

    if (!isYoutubeUrl) {
      setUrlError("Ingresa una URL válida de YouTube")
      return
    }

    setYoutubeLoading(true)
    setUrlError("")
    setYoutubePreview(null)

    try {
      const info = await getYouTubeInfo(youtubeUrl)
      setYoutubePreview(info)
    } catch (error: any) {
      setUrlError(error.message || "Error al obtener información del video")
    } finally {
      setYoutubeLoading(false)
    }
  }

  // Dentro de tu componente...

const handleDownloadYoutubeVideo = async () => {
    // 1. Usar el estado correcto: youtubeUrl
    if (!youtubeUrl) return

    // 2. Usar los estados correctos: youtubeDownloading y setUrlError
    setYoutubeDownloading(true)
    setUrlError("") // Limpiar errores previos

    try {
      // Llamamos a NUESTRO backend (que protege la clave)
      const response = await fetch("/api/youtube/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Error en la descarga")
      }

      // --- TRUCO PARA FORZAR LA DESCARGA EN EL NAVEGADOR ---
      const blob = await response.blob()
      
      // Creamos una URL temporal para ese archivo
      const downloadUrl = window.URL.createObjectURL(blob)
      
      // OPCIONAL: Si quieres agregarlo automáticamente a la lista "Custom" 
      // para usarlo de inmediato sin tener que subirlo manualmente:
      const newVideo: BackgroundVideo = {
         id: `downloaded-${Date.now()}`,
         category: "Custom",
         thumbnail: youtubePreview?.thumbnail || "/placeholder.svg?height=160&width=90",
         videoUrl: downloadUrl, // Usamos el blob local
         title: youtubePreview?.title || "Video Descargado",
         isYoutube: false, // Ya es un archivo local (blob)
      }
      setCustomVideos((prev) => [...prev, newVideo])
      setSelectedVideo(newVideo)
      setActiveCategory("Custom")
      setYoutubeUrl("") // Limpiar input

      console.log("Descarga completada y agregada")

    } catch (err: any) {
      console.error(err)
      setUrlError(err.message) // 3. Usar setUrlError
    } finally {
      setYoutubeDownloading(false) // 4. Usar setYoutubeDownloading
    }
  }


  const handleAddYoutubePreviewOnly = () => {
    if (!youtubePreview) return

    const newVideo: BackgroundVideo = {
      id: `youtube-preview-${youtubePreview.videoId}-${Date.now()}`,
      category: "Custom",
      thumbnail: youtubePreview.thumbnail,
      videoUrl: `https://www.youtube.com/embed/${youtubePreview.videoId}?autoplay=1&mute=1&loop=1&playlist=${youtubePreview.videoId}`,
      title: youtubePreview.title.substring(0, 25),
      isYoutube: true,
      youtubeId: youtubePreview.videoId,
      duration: youtubePreview.duration,
    }

    setCustomVideos([...customVideos, newVideo])
    setSelectedVideo(newVideo)
    setYoutubeUrl("")
    setYoutubePreview(null)
    setActiveCategory("Custom")
  }

  const handleAddCustomVideo = () => {
    setUrlError("")

    if (!customVideoUrl.trim()) {
      setUrlError("Ingresa una URL de video")
      return
    }

    if (customVideoUrl.includes("youtube.com") || customVideoUrl.includes("youtu.be")) {
      setYoutubeUrl(customVideoUrl)
      setCustomVideoUrl("")
      setUrlError("Para videos de YouTube, usa la pestaña 'YouTube'")
      return
    }

    const isValidUrl =
      customVideoUrl.match(/^https?:\/\/.+\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i) ||
      customVideoUrl.includes("pexels.com") ||
      customVideoUrl.includes("pixabay.com") ||
      customVideoUrl.includes("coverr.co") ||
      customVideoUrl.includes("blob:")

    if (!isValidUrl) {
      setUrlError("Ingresa una URL válida de video (.mp4, .webm)")
      return
    }

    const newVideo: BackgroundVideo = {
      id: `custom-${Date.now()}`,
      category: "Custom",
      thumbnail: "/placeholder.svg?height=160&width=90",
      videoUrl: customVideoUrl,
      title: customVideoUrl.replace(/\.[^/.]+$/, "").substring(0, 20),
    }

    setCustomVideos((prev) => [...prev, newVideo])
    setSelectedVideo(newVideo)
    setCustomVideoUrl("")
    setActiveCategory("Custom")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("video/")) {
      setUrlError("Por favor selecciona un archivo de video válido")
      return
    }

    if (file.size > 500 * 1024 * 1024) {
      setUrlError("El archivo es muy grande. Máximo 500MB")
      return
    }

    setIsUploading(true)
    setUrlError("")

    try {
      const videoUrl = URL.createObjectURL(file)
      const thumbnailUrl = await generateVideoThumbnail(videoUrl)

      const newVideo: BackgroundVideo = {
        id: `upload-${Date.now()}`,
        category: "Custom",
        thumbnail: thumbnailUrl,
        videoUrl: videoUrl,
        title: file.name.replace(/\.[^/.]+$/, "").substring(0, 20),
      }

      setCustomVideos((prev) => [...prev, newVideo])
      setSelectedVideo(newVideo)
      setActiveCategory("Custom")
    } catch (error) {
      setUrlError("Error al procesar el video")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement("video")
      video.crossOrigin = "anonymous"
      video.src = videoUrl
      video.muted = true
      video.currentTime = 1

      video.onloadeddata = () => {
        const canvas = document.createElement("canvas")
        canvas.width = 90
        canvas.height = 160
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL("image/jpeg", 0.7))
        } else {
          resolve("/placeholder.svg?height=160&width=90")
        }
      }

      video.onerror = () => {
        resolve("/placeholder.svg?height=160&width=90")
      }

      video.load()
    })
  }

  const handleRemoveCustomVideo = (videoId: string) => {
    const video = customVideos.find((v) => v.id === videoId)
    if (video?.videoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(video.videoUrl)
    }
    setCustomVideos(customVideos.filter((v) => v.id !== videoId))
    if (selectedVideo?.id === videoId) {
      setSelectedVideo(null as any)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">Seleccionar Video de Fondo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Categories */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2",
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80",
                )}
              >
                {category === "Custom" && <Link className="w-4 h-4" />}
                {category}
                {category === "Custom" && customVideos.length > 0 && (
                  <span className="bg-primary/20 text-primary text-xs px-1.5 rounded-full">{customVideos.length}</span>
                )}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {activeCategory === "Custom" && (
          <div className="space-y-4 p-4 bg-secondary/50 rounded-lg border border-border">
            <Tabs defaultValue="youtube" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="youtube" className="gap-2">
                  <Youtube className="w-4 h-4" />
                  YouTube
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Subir
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2">
                  <Link className="w-4 h-4" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="youtube" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <span>Pega un link de YouTube para descargar y usar el video</span>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value)
                      setUrlError("")
                      setYoutubePreview(null)
                    }}
                    className="flex-1 bg-background"
                    disabled={youtubeLoading || youtubeDownloading}
                  />
                  <Button
                    onClick={handleYoutubePreview}
                    disabled={youtubeLoading || youtubeDownloading}
                    variant="outline"
                    className="gap-2 bg-transparent"
                  >
                    {youtubeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Buscar
                  </Button>
                </div>

                {youtubePreview && (
                  <div className="border border-border rounded-lg overflow-hidden bg-background">
                    <div className="aspect-video relative">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubePreview.videoId}`}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-3 space-y-3">
                      <div>
                        <h4 className="font-medium text-sm line-clamp-2">{youtubePreview.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{youtubePreview.author}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(youtubePreview.duration)}
                          </span>
                        </div>
                      </div>

                      {youtubeDownloading && (
                        <div className="space-y-2">
                          <Progress value={downloadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground text-center">
                            Descargando video... {downloadProgress}%
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={handleDownloadYoutubeVideo}
                          className="flex-1 gap-2"
                          disabled={youtubeDownloading}
                        >
                          {youtubeDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          Descargar y usar
                        </Button>
                        <Button
                          onClick={handleAddYoutubePreviewOnly}
                          variant="outline"
                          className="gap-2 bg-transparent"
                          disabled={youtubeDownloading}
                        >
                          <Play className="w-4 h-4" />
                          Solo preview
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        "Descargar" permite generar video final. "Solo preview" es para vista previa únicamente.
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Soporta: youtube.com, youtu.be, YouTube Shorts
                </p>
              </TabsContent>

              <TabsContent value="upload" className="space-y-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <VideoIcon className="w-5 h-5 text-primary" />
                  <span>Sube un video desde tu dispositivo (MP4, WebM, MOV)</span>
                </div>

                <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full gap-2"
                  variant="outline"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Seleccionar Video
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">Máximo 500MB. Formatos: MP4, WebM, MOV</p>
              </TabsContent>

              <TabsContent value="url" className="space-y-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link className="w-5 h-5 text-primary" />
                  <span>Pega la URL directa de un video (no YouTube)</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/video.mp4"
                    value={customVideoUrl}
                    onChange={(e) => {
                      setCustomVideoUrl(e.target.value)
                      setUrlError("")
                    }}
                    className="flex-1 bg-background"
                  />
                  <Button onClick={handleAddCustomVideo} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {urlError && <p className="text-sm text-destructive">{urlError}</p>}

            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <AlertTriangle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Fuentes recomendadas de videos gratis:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>youtube.com (usa la pestaña YouTube)</li>
                  <li>pexels.com/videos</li>
                  <li>pixabay.com/videos</li>
                  <li>coverr.co</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Video Grid */}
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {filteredVideos.length === 0 && activeCategory === "Custom" ? (
              <div className="w-full py-8 text-center text-muted-foreground">
                <VideoIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay videos personalizados</p>
                <p className="text-xs">Añade un video de YouTube, sube uno o usa una URL</p>
              </div>
            ) : (
              filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className={cn(
                    "relative flex-shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 group",
                    selectedVideo?.id === video.id
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:ring-2 hover:ring-primary/50",
                  )}
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="w-[90px] h-[160px] relative">
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* YouTube badge */}
                    {video.isYoutube && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1 rounded">
                        YT Preview
                      </div>
                    )}

                    {/* Downloaded YouTube badge */}
                    {video.youtubeId && !video.isYoutube && (
                      <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1 rounded">YT</div>
                    )}

                    {/* Duration badge */}
                    {video.duration && (
                      <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                        {formatDuration(video.duration)}
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs font-medium truncate">{video.title}</p>
                    </div>

                    {selectedVideo?.id === video.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>

                    {activeCategory === "Custom" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveCustomVideo(video.id)
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  )
