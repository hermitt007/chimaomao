// app/api/download/route.ts

import { NextResponse } from "next/server";

// Timeout largo para videos grandes
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL faltante" }, { status: 400 });
    }

    console.log("Descargando desde servidor:", url);

    // Descargar desde el servidor (evita CORS)
    const videoRes = await fetch(url);

    if (!videoRes.ok) {
      return NextResponse.json(
        { error: "Error al descargar desde el servidor" },
        { status: 500 }
      );
    }

    const arrayBuffer = await videoRes.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": "attachment; filename=video.mp4",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      }
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
