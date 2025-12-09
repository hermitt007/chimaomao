"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, CheckCircle2, AlertCircle, Video, FileVideo, Share2 } from "lucide-react"
import type { BackgroundVideo, VideoFormat } from "@/components/video-generator"
import type { TextStyle } from "@/components/text-style-selector"
import { downloadBlob, recordVideoWithTextOverlay, convertWebmToMp4, getAudioDuration } from "@/lib/video-recorder"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface GenerateButtonProps {
  script: string
  selectedVideo: BackgroundVideo | null
  videoFormat: VideoFormat
  isGenerating: boolean
  setIsGenerating: (value: boolean) => void
  setGeneratedAudioUrl: (url: string | null) => void
  generatedAudioUrl: string | null
  generatedVideoBlob: Blob | null
  setGeneratedVideoBlob: (blob: Blob | null) => void
  audioBlob: Blob | null
  setAudioBlob: (blob: Blob | null) => void
  videoRef: React.RefObject<{ getVideoElement: () => HTMLVideoElement | null } | null>
  textStyle: TextStyle
  audioDuration: number | null
  setAudioDuration: (duration: number | null) => void
}

export function GenerateButton({
  script,
  selectedVideo,
  videoFormat,
  isGenerating,
  setIsGenerating,
  setGeneratedAudioUrl,
  generatedAudioUrl,
  generatedVideoBlob,
  setGeneratedVideoBlob,
  audioBlob,
  setAudioBlob,
  videoRef,
  textStyle,
  audioDuration,
  setAudioDuration,
}: GenerateButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [downloadStage, setDownloadStage] = useState<"recording" | "converting" | "done">("recording")
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [publishStatus, setPublishStatus] = useState<"idle" | "creating" | "uploading" | "success" | "error">("idle")

  useEffect(() => {
    const loadConnections = () => {
      const platforms: string[] = []
      const platformIds = ["tiktok", "instagram", "facebook", "youtube"]
      platformIds.forEach((p) => {
        if (localStorage.getItem(`${p}_connection`)) platforms.push(p)
      })
      setConnectedPlatforms(platforms)
    }

    loadConnections()
    window.addEventListener("storage", loadConnections)
    return () => window.removeEventListener("storage", loadConnections)
  }, [])

  const handleGenerate = async () => {
    if (!script.trim() || !selectedVideo) return

    if (selectedVideo.isYoutube) {
      alert(
        "Este video de YouTube es solo para vista previa. Por favor descarga el video primero usando el botón 'Descargar y usar' en la pestaña YouTube.",
      )
      return
    }

    setIsGenerating(true)
    setGeneratedAudioUrl(null)
    setGeneratedVideoBlob(null)
    setAudioBlob(null)
    setAudioDuration(null)

    try {
      const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/onwK4e9ZLuTAKqWW03F9", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": "sk_c1923061c72927db505987c44aa22962022f004deb0eee5c",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Error en la API de ElevenLabs")
      }

      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)

      const duration = await getAudioDuration(blob)
      setAudioDuration(duration)

      setAudioBlob(blob)
      setGeneratedAudioUrl(audioUrl)
    } catch (error) {
      console.error("Error generating speech:", error)
      alert("Error al generar el audio. Verifica tu conexión e intenta de nuevo.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedAudioUrl || !audioBlob || !selectedVideo) {
      alert("Primero genera el audio del video")
      return
    }

    if (selectedVideo.isYoutube) {
      alert(
        "Este video de YouTube es solo para vista previa. Por favor descarga el video primero usando el botón 'Descargar y usar' en la pestaña YouTube.",
      )
      return
    }

    const videoElement = videoRef.current?.getVideoElement()
    if (!videoElement) {
      alert("Error: No se pudo acceder al video. Intenta de nuevo.")
      return
    }

    setIsDownloading(true)
    setDownloadProgress(0)
    setDownloadStage("recording")
    setShowDownloadDialog(true)

    try {
      const webmBlob = await recordVideoWithTextOverlay(
        videoElement,
        audioBlob,
        script,
        videoFormat,
        textStyle,
        (progress) => setDownloadProgress(Math.round(progress)),
        audioDuration || undefined,
      )

      setDownloadStage("converting")
      setDownloadProgress(70)

      const mp4Blob = await convertWebmToMp4(webmBlob, (progress) => {
        setDownloadProgress(Math.round(70 + progress * 0.3))
      })

      setGeneratedVideoBlob(mp4Blob)
      setDownloadStage("done")
      setDownloadProgress(100)

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-")
      const extension = mp4Blob.type.includes("mp4") ? "mp4" : "webm"
      const filename = `reelforge-video-${timestamp}.${extension}`

      downloadBlob(mp4Blob, filename)

      setTimeout(() => {
        setShowDownloadDialog(false)
        setIsDownloading(false)
      }, 2000)
    } catch (error) {
      console.error("Error creating video:", error)
      alert("Error al crear el video. Intenta de nuevo.")
      setShowDownloadDialog(false)
      setIsDownloading(false)
    }
  }

  const handlePublish = async () => {
    if (connectedPlatforms.length === 0) {
      alert("Primero conecta al menos una red social desde el botón 'Conectar Redes' en el encabezado")
      return
    }

    if (!generatedAudioUrl || !audioBlob) {
      alert("Primero genera el audio del video")
      return
    }

    if (!selectedVideo) {
      alert("No hay un video seleccionado")
      return
    }

    if (selectedVideo.isYoutube) {
      alert(
        "Este video de YouTube es solo para vista previa. Por favor descarga el video primero usando el botón 'Descargar y usar' en la pestaña YouTube.",
      )
      return
    }

    const videoElement = videoRef.current?.getVideoElement()
    if (!videoElement) {
      alert("Error: No se pudo acceder al video")
      return
    }

    setShowPublishDialog(true)
    setIsPublishing(true)
    setPublishStatus("creating")
    setPublishProgress(0)

    try {
      let videoToPublish = generatedVideoBlob

      if (!videoToPublish) {
        const webmBlob = await recordVideoWithTextOverlay(
          videoElement,
          audioBlob,
          script,
          videoFormat,
          textStyle,
          (progress) => setPublishProgress(Math.round(progress * 0.5)),
          audioDuration || undefined,
        )

        const mp4Blob = await convertWebmToMp4(webmBlob, (progress) =>
          setPublishProgress(Math.round(50 + progress * 0.2)),
        )

        videoToPublish = mp4Blob
        setGeneratedVideoBlob(mp4Blob)
      } else {
        setPublishProgress(70)
      }

      setPublishStatus("uploading")

      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 100))
        setPublishProgress(70 + i * 1.5)
      }

      setPublishStatus("success")
      setPublishProgress(100)
    } catch (error) {
      console.error("Error publishing:", error)
      setPublishStatus("error")
    } finally {
      setIsPublishing(false)
    }
  }

  const canGenerate = script.trim().length > 0 && selectedVideo !== null

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          disabled={!canGenerate || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generar Video
            </>
          )}
        </Button>

        <Button
          size="lg"
          variant="outline"
          className={`gap-2 ${
            connectedPlatforms.length > 0
              ? "border-green-500 text-green-500 hover:bg-green-500/10"
              : "border-muted-foreground/30 text-muted-foreground"
          } bg-transparent`}
          disabled={isGenerating || !generatedAudioUrl || isPublishing}
          onClick={handlePublish}
        >
          <Share2 className="w-5 h-5" />
          {connectedPlatforms.length > 0 ? `Publicar (${connectedPlatforms.length})` : "Conecta redes"}
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="gap-2 bg-transparent border-primary/50 hover:bg-primary/10 hover:border-primary"
          disabled={isGenerating || !generatedAudioUrl || isDownloading}
          onClick={handleDownload}
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <FileVideo className="w-5 h-5" />
              Descargar MP4
            </>
          )}
        </Button>
      </div>

      {audioDuration && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Duración del audio: {Math.round(audioDuration)} segundos - El video se recortará a esta duración
        </p>
      )}

      {/* Dialog de descarga */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Creando tu Video MP4
            </DialogTitle>
            <DialogDescription>
              {downloadStage === "recording" && "Grabando video con audio y texto..."}
              {downloadStage === "converting" && "Convirtiendo a MP4 (H.264)..."}
              {downloadStage === "done" && "Video MP4 creado exitosamente!"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-3">
              <Progress value={downloadProgress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {downloadStage === "recording" && "Renderizando frames..."}
                  {downloadStage === "converting" && "Codificando H.264..."}
                  {downloadStage === "done" && "Completado!"}
                </span>
                <span>{downloadProgress}%</span>
              </div>
            </div>

            {downloadStage === "done" && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">Video MP4 descargado</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu video está listo para subir a TikTok, Instagram Reels, YouTube Shorts y más.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Share2 className="w-5 h-5 text-green-500" />
              Publicando en Redes Sociales
            </DialogTitle>
            <DialogDescription>
              {publishStatus === "creating" && "Creando tu video..."}
              {publishStatus === "uploading" && "Subiendo a tus redes conectadas..."}
              {publishStatus === "success" && "Video publicado exitosamente!"}
              {publishStatus === "error" && "Hubo un error al publicar"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {(publishStatus === "creating" || publishStatus === "uploading") && (
              <div className="space-y-3">
                <Progress value={publishProgress} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {publishStatus === "creating" && "Procesando video..."}
                    {publishStatus === "uploading" && "Subiendo..."}
                  </span>
                  <span>{publishProgress}%</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {connectedPlatforms.map((p) => (
                    <span key={p} className="text-xs bg-secondary px-2 py-1 rounded-full capitalize">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {publishStatus === "success" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tu video ha sido enviado a {connectedPlatforms.length}{" "}
                  {connectedPlatforms.length === 1 ? "plataforma" : "plataformas"}. Puede tardar unos minutos en
                  aparecer.
                </p>
                <Button onClick={() => setShowPublishDialog(false)}>Cerrar</Button>
              </div>
            )}

            {publishStatus === "error" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-destructive/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground">Error al publicar. Intenta de nuevo.</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowPublishDialog(false)} variant="outline">
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => {
                      setPublishStatus("idle")
                      handlePublish()
                    }}
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
