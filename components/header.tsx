"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Video, Sparkles, Link2 } from "lucide-react"
import { TikTokIcon } from "@/components/icons/tiktok-icon"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SocialConnectModal } from "@/components/social-connect-modal"
import {
  getTikTokAuthUrl,
  getTikTokConnection,
  setTikTokConnection,
  disconnectTikTok,
  type TikTokUser,
} from "@/lib/tiktok-auth"

export function Header() {
  const [tiktokConnected, setTiktokConnected] = useState(false)
  const [tiktokUser, setTiktokUser] = useState<TikTokUser | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showSocialModal, setShowSocialModal] = useState(false)
  const [connectedCount, setConnectedCount] = useState(0)

  useEffect(() => {
    // Verificar si hay usuario guardado
    const stored = getTikTokConnection()
    if (stored) {
      setTiktokConnected(true)
      setTiktokUser(stored)
    }

    // Manejar callback de OAuth
    const urlParams = new URLSearchParams(window.location.search)
    const tiktokSuccess = urlParams.get("tiktok_success")
    const tiktokUserData = urlParams.get("tiktok_user")
    const tiktokError = urlParams.get("tiktok_error")

    if (tiktokSuccess === "true" && tiktokUserData) {
      try {
        const userData = JSON.parse(decodeURIComponent(tiktokUserData)) as TikTokUser
        setTikTokConnection(userData)
        setTiktokUser(userData)
        setTiktokConnected(true)

        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (e) {
        console.error("Error parsing TikTok user data:", e)
      }
    }

    if (tiktokError) {
      console.error("TikTok OAuth error:", tiktokError)
      alert(`Error al conectar con TikTok: ${tiktokError}`)
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const checkConnections = () => {
      let count = 0
      const platforms = ["tiktok", "instagram", "facebook", "youtube"]
      platforms.forEach((p) => {
        if (localStorage.getItem(`${p}_connection`)) count++
      })
      setConnectedCount(count)
    }

    checkConnections()
    window.addEventListener("storage", checkConnections)
    return () => window.removeEventListener("storage", checkConnections)
  }, [])

  const handleTikTokConnect = async () => {
    if (tiktokConnected) {
      setShowDialog(true)
      return
    }

    // Verificar si hay configuración de TikTok
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY

    if (!clientKey) {
      setShowConfigDialog(true)
      return
    }

    setIsConnecting(true)

    // Redirigir a TikTok OAuth
    const authUrl = getTikTokAuthUrl()
    if (authUrl) {
      window.location.href = authUrl
    } else {
      setShowConfigDialog(true)
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    disconnectTikTok()
    setTiktokConnected(false)
    setTiktokUser(null)
    setShowDialog(false)
  }

  const handleConnect = () => {
    // Actualizar contador
    let count = 0
    const platforms = ["tiktok", "instagram", "facebook", "youtube"]
    platforms.forEach((p) => {
      if (localStorage.getItem(`${p}_connection`)) count++
    })
    setConnectedCount(count)
  }

  return (
    <>
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                ReelForge
                <Sparkles className="w-4 h-4 text-primary" />
              </h1>
              <p className="text-xs text-muted-foreground">Crea videos virales con IA</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tiktokConnected && tiktokUser && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#ff0050]/10 rounded-full">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={tiktokUser.avatar || "/placeholder.svg"} />
                  <AvatarFallback>TT</AvatarFallback>
                </Avatar>
                <span className="text-sm text-[#ff0050] font-medium">{tiktokUser.displayName}</span>
              </div>
            )}

            <Button
              onClick={() => setShowSocialModal(true)}
              variant={connectedCount > 0 ? "default" : "outline"}
              className={`gap-2 ${
                connectedCount > 0
                  ? "bg-gradient-to-r from-[#ff0050] via-[#E4405F] to-[#1877F2] hover:opacity-90 text-white border-0"
                  : "border-primary/50 text-primary hover:bg-primary/10"
              }`}
            >
              <Link2 className="w-4 h-4" />
              {connectedCount > 0 ? (
                <>
                  {connectedCount} {connectedCount === 1 ? "Cuenta" : "Cuentas"}
                </>
              ) : (
                "Conectar Redes"
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Dialog de desconexión */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Desconectar TikTok</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres desconectar tu cuenta de TikTok? No podrás publicar videos directamente.
            </DialogDescription>
          </DialogHeader>
          {tiktokUser && (
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
              <Avatar>
                <AvatarImage src={tiktokUser.avatar || "/placeholder.svg"} />
                <AvatarFallback>TT</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{tiktokUser.displayName}</p>
                <p className="text-xs text-muted-foreground">Cuenta conectada</p>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDisconnect} className="gap-2">
              <Link2 className="w-4 h-4" />
              Desconectar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de configuración necesaria */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <TikTokIcon className="w-5 h-5 text-[#ff0050]" />
              Configuración de TikTok API
            </DialogTitle>
            <DialogDescription>
              Para conectar con TikTok, necesitas configurar las credenciales de la API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-secondary rounded-lg space-y-3">
              <h4 className="font-medium text-foreground">Pasos para configurar:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Ve a{" "}
                  <a
                    href="https://developers.tiktok.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    TikTok for Developers
                    <Link2 className="w-3 h-3" />
                  </a>
                </li>
                <li>Crea una aplicación nueva</li>
                <li>Agrega el producto "Login Kit" y "Content Posting API"</li>
                <li>
                  Configura la URL de callback:{" "}
                  <code className="bg-background px-1 rounded">
                    {typeof window !== "undefined" ? window.location.origin : ""}/api/tiktok/callback
                  </code>
                </li>
                <li>Agrega las variables de entorno:</li>
              </ol>
              <div className="bg-background p-3 rounded-md font-mono text-xs">
                <p>NEXT_PUBLIC_TIKTOK_CLIENT_KEY=tu_client_key</p>
                <p>TIKTOK_CLIENT_SECRET=tu_client_secret</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowConfigDialog(false)}>Entendido</Button>
          </div>
        </DialogContent>
      </Dialog>

      <SocialConnectModal open={showSocialModal} onOpenChange={setShowSocialModal} onConnect={handleConnect} />
    </>
  )
}
