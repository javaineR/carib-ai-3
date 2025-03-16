import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import FirebaseProvider from '@/components/auth/FirebaseProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteHeader } from '@/components/site-header'
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from 'react'
import * as ElevenLabs from 'elevenlabs'
import { OfflineAlert } from '@/components/ui/offline-alert'
import { DecorativeElements } from '@/components/ui/decorative-icons'

const inter = Inter({ subsets: ['latin'] })

// Initializing the ElevenLabs API
const apiKey = process.env.ELEVENLABS_API_KEY

export const metadata: Metadata = {
  title: 'QuantumEd AI - Transform Syllabi into Learning Modules',
  description: 'Transform complex syllabi into bite-sized learning modules with AI-powered personalization',
  openGraph: {
    title: "QuantumEd AI - Transform Syllabi into Learning Modules",
    description: "Transform complex syllabi into bite-sized learning modules with AI-powered personalization",
    url: "https://quantum-ed.vercel.app",
    siteName: "QuantumEd",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuantumEd AI - Transform Syllabi into Learning Modules",
    description: "Transform complex syllabi into bite-sized learning modules with AI-powered personalization",
    creator: "@quantumedai",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseProvider>
            <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-indigo-900/40 via-blue-900/30 to-purple-900/40">
              {/* Decorative floating elements that appear across the entire app */}
              <DecorativeElements />
              
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="animate-blob filter blur-xl opacity-30 absolute -top-4 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply"></div>
                <div className="animate-blob animation-delay-2000 filter blur-xl opacity-30 absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply"></div>
                <div className="animate-blob animation-delay-4000 filter blur-xl opacity-30 absolute top-40 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply"></div>
                <div className="animate-blob filter blur-xl opacity-30 absolute -bottom-20 right-32 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply"></div>
              </div>
              
              <Suspense fallback={null}>
                <SiteHeader />
              </Suspense>
              <div className="flex-1 z-10 relative">
                <OfflineAlert />
                {children}
              </div>
            </div>
            <Toaster />
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}