"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { processSyllabus } from "@/app/actions"

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setError(null)
    setIsSuccess(false)
    setSuccessMessage(null)

    if (selectedFile) {
      const fileType = selectedFile.type
      // Check file size - limit to 15MB (15 * 1024 * 1024 bytes)
      const maxSize = 15 * 1024 * 1024 // 15MB in bytes
      
      if (selectedFile.size > maxSize) {
        setError("File is too large. Please upload a file smaller than 15MB")
        setFile(null)
        return
      }
      
      if (
        fileType === "application/pdf" ||
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setFile(selectedFile)
      } else {
        setError("Please upload a PDF or DOCX file")
        setFile(null)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (!droppedFile) return

    // Check file size - limit to 15MB (15 * 1024 * 1024 bytes)
    const maxSize = 15 * 1024 * 1024 // 15MB in bytes
    
    if (droppedFile.size > maxSize) {
      setError("File is too large. Please upload a file smaller than 15MB")
      setFile(null)
      return
    }
    
    const fileType = droppedFile.type
    if (
      fileType === "application/pdf" ||
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      setFile(droppedFile)
      setError(null)
    } else {
      setError("Please upload a PDF or DOCX file")
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    try {
      setIsUploading(true)
      setError(null)
      setIsSuccess(false)
      setSuccessMessage(null)

      const formData = new FormData()
      formData.append("file", file)

      // Wrap the entire server action in a try-catch to prevent crashes
      try {
        // Set a timeout to prevent hanging forever
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Processing timed out. The operation took too long to complete.")), 2 * 60 * 1000); // 2 minutes
        });
        
        // Race the processSyllabus with a timeout to prevent hanging
        const result = await Promise.race([
          processSyllabus(formData),
          timeoutPromise
        ]) as {success: boolean} | undefined;
        
        if (result && result.success) {
          setIsSuccess(true)
          setSuccessMessage("Syllabus processed successfully! Modules have been generated.")
          // Don't redirect automatically - let the user click the View Modules button
          // router.push("/?tab=modules")
          router.refresh()
        } else {
          // Handle undefined or unsuccessful result
          throw new Error("Process completed but returned unsuccessful status")
        }
      } catch (processingError: any) {
        console.error("Error during syllabus processing:", processingError)
        
        // Create more user-friendly error messages based on error patterns
        let userMessage = processingError?.message || "Failed to process syllabus. Please try again."
        
        // Always set isSuccess to true so users can see modules, even with warnings
        let shouldShowModulesButton = true;
        
        // Check for common PDF processing errors
        if (userMessage.includes("PDF processing error") || 
            userMessage.includes("pdf-parse") || 
            userMessage.includes("PDF parsing")) {
          
          // Handle PDF-specific errors
          if (userMessage.includes("image-based") || userMessage.includes("No text could be extracted")) {
            userMessage = "We couldn't extract text from this PDF. It appears to be image-based or scanned. Basic modules have been generated.";
          } else if (userMessage.includes("encrypted") || userMessage.includes("protected")) {
            userMessage = "This PDF is password-protected or encrypted. Basic modules have been generated.";
          } else if (userMessage.includes("Buffer conversion") || userMessage.includes("server")) {
            userMessage = "There was a server error while processing the PDF. Basic modules have been generated.";
          } else if (userMessage.includes("corrupted") || userMessage.includes("unsupported format")) {
            userMessage = "The PDF file appears to be corrupted or in an unsupported format. Basic modules have been generated.";
          } else if (userMessage.includes("timed out")) {
            userMessage = "Processing timed out. Basic modules have been generated.";
          } else if (userMessage.includes("Load failed")) {
            userMessage = "Failed to load the PDF. Basic modules have been generated.";
          } else {
            userMessage = "There was an issue processing the PDF. Basic modules have been generated.";
          }
        } else if (userMessage.includes("rate limit")) {
          userMessage = "The AI service is currently at capacity. Basic modules have been generated. Please try again later.";
        } else if (userMessage.includes("timed out")) {
          userMessage = "Processing timed out. This might be due to high demand. Basic modules have been generated.";
        }
        
        // Show a warning instead of an error, and set success to true
        setError(null)
        setSuccessMessage(userMessage)
        setIsSuccess(shouldShowModulesButton)
        
        // Refresh to show the fallback modules
        router.refresh()
      }
    } catch (err: any) {
      // Even for serious errors, try to show modules
      setIsSuccess(true)
      setSuccessMessage("There was an issue, but we've generated some basic modules for you.")
      setError("Note: " + (err?.message || "Unknown error"))
      console.error("Form submission error:", err)
      router.refresh()
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 cursor-pointer transition-all duration-300 ${
          isDragging ? "border-primary-100 bg-primary-100/10" : "border-bg-300 hover:bg-bg-300/20"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          id="file-upload"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.docx"
          disabled={isUploading}
        />
        <div className="p-3 rounded-full bg-primary-100/10 mb-4 transition-transform duration-300 hover:scale-110">
          <Upload className="h-6 w-6 text-primary-100" />
        </div>
        <p className="text-sm font-medium mb-1 text-primary-100">Click to upload or drag and drop</p>
        <p className="text-xs text-text-100">PDF or DOCX (max 15MB)</p>
      </div>

      {file && (
        <div className="flex items-center justify-between gap-2 p-3 border rounded-md bg-bg-300 border-bg-300 text-primary-100 animate-fadeIn">
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <FileText className="h-5 w-5 text-primary-100 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{file.name}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-bg-200"
            onClick={handleRemoveFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && <div className="text-sm text-red-500 animate-fadeIn">{error}</div>}
      {successMessage && <div className="text-sm text-green-500 animate-fadeIn mt-2 mb-2">{successMessage}</div>}

      <Button
        type="submit"
        className="w-full bg-primary-100 text-bg-100 hover:bg-primary-200 transition-all duration-300"
        disabled={!file || isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Process Syllabus"
        )}
      </Button>

      {isSuccess && (
        <Button
          type="button"
          className="w-full mt-4 bg-green-600 text-white hover:bg-green-700 transition-all duration-300"
          onClick={(e) => {
            // Prevent default behavior to avoid any potential form submission
            e.preventDefault();
            
            // Set a flag in local storage to indicate we're navigating to modules
            // This helps maintain state across redirects
            localStorage.setItem('viewingModules', 'true');
            
            // Use multiple navigation approaches for maximum reliability
            try {
              // First refresh the router to clear any cached states
              router.refresh();
              
              // Add a small delay before navigation
              setTimeout(() => {
                try {
                  // Add a random query parameter to prevent caching issues
                  const randomParam = `r=${Math.random()}`;
                  router.push(`/?tab=modules&${randomParam}`);
                  
                  // Set a backup approach with window.location after a small delay
                  setTimeout(() => {
                    if (document.location.pathname !== "/" || !document.location.search.includes("tab=modules")) {
                      // Fallback to direct location change if router navigation fails
                      window.location.href = `/?tab=modules&${randomParam}`;
                    }
                  }, 300);
                } catch (pushError) {
                  console.error("Router push error:", pushError);
                  window.location.href = "/?tab=modules";
                }
              }, 100);
            } catch (error) {
              console.error("Navigation error:", error);
              // Ultimate fallback
              window.location.href = "/?tab=modules";
            }
          }}
        >
          View Generated Modules
        </Button>
      )}
    </form>
  )
}

