"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getGeneratedModules } from "@/app/actions"
import ModulesList from "@/components/modules-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"

interface TabsContainerProps {
  children: React.ReactNode
}

export default function TabsContainer({ children }: TabsContainerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<string>("home")
  const [modules, setModules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default fallback module with the new structure
  const fallbackModule = [{
    title: "Sample Module",
    description: "A sample module to demonstrate the structure and features.",
    topics: [
      {
        title: "Getting Started",
        content: "An introduction to the basics of the topic.",
        subtopics: ["Understanding the fundamentals", "Exploring key concepts", "Practical applications"]
      }
    ],
    learningTools: {
      games: [
        {
          title: "Knowledge Check",
          questions: [
            {
              question: "What is the first step in learning?",
              options: [
                "Memorizing facts",
                "Understanding concepts",
                "Taking tests",
                "Reading textbooks"
              ],
              correctAnswer: "Understanding concepts"
            }
          ]
        }
      ],
      flashcards: [
        {
          term: "Learning",
          definition: "The acquisition of knowledge or skills through experience, study, or being taught",
          creoleDefinition: "Di way yu get nolij ar skil dem chru riiding, praktis, ar wen smadi tiich yu"
        }
      ],
      questionBank: [
        {
          question: "How do I use this platform?",
          answer: "Upload a syllabus to generate personalized learning modules, then explore the interactive tools for each module."
        }
      ]
    }
  }];

  // Handle tab switching
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
      
      // If the tab is modules, fetch the modules
      if (tab === "modules") {
        const loadModules = async () => {
          setIsLoading(true)
          setError(null)
          try {
            // Check if there's a flag in localStorage indicating we're viewing modules
            const viewingModules = localStorage.getItem('viewingModules')
            if (viewingModules) {
              // Clear the flag
              localStorage.removeItem('viewingModules')
              
              try {
                // Fetch the modules with timeout protection
                const timeoutPromise = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error("Loading modules timed out")), 5000);
                });
                
                const fetchedModules = await Promise.race([
                  getGeneratedModules(),
                  timeoutPromise
                ]) as any[];
                
                if (fetchedModules && Array.isArray(fetchedModules) && fetchedModules.length > 0) {
                  setModules(fetchedModules);
                } else {
                  throw new Error("Invalid modules data");
                }
              } catch (fetchError) {
                console.error("Error fetching modules:", fetchError)
                setError("Couldn't load modules. Using sample modules instead.")
                // Set default modules with the new structure if there's an error
                setModules(fallbackModule);
              }
            } else {
              // Just try to fetch modules normally
              try {
                const fetchedModules = await getGeneratedModules()
                if (fetchedModules && Array.isArray(fetchedModules) && fetchedModules.length > 0) {
                  setModules(fetchedModules);
                } else {
                  throw new Error("Invalid modules data");
                }
              } catch (e) {
                console.error("Error fetching modules:", e)
                setError("Couldn't load modules. Using sample modules instead.")
                // Set default modules with the new structure if there's an error
                setModules(fallbackModule);
              }
            }
          } finally {
            setIsLoading(false)
          }
        }
        
        loadModules()
      }
    }
  }, [searchParams, router])

  // Handle going back to home
  const handleBackToHome = (e: React.MouseEvent) => {
    e.preventDefault()
    // Use a more robust approach for navigation
    try {
      // First refresh the router state
      router.refresh()
      
      // Then navigate to the home page after a small delay
      setTimeout(() => {
        try {
          router.push("/")
        } catch (error) {
          console.error("Navigation error:", error)
          window.location.href = "/"
        }
      }, 50)
    } catch (error) {
      console.error("Navigation error:", error)
      window.location.href = "/"
    }
  }

  // If the active tab is "modules", show the modules list instead of children
  if (activeTab === "modules") {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto pt-4">
          <Button 
            variant="ghost" 
            className="flex items-center text-muted-foreground hover:text-foreground"
            onClick={handleBackToHome}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Button>
        </div>
        
        <div className="container mx-auto py-10 px-4">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Generated Modules</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Review and edit the generated learning modules with Jamaican Creole explanations.
            </p>
          </div>

          {error && (
            <div className="mt-4 max-w-4xl mx-auto bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="mt-6 max-w-6xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading modules...</p>
              </div>
            ) : (
              <ModulesList initialModules={modules} />
            )}
          </div>
        </div>
      </main>
    )
  }

  // Otherwise, render the children (home page)
  return children
} 