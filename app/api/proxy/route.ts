import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const targetUrl = body.url;

    if (!targetUrl) {
      return new NextResponse('Falta la URL', { status: 400 });
    }

    // Hacemos la petición al archivo de video original con cabeceras de "Navegador Real"
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'video',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      }
    });

    if (!response.ok) {
      console.error("Error origen:", response.status, response.statusText);
      // Si falla, devolvemos el error exacto para verlo en consola
      return new NextResponse(`Error origen: ${response.status} ${response.statusText}`, { status: response.status });
    }

    // --- MAGIA DE STREAMING ---
    // En lugar de 'await response.blob()' (que llena la RAM y falla),
    // pasamos el flujo de datos (body) directamente al usuario.
    
    // Copiamos los headers importantes del video original
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
    headers.set('Content-Length', response.headers.get('Content-Length') || '');
    headers.set('Content-Disposition', 'attachment; filename="video.mp4"');

    return new NextResponse(response.body, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("Proxy Error Fatal:", error);
    return new NextResponse(`Error interno del proxy: ${error.message}`, { status: 500 });
  }
}