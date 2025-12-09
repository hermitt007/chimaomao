const API_KEY = "sk_c1923061c72927db505987c44aa22962022f004deb0eee5c"
const VOICE_ID = "UEKYgullGqaF0keqT8Bu"

export async function generateSpeech(text: string): Promise<string> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`)
  }

  const audioBlob = await response.blob()
  return URL.createObjectURL(audioBlob)
}
