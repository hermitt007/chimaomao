import { NextResponse } from 'next/server';

// CREDENCIALES (Idealmente pon esto en un archivo .env)
const RAPID_API_KEY = '1044ee640amsh8bad42eaa4d1d8dp126afbjsn76e10ace99b1';
const RAPID_API_HOST = 'youtube-media-downloader.p.rapidapi.com';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    // 1. Extraer ID del video (Lógica adaptada de tu script)
    const videoId = extractVideoID(url);
    if (!videoId) {
      return NextResponse.json({ error: 'URL de YouTube inválida' }, { status: 400 });
    }

    // 2. Llamar a RapidAPI para obtener los detalles
    const infoUrl = `https://${RAPID_API_HOST}/v2/video/details?videoId=${videoId}`;
    
    console.log(`Consultando RapidAPI para ID: ${videoId}`);

    const infoResponse = await fetch(infoUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': RAPID_API_HOST
      }
    });

    if (!infoResponse.ok) {
      throw new Error(`Error en RapidAPI: ${infoResponse.status}`);
    }

    const data = await infoResponse.json();

    // 3. Buscar el enlace de descarga (Lógica adaptada de tu script)
    let downloadUrl = '';
    
    if (data.videos && data.videos.items && data.videos.items.length > 0) {
        // Buscamos 720p o el primero disponible
        const bestVideo = data.videos.items.find((v: any) => v.quality === '720p') || data.videos.items[0];
        downloadUrl = bestVideo.url;
    }

    if (!downloadUrl) {
        return NextResponse.json({ error: 'No se encontraron enlaces de descarga' }, { status: 404 });
    }

    console.log("URL de video encontrada, iniciando descarga...");

    // 4. Descargar el video al servidor (Buffer)
    const videoResponse = await fetch(downloadUrl);
    
    if (!videoResponse.ok) {
        throw new Error("No se pudo descargar el archivo de video final");
    }

    // Convertir a buffer
    const videoBuffer = await videoResponse.arrayBuffer();

    // 5. Enviar al cliente
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${data.title || 'video'}.mp4"`,
      },
    });

  } catch (error: any) {
    console.error("Error general:", error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

// Función auxiliar de extracción (Misma lógica que tu script)
function extractVideoID(url: string) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}
