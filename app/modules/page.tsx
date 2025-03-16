import { Suspense } from "react"
import { getGeneratedModules } from "../actions"
import ModulesList from "@/components/modules-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import "./modules-dark.css"

export default async function ModulesPage() {
  const modules = await getGeneratedModules()

  return (
    <div className="relative min-h-screen modules-dark-bg">
      {/* Background Image */}
      <div className="fixed inset-0 -z-10">
        <Image 
          src="/images/modules-background.jpg" 
          alt="Modules Background" 
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50"></div>
      </div>

      {/* Content */}
      <main className="relative z-10 container mx-auto py-10 px-4">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">Generated Modules</h1>
          <p className="text-lg max-w-2xl text-gray-100">
            Review and edit the generated learning modules with Jamaican Creole explanations.
          </p>
        </div>

        <div className="mt-10 max-w-4xl mx-auto">
          <Card className="card-dark border-bg-300">
            <CardHeader>
              <CardTitle>Learning Modules</CardTitle>
              <CardDescription className="text-gray-300">
                These modules have been generated from your syllabus.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="text-gray-200">Loading modules...</div>}>
                <ModulesList initialModules={modules} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

