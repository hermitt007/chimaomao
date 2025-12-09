"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { VideoFormat } from "@/components/video-generator"

interface VideoFormatSelectorProps {
  videoFormat: VideoFormat
  setVideoFormat: (format: VideoFormat) => void
}

const formats: { value: VideoFormat; label: string; icon: React.ReactNode }[] = [
  {
    value: "9:16",
    label: "9:16",
    icon: <div className="w-6 h-10 border-2 border-current rounded-sm" />,
  },
  {
    value: "16:9",
    label: "16:9",
    icon: <div className="w-10 h-6 border-2 border-current rounded-sm" />,
  },
  {
    value: "1:1",
    label: "1:1",
    icon: <div className="w-8 h-8 border-2 border-current rounded-sm" />,
  },
]

export function VideoFormatSelector({ videoFormat, setVideoFormat }: VideoFormatSelectorProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">Formato del Video</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {formats.map((format) => (
            <button
              key={format.value}
              onClick={() => setVideoFormat(format.value)}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                videoFormat === format.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50",
              )}
            >
              {format.icon}
              <span className="text-sm font-medium">{format.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
