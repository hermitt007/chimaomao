import { VideoGenerator } from "@/components/video-generator"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <VideoGenerator />
    </main>
  )
}
