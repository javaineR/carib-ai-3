import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, FileText } from "lucide-react"
import SyllabusUploader from "@/components/SyllabusUploader"

export default function GenerateModulesPage() {
  return (
    <div className="min-h-screen bg-[#1a1b26] text-white">
      <div className="container mx-auto pt-4">
        <Button variant="ghost" asChild className="text-gray-400 hover:text-white">
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col items-center justify-center space-y-6 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-400">
            Generate Learning Modules
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl">
            Upload your syllabus to create personalized learning modules with key terms, examples, and Jamaican Creole translations.
          </p>
        </div>

        <div className="mt-10 max-w-4xl mx-auto">
          <Card className="bg-[#232534] border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-100" />
                <CardTitle className="text-white">Upload Syllabus</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                We'll extract specific learning objectives, key terms, and teaching content from your syllabus.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <SyllabusUploader />
              </div>
              
              <div className="mt-8 bg-bg-300/20 rounded-md p-4 text-sm">
                <h3 className="font-medium text-primary-100 mb-2">How It Works</h3>
                <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                  <li>Upload your syllabus or educational document (PDF or DOCX)</li>
                  <li>Our system analyzes the document to extract learning objectives and key terms</li>
                  <li>AI generates personalized modules based on the extracted content</li>
                  <li>Each module includes simplified explanations and practical examples</li>
                  <li>Terms are translated to Jamaican Creole for increased accessibility</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

