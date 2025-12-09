"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { MessageSquare, Type, Sparkles } from "lucide-react"

export type TextStyle = "tiktok" | "reddit" | "minimal"

interface TextStyleSelectorProps {
  textStyle: TextStyle
  setTextStyle: (style: TextStyle) => void
}

const styles: { id: TextStyle; name: string; icon: React.ReactNode; preview: React.ReactNode }[] = [
  {
    id: "tiktok",
    name: "TikTok",
    icon: <Sparkles className="w-4 h-4" />,
    preview: (
      <div className="text-center">
        <p className="text-white text-sm font-black uppercase" style={{ textShadow: "2px 2px 0 #000" }}>
          TEXTO VIRAL
        </p>
      </div>
    ),
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: <MessageSquare className="w-4 h-4" />,
    preview: (
      <div className="bg-white rounded p-2 text-left scale-75">
        <p className="text-[8px] text-gray-500">r/historias</p>
        <p className="text-[10px] font-bold text-black leading-tight">Título del post...</p>
        <p className="text-[8px] text-gray-700 leading-tight">Texto del contenido...</p>
      </div>
    ),
  },
  {
    id: "minimal",
    name: "Minimal",
    icon: <Type className="w-4 h-4" />,
    preview: (
      <div className="text-center">
        <p className="text-white text-sm font-medium">Texto limpio</p>
      </div>
    ),
  },
]

export function TextStyleSelector({ textStyle, setTextStyle }: TextStyleSelectorProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">Estilo de Texto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => setTextStyle(style.id)}
              className={cn(
                "relative p-3 rounded-xl border-2 transition-all",
                textStyle === style.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-secondary/50",
              )}
            >
              <div className="h-16 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg mb-2 overflow-hidden">
                {style.preview}
              </div>
              <div className="flex items-center justify-center gap-1.5">
                {style.icon}
                <span className="text-xs font-medium text-foreground">{style.name}</span>
              </div>
              {textStyle === style.id && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
