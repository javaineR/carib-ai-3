"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, X, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  initialImage?: string
  onImageChange?: (file: File | null) => void
  className?: string
  size?: "sm" | "md" | "lg"
}

export function ImageUpload({ initialImage, onImageChange, className, size = "md" }: ImageUploadProps) {
  const [image, setImage] = useState<string | null>(initialImage || null)
  const [isHovering, setIsHovering] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string)
        if (onImageChange) onImageChange(file)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (onImageChange) onImageChange(null)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Avatar
          className={cn(
            sizeClasses[size],
            "border-2 border-bg-300 transition-all duration-300",
            image ? "cursor-pointer" : "",
          )}
          onClick={image ? triggerFileInput : undefined}
        >
          <AvatarImage src={image || ""} alt="Profile" />
          <AvatarFallback className="bg-bg-300 text-primary-100">
            {!image && <Camera className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>

        {/* Overlay with actions */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity duration-300",
            isHovering ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30"
              onClick={triggerFileInput}
            >
              <Upload className="h-4 w-4 text-white" />
            </Button>
            {image && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

      <span className="text-sm text-text-100 mt-2">{image ? "Change photo" : "Upload photo"}</span>
    </div>
  )
}

