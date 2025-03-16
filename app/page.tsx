import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Play, ArrowRight } from "lucide-react"
import Link from "next/link"
import TabsContainer from "@/components/TabsContainer"
import Image from "next/image"

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
            <div className="absolute inset-0 jellyfish-overlay"></div>
          </div>

          {/* Content */}
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 bg-bg-200/30 rounded-full px-4 py-2 mb-6 backdrop-blur-sm animate-glow">
                <span className="text-sm text-text-100">New</span>
                <span className="text-sm text-primary-100 text-glow">Transform syllabi into engaging learning modules</span>
              </div>

              <h1 className="text-6xl font-bold text-primary-100 mb-6 animate-fadeIn text-glow">
                Find your
                <br />
                learning path.
              </h1>

              <p className="text-xl text-text-100 mb-8 max-w-2xl animate-fadeIn" style={{ animationDelay: "0.2s" }}>
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
                  className="bg-primary-100 text-bg-100 hover:bg-primary-200 transition-all duration-300 hover:scale-105 animate-glow"
                >
                  <Link href="/signup">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="flex items-center space-x-6">
                <Button variant="ghost" className="text-primary-100 hover:text-primary-200 backdrop-blur-sm bg-bg-200/20 animate-glow">
                  <Play className="mr-2 h-4 w-4" />
                  Watch demo
                </Button>
                <div className="flex items-center space-x-4 text-text-100">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-200 bg-accent-100" />
                    ))}
                  </div>
                  <span className="text-glow">Join 2,000+ educators</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="relative py-20 bg-bg-200/30 backdrop-blur-md">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-6 bg-bg-300/40 border-bg-300/50 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-accent-100 animate-pulse-custom" />
                  <div>
                    <h3 className="text-primary-100 font-semibold mb-2 text-glow">Amazing Learning Experience</h3>
                    <p className="text-text-100 mb-4">
                      "QuantumEd AI has transformed how I teach complex subjects. The AI-powered modules make learning
                      more accessible and engaging for my students."
                    </p>
                    <p className="text-text-200 text-sm">Dr. Sarah Johnson - Mathematics Professor</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-bg-300/40 border-bg-300/50 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary-200 animate-pulse-custom" />
                  <div>
                    <h3 className="text-primary-100 font-semibold mb-2 text-glow">Simplified Learning Path</h3>
                    <p className="text-text-100 mb-4">
                      "The way QuantumEd breaks down complex topics into manageable modules is incredible. It's like
                      having a personal AI tutor."
                    </p>
                    <p className="text-text-200 text-sm">Michael Chen - Computer Science Student</p>
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

