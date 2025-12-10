import { NextResponse } from 'next/server';

const RAPID_API_KEY = '1044ee640amsh8bad42eaa4d1d8dp126afbjsn76e10ace99b1';
const RAPID_API_HOST = 'youtube-media-downloader.p.rapidapi.com';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    // 1. Extraer ID
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[7].length == 11) ? match[7] : false;

    if (!videoId) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    console.log(`[Server] Buscando video ID: ${videoId}`);

    // 2. Pedir info a RapidAPI (Desde el servidor NO hay bloqueo)
    const apiUrl = `https://${RAPID_API_HOST}/v2/video/details?videoId=${videoId}`;
    
    const apiRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': RAPID_API_HOST
      }
    });

    if (!apiRes.ok) {
      throw new Error(`Error RapidAPI: ${apiRes.status}`);
    }

    const data = await apiRes.json();

    // 3. Buscar el mejor link MP4 (720p o 360p)
    let directUrl = '';
    if (data.videos?.items) {
      const best = data.videos.items.find((v: any) => v.quality === '720p' && v.extension === 'mp4') 
                || data.videos.items.find((v: any) => v.extension === 'mp4');
      directUrl = best?.url || '';
    }

    if (!directUrl) {
      return NextResponse.json({ error: 'No se encontró link MP4' }, { status: 404 });
    }

    // 4. Devolver todo limpio al frontend
    return NextResponse.json({
      title: data.title,
      thumbnail: data.thumbnails?.[data.thumbnails.length - 1]?.url,
      author: data.author,
      duration: data.lengthSeconds, // A veces la API devuelve esto
      downloadUrl: directUrl // Link directo al archivo de video
    });

  } catch (error: any) {
    console.error("[Server Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}