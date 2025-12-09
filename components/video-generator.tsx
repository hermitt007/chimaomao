"use client"

import { useState, useRef } from "react"
import { ScriptInput } from "@/components/script-input"
import { VideoFormatSelector } from "@/components/video-format-selector"
import { BackgroundVideoSelector } from "@/components/background-video-selector"
import { VideoPreview, type VideoPreviewHandle } from "@/components/video-preview"
import { GenerateButton } from "@/components/generate-button"
import { TextStyleSelector, type TextStyle } from "@/components/text-style-selector"

export type VideoFormat = "9:16" | "16:9" | "1:1"

export interface BackgroundVideo {
  id: string
  category: string
  thumbnail: string
  videoUrl: string
  title: string
  isYoutube?: boolean
  youtubeId?: string
  duration?: number // Added duration field
}

export function VideoGenerator() {
  const [script, setScript] = useState("")
  const [videoFormat, setVideoFormat] = useState<VideoFormat>("9:16")
  const [selectedVideo, setSelectedVideo] = useState<BackgroundVideo | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)
  const [generatedVideoBlob, setGeneratedVideoBlob] = useState<Blob | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [textStyle, setTextStyle] = useState<TextStyle>("tiktok")
  const [audioDuration, setAudioDuration] = useState<number | null>(null)

  const videoPreviewRef = useRef<VideoPreviewHandle>(null)

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length
  const estimatedDuration = Math.ceil(wordCount / 2.5)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda - Configuración */}
        <div className="lg:col-span-2 space-y-6">
          <ScriptInput
            script={script}
            setScript={setScript}
            wordCount={wordCount}
            estimatedDuration={estimatedDuration}
          />

          <BackgroundVideoSelector selectedVideo={selectedVideo} setSelectedVideo={setSelectedVideo} />

          <TextStyleSelector textStyle={textStyle} setTextStyle={setTextStyle} />

          <GenerateButton
            script={script}
            selectedVideo={selectedVideo}
            videoFormat={videoFormat}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            setGeneratedAudioUrl={setGeneratedAudioUrl}
            generatedAudioUrl={generatedAudioUrl}
            generatedVideoBlob={generatedVideoBlob}
            setGeneratedVideoBlob={setGeneratedVideoBlob}
            audioBlob={audioBlob}
            setAudioBlob={setAudioBlob}
            videoRef={videoPreviewRef}
            textStyle={textStyle}
            audioDuration={audioDuration}
            setAudioDuration={setAudioDuration}
          />
        </div>

        {/* Columna derecha - Preview */}
        <div className="space-y-6">
          <VideoFormatSelector videoFormat={videoFormat} setVideoFormat={setVideoFormat} />

          <VideoPreview
            ref={videoPreviewRef}
            videoFormat={videoFormat}
            selectedVideo={selectedVideo}
            script={script}
            audioUrl={generatedAudioUrl}
            isGenerating={isGenerating}
            textStyle={textStyle}
            audioDuration={audioDuration}
          />
        </div>
      </div>
    </div>
  )
}
