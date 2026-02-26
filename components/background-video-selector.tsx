"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, Play, Link, Upload, Loader2, Youtube, Download, AlertCircle, ExternalLink, Video } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import type { BackgroundVideo } from "@/components/video-generator"

// =====================================================================
// 1. CONFIGURACIÓN
// =====================================================================

// Instancias de Cobalt (Gratis)
const COBALT_INSTANCES = [
  "https://cobalt.wuk.sh",
  "https://api.cobalt.tools",
  "https://cobalt.kwiatekmiki.com",
];

// Tu RapidAPI (Respaldo)
const RAPID_API_KEY = '1044ee640amsh8bad42eaa4d1d8dp126afbjsn76e10ace99b1';
const RAPID_API_HOST = 'youtube-media-downloader.p.rapidapi.com';

// Proxy CORS
const CORS_PROXY = "https://corsproxy.io/?";

interface BackgroundVideoSelectorProps {
  selectedVideo: BackgroundVideo | null
  setSelectedVideo: (video: BackgroundVideo) => void
}

const categories = ["Custom", "Satisfactorio", "Subway S.", "Minecraft", "GTA"]

// =====================================================================
// 2. TUS VIDEOS LOCALES (Ya descargados)
// =====================================================================
// Asegúrate de que los nombres de archivo coincidan EXACTAMENTE con los que subiste a public/videos/
const backgroundVideos: BackgroundVideo[] = [
  {
    id: "mc1", 
    category: "Minecraft", 
    title: "Minecraft Parkour",
    // Usa una captura del video o un placeholder si no tienes imagen
    thumbnail: "/placeholder.svg", 
    // Ruta relativa a la carpeta public
    videoUrl: "/videos/Parkour 3.mp4", 
    isYoutube: false // ¡Importante! Ya no es YouTube
  },
  {
    id: "mc2", 
    category: "Minecraft", 
    title: "Parkour Rápido",
    thumbnail: "/placeholder.svg", 
    videoUrl: "/videos/Parkour 3.mp4", 
    isYoutube: false
  },
  {
    id: "mc3", 
    category: "Minecraft", 
    title: "Parkour Extremo",
    thumbnail: "/placeholder.svg", 
    videoUrl: "/videos/Parkour 3.mp4", 
    isYoutube: false
  },
  {
    id: "ss1", 
    category: "Subway S.", 
    title: "Subway Run 1",
    thumbnail: "/placeholder.svg", 
    videoUrl: "/videos/run 1.mp4", 
    isYoutube: false
  },
  {
    id: "ss2", 
    category: "Subway S.", 
    title: "Subway Run 2",
    thumbnail: "/placeholder.svg", 
    videoUrl: "/videos/run 2.mp4", 
    isYoutube: false
  },
  {
    id: "ss3", 
    category: "Subway S.", 
    title: "Subway Run 3",
    thumbnail: "/placeholder.svg", 
    videoUrl: "/videos/run 3.mp4", 
    isYoutube: false
  },
  {
    id: "gta1", 
    category: "GTA", 
    title: "GTA V Stunts",
    thumbnail: "/placeholder.svg", 
    videoUrl: "/videos/gta 2.mp4", 
    isYoutube: false
  },
  {
    id: "sat1", 
    category: "Satisfactorio", 
    title: "Satisfying Loop",
    thumbnail: "/placeholder.svg", 
    videoUrl: "/videos/satisfactory.mp4", 
    isYoutube: false
  }
]

export function BackgroundVideoSelector({ selectedVideo, setSelectedVideo }: BackgroundVideoSelectorProps) {
  const [activeCategory, setActiveCategory] = useState("Minecraft")
  const [customVideoUrl, setCustomVideoUrl] = useState("")
  const [customVideos, setCustomVideos] = useState<BackgroundVideo[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  
  // Datos temporales
  const [previewInfo, setPreviewInfo] = useState<any>(null)
  const [manualLink, setManualLink] = useState<string | null>(null)
  const [isApiLimitError, setIsApiLimitError] = useState(false)

  const filteredVideos =
    activeCategory === "Custom" ? customVideos : backgroundVideos.filter((v) => v.category === activeCategory)

  // Helper ID
  const getID = (url: string) => {
    const match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
    return (match && match[7].length == 11) ? match[7] : false;
  }

  // --- 1. PREVIEW VISUAL ---
  const handlePreview = () => {
    const id = getID(youtubeUrl);
    if (!id) { setErrorMsg("URL inválida"); return; }
    
    setPreviewInfo({
        title: "Video detectado",
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        videoId: id
    });
    setErrorMsg("");
    setManualLink(null);
    setIsApiLimitError(false);
  }

  // --- 2. MOTOR DE DESCARGA (Solo para URLs nuevas que pegue el usuario) ---
  const handleDownload = async (urlOverride?: string, infoOverride?: any) => {
    const targetUrl = urlOverride || youtubeUrl;
    const targetInfo = infoOverride || previewInfo;
    const videoId = getID(targetUrl);

    if (!targetUrl || !videoId) return;

    setLoading(true);
    setProgress(10);
    setErrorMsg("");
    setManualLink(null);
    setIsApiLimitError(false);
    setStatusMsg("Iniciando descarga...");
    
    const interval = setInterval(() => setProgress(p => (p < 90 ? p + 2 : p)), 200);

    try {
      let downloadLink = "";

      // --- INTENTO A: COBALT ---
      for (const instance of COBALT_INSTANCES) {
          try {
              let res = await fetch(`${instance}/`, {
                  method: "POST",
                  headers: { "Accept": "application/json", "Content-Type": "application/json" },
                  body: JSON.stringify({ url: targetUrl, vQuality: "720", filenamePattern: "basic" })
              });

              if (res.status === 404) {
                  res = await fetch(`${instance}/api/json`, {
                      method: "POST",
                      headers: { "Accept": "application/json", "Content-Type": "application/json" },
                      body: JSON.stringify({ url: targetUrl, vQuality: "720" })
                  });
              }

              const data = await res.json();
              const link = data.url || data.picker?.[0]?.url || data.audio;
              if (link) { downloadLink = link; break; }
          } catch (e) { }
      }

      // --- INTENTO B: RAPIDAPI ---
      if (!downloadLink) {
          const apiUrl = `https://${RAPID_API_HOST}/v2/video/details?videoId=${videoId}`;
          const apiRes = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'x-rapidapi-key': RAPID_API_KEY,
              'x-rapidapi-host': RAPID_API_HOST
            }
          });

          if (apiRes.status === 429) {
              setIsApiLimitError(true);
              setManualLink("https://cobalt.tools"); 
              throw new Error("Cuota agotada. Usa la opción manual.");
          }

          if (apiRes.ok) {
              const data = await apiRes.json();
              if (data.videos?.items) {
                  const best = data.videos.items.find((v: any) => v.quality === '720p' && v.extension === 'mp4') 
                            || data.videos.items.find((v: any) => v.extension === 'mp4')
                            || data.videos.items[0];
                  downloadLink = best?.url;
              }
          }
      }

      if (!downloadLink) {
          setManualLink("https://cobalt.tools"); 
          throw new Error("No se pudo obtener enlace automático.");
      }

      console.log("Link encontrado:", downloadLink);
      setStatusMsg("Guardando archivo...");
      setProgress(60);

      try {
          const safeLink = CORS_PROXY + encodeURIComponent(downloadLink);
          const fileRes = await fetch(safeLink);
          if (!fileRes.ok) throw new Error("Bloqueo de red");
          const blob = await fileRes.blob();
          const localUrl = URL.createObjectURL(blob);          
          saveVideoToApp(localUrl, targetInfo);

      } catch (fetchError) {
          // Fallback: pedimos al backend que descargue el archivo para evitar bloqueos CORS del navegador.
          const proxyRes = await fetch("/api/youtube/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl }),
          });

          if (!proxyRes.ok) {
            setManualLink(downloadLink);
            throw new Error("Descarga automática bloqueada por el navegador.");
          }

          const proxyBlob = await proxyRes.blob();
          const localUrl = URL.createObjectURL(proxyBlob);
          saveVideoToApp(localUrl, targetInfo);
      }

    } catch (err: any) {
      console.error(err);
      if (!manualLink) setErrorMsg(err.message || "Error desconocido");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  const saveVideoToApp = (blobUrl: string, info: any) => {
      const newVideo: BackgroundVideo = {
        id: `dl-${Date.now()}`,
        category: "Custom",
        thumbnail: info?.thumbnail || "/placeholder.svg",
        videoUrl: blobUrl, 
        title: info?.title || "Video Descargado",
        isYoutube: false
      }
      setCustomVideos(prev => [...prev, newVideo]);
      setSelectedVideo(newVideo);
      setActiveCategory("Custom");
      setYoutubeUrl("");
      setPreviewInfo(null);
      setProgress(100);
      setStatusMsg("¡Listo!");
      setTimeout(() => { setProgress(0); setStatusMsg("") }, 3000);
  }

  // --- HANDLERS ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    const newVideo = { id: `up-${Date.now()}`, category: "Custom", thumbnail: "/placeholder.svg", videoUrl: url, title: file.name };
    setCustomVideos(prev => [...prev, newVideo]); setSelectedVideo(newVideo); setActiveCategory("Custom");
  }

  const handleCustomUrl = () => {
    if(!customVideoUrl) return;
    const newVideo = { id: `url-${Date.now()}`, category: "Custom", thumbnail: "/placeholder.svg", videoUrl: customVideoUrl, title: "URL Externa" };
    setCustomVideos(prev => [...prev, newVideo]); setSelectedVideo(newVideo); setActiveCategory("Custom"); setCustomVideoUrl("");
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3"><CardTitle>Seleccionar Video de Fondo</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}>
                {cat === "Custom" && <Link className="w-4 h-4" />} {cat}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {activeCategory === "Custom" && (
            <div className="space-y-4 p-4 bg-secondary/50 rounded-lg border border-border">
                <Tabs defaultValue="youtube">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="youtube"><Youtube className="w-4 h-4 mr-2"/> YouTube</TabsTrigger>
                        <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2"/> Subir</TabsTrigger>
                        <TabsTrigger value="url"><Link className="w-4 h-4 mr-2"/> URL</TabsTrigger>
                    </TabsList>

                    <TabsContent value="youtube" className="mt-4 space-y-4">
                        <div className="flex gap-2">
                            <Input placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} 
                                onChange={(e) => {
                                    setYoutubeUrl(e.target.value);
                                    if(getID(e.target.value)) handlePreview();
                                }} 
                                disabled={loading}/>
                            <Button onClick={handlePreview} disabled={loading}><Play className="w-4 h-4"/></Button>
                        </div>

                        {previewInfo && (
                            <div className="bg-background border rounded-lg p-3">
                                <div className="flex gap-3 mb-3">
                                    <img src={previewInfo.thumbnail} className="w-24 h-16 object-cover rounded"/>
                                    <div>
                                        <p className="font-bold text-sm line-clamp-1">{previewInfo.title}</p>
                                        <p className="text-xs text-muted-foreground">ID: {previewInfo.videoId}</p>
                                    </div>
                                </div>
                                <Button className="w-full gap-2" onClick={() => handleDownload()} disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Download className="w-4 h-4"/>} 
                                    Descargar y Usar
                                </Button>
                            </div>
                        )}
                        
                        {loading && (
                             <div className="space-y-1 animate-in fade-in">
                                <div className="flex justify-between text-xs"><span>{statusMsg}</span><span>{Math.round(progress)}%</span></div>
                                <Progress value={progress} className="h-2"/>
                             </div>
                        )}

                        {manualLink && (
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg space-y-2 mt-2 animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                                    <AlertCircle className="w-4 h-4"/>
                                    {isApiLimitError ? "Tu API se agotó (429)" : "Descarga automática bloqueada"}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" variant="outline" className="text-xs" 
                                        onClick={() => window.open(manualLink, '_blank')}>
                                        <ExternalLink className="w-3 h-3 mr-2"/> 1. Ir a Descargar
                                    </Button>
                                    <Button size="sm" className="text-xs" 
                                        onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="w-3 h-3 mr-2"/> 2. Subir Archivo
                                    </Button>
                                </div>
                            </div>
                        )}

                        {errorMsg && !manualLink && (
                            <div className="flex items-center gap-2 text-destructive text-sm mt-2 p-2 bg-destructive/10 rounded">
                                <AlertCircle className="w-4 h-4"/> {errorMsg}
                            </div>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="upload" className="mt-4">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="video/*" className="hidden"/>
                        <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>Seleccionar archivo local</Button>
                    </TabsContent>
                    <TabsContent value="url" className="mt-4 flex gap-2">
                        <Input value={customVideoUrl} onChange={e => setCustomVideoUrl(e.target.value)} placeholder="https://..." />
                        <Button onClick={handleCustomUrl}>Agregar</Button>
                    </TabsContent>
                </Tabs>
            </div>
        )}

        <ScrollArea>
            <div className="flex gap-3 pb-2">
                {filteredVideos.map((video) => (
                    <div key={video.id}
                        className={cn("relative w-[100px] aspect-[9/16] rounded-lg overflow-hidden cursor-pointer flex-shrink-0 bg-black",
                            selectedVideo?.id === video.id ? "ring-2 ring-primary" : "hover:opacity-80"
                        )}
                        onClick={() => {
                            // Al hacer clic en un video local, lo seleccionamos directamente
                            // ya no intentamos descargar porque YA lo tienes
                            if (video.isYoutube && !activeCategory.includes("Custom")) {
                                handleDownload(video.videoUrl, video); 
                            } else {
                                setSelectedVideo(video);
                            }
                        }}
                    >
                        {/* Como son videos locales, usamos el propio video como thumbnail si no hay imagen */}
                        {video.videoUrl.endsWith('.mp4') ? (
                            <video src={video.videoUrl} className="w-full h-full object-cover opacity-70 pointer-events-none" />
                        ) : (
                            <img src={video.thumbnail} className="w-full h-full object-cover opacity-70"/>
                        )}
                        
                        {loading && (selectedVideo?.id === video.id || (youtubeUrl && video.videoUrl === youtubeUrl)) && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>
                        )}
                        
                        <div className="absolute top-1 left-1">
                            {video.isYoutube ? <Youtube className="w-3 h-3 text-red-500"/> : <Video className="w-3 h-3 text-white"/>}
                        </div>
                        
                        <div className="absolute bottom-0 w-full p-1 bg-gradient-to-t from-black to-transparent">
                            <p className="text-[10px] text-white font-bold truncate">{video.title}</p>
                        </div>
                    </div>
                ))}
            </div>
            <ScrollBar orientation="horizontal"/>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
