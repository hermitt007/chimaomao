import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // URL base para redirigir
  const baseUrl = request.nextUrl.origin

  if (error) {
    return NextResponse.redirect(`${baseUrl}?tiktok_error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}?tiktok_error=missing_params`)
  }

  try {
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET

    if (!clientKey || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}?tiktok_error=missing_config`)
    }

    // Intercambiar código por access token
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: `${baseUrl}/api/tiktok/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("TikTok token error:", errorData)
      return NextResponse.redirect(`${baseUrl}?tiktok_error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in, open_id } = tokenData

    // Obtener información del usuario
    const userResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    )

    let userData = { display_name: "Usuario TikTok", avatar_url: "" }
    if (userResponse.ok) {
      const userJson = await userResponse.json()
      userData = userJson.data?.user || userData
    }

    // Codificar datos del usuario para pasar via URL
    const userInfo = {
      openId: open_id,
      displayName: userData.display_name,
      avatar: userData.avatar_url,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + expires_in * 1000,
    }

    const encodedUser = encodeURIComponent(JSON.stringify(userInfo))

    return NextResponse.redirect(`${baseUrl}?tiktok_success=true&tiktok_user=${encodedUser}`)
  } catch (error) {
    console.error("TikTok callback error:", error)
    return NextResponse.redirect(`${baseUrl}?tiktok_error=server_error`)
  }
}
