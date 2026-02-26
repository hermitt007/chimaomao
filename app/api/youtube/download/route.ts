import { randomUUID } from "crypto"
import { mkdir, readFile, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { spawn } from "child_process"
import { NextResponse } from "next/server"

export const maxDuration = 300

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
  /youtube\.com\/shorts\/([^&\n?#]+)/,
]

type DownloadRequest = {
  url?: string
  action?: "info" | "download"
  textOverlay?: string
}

export async function POST(req: Request) {
  try {
        const body = (await req.json()) as DownloadRequest
    const { url, action = "download", textOverlay } = body

    if (!url) {
            return NextResponse.json({ error: "URL faltante" }, { status: 400 })
    }

    const videoId = extractYouTubeId(url)
    if (!videoId) {
      return NextResponse.json({ error: "URL de YouTube inválida" }, { status: 400 })
    }

      if (action === "info") {
      return await getVideoInfo(videoId)
    }

    const { videoPath: downloadedVideo, tempFolder } = await downloadYouTubeVideo(url)

    try {
      const finalVideoPath = textOverlay?.trim()
        ? await burnTextOverlay(downloadedVideo, textOverlay.trim())
        : downloadedVideo

          const videoBuffer = await readFile(finalVideoPath)

          return new NextResponse(videoBuffer, {
        headers: {
          "Content-Type": "video/webm",
          "Content-Disposition": `attachment; filename=video-${videoId}.webm`,
          "Cache-Control": "no-store",
        },
      })
    } finally {
      await cleanupTempFiles([tempFolder])
    }
  } catch (error: any) {
    console.error("[youtube/download]", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

async function getVideoInfo(videoId: string) {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  const response = await fetch(oembedUrl)

  if (!response.ok) {
    return NextResponse.json({ error: "No se pudo obtener información del video" }, { status: 400 })
  }

  const data = await response.json()

  return NextResponse.json({
    videoId,
    title: data.title,
    author: data.author_name,
    duration: 0,
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1`,
    hasDownload: true,
    previewOnly: false,
  })
}

function extractYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

async function downloadYouTubeVideo(url: string): Promise<{ videoPath: string; tempFolder: string }> {
  const tempFolder = join(tmpdir(), `yt-${randomUUID()}`)
  await mkdir(tempFolder, { recursive: true })

  const outputTemplate = join(tempFolder, "source.%(ext)s")

  await runCommand("yt-dlp", [
    "--no-playlist",
    "-f",
    "bestvideo[ext=webm]+bestaudio[ext=webm]/best[ext=webm]/best",
    "--merge-output-format",
    "webm",
    "-o",
    outputTemplate,
    url,
  ])

  const downloadedPath = join(tempFolder, "source.webm")
  return { videoPath: downloadedPath, tempFolder }
}

async function burnTextOverlay(videoPath: string, textOverlay: string): Promise<string> {
  const editedPath = videoPath.replace(".webm", "_editado.webm")
  const escapedText = escapeTextForDrawText(textOverlay)

  await runCommand("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-vf",
    `drawtext=text='${escapedText}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,0,5)'`,
    "-c:v",
    "libvpx-vp9",
    "-c:a",
    "libopus",
    editedPath,
  ])

  return editedPath
}

function escapeTextForDrawText(text: string): string {
  return text.replace(/[:'\\]/g, "\\$&")
}

async function runCommand(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args)

    let stderr = ""

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })

    child.on("error", (error) => {
      reject(new Error(`No se pudo ejecutar ${command}: ${error.message}`))
    })

    child.on("close", (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} terminó con código ${code}. ${stderr}`))
    })
  })
}

async function cleanupTempFiles(paths: string[]) {
  await Promise.all(paths.map((path) => rm(path, { recursive: true, force: true })))
}
