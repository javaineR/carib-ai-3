import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Play, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import TabsContainer from "@/components/TabsContainer"
import Image from "next/image"
import { 
  MarsIcon, 
  JupiterIcon, 
  SaturnIcon, 
  BasketballIcon, 
  SoccerBallIcon, 
  TennisBallIcon 
} from "@/components/ui/decorative-icons"

export default function Home() {
  return (
    <TabsContainer>
      <div className="min-h-screen bg-jellyfish">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20">
          {/* Jellyfish Background */}
          <div className="absolute inset-0 overflow-hidden">
            <Image 
              src="/jellyfish-bg.jpg" 
              alt="Glowing jellyfish in the deep blue sea" 
              fill 
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 via-blue-900/70 to-pink-900/70"></div>
          </div>

          {/* Decorative floating elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-32 left-10 animate-float" style={{ animationDelay: "0s" }}>
              <MarsIcon className="h-8 w-8" />
            </div>
            <div className="absolute top-40 right-16 animate-float" style={{ animationDelay: "1.5s" }}>
              <SaturnIcon className="h-12 w-12" />
            </div>
            <div className="absolute bottom-32 left-1/4 animate-float" style={{ animationDelay: "2.3s" }}>
              <JupiterIcon className="h-10 w-10" />
            </div>
            <div className="absolute top-1/4 right-1/4 animate-float" style={{ animationDelay: "3.1s" }}>
              <BasketballIcon className="h-6 w-6" />
            </div>
            <div className="absolute bottom-40 left-40 animate-float" style={{ animationDelay: "1.8s" }}>
              <SoccerBallIcon className="h-7 w-7" />
            </div>
            <div className="absolute top-1/2 right-20 animate-float" style={{ animationDelay: "0.5s" }}>
              <TennisBallIcon className="h-5 w-5" />
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 bg-bg-200/30 rounded-full px-4 py-2 mb-6 backdrop-blur-sm animate-glow">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-sparkle" />
                <span className="text-sm text-primary-100 text-glow">Transform syllabi into engaging learning modules</span>
              </div>

              <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-6 animate-fadeIn">
                Find your
                <br />
                learning path.
              </h1>

              <p className="text-xl text-white mb-8 max-w-2xl animate-fadeIn" style={{ animationDelay: "0.2s" }}>
                Transform complex syllabi into bite-sized learning modules with AI-powered personalization. Perfect for
                educators and students seeking an enhanced learning experience.
              </p>

              <div className="flex items-center space-x-4 mb-12 animate-fadeIn" style={{ animationDelay: "0.4s" }}>
                <Input
                  placeholder="Enter your school email"
                  className="w-full max-w-sm bg-bg-200/40 border-bg-300/50 text-gray-200 placeholder:text-gray-400 backdrop-blur-sm"
                />
                <Button
                  asChild
                  className="btn-gradient-purple hover-lift animate-glow"
                >
                  <Link href="/signup">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="flex items-center space-x-6">
                <Button variant="ghost" className="text-white bg-purple-600/30 hover:bg-purple-600/50 backdrop-blur-sm border border-purple-500/30 hover-lift">
                  <Play className="mr-2 h-4 w-4" />
                  Watch demo
                </Button>
                <div className="flex items-center space-x-4 text-white">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-200 bg-gradient-to-br from-pink-500 to-purple-600" />
                    ))}
                  </div>
                  <span className="text-glow">Join 2,000+ educators</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="relative py-20 bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-blue-900/40 backdrop-blur-md">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-center mb-12">
              <div className="inline-flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-yellow-400 animate-sparkle" />
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-400">What Our Users Say</h2>
                <Sparkles className="h-5 w-5 text-yellow-400 animate-sparkle" style={{ animationDelay: "1s" }} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6 card-gradient-purple hover-scale border-purple-500/20">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 animate-pulse-custom flex items-center justify-center text-white font-bold">SJ</div>
                    <div className="absolute -top-1 -right-1">
                      <TennisBallIcon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Amazing Learning Experience</h3>
                    <p className="text-purple-100 mb-4">
                      "QuantumEd AI has transformed how I teach complex subjects. The AI-powered modules make learning
                      more accessible and engaging for my students."
                    </p>
                    <p className="text-purple-200 text-sm">Dr. Sarah Johnson - Mathematics Professor</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 card-gradient-blue hover-scale border-blue-500/20">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 animate-pulse-custom flex items-center justify-center text-white font-bold">MC</div>
                    <div className="absolute -top-1 -right-1">
                      <BasketballIcon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Simplified Learning Path</h3>
                    <p className="text-blue-100 mb-4">
                      "The way QuantumEd breaks down complex topics into manageable modules is incredible. It's like
                      having a personal AI tutor."
                    </p>
                    <p className="text-blue-200 text-sm">Michael Chen - Computer Science Student</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </TabsContainer>
  )
}

