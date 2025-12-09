// TikTok OAuth Configuration

export interface TikTokUser {
  openId: string
  unionId: string
  avatar: string
  displayName: string
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface TikTokConfig {
  clientKey: string
  clientSecret: string
}

// Los usuarios deben configurar sus propias credenciales de TikTok Developer
// Obtener en: https://developers.tiktok.com/
const TIKTOK_CONFIG: TikTokConfig = {
  clientKey: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || "",
  clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
}

export function getTikTokAuthUrl(): string {
  const clientKey = TIKTOK_CONFIG.clientKey

  if (!clientKey) {
    console.error("TikTok Client Key no configurado")
    return ""
  }

  const redirectUri = encodeURIComponent(window.location.origin + "/api/tiktok/callback")
  // Scopes necesarios para publicar videos
  const scope = encodeURIComponent("user.info.basic,video.publish,video.upload")
  const state = generateRandomState()

  // Guardar state para verificación CSRF
  localStorage.setItem("tiktok_oauth_state", state)

  // Code verifier para PKCE
  const codeVerifier = generateCodeVerifier()
  localStorage.setItem("tiktok_code_verifier", codeVerifier)

  const codeChallenge = codeVerifier // Para simplificar, usar plain. En producción usar S256

  return `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`
}

function generateRandomState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

export function getTikTokConnection(): TikTokUser | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("tiktok_user_data")
  if (!stored) return null

  const user = JSON.parse(stored) as TikTokUser

  // Verificar si el token ha expirado
  if (user.expiresAt && Date.now() > user.expiresAt) {
    // Token expirado, limpiar
    disconnectTikTok()
    return null
  }

  return user
}

export function setTikTokConnection(user: TikTokUser): void {
  localStorage.setItem("tiktok_user_data", JSON.stringify(user))
  localStorage.setItem("tiktok_connected", "true")
}

export function disconnectTikTok(): void {
  localStorage.removeItem("tiktok_user_data")
  localStorage.removeItem("tiktok_connected")
  localStorage.removeItem("tiktok_oauth_state")
  localStorage.removeItem("tiktok_code_verifier")
  localStorage.removeItem("tiktok_user")
}

export function isTikTokConnected(): boolean {
  return getTikTokConnection() !== null
}

export function getTikTokAccessToken(): string | null {
  const user = getTikTokConnection()
  return user?.accessToken || null
}

// Función para publicar video en TikTok
export async function publishToTikTok(
  videoBlob: Blob,
  title: string,
  onProgress?: (progress: number) => void,
): Promise<{ success: boolean; error?: string; publishId?: string }> {
  const accessToken = getTikTokAccessToken()

  if (!accessToken) {
    return { success: false, error: "No estás conectado a TikTok" }
  }

  try {
    onProgress?.(10)

    // Paso 1: Inicializar la publicación
    const initResponse = await fetch("/api/tiktok/publish/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken,
        title,
        videoSize: videoBlob.size,
      }),
    })

    if (!initResponse.ok) {
      const error = await initResponse.json()
      return { success: false, error: error.message || "Error al inicializar publicación" }
    }

    const { uploadUrl, publishId } = await initResponse.json()
    onProgress?.(30)

    // Paso 2: Subir el video
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": `bytes 0-${videoBlob.size - 1}/${videoBlob.size}`,
      },
      body: videoBlob,
    })

    if (!uploadResponse.ok) {
      return { success: false, error: "Error al subir el video" }
    }

    onProgress?.(80)

    // Paso 3: Confirmar publicación
    const confirmResponse = await fetch("/api/tiktok/publish/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken,
        publishId,
      }),
    })

    if (!confirmResponse.ok) {
      const error = await confirmResponse.json()
      return { success: false, error: error.message || "Error al confirmar publicación" }
    }

    onProgress?.(100)
    return { success: true, publishId }
  } catch (error) {
    console.error("Error publishing to TikTok:", error)
    return { success: false, error: "Error de conexión con TikTok" }
  }
}
