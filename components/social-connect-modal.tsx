"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TikTokIcon } from "@/components/icons/tiktok-icon"
import { FacebookIcon } from "@/components/icons/facebook-icon"
import { YouTubeIcon } from "@/components/icons/youtube-icon"
import { InstagramIcon } from "@/components/icons/instagram-icon"

interface InstagramUser {
  username: string
  name: string
  avatar: string
}

interface SocialPlatform {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  bgColor: string
  connected: boolean
  user?: InstagramUser
}

interface SocialConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect: (platform: string) => void
}

export function SocialConnectModal({ open, onOpenChange, onConnect }: SocialConnectModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    {
      id: "tiktok",
      name: "TikTok",
      icon: <TikTokIcon className="w-6 h-6" />,
      color: "#ff0050",
      bgColor: "bg-[#ff0050]/10",
      connected: false,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: <InstagramIcon className="w-6 h-6" />,
      color: "#E4405F",
      bgColor: "bg-[#E4405F]/10",
      connected: false,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <FacebookIcon className="w-6 h-6" />,
      color: "#1877F2",
      bgColor: "bg-[#1877F2]/10",
      connected: false,
    },
    {
      id: "youtube",
      name: "YouTube Shorts",
      icon: <YouTubeIcon className="w-6 h-6" />,
      color: "#FF0000",
      bgColor: "bg-[#FF0000]/10",
      connected: false,
    },
  ])

  const [instagramUsername, setInstagramUsername] = useState("")
  const [instagramPassword, setInstagramPassword] = useState("")
  const [instagramError, setInstagramError] = useState("")

  useEffect(() => {
    // Cargar conexiones guardadas
    const loadConnections = () => {
      setPlatforms((prev) =>
        prev.map((p) => {
          const stored = localStorage.getItem(`${p.id}_connection`)
          if (stored) {
            try {
              const data = JSON.parse(stored)
              return { ...p, connected: true, user: data }
            } catch {
              return p
            }
          }
          return p
        }),
      )
    }
    loadConnections()
  }, [open])

  const handleConnect = async (platformId: string) => {
    if (platformId === "instagram") {
      setInstagramError("")

      if (!instagramUsername.trim()) {
        setInstagramError("El nombre de usuario es requerido")
        return
      }

      if (!instagramPassword.trim()) {
        setInstagramError("La contraseña es requerida")
        return
      }

      // Validate username format (alphanumeric, dots, underscores)
      const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/
      if (!usernameRegex.test(instagramUsername.trim())) {
        setInstagramError("Nombre de usuario inválido. Solo letras, números, puntos y guiones bajos.")
        return
      }

      if (instagramPassword.length < 6) {
        setInstagramError("La contraseña debe tener al menos 6 caracteres")
        return
      }

      setConnecting(platformId)

      // Simular autenticación (en producción usarías Instagram Basic Display API)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const userData: InstagramUser = {
        username: `@${instagramUsername.trim().toLowerCase()}`,
        name: instagramUsername.trim(),
        avatar: "/instagram-avatar.jpg",
      }

      localStorage.setItem("instagram_connection", JSON.stringify(userData))
      localStorage.setItem("instagram_username", instagramUsername.trim())

      setPlatforms((prev) => prev.map((p) => (p.id === platformId ? { ...p, connected: true, user: userData } : p)))
      setConnecting(null)
      setInstagramUsername("")
      setInstagramPassword("")
      onConnect(platformId)
      return
    }

    setConnecting(platformId)

    // Simular OAuth popup
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    // Para TikTok, usar la URL real de OAuth si está configurada
    if (platformId === "tiktok" && process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY) {
      const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY
      const redirectUri = encodeURIComponent(`${window.location.origin}/api/tiktok/callback`)
      const scope = encodeURIComponent("user.info.basic,video.publish")
      const state = Math.random().toString(36).substring(7)
      const csrfState = state

      localStorage.setItem("tiktok_csrf_state", csrfState)

      const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${csrfState}`

      const popup = window.open(
        authUrl,
        `${platformId}_auth`,
        `width=${width},height=${height},left=${left},top=${top}`,
      )

      // Escuchar mensaje del popup
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === "TIKTOK_AUTH_SUCCESS") {
          const userData = event.data.user
          localStorage.setItem(`${platformId}_connection`, JSON.stringify(userData))
          localStorage.setItem("tiktok_connected", "true")
          localStorage.setItem("tiktok_access_token", event.data.accessToken)

          setPlatforms((prev) => prev.map((p) => (p.id === platformId ? { ...p, connected: true, user: userData } : p)))
          setConnecting(null)
          onConnect(platformId)
        }
      }

      window.addEventListener("message", handleMessage)

      // Limpiar después de un tiempo
      setTimeout(() => {
        window.removeEventListener("message", handleMessage)
        setConnecting(null)
      }, 120000)

      return
    }

    // Para otras plataformas, simular conexión con datos de prueba
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockUsers: Record<string, { name: string; avatar: string; username: string }> = {
      tiktok: { name: "Tu Usuario TikTok", avatar: "/tiktok-avatar.jpg", username: "@tiktokuser" },
      instagram: { name: "Tu Usuario Instagram", avatar: "/instagram-avatar.jpg", username: "@instauser" },
      facebook: { name: "Tu Página Facebook", avatar: "/facebook-avatar.jpg", username: "Mi Página" },
      youtube: { name: "Tu Canal YouTube", avatar: "/youtube-avatar.jpg", username: "@ytchannel" },
    }

    const userData = mockUsers[platformId]
    localStorage.setItem(`${platformId}_connection`, JSON.stringify(userData))
    if (platformId === "tiktok") {
      localStorage.setItem("tiktok_connected", "true")
    }

    setPlatforms((prev) => prev.map((p) => (p.id === platformId ? { ...p, connected: true, user: userData } : p)))
    setConnecting(null)
    onConnect(platformId)
  }

  const handleDisconnect = (platformId: string) => {
    localStorage.removeItem(`${platformId}_connection`)
    if (platformId === "tiktok") {
      localStorage.removeItem("tiktok_connected")
      localStorage.removeItem("tiktok_access_token")
    }
    setPlatforms((prev) => prev.map((p) => (p.id === platformId ? { ...p, connected: false, user: undefined } : p)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">Conectar Redes Sociales</DialogTitle>
          <DialogDescription>Vincula tus cuentas para publicar directamente desde ReelForge</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={`p-4 rounded-xl border transition-all ${
                platform.connected ? "border-green-500/30 bg-green-500/5" : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${platform.bgColor}`} style={{ color: platform.color }}>
                    {platform.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{platform.name}</p>
                    {platform.connected && platform.user ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={platform.user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{platform.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{platform.user.username}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No conectado</p>
                    )}
                  </div>
                </div>

                {platform.connected ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDisconnect(platform.id)}
                    >
                      Desconectar
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="gap-2"
                    style={{ backgroundColor: platform.color }}
                    disabled={connecting === platform.id}
                    onClick={() => handleConnect(platform.id)}
                  >
                    {connecting === platform.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Conectar
                      </>
                    )}
                  </Button>
                )}
              </div>

              {platform.id === "instagram" && !platform.connected && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram-username">Nombre de usuario</Label>
                    <Input
                      id="instagram-username"
                      placeholder="tu_usuario"
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value)}
                      disabled={connecting === platform.id}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram-password">Contraseña</Label>
                    <Input
                      id="instagram-password"
                      type="password"
                      placeholder="••••••••"
                      value={instagramPassword}
                      onChange={(e) => setInstagramPassword(e.target.value)}
                      disabled={connecting === platform.id}
                    />
                  </div>

                  {instagramError && <p className="text-sm text-destructive">{instagramError}</p>}

                  <Button
                    className="w-full gap-2"
                    style={{ backgroundColor: "#E4405F" }}
                    disabled={connecting === platform.id}
                    onClick={handleConnect}
                  >
                    {connecting === platform.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Conectar Instagram
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Al conectar, autorizas a ReelForge a publicar contenido en tu nombre
        </div>
      </DialogContent>
    </Dialog>
  )
}
