"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { processSyllabus } from "@/app/actions"
import { useRouter } from "next/navigation"
import { FileText, Upload, Loader2, FileCheck, FileWarning } from "lucide-react"

export default function SyllabusUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setError(null)
    
    // Basic validation
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.pdf') && !selectedFile.name.endsWith('.docx')) {
        setError("Please upload a PDF or DOCX file.")
        setFile(null)
        return
      }
      
      const maxFileSize = 16 * 1024 * 1024 // 16MB
      if (selectedFile.size > maxFileSize) {
        setError("File size exceeds 16MB limit.")
        setFile(null)
        return
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file.")
      return
    }

    setIsLoading(true)
    setProgress("Preparing to process document...")
    
    try {
      // Create a form data object to send the file
      const formData = new FormData()
      formData.append("file", file)
      
      // Show progress updates
      setProgress("Analyzing document structure...")
      await new Promise(r => setTimeout(r, 1000))
      
      setProgress("Extracting learning objectives and key terms...")
      await new Promise(r => setTimeout(r, 1500))
      
      setProgress("Processing content for module generation...")
      
      // Process the syllabus
      const result = await processSyllabus(formData)
      
      if (result.success) {
        setProgress("Document processed successfully! Redirecting to modules...")
        
        // Small delay for UX purposes - shows success state briefly
        await new Promise(r => setTimeout(r, 1500))
        
        // Redirect to the modules page
        router.push("/modules")
      } else {
        throw new Error("Failed to process syllabus")
      }
    } catch (err: any) {
      console.error("Error processing syllabus:", err)
      setError(err.message || "An error occurred while processing the syllabus.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card className="bg-bg-200 border-bg-300">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer
                  ${file ? 'bg-bg-300/50 border-primary-100' : 'hover:bg-bg-300/50 bg-bg-300/20 border-bg-300'}
                  transition-all duration-300`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                    {file ? (
                      <>
                        <FileCheck className="w-10 h-10 mb-3 text-primary-100" />
                        <p className="mb-2 text-sm text-text-100">
                          <span className="font-semibold">{file.name}</span>
                        </p>
                        <p className="text-xs text-text-200">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <FileText className="w-10 h-10 mb-3 text-text-200" />
                        <p className="mb-2 text-sm text-text-100">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-text-200 text-center max-w-xs">
                          Upload your syllabus or educational document (PDF, DOCX)
                        </p>
                        <p className="text-xs text-text-200 mt-2">
                          Maximum file size: 16MB
                        </p>
                      </>
                    )}
                  </div>
                  <Input
                    id="dropzone-file"
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </label>
              </div>
              
              {error && (
                <div className="flex items-center text-destructive text-sm">
                  <FileWarning className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}
              
              {progress && isLoading && (
                <div className="rounded-md bg-bg-300/50 p-4 mt-4">
                  <div className="flex items-center">
                    <Loader2 className="animate-spin w-5 h-5 mr-2 text-primary-100" />
                    <p className="text-sm text-text-100">{progress}</p>
                  </div>
                  
                  <div className="w-full bg-bg-300 rounded-full h-2.5 mt-3">
                    <div className="bg-primary-100 h-2.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                  </div>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full flex items-center justify-center"
                disabled={!file || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Generate Learning Modules
                  </>
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-text-200">
              Your syllabus will be analyzed to extract specific learning objectives, key technical terms, and teaching content to create personalized learning modules.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 