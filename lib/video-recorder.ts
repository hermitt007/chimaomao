import type { TextStyle } from "@/components/text-style-selector"

export interface RecordingOptions {
  canvasElement: HTMLCanvasElement
  audioBlob: Blob
  duration: number
  onProgress?: (progress: number) => void
}

// Cargar FFmpeg dinámicamente
let ffmpegInstance: any = null
let ffmpegLoading = false

async function loadFFmpeg(): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance
  if (ffmpegLoading) {
    while (ffmpegLoading) {
      await new Promise((r) => setTimeout(r, 100))
    }
    return ffmpegInstance
  }

  ffmpegLoading = true

  try {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg")
    const { fetchFile, toBlobURL } = await import("@ffmpeg/util")

    const ffmpeg = new FFmpeg()

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm"

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    })

    ffmpegInstance = { ffmpeg, fetchFile }
    return ffmpegInstance
  } catch (error) {
    console.error("Error loading FFmpeg:", error)
    throw error
  } finally {
    ffmpegLoading = false
  }
}

export async function recordVideoWithTextOverlay(
  videoElement: HTMLVideoElement,
  audioBlob: Blob,
  script: string,
  format: "9:16" | "16:9" | "1:1",
  textStyle: TextStyle,
  onProgress?: (progress: number) => void,
  targetDuration?: number, // Duration in seconds to trim the video
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const dimensions = {
        "9:16": { width: 1080, height: 1920 },
        "16:9": { width: 1920, height: 1080 },
        "1:1": { width: 1080, height: 1080 },
      }

      const { width, height } = dimensions[format]

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")!

      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      await new Promise<void>((res) => {
        audio.addEventListener("loadedmetadata", () => res())
        audio.load()
      })

      const duration = targetDuration || audio.duration || 10

      const words = script.split(/\s+/).filter(Boolean)
      const sentences = script.split(/[.!?]+/).filter(Boolean)
      const wordsPerGroup = 3
      const wordsPerSecond = 2.5

      const canvasStream = canvas.captureStream(30)

      const audioContext = new AudioContext()
      const audioSource = audioContext.createMediaElementSource(audio)
      const destination = audioContext.createMediaStreamDestination()
      audioSource.connect(destination)
      audioSource.connect(audioContext.destination)

      const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...destination.stream.getAudioTracks()])

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm"

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8000000,
      })

      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(chunks, { type: "video/webm" })
        URL.revokeObjectURL(audioUrl)
        audioContext.close()
        resolve(webmBlob)
      }

      mediaRecorder.onerror = (e) => {
        URL.revokeObjectURL(audioUrl)
        reject(e)
      }

      mediaRecorder.start(100)

      videoElement.currentTime = 0
      videoElement.muted = true
      videoElement.loop = true // Enable looping in case video is shorter than audio
      videoElement.play()
      audio.play()

      const startTime = performance.now()

      const drawTikTokText = (text: string) => {
        ctx.save()

        const gradient = ctx.createLinearGradient(0, height * 0.4, 0, height * 0.6)
        gradient.addColorStop(0, "rgba(0,0,0,0)")
        gradient.addColorStop(0.5, "rgba(0,0,0,0.3)")
        gradient.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = gradient
        ctx.fillRect(0, height * 0.35, width, height * 0.3)

        const fontSize = Math.round(width * 0.08)
        ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        const textX = width / 2
        const textY = height / 2

        ctx.shadowColor = "rgba(0,0,0,0.9)"
        ctx.shadowBlur = 20
        ctx.shadowOffsetX = 4
        ctx.shadowOffsetY = 4

        ctx.strokeStyle = "#000000"
        ctx.lineWidth = fontSize * 0.15
        ctx.lineJoin = "round"
        ctx.miterLimit = 2
        ctx.strokeText(text.toUpperCase(), textX, textY)

        ctx.fillStyle = "#FFFFFF"
        ctx.fillText(text.toUpperCase(), textX, textY)

        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        const barHeight = fontSize * 0.5
        const barY = textY + fontSize * 0.8
        const barText = "REELFORGE AI"
        ctx.font = `800 ${barHeight * 0.6}px Inter, system-ui, sans-serif`
        const barWidth = ctx.measureText(barText).width + barHeight

        ctx.fillStyle = "rgba(34, 197, 94, 0.9)"
        ctx.beginPath()
        ctx.roundRect(textX - barWidth / 2, barY - barHeight / 2, barWidth, barHeight, barHeight * 0.2)
        ctx.fill()

        ctx.fillStyle = "#000000"
        ctx.fillText(barText, textX, barY)

        ctx.restore()
      }

      const drawRedditText = (sentenceIndex: number) => {
        ctx.save()

        const cardWidth = width * 0.9
        const cardHeight = height * 0.35
        const cardX = (width - cardWidth) / 2
        const cardY = (height - cardHeight) / 2

        ctx.fillStyle = "#FFFFFF"
        ctx.beginPath()
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 16)
        ctx.fill()

        const headerHeight = cardHeight * 0.15
        ctx.fillStyle = "#F9FAFB"
        ctx.beginPath()
        ctx.roundRect(cardX, cardY, cardWidth, headerHeight, [16, 16, 0, 0])
        ctx.fill()

        const iconSize = headerHeight * 0.6
        const iconX = cardX + 16
        const iconY = cardY + (headerHeight - iconSize) / 2

        const iconGradient = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize)
        iconGradient.addColorStop(0, "#FB923C")
        iconGradient.addColorStop(1, "#EF4444")
        ctx.fillStyle = iconGradient
        ctx.beginPath()
        ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#FFFFFF"
        ctx.font = `bold ${iconSize * 0.5}px Inter, system-ui, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("r/", iconX + iconSize / 2, iconY + iconSize / 2)

        ctx.fillStyle = "#4B5563"
        ctx.font = `600 ${headerHeight * 0.35}px Inter, system-ui, sans-serif`
        ctx.textAlign = "left"
        ctx.textBaseline = "middle"
        ctx.fillText("r/historias • hace 4 h", iconX + iconSize + 12, cardY + headerHeight / 2)

        const title = sentences[0]?.trim() || "Historia increíble"
        const titleY = cardY + headerHeight + 24
        ctx.fillStyle = "#111827"
        ctx.font = `700 ${cardHeight * 0.08}px Inter, system-ui, sans-serif`
        ctx.textAlign = "left"
        ctx.fillText(title.substring(0, 50) + (title.length > 50 ? "..." : ""), cardX + 16, titleY)

        const bodyY = titleY + cardHeight * 0.12
        const visibleSentences = sentences.slice(1, Math.min(sentenceIndex + 2, sentences.length))
        ctx.fillStyle = "#374151"
        ctx.font = `400 ${cardHeight * 0.055}px Inter, system-ui, sans-serif`

        let currentY = bodyY
        visibleSentences.forEach((sentence, i) => {
          const text = sentence.trim() + "."
          ctx.fillText(text.substring(0, 60) + (text.length > 60 ? "..." : ""), cardX + 16, currentY)
          currentY += cardHeight * 0.08
        })

        const footerY = cardY + cardHeight - headerHeight
        ctx.fillStyle = "#F9FAFB"
        ctx.beginPath()
        ctx.roundRect(cardX, footerY, cardWidth, headerHeight, [0, 0, 16, 16])
        ctx.fill()

        ctx.fillStyle = "#6B7280"
        ctx.font = `500 ${headerHeight * 0.35}px Inter, system-ui, sans-serif`
        ctx.textAlign = "left"
        ctx.fillText("↑ 3.5 mil    💬 138    🏆 1    ↗ Compartir", cardX + 16, footerY + headerHeight / 2)

        ctx.restore()
      }

      const drawMinimalText = (text: string) => {
        ctx.save()

        const boxWidth = width * 0.9
        const boxHeight = height * 0.1
        const boxX = (width - boxWidth) / 2
        const boxY = height * 0.75

        ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
        ctx.beginPath()
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16)
        ctx.fill()

        const fontSize = Math.round(width * 0.045)
        ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "#FFFFFF"
        ctx.fillText(text, width / 2, boxY + boxHeight / 2)

        ctx.restore()
      }

      const drawFrame = () => {
        const elapsed = (performance.now() - startTime) / 1000
        const progress = Math.min(elapsed / duration, 1)

        onProgress?.(progress * 70)

        if (progress < 1 && mediaRecorder.state === "recording") {
          ctx.drawImage(videoElement, 0, 0, width, height)

          const currentWordIndex = Math.floor((elapsed * wordsPerSecond) / wordsPerGroup) * wordsPerGroup
          const currentSentenceIndex = Math.floor(elapsed / 3)

          if (textStyle === "tiktok") {
            const currentWords = words.slice(currentWordIndex, currentWordIndex + wordsPerGroup).join(" ")
            if (currentWords) drawTikTokText(currentWords)
          } else if (textStyle === "reddit") {
            drawRedditText(currentSentenceIndex)
          } else if (textStyle === "minimal") {
            const currentWords = words.slice(currentWordIndex, currentWordIndex + wordsPerGroup).join(" ")
            if (currentWords) drawMinimalText(currentWords)
          }

          requestAnimationFrame(drawFrame)
        } else {
          mediaRecorder.stop()
          videoElement.pause()
          videoElement.loop = false
          audio.pause()
        }
      }

      drawFrame()
    } catch (error) {
      reject(error)
    }
  })
}

export async function convertWebmToMp4(webmBlob: Blob, onProgress?: (progress: number) => void): Promise<Blob> {
  try {
    onProgress?.(75)

    const { ffmpeg, fetchFile } = await loadFFmpeg()

    onProgress?.(80)

    await ffmpeg.writeFile("input.webm", await fetchFile(webmBlob))

    onProgress?.(85)

    await ffmpeg.exec([
      "-i",
      "input.webm",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "output.mp4",
    ])

    onProgress?.(95)

    const data = await ffmpeg.readFile("output.mp4")
    const mp4Blob = new Blob([data], { type: "video/mp4" })

    await ffmpeg.deleteFile("input.webm")
    await ffmpeg.deleteFile("output.mp4")

    onProgress?.(100)

    return mp4Blob
  } catch (error) {
    console.error("Error converting to MP4:", error)
    onProgress?.(100)
    return webmBlob
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.src = URL.createObjectURL(audioBlob)
    audio.addEventListener("loadedmetadata", () => {
      resolve(audio.duration)
      URL.revokeObjectURL(audio.src)
    })
    audio.addEventListener("error", () => {
      resolve(10)
    })
  })
}
