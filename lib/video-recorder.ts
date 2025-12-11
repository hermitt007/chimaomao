import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util"

let ffmpeg: FFmpeg | null = null

/**
 * 1. Carga FFmpeg de forma segura desde un CDN
 */
export async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg

  const ffmpegInstance = new FFmpeg()
  // Usamos una versión específica y estable
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"

  try {
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    })
    
    // Activamos logs para ver qué pasa si algo falla
    ffmpegInstance.on("log", ({ message }) => {
        console.log("[FFmpeg Log]:", message);
    });

    ffmpeg = ffmpegInstance
    return ffmpeg
  } catch (error) {
    console.error("Error fatal cargando FFmpeg:", error)
    throw error
  }
}

/**
 * 2. Conversor WebM -> MP4 (Corregido con pix_fmt yuv420p)
 */
export async function convertWebmToMp4(webmBlob: Blob, onProgress?: (progress: number) => void): Promise<Blob> {
  try {
    const ffmpeg = await loadFFmpeg()
    
    // Escribir archivo de entrada (usando 'as any' para evitar error de tipos de TS)
    await ffmpeg.writeFile("input.webm", await fetchFile(webmBlob) as any)

    ffmpeg.on("progress", ({ progress }) => { if (onProgress) onProgress(progress * 100) })

    // EJECUTAR CONVERSIÓN CON PARÁMETROS CORREGIDOS
    // -pix_fmt yuv420p: Crucial para compatibilidad y evitar errores de encoding
    // -c:a aac: Asegurar codificación de audio compatible
    const ret = await ffmpeg.exec([
        "-i", "input.webm", 
        "-c:v", "libx264", 
        "-preset", "ultrafast", 
        "-pix_fmt", "yuv420p",  // <--- ESTA LÍNEA ARREGLA EL ERROR "EXEC FALLÓ"
        "-c:a", "aac",
        "-strict", "experimental",
        "output.mp4"
    ])
    
    if (ret !== 0) throw new Error("FFmpeg retornó código de error (mira los logs)")

    // Leer archivo de salida
    const data = await ffmpeg.readFile("output.mp4")
    
    // Limpieza
    try {
        await ffmpeg.deleteFile("input.webm")
        await ffmpeg.deleteFile("output.mp4")
    } catch(e) {}

    return new Blob([data as any], { type: "video/mp4" })

  } catch (error) {
    console.error("Fallo conversión a MP4. Se usará el video WebM original.", error)
    // FALLBACK: Si falla, devolvemos el video original para que el usuario no pierda su trabajo
    return webmBlob
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio(URL.createObjectURL(blob))
    audio.onloadedmetadata = () => resolve(audio.duration)
    audio.onerror = () => resolve(0)
  })
}

/**
 * Helpers de dibujo
 */
function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, x: number, y: number, w: number, h: number) {
    // @ts-ignore
    const imgW = img.videoWidth || img.width || 1280;
    // @ts-ignore
    const imgH = img.videoHeight || img.height || 720;
    const ratio = Math.max(w / imgW, h / imgH);
    const newW = imgW * ratio;
    const newH = imgH * ratio;
    const offsetX = (w - newW) / 2;
    const offsetY = (h - newH) / 2;
    ctx.drawImage(img, x + offsetX, y + offsetY, newW, newH);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    ctx.shadowColor = "black";
    ctx.shadowBlur = 4;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";

    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.strokeText(line, x, currentY);
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.strokeText(line, x, currentY);
    ctx.fillText(line, x, currentY);
}

/**
 * 3. GRABADOR PRINCIPAL
 */
export async function recordVideoWithTextOverlay(
  videoElement: HTMLVideoElement,
  audioBlob: Blob,
  script: string,
  videoFormat: any,
  textStyle: any,
  onProgress: (progress: number) => void,
  duration?: number,
  userData?: { name: string, avatar: string }
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // Forzar dimensiones pares para que FFmpeg no falle después (ej: 720x1280)
      const CANVAS_WIDTH = 720;
      const CANVAS_HEIGHT = 1280; 

      videoElement.crossOrigin = "anonymous"
      videoElement.muted = true
      videoElement.currentTime = 0;
      
      if (videoElement.readyState < 3) {
          await new Promise((r) => { videoElement.oncanplay = r })
      }

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioContext()
      const dest = audioCtx.createMediaStreamDestination()
      const sourceNode = audioCtx.createBufferSource()
      
      const audioBuffer = await audioBlob.arrayBuffer()
      const decodedAudio = await audioCtx.decodeAudioData(audioBuffer)
      sourceNode.buffer = decodedAudio
      sourceNode.connect(dest)

      let avatarImg: HTMLImageElement | null = null;
      if (userData?.avatar && userData.avatar.startsWith('blob:')) {
          avatarImg = new Image();
          avatarImg.src = userData.avatar;
          await new Promise(r => avatarImg!.onload = r).catch(() => avatarImg = null);
      }

      const canvas = document.createElement("canvas")
      canvas.width = CANVAS_WIDTH
      canvas.height = CANVAS_HEIGHT
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("No ctx")

      const canvasStream = canvas.captureStream(30)
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ])

      // Usar bitrates altos para calidad
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 5000000 
      })

      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      
      recorder.onstop = () => {
        const fullBlob = new Blob(chunks, { type: "video/webm" })
        combinedStream.getTracks().forEach(track => track.stop())
        audioCtx.close()
        resolve(fullBlob)
      }

      let animationId: number;
      const drawFrame = () => {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          if (!videoElement.paused && !videoElement.ended) {
             drawCover(ctx, videoElement, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          } else {
             drawCover(ctx, videoElement, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          }

          // UI REDDIT
          const padding = 40;
          const headerY = 250;

          // Avatar
          if (avatarImg) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(padding + 25, headerY, 25, 0, Math.PI * 2, true);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(avatarImg, padding, headerY - 25, 50, 50);
              ctx.restore();
          } else {
              ctx.fillStyle = "#FF4500";
              ctx.beginPath();
              ctx.arc(padding + 25, headerY, 25, 0, Math.PI * 2);
              ctx.fill();
          }

          // Nombre Usuario
          ctx.fillStyle = "white";
          ctx.font = "bold 24px Arial";
          ctx.textAlign = "left";
          ctx.shadowColor = "black";
          ctx.shadowBlur = 4;
          ctx.fillText(`u/${userData?.name || 'RedditUser'}`, padding + 60, headerY + 8);

          // Texto
          ctx.font = "bold 34px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          
          wrapText(ctx, script, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50, CANVAS_WIDTH - 80, 50);

          if (recorder.state === 'recording') {
              animationId = requestAnimationFrame(drawFrame);
          }
      };

      // Play seguro
      videoElement.play().catch(e => console.warn("Auto-play warning:", e));
      
      recorder.start();
      sourceNode.start(0);
      drawFrame();

      const totalDuration = duration || decodedAudio.duration || 10;
      const startTime = Date.now();

      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const p = Math.min((elapsed / totalDuration) * 100, 99);
        onProgress(p);
      }, 200);

      sourceNode.onended = () => {
        clearInterval(progressInterval);
        onProgress(100);
        if (recorder.state === 'recording') recorder.stop();
        videoElement.pause();
        cancelAnimationFrame(animationId);
      };

    } catch (e) {
      console.error("Error crítico en grabación:", e)
      reject(e)
    }
  })
}