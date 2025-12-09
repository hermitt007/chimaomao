import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accessToken, publishId } = await request.json()

    if (!accessToken || !publishId) {
      return NextResponse.json({ message: "Parámetros requeridos" }, { status: 400 })
    }

    // Verificar estado de la publicación
    const response = await fetch(`https://open.tiktokapis.com/v2/post/publish/status/fetch/?publish_id=${publishId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { message: error.error?.message || "Error al verificar publicación" },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json({
      status: data.data.status,
      publishId: publishId,
    })
  } catch (error) {
    console.error("TikTok publish confirm error:", error)
    return NextResponse.json({ message: "Error del servidor" }, { status: 500 })
  }
}
