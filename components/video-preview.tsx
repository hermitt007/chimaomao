"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Volume2, VolumeX, Play, Pause, ArrowUp, MessageSquare, Share2, Award, Clock } from "lucide-react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import type { VideoFormat, BackgroundVideo } from "@/components/video-generator"
import type { TextStyle } from "@/components/text-style-selector"

interface VideoPreviewProps {
  videoFormat: VideoFormat
  selectedVideo: BackgroundVideo | null
  script: string
  audioUrl: string | null
  isGenerating: boolean
  textStyle: TextStyle
  audioDuration: number | null // Added audio duration prop
}

export interface VideoPreviewHandle {
  getVideoElement: () => HTMLVideoElement | null
  getAudioElement: () => HTMLAudioElement | null
}

function RedditOverlay({ script, currentIndex }: { script: string; currentIndex: number }) {
  const sentences = script.split(/[.!?]+/).filter(Boolean)
  const title = sentences[0]?.trim() || "Historia increíble"
  const visibleSentences = sentences.slice(1, Math.min(currentIndex + 2, sentences.length))

  return (
    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2">
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden max-w-[90%] mx-auto">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">r/</span>
          </div>
          <span className="text-xs text-gray-600 font-medium">r/historias</span>
          <span className="text-xs text-gray-400">• hace 4 h</span>
          <div className="ml-auto">
            <span className="text-xs text-blue-500 font-medium px-2 py-1 bg-blue-50 rounded-full">Unirse</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">{title}</h3>
          <div className="text-gray-700 text-xs leading-relaxed space-y-1">
            {visibleSentences.map((sentence, i) => (
              <p
                key={i}
                className={cn(
                  "transition-all duration-300",
                  i === visibleSentences.length - 1 ? "animate-in fade-in slide-in-from-bottom-2" : "",
                )}
              >
                {sentence.trim()}.
              </p>
            ))}
            {sentences.length > currentIndex + 2 && <span className="text-gray-400">...</span>}
          </div>
        </div>

        <div className="flex items-center gap-4 px-3 py-2 border-t bg-gray-50">
          <div className="flex items-center gap-1 text-gray-500">
            <ArrowUp className="w-4 h-4" />
            <span className="text-xs font-medium">3.5 mil</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">138</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-xs">1</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 ml-auto">
            <Share2 className="w-4 h-4" />
            <span className="text-xs">Compartir</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TikTokOverlay({
  words,
  currentIndex,
  wordsPerGroup,
}: { words: string[]; currentIndex: number; wordsPerGroup: number }) {
  const currentWords = words.slice(currentIndex, currentIndex + wordsPerGroup).join(" ")

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="text-center w-full">
        <div key={currentIndex} className="animate-in fade-in zoom-in duration-300">
          <p
            className="text-white text-2xl sm:text-3xl font-black uppercase tracking-wide leading-tight px-2"
            style={{
              textShadow: `
                0 0 20px rgba(0,0,0,0.9),
                0 4px 12px rgba(0,0,0,0.9),
                3px 3px 0 #000,
                -3px -3px 0 #000,
                3px -3px 0 #000,
                -3px 3px 0 #000,
                0 0 40px rgba(0,0,0,0.5)
              `,
              WebkitTextStroke: "2px #000",
              paintOrder: "stroke fill",
            }}
          >
            {currentWords || words.slice(0, wordsPerGroup).join(" ")}
          </p>
        </div>
        <div className="mt-4 bg-primary/90 px-4 py-2 rounded-md inline-block shadow-lg">
          <p className="text-primary-foreground text-xs font-bold uppercase tracking-widest">ReelForge AI</p>
        </div>
      </div>
    </div>
  )
}

function MinimalOverlay({
  words,
  currentIndex,
  wordsPerGroup,
}: { words: string[]; currentIndex: number; wordsPerGroup: number }) {
  const currentWords = words.slice(currentIndex, currentIndex + wordsPerGroup).join(" ")

  return (
    <div className="absolute bottom-20 left-4 right-4">
      <div key={currentIndex} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-4">
          <p className="text-white text-lg font-medium text-center">
            {currentWords || words.slice(0, wordsPerGroup).join(" ")}
          </p>
        </div>
      </div>
    </div>
  )
}

export const VideoPreview = forwardRef<VideoPreviewHandle, VideoPreviewProps>(
  ({ videoFormat, selectedVideo, script, audioUrl, isGenerating, textStyle, audioDuration }, ref) => {
    const [isMuted, setIsMuted] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
    const videoRef = useRef<HTMLVideoElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    useImperativeHandle(ref, () => ({
      getVideoElement: () => videoRef.current,
      getAudioElement: () => audioRef.current,
    }))

    const aspectRatioClass = {
      "9:16": "aspect-[9/16]",
      "16:9": "aspect-video",
      "1:1": "aspect-square",
    }

    const words = script.split(/\s+/).filter(Boolean)
    const sentences = script.split(/[.!?]+/).filter(Boolean)
    const wordsPerGroup = 3

    useEffect(() => {
      if (!audioUrl || !isPlaying) {
        setCurrentWordIndex(0)
        setCurrentSentenceIndex(0)
        return
      }

      const wordsPerSecond = 2.5
      const interval = setInterval(
        () => {
          setCurrentWordIndex((prev) => {
            const next = prev + wordsPerGroup
            if (next >= words.length) return 0
            return next
          })
          setCurrentSentenceIndex((prev) => {
            if (prev >= sentences.length - 1) return 0
            return prev + 0.3
          })
        },
        (wordsPerGroup / wordsPerSecond) * 1000,
      )

      return () => clearInterval(interval)
    }, [audioUrl, isPlaying, words.length, sentences.length])

    const togglePlayback = () => {
      if (!audioUrl) return

      if (isPlaying) {
        audioRef.current?.pause()
        videoRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current?.play()
        videoRef.current?.play()
        setIsPlaying(true)
      }
    }

    useEffect(() => {
      const audio = audioRef.current
      if (!audio) return

      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentWordIndex(0)
        setCurrentSentenceIndex(0)
        if (videoRef.current) {
          videoRef.current.currentTime = 0
        }
      }

      audio.addEventListener("ended", handleEnded)
      return () => audio.removeEventListener("ended", handleEnded)
    }, [audioUrl])

    useEffect(() => {
      if (selectedVideo && videoRef.current && !selectedVideo.isYoutube) {
        videoRef.current.play().catch(() => {})
      }
    }, [selectedVideo])

    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.round(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center justify-between">
            <span>Vista Previa</span>
            {audioDuration && (
              <span className="text-xs font-normal text-muted-foreground flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                {formatDuration(audioDuration)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "relative bg-secondary rounded-lg overflow-hidden mx-auto group",
              aspectRatioClass[videoFormat],
              videoFormat === "9:16" ? "max-w-[280px]" : "w-full",
            )}
          >
            {selectedVideo ? (
              <>
                {selectedVideo.isYoutube ? (
                  <iframe
                    src={selectedVideo.videoUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={selectedVideo.videoUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    loop
                    muted
                    playsInline
                    autoPlay
                    crossOrigin="anonymous"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

                {isGenerating ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-white text-sm font-medium">Generando audio...</p>
                    </div>
                  </div>
                ) : audioUrl && words.length > 0 ? (
                  <>
                    {textStyle === "reddit" && (
                      <RedditOverlay script={script} currentIndex={Math.floor(currentSentenceIndex)} />
                    )}
                    {textStyle === "tiktok" && (
                      <TikTokOverlay words={words} currentIndex={currentWordIndex} wordsPerGroup={wordsPerGroup} />
                    )}
                    {textStyle === "minimal" && (
                      <MinimalOverlay words={words} currentIndex={currentWordIndex} wordsPerGroup={wordsPerGroup} />
                    )}
                  </>
                ) : words.length > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10">
                      <p
                        className="text-white text-lg font-bold text-center"
                        style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
                      >
                        {words.slice(0, 5).join(" ")}...
                      </p>
                      <p className="text-white/70 text-xs mt-1 text-center">Genera el audio para ver la animación</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white/70 text-sm bg-black/40 px-4 py-2 rounded-lg">
                      Escribe tu guión para ver la vista previa
                    </p>
                  </div>
                )}

                {audioUrl && !selectedVideo.isYoutube && (
                  <button
                    onClick={togglePlayback}
                    className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 bg-black/60 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20 z-10",
                      isPlaying ? "opacity-0 hover:opacity-100" : "opacity-90 hover:opacity-100 hover:scale-110",
                    )}
                  >
                    {isPlaying ? (
                      <Pause className="w-10 h-10 text-white" />
                    ) : (
                      <Play className="w-10 h-10 text-white ml-1" />
                    )}
                  </button>
                )}

                {!selectedVideo.isYoutube && (
                  <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                )}

                {isPlaying && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 z-10">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(currentWordIndex / Math.max(words.length, 1)) * 100}%` }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/50">
                <div className="text-center px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-sm">Selecciona un video de fondo</p>
                </div>
              </div>
            )}

            {audioUrl && <audio ref={audioRef} src={audioUrl} muted={isMuted} />}
          </div>

          <div className="mt-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              Formato {videoFormat} • Estilo {textStyle}
              {selectedVideo?.isYoutube && " • YouTube Preview"}
              {selectedVideo?.youtubeId && !selectedVideo?.isYoutube && " • YouTube Descargado"}
            </p>
            {audioUrl && (
              <p className="text-xs text-primary">{isPlaying ? "Reproduciendo..." : "Clic para reproducir"}</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  },
)

VideoPreview.displayName = "VideoPreview"
