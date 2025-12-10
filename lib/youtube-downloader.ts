// lib/youtube-downloader.ts

// TUS CREDENCIALES
const RAPID_API_KEY = '1044ee640amsh8bad42eaa4d1d8dp126afbjsn76e10ace99b1';
const RAPID_API_HOST = 'youtube-media-downloader.p.rapidapi.com';

export async function getDirectVideoUrl(videoId: string): Promise<string> {
  console.log(`[Downloader] Iniciando búsqueda para ID: ${videoId}`);

  // URL corregida y simplificada para RapidAPI
  const url = `https://${RAPID_API_HOST}/v2/video/details?videoId=${videoId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': RAPID_API_HOST
      }
    });

    if (!response.ok) {
      // Intentamos leer el error real de la API si existe
      const errorText = await response.text();
      console.error(`[Downloader] Error API (${response.status}):`, errorText);
      throw new Error(`Error de API: ${response.status}`);
    }

    const data = await response.json();
    console.log("[Downloader] Datos recibidos:", data);

    // Búsqueda robusta del enlace mp4
    let downloadLink = '';

    if (data.videos && data.videos.items) {
      // 1. Intentar buscar 720p (balance calidad/peso)
      const hdVideo = data.videos.items.find((v: any) => v.quality === '720p' && v.extension === 'mp4');
      
      // 2. Si no, buscar 360p
      const sdVideo = data.videos.items.find((v: any) => v.quality === '360p' && v.extension === 'mp4');
      
      // 3. Si no, el primero que sea mp4
      const anyMp4 = data.videos.items.find((v: any) => v.extension === 'mp4');

      // Asignar el mejor encontrado
      if (hdVideo) downloadLink = hdVideo.url;
      else if (sdVideo) downloadLink = sdVideo.url;
      else if (anyMp4) downloadLink = anyMp4.url;
    }

    if (!downloadLink) {
      throw new Error("La API no devolvió enlaces MP4 válidos.");
    }

    // Retornamos el link directo
    // NOTA: No descargamos el Blob aquí para evitar errores de CORS en el frontend.
    // Usaremos la URL directa.
    return downloadLink;

  } catch (error) {
    console.error("[Downloader] Excepción:", error);
    throw error;
  }
}

export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length == 11) ? match[7] : null;
}