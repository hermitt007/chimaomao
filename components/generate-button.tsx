"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, CheckCircle2, AlertCircle, Video, FileVideo, Share2, Mic, User, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BackgroundVideo, VideoFormat } from "@/components/video-generator"
import type { TextStyle } from "@/components/text-style-selector"
// NOTA: Quitamos convertWebmToMp4 de los imports porque ya no lo usaremos
import { downloadBlob, recordVideoWithTextOverlay, getAudioDuration } from "@/lib/video-recorder"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

// Voces ElevenLabs
const VOICE_OPTIONS = [
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel (Neutral)" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Americana)" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi (Fuerte)" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella (Suave)" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni (Serio)" },
]

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
  // Simplificamos los estados: solo grabando o listo
  const [downloadStage, setDownloadStage] = useState<"recording" | "done">("recording")
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [publishStatus, setPublishStatus] = useState<"idle" | "creating" | "uploading" | "success" | "error">("idle")
  
  const [selectedVoiceId, setSelectedVoiceId] = useState("onwK4e9ZLuTAKqWW03F9")

  const [redditUsername, setRedditUsername] = useState("HistoriaReal")
  const [redditAvatar, setRedditAvatar] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadConnections = () => {
        const platforms: string[] = []
        const platformIds = ["tiktok", "instagram", "facebook", "youtube"]
        platformIds.forEach((p) => { if (localStorage.getItem(`${p}_connection`)) platforms.push(p) })
        setConnectedPlatforms(platforms)
    }
    loadConnections()
    window.addEventListener("storage", loadConnections)
    return () => window.removeEventListener("storage", loadConnections)
  }, [])

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setRedditAvatar(url);
      }
  }

  const handleGenerate = async () => {
    if (!script.trim() || !selectedVideo) return
    if (selectedVideo.isYoutube) { alert("Descarga el video primero."); return }

    setIsGenerating(true)
    setGeneratedAudioUrl(null); setGeneratedVideoBlob(null); setAudioBlob(null); setAudioDuration(null);

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": "sk_c1923061c72927db505987c44aa22962022f004deb0eee5c" },
        body: JSON.stringify({ text: script, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      })

      if (!response.ok) throw new Error("Error ElevenLabs")
      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)
      const duration = await getAudioDuration(blob)
      setAudioDuration(duration)
      setAudioBlob(blob)
      setGeneratedAudioUrl(audioUrl)
    } catch (error) {
      console.error(error); alert("Error generando audio.")
    } finally { setIsGenerating(false) }
  }

  // --- NUEVA LÓGICA DE DESCARGA (SIN CONVERSIÓN MP4) ---
  const handleDownload = async () => {
    if (!generatedAudioUrl || !audioBlob || !selectedVideo) { alert("Genera el audio primero"); return }
    const videoElement = videoRef.current?.getVideoElement()
    if (!videoElement) { alert("Error video"); return }

    setIsDownloading(true); setDownloadProgress(0); setDownloadStage("recording"); setShowDownloadDialog(true);

    try {
      // 1. Grabar el video (Esto devuelve un WebM)
      const webmBlob = await recordVideoWithTextOverlay(
        videoElement,
        audioBlob,
        script,
        videoFormat,
        textStyle,
        (progress) => setDownloadProgress(Math.round(progress)),
        audioDuration || undefined,
        { 
            name: redditUsername, 
            avatar: redditAvatar || "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png" 
        }
      )

      // 2. ¡LISTO! No convertimos nada.
      // Guardamos el WebM directamente. Es más rápido y seguro.
      setGeneratedVideoBlob(webmBlob)
      setDownloadStage("done")
      setDownloadProgress(100)

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-")
      // Cambiamos la extensión a .webm
      downloadBlob(webmBlob, `reddit-story-${timestamp}.webm`)

      setTimeout(() => { setShowDownloadDialog(false); setIsDownloading(false) }, 2000)
    } catch (error) {
      console.error(error); alert("Error creando video."); setShowDownloadDialog(false); setIsDownloading(false)
    }
  }

  const handlePublish = async () => { 
      alert("Función de publicación no configurada en este demo.")
  }

  const canGenerate = script.trim().length > 0 && selectedVideo !== null

  return (
    <>
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-secondary/20">
        <h3 className="font-semibold text-sm text-muted-foreground">Configuración de Historia</h3>
        
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
                <Label>Voz del Narrador</Label>
                <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
                    <SelectTrigger className="bg-background"><div className="flex items-center gap-2"><Mic className="w-4 h-4 text-primary"/><SelectValue/></div></SelectTrigger>
                    <SelectContent>
                        {VOICE_OPTIONS.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="flex-1 space-y-2">
                <Label>Nombre de Usuario (Overlay)</Label>
                <div className="flex gap-2">
                    <Input value={redditUsername} onChange={e => setRedditUsername(e.target.value)} className="bg-background" />
                    <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*"/>
                    <Button variant="outline" size="icon" onClick={() => avatarInputRef.current?.click()} className="shrink-0">
                        {redditAvatar ? <img src={redditAvatar} className="w-6 h-6 rounded-full object-cover"/> : <User className="w-4 h-4"/>}
                    </Button>
                </div>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button size="lg" className="flex-1 gap-2 bg-primary hover:bg-primary/90" disabled={!canGenerate || isGenerating} onClick={handleGenerate}>
                {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles className="w-5 h-5"/>} Generar Audio
            </Button>

            <Button size="lg" variant="outline" className="gap-2" disabled={isGenerating || !generatedAudioUrl || isDownloading} onClick={handleDownload}>
                {isDownloading ? <Loader2 className="animate-spin"/> : <FileVideo className="w-5 h-5"/>} 
                {/* Cambiamos el texto para ser honestos */}
                Descargar Video
            </Button>
        </div>
      </div>

      {audioDuration && <p className="text-xs text-center mt-2 text-muted-foreground">Audio: {Math.round(audioDuration)}s</p>}

      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Creando Video Vertical</DialogTitle>
            <DialogDescription>
                {downloadStage === "recording" && "Grabando y renderizando overlay..."}
                {downloadStage === "done" && "¡Listo! Descargando..."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
             <Progress value={downloadProgress} className="h-3"/>
             <p className="text-sm text-center text-muted-foreground">{downloadProgress}%</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}