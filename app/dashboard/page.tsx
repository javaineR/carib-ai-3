import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Plus, BookOpen, ExternalLink, Rocket, BarChart2, HelpCircle, Sparkles, Award, Bookmark, Medal, CircleUser } from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import { getGeneratedModules } from "@/app/actions"
import Image from "next/image"
import { 
  MercuryIcon, 
  VenusIcon, 
  EarthIcon, 
  MarsIcon, 
  JupiterIcon, 
  SaturnIcon, 
  BasketballIcon,
  SoccerBallIcon, 
  TennisBallIcon, 
  BaseballIcon
} from "@/components/ui/decorative-icons"

export default async function DashboardPage() {
  // Fetch modules for the recent modules section
  const allModules = await getGeneratedModules()
  const recentModules = allModules.slice(0, 3) // Show only the 3 most recent

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background Image with Colorful Overlay */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 via-blue-600/70 to-pink-600/80 z-10"></div>
        <Image 
          src="/images/dashboard-background.svg" 
          alt="Dashboard Background" 
          fill
          priority
          style={{ objectFit: 'cover' }}
          quality={100}
          className="z-0 opacity-60"
        />
      </div>

      {/* Decorative floating planets */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 animate-float" style={{ animationDelay: "0s" }}>
          <MarsIcon className="h-8 w-8" />
        </div>
        <div className="absolute top-40 right-16 animate-float" style={{ animationDelay: "1.5s" }}>
          <SaturnIcon className="h-12 w-12" />
        </div>
        <div className="absolute bottom-32 left-20 animate-float" style={{ animationDelay: "2.3s" }}>
          <JupiterIcon className="h-10 w-10" />
        </div>
        <div className="absolute bottom-40 right-32 animate-float" style={{ animationDelay: "3.1s" }}>
          <BasketballIcon className="h-6 w-6" />
        </div>
        <div className="absolute top-1/4 left-1/2 animate-float" style={{ animationDelay: "1.8s" }}>
          <EarthIcon className="h-9 w-9" />
        </div>
        <div className="absolute bottom-16 right-16 animate-float" style={{ animationDelay: "0.5s" }}>
          <SoccerBallIcon className="h-7 w-7" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="container mx-auto pt-4">
          <Button
            variant="ghost"
            asChild
            className="text-white hover:text-primary-100 hover:bg-bg-200/20 transition-colors duration-300"
          >
            <Link href="/">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Profile Section */}
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row items-start gap-8 mb-10">
            <div className="card-gradient-purple backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 flex flex-col items-center relative hover-scale">
              <div className="absolute -top-4 -right-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-2 shadow-lg transform hover:rotate-12 transition-transform duration-300">
                <Medal className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-white font-bold">✨</span>
              </div>
              <div className="mb-4 relative">
                <ImageUpload size="lg" />
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg">
                  <Award className="h-4 w-4 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white">User Name</h2>
              <p className="text-gray-200">user@example.com</p>
              <Button
                asChild
                className="mt-4 btn-gradient-pink hover-lift"
              >
                <Link href="/profile">Edit Profile</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Generate Modules Section */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="text-center max-w-2xl mx-auto card-gradient-blue p-8 rounded-xl relative hover-scale">
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-red-500 to-orange-500 rounded-full p-3 shadow-lg hover:scale-110 transition-transform duration-300 animate-bounce-slow">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            
            <div className="absolute -top-3 -left-3">
              <MarsIcon className="h-8 w-8" />
            </div>
            <div className="absolute -bottom-3 -right-3">
              <SaturnIcon className="h-10 w-10" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4 mt-4">Ready to Create Learning Modules?</h2>
            <p className="text-gray-200 mb-8">
              Upload your syllabus and let our AI transform it into engaging learning modules with Jamaican Creole
              explanations.
            </p>
            <Button
              asChild
              size="lg"
              className="btn-gradient-green hover-lift text-lg px-8 py-6 h-auto"
            >
              <Link href="/generate-modules">
                <Plus className="mr-2 h-5 w-5" />
                Generate Modules
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="container mx-auto py-10 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-gradient-blue relative hover-scale">
              <div className="absolute -top-3 -right-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-2 shadow-lg transform hover:rotate-12 transition-transform duration-300">
                <Bookmark className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -top-3 -left-3">
                <BaseballIcon className="h-6 w-6" />
              </div>
              <CardHeader>
                <CardTitle className="text-white">Recent Modules</CardTitle>
                <CardDescription className="text-blue-200">Your recently generated modules</CardDescription>
              </CardHeader>
              <CardContent>
                {recentModules.length > 0 ? (
                  <div className="space-y-4">
                    {recentModules.map((module, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-blue-700/50 last:border-0 hover:bg-blue-700/30 rounded-md px-2 transition-colors duration-200">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-300" />
                          <span className="text-blue-100 truncate max-w-[150px]">{module.title}</span>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="text-blue-200 hover:text-blue-100 hover:bg-blue-800/50">
                          <Link href={`/?tab=modules&module=${index}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                    <Button asChild className="w-full mt-2 btn-gradient-blue">
                      <Link href="/?tab=modules">View All Modules</Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-blue-200">No modules generated yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="card-gradient-purple relative hover-scale">
              <div className="absolute -top-3 -right-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full p-2 shadow-lg transform hover:rotate-12 transition-transform duration-300">
                <BarChart2 className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -top-3 -left-3">
                <TennisBallIcon className="h-6 w-6" />
              </div>
              <CardHeader>
                <CardTitle className="text-white">Quick Stats</CardTitle>
                <CardDescription className="text-purple-200">Your learning progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center hover:bg-purple-700/30 p-2 rounded-md transition-colors duration-200">
                    <span className="text-purple-200">Total Modules:</span>
                    <span className="font-semibold text-purple-100">{allModules.length}</span>
                  </div>
                  <div className="flex justify-between items-center hover:bg-purple-700/30 p-2 rounded-md transition-colors duration-200">
                    <span className="text-purple-200">Last Generated:</span>
                    <span className="font-semibold text-purple-100">{allModules.length > 0 ? "Today" : "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center hover:bg-purple-700/30 p-2 rounded-md transition-colors duration-200">
                    <span className="text-purple-200">Syllabus Processed:</span>
                    <span className="font-semibold text-purple-100">{allModules.length > 0 ? "Yes" : "No"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient-pink relative hover-scale">
              <div className="absolute -top-3 -right-3 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full p-2 shadow-lg transform hover:rotate-12 transition-transform duration-300">
                <HelpCircle className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -top-3 -left-3">
                <VenusIcon className="h-6 w-6" />
              </div>
              <CardHeader>
                <CardTitle className="text-white">Help & Support</CardTitle>
                <CardDescription className="text-pink-200">Get help with QuantumEd AI</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-pink-200">Access tutorials and support resources</p>
                <Button className="mt-4 btn-gradient-pink">
                  View Resources
                </Button>
              </CardContent>
            </Card>

            <Card className="card-gradient-green relative hover-scale">
              <div className="absolute -top-3 -right-3 bg-gradient-to-br from-green-400 to-green-600 rounded-full p-2 shadow-lg transform hover:rotate-12 transition-transform duration-300">
                <CircleUser className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -top-3 -left-3">
                <EarthIcon className="h-6 w-6" />
              </div>
              <CardHeader>
                <CardTitle className="text-white">Learning Lab</CardTitle>
                <CardDescription className="text-green-200">Interactive STEM learning with built-in code editor</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-green-200">Explore interactive STEM modules and practice coding.</p>
                <Button className="mt-4 btn-gradient-green" asChild>
                  <Link href="/learning-lab">Explore Learning Lab</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Decorative Footer Elements */}
        <div className="relative h-20 w-full overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-r from-purple-900/50 via-blue-900/50 to-indigo-900/50"></div>
          <div className="absolute -bottom-10 left-0 right-0 h-20 w-full">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-20">
              <path fill="rgba(139, 92, 246, 0.3)" d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
              <path fill="rgba(99, 102, 241, 0.3)" d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
              <path fill="rgba(79, 70, 229, 0.3)" d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" opacity=".75"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

