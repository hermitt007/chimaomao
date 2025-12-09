import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accessToken, title, videoSize } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ message: "Token de acceso requerido" }, { status: 401 })
    }

    // Inicializar publicación con TikTok Content Posting API
    const response = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: title.substring(0, 150), // TikTok limita a 150 caracteres
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("TikTok init error:", error)
      return NextResponse.json(
        { message: error.error?.message || "Error al inicializar publicación" },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json({
      uploadUrl: data.data.upload_url,
      publishId: data.data.publish_id,
    })
  } catch (error) {
    console.error("TikTok publish init error:", error)
    return NextResponse.json({ message: "Error del servidor" }, { status: 500 })
  }
}
