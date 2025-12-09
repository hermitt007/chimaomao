"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lightbulb, FileText, Upload, HelpCircle, X, Loader2, ImageIcon, FileType } from "lucide-react"

interface ScriptInputProps {
  script: string
  setScript: (script: string) => void
  wordCount: number
  estimatedDuration: number
}

export function ScriptInput({ script, setScript, wordCount, estimatedDuration }: ScriptInputProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const helpContent = [
    { tag: "[suspenso]", description: "Añade tono de suspenso a la voz" },
    { tag: "[feliz]", description: "Tono alegre y emocionado" },
    { tag: "[triste]", description: "Tono melancólico" },
    { tag: '<break time="1.0s" />', description: "Pausa de 1 segundo" },
    { tag: "[dragón dorado]", description: "Genera contenido con IA" },
  ]

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setProcessingStatus("Procesando archivo...")

    try {
      if (file.type === "application/pdf") {
        setProcessingStatus("Extrayendo texto del PDF...")
        const text = await extractTextFromPDF(file)
        setScript(script ? `${script}\n\n${text}` : text)
      } else if (file.type === "text/plain") {
        const text = await file.text()
        setScript(script ? `${script}\n\n${text}` : text)
      } else if (file.name.endsWith(".docx")) {
        setProcessingStatus("Procesando documento Word...")
        const text = await extractTextFromDocx(file)
        setScript(script ? `${script}\n\n${text}` : text)
      } else {
        alert("Formato no soportado. Usa PDF, TXT o DOCX")
      }
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error al procesar el archivo")
    } finally {
      setIsProcessing(false)
      setProcessingStatus("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen válida")
      return
    }

    setIsProcessing(true)
    setProcessingStatus("Detectando texto en imagen...")

    try {
      const text = await extractTextFromImage(file)
      if (text.trim()) {
        setScript(script ? `${script}\n\n${text}` : text)
      } else {
        alert("No se detectó texto en la imagen")
      }
    } catch (error) {
      console.error("Error processing image:", error)
      alert("Error al procesar la imagen")
    } finally {
      setIsProcessing(false)
      setProcessingStatus("")
      if (imageInputRef.current) imageInputRef.current.value = ""
    }
  }

  // Extract text from PDF using pdf.js
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist")
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let fullText = ""
    for (let i = 1; i <= pdf.numPages; i++) {
      setProcessingStatus(`Extrayendo página ${i} de ${pdf.numPages}...`)
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(" ")
      fullText += pageText + "\n"
    }

    return fullText.trim()
  }

  // Extract text from DOCX (basic extraction)
  const extractTextFromDocx = async (file: File): Promise<string> => {
    const JSZip = (await import("jszip")).default
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    const documentXml = await zip.file("word/document.xml")?.async("string")
    if (!documentXml) throw new Error("Invalid DOCX file")

    // Simple XML text extraction
    const text = documentXml
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    return text
  }

  // Extract text from image using Tesseract.js OCR
  const extractTextFromImage = async (file: File): Promise<string> => {
    const Tesseract = await import("tesseract.js")

    setProcessingStatus("Cargando motor OCR...")

    const result = await Tesseract.recognize(file, "spa+eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setProcessingStatus(`Reconociendo texto: ${Math.round(m.progress * 100)}%`)
        }
      },
    })

    return result.data.text
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          Tu Guión de Video
        </CardTitle>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Usa un enlace a un tweet, publicación de LinkedIn o entrada de blog y recuperaremos mágicamente el contenido
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-card">
              <FileText className="w-4 h-4" />
              Texto
            </TabsTrigger>
            <TabsTrigger value="file" className="gap-2 data-[state=active]:bg-card">
              <FileType className="w-4 h-4" />
              PDF/Doc
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2 data-[state=active]:bg-card">
              <ImageIcon className="w-4 h-4" />
              Imagen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4">
            <div className="relative">
              <Textarea
                placeholder={`Érase una vez en un bosque
Salta de línea para generar nuevo contenido
Apareció un dragón  [dragón dorado - ayudará a la generación de contenido]
<break time="1.0s" />  [marcará una pausa de 1s]
Y así comienza la historia.`}
                className="min-h-[200px] bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground resize-none"
                value={script}
                onChange={(e) => setScript(e.target.value)}
              />

              <Button
                variant="outline"
                size="sm"
                className="absolute bottom-3 right-3 gap-1 text-xs bg-transparent"
                onClick={() => setShowHelp(!showHelp)}
              >
                {showHelp ? <X className="w-3 h-3" /> : <HelpCircle className="w-3 h-3" />}
                {showHelp ? "cerrar" : "mostrar ayuda"}
              </Button>
            </div>

            {showHelp && (
              <div className="mt-3 p-3 bg-secondary/50 rounded-lg border border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">Comandos disponibles:</h4>
                <div className="space-y-1">
                  {helpContent.map((item, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <code className="text-primary bg-primary/10 px-1 rounded">{item.tag}</code>
                      <span className="text-muted-foreground">{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="file" className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isProcessing ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-10 h-10 mx-auto text-primary mb-3 animate-spin" />
                  <p className="text-sm text-primary font-medium">{processingStatus}</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Arrastra un archivo PDF, TXT o DOCX aquí</p>
                  <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-3">
              El texto extraído se agregará al guión actual
            </p>
          </TabsContent>

          <TabsContent value="image" className="mt-4">
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

            <div
              onClick={() => !isProcessing && imageInputRef.current?.click()}
              className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isProcessing ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-10 h-10 mx-auto text-primary mb-3 animate-spin" />
                  <p className="text-sm text-primary font-medium">{processingStatus}</p>
                </>
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Sube una imagen con texto</p>
                  <p className="text-xs text-muted-foreground mt-1">Usamos OCR para extraer el texto automáticamente</p>
                </>
              )}
            </div>

            <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Consejo:</span> Funciona mejor con imágenes claras y texto
                legible. Soporta español e inglés.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t border-border">
          <span>
            Número de palabras: <span className="text-primary font-medium">{wordCount}</span>
          </span>
          <span>
            Duración estimada del video: <span className="text-primary font-medium">{estimatedDuration} segundos</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
