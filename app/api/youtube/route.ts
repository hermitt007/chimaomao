import { NextRequest, NextResponse } from "next/server";
import ytdl from "ytdl-core";
import { createFFmpeg, fetchFile } from "@ffmpeg.wasm/core";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!ytdl.validateURL(url)) {
      return NextResponse.json({ error: "URL inválida de YouTube" }, { status: 400 });
    }

    const audioStream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
    const videoStream = ytdl(url, { filter: "videoonly", quality: "highestvideo" });

    const audioBuffer = await streamToBuffer(audioStream);
    const videoBuffer = await streamToBuffer(videoStream);

    const ffmpeg = createFFmpeg({ log: false });
    await ffmpeg.load();

    ffmpeg.FS("writeFile", "audio.mp4", new Uint8Array(audioBuffer));
    ffmpeg.FS("writeFile", "video.mp4", new Uint8Array(videoBuffer));

    await ffmpeg.run(
      "-i", "video.mp4",
      "-i", "audio.mp4",
      "-c:v", "copy",
      "-c:a", "aac",
      "output.mp4"
    );

    const merged = ffmpeg.FS("readFile", "output.mp4");

    return new NextResponse(merged.buffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": "attachment; filename=video.mp4"
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
