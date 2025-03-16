import SignupForm from "@/components/auth/signup-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-bg-100 flex flex-col">
      <div className="container mx-auto pt-4">
        <Button variant="ghost" asChild className="text-text-100 hover:text-primary-100 hover:bg-bg-200">
          <Link href="/">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-100">QuantumEd AI</h1>
            <p className="text-text-100 mt-2">Create your account to get started</p>
          </div>
          <SignupForm />
        </div>
      </div>
    </div>
  )
}

