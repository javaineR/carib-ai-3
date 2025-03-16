"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Save, Loader2 } from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import { doc, getDoc } from "firebase/firestore"
import { useFirebase } from "@/components/auth/FirebaseProvider"

export default function ProfilePage() {
  const { user, loading: authLoading, updateUserProfile } = useAuth()
  const { db } = useFirebase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    role: "",
    institution: "",
  })

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (user && db) {
        // Set basic info from Auth
        const userData = {
          name: user.displayName || "",
          email: user.email || "",
          bio: "",
          role: "",
          institution: "",
        }
        
        try {
          // Get additional info from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid))
          
          if (userDoc.exists()) {
            const data = userDoc.data()
            userData.bio = data.bio || ""
            userData.role = data.role || ""
            userData.institution = data.institution || ""
          }
        } catch (error) {
          console.error("Error loading user data from Firestore:", error)
        }
        
        setFormData(userData)
      }
    }
    
    loadUserData()
  }, [user, db])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (file: File | null) => {
    setProfileImage(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateUserProfile({
        name: formData.name,
        bio: formData.bio,
        role: formData.role,
        institution: formData.institution,
        profileImage: profileImage,
      })

      if (result.success) {
        toast({
          title: "Profile updated",
          description: "Your profile changes have been saved successfully.",
          variant: "default",
        })
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Failed to update profile. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in profile update:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-100" />
        <span className="ml-2 text-text-100">Loading profile...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-primary-100 mb-4">Not Logged In</h1>
        <p className="text-text-100 mb-6">You need to be logged in to view your profile.</p>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-100 flex flex-col">
      <div className="container mx-auto pt-4">
        <Button
          variant="ghost"
          asChild
          className="text-text-100 hover:text-primary-100 hover:bg-bg-200 transition-colors duration-300"
        >
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="container mx-auto py-10 px-4 animate-fadeIn">
        <h1 className="text-3xl font-bold text-primary-100 mb-6">Edit Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-bg-200 border-bg-300 md:col-span-1">
            <CardHeader>
              <CardTitle className="text-primary-100">Profile Picture</CardTitle>
              <CardDescription className="text-text-100">
                Upload a profile picture to personalize your account
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ImageUpload 
                size="lg" 
                onImageChange={handleImageChange} 
                className="mb-4 animate-pulse-custom" 
                initialImage={user.photoURL || undefined}
              />
              <p className="text-sm text-text-100 text-center mt-4">
                Click on the avatar to upload or change your profile picture
              </p>
            </CardContent>
          </Card>

          <Card className="bg-bg-200 border-bg-300 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-primary-100">Personal Information</CardTitle>
              <CardDescription className="text-text-100">Update your personal details and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-primary-100">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-bg-300 border-bg-300 text-gray-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-primary-100">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled
                      className="bg-bg-300 border-bg-300 text-gray-800 opacity-70"
                    />
                    <p className="text-xs text-text-200">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-primary-100">
                      Role
                    </Label>
                    <Input
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="bg-bg-300 border-bg-300 text-gray-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institution" className="text-primary-100">
                      Institution
                    </Label>
                    <Input
                      id="institution"
                      name="institution"
                      value={formData.institution}
                      onChange={handleChange}
                      className="bg-bg-300 border-bg-300 text-gray-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-primary-100">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="bg-bg-300 border-bg-300 text-gray-800 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="bg-primary-100 text-bg-100 hover:bg-primary-200 transition-all duration-300 hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

