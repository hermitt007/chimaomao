"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, Play, Link, Upload, Loader2, Youtube, Download, AlertCircle, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import type { BackgroundVideo } from "@/components/video-generator"

// =====================================================================
// 1. CONFIGURACIÓN DE MOTORES
// =====================================================================

// Instancias de Cobalt (Gratis)
const COBALT_INSTANCES = [
  "https://cobalt.wuk.sh",
  "https://api.cobalt.tools",
  "https://cobalt.kwiatekmiki.com",
  "https://cobalt.tools"
];

// Tu RapidAPI (Respaldo Infalible)
const RAPID_API_KEY = '1044ee640amsh8bad42eaa4d1d8dp126afbjsn76e10ace99b1';
const RAPID_API_HOST = 'youtube-media-downloader.p.rapidapi.com';

// Proxy para evitar bloqueo del navegador (CORS)
const CORS_PROXY = "https://corsproxy.io/?";

interface BackgroundVideoSelectorProps {
  selectedVideo: BackgroundVideo | null
  setSelectedVideo: (video: BackgroundVideo) => void
}

const categories = ["Custom", "Satisfactorio", "Subway S.", "Minecraft", "GTA"]

const backgroundVideos: BackgroundVideo[] = [
  {
    id: "mc1", category: "Minecraft", title: "Minecraft Parkour",
    thumbnail: "https://img.youtube.com/vi/aZ3f_Xj6VQM/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=85z7jqGAGcc", isYoutube: true, youtubeId: "aZ3f_Xj6VQM"
  },
  {
    id: "ss1", category: "Subway S.", title: "Subway Surfers",
    thumbnail: "https://img.youtube.com/vi/XYqOrsmEDtE/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=vTfD20dbxho", isYoutube: true, youtubeId: "XYqOrsmEDtE"
  },
  {
    id: "gta1", category: "GTA", title: "GTA V Stunts",
    thumbnail: "https://img.youtube.com/vi/K5J_iXw8gwc/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=xv3wFGGeIsI", isYoutube: true, youtubeId: "K5J_iXw8gwc"
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
        thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        videoId: id
    });
    setErrorMsg("");
    setManualLink(null);
  }

  // --- 2. MOTOR DE DESCARGA MAESTRO ---
  const handleDownload = async (urlOverride?: string, infoOverride?: any) => {
    const targetUrl = urlOverride || youtubeUrl;
    const targetInfo = infoOverride || previewInfo;
    const videoId = getID(targetUrl);

    if (!targetUrl || !videoId) return;

    setLoading(true);
    setProgress(10);
    setErrorMsg("");
    setManualLink(null);
    setStatusMsg("Iniciando motores...");
    
    // Progreso falso visual
    const interval = setInterval(() => setProgress(p => (p < 90 ? p + 2 : p)), 200);

    try {
      let downloadLink = "";

      // ==========================================
      // INTENTO A: COBALT (Gratis)
      // ==========================================
      for (const instance of COBALT_INSTANCES) {
          try {
              console.log(`Probando Cobalt: ${instance}`);
              // Intento v10
              let res = await fetch(`${instance}/`, {
                  method: "POST",
                  headers: { "Accept": "application/json", "Content-Type": "application/json" },
                  body: JSON.stringify({ url: targetUrl, vQuality: "720", filenamePattern: "basic" })
              });

              // Intento v7 fallback
              if (res.status === 404) {
                  res = await fetch(`${instance}/api/json`, {
                      method: "POST",
                      headers: { "Accept": "application/json", "Content-Type": "application/json" },
                      body: JSON.stringify({ url: targetUrl, vQuality: "720" })
                  });
              }

              const data = await res.json();
              const link = data.url || data.picker?.[0]?.url || data.audio;
              
              if (link) {
                  downloadLink = link;
                  console.log("¡Cobalt funcionó!");
                  break; 
              }
          } catch (e) {
              // Falló esta instancia, probamos la siguiente
          }
      }

      // ==========================================
      // INTENTO B: RAPIDAPI (Respaldo)
      // ==========================================
      if (!downloadLink) {
          console.log("Cobalt falló. Activando RapidAPI...");
          setStatusMsg("Usando RapidAPI...");
          
          const apiUrl = `https://${RAPID_API_HOST}/v2/video/details?videoId=${videoId}`;
          const apiRes = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'x-rapidapi-key': RAPID_API_KEY,
              'x-rapidapi-host': RAPID_API_HOST
            }
          });

          if (apiRes.ok) {
              const data = await apiRes.json();
              // Buscar mejor calidad MP4
              if (data.videos?.items) {
                  const best = data.videos.items.find((v: any) => v.quality === '720p' && v.extension === 'mp4') 
                            || data.videos.items.find((v: any) => v.extension === 'mp4')
                            || data.videos.items[0];
                  downloadLink = best?.url;
              }
          }
      }

      if (!downloadLink) {
          throw new Error("No se pudo obtener el enlace de descarga.");
      }

      console.log("Link final:", downloadLink);
      setStatusMsg("Descargando archivo...");
      setProgress(60);

      // ==========================================
// FASE FINAL: DESCARGA VIA BACKEND (SIN CORS)
try {
    setStatusMsg("Descargando desde servidor seguro...");

    const fileRes = await fetch("/api/youtube/download/route.ts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: downloadLink })
    });

    if (!fileRes.ok) throw new Error("Error en el servidor al bajar el archivo");

    const blob = await fileRes.blob();
    const localUrl = URL.createObjectURL(blob);

    // Guardamos el video en la app
    saveVideoToApp(localUrl, targetInfo);

} catch (fetchError: any) {
    console.warn("Descarga automática falló. Activando modo manual.", fetchError);

    // Activa modo manual
    setManualLink(downloadLink);

    // NO lanzar error que detona en consola
    setErrorMsg("La descarga automática falló. Usa el modo manual.");

    // Detener spinner y barra de progreso
    setLoading(false);
    setProgress(0);

    // Corta aquí sin romper React
    return;
}



    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error desconocido");
      if (!manualLink) setProgress(0);
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

                        {/* PLAN DE EMERGENCIA: DESCARGA MANUAL */}
                        {manualLink && (
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg space-y-2 mt-2">
                                <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                                    <AlertCircle className="w-4 h-4"/> Descarga automática bloqueada
                                </div>
                                <p className="text-xs text-muted-foreground">Tu navegador bloqueó la conexión. Hazlo en 2 pasos:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" variant="outline" className="text-xs" 
                                        onClick={() => window.open(manualLink, '_blank')}>
                                        <ExternalLink className="w-3 h-3 mr-2"/> 1. Bajar Video
                                    </Button>
                                    <Button size="sm" className="text-xs" 
                                        onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="w-3 h-3 mr-2"/> 2. Subirlo aquí
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
                            if (video.isYoutube && !activeCategory.includes("Custom")) {
                                handleDownload(video.videoUrl, video); 
                            } else {
                                setSelectedVideo(video);
                            }
                        }}
                    >
                        <img src={video.thumbnail} className="w-full h-full object-cover opacity-70"/>
                        {loading && (selectedVideo?.id === video.id || (youtubeUrl && video.videoUrl === youtubeUrl)) && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>
                        )}
                        <div className="absolute top-1 left-1">{video.isYoutube ? <Youtube className="w-3 h-3 text-red-500"/> : <Check className="w-3 h-3 text-white"/>}</div>
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