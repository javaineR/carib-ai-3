//Claude Sonnet 3.7 Thinking Model
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
//Claude Sonnet 3.7 Thinking Model

const inter = Inter({ subsets: ['latin'] })

// Initializing the ElevenLabs API
const apiKey = 'sk_03c3ff9bfed302c29b664036f7e929404cf7e820b795c7c5'

export const metadata: Metadata = {
  title: 'QuantumEd AI - Transform Syllabi into Learning Modules',
  description: 'Transform complex syllabi into bite-sized learning modules with AI-powered personalization',
  openGraph: {
    title: "Next.js by Vercel - The React Framework",
    description: "Production grade React applications that scale. The world's most popular React framework.",
    url: "https://nextjs.org",
    siteName: "Next.js",
    images: [
      {
        url: "https://nextjs.org/og.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next.js by Vercel - The React Framework",
    description: "Production grade React applications that scale. The world's most popular React framework.",
    creator: "@nextjs",
    images: ["https://nextjs.org/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.dev'
}
//Claude Sonnet 3.7 Thinking Model Generated
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
            <div className="relative flex min-h-screen flex-col">
              <Suspense fallback={null}>
                <SiteHeader />
              </Suspense>
              <div className="flex-1">
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
//Claude Sonnet 3.7 Thinking Model Generated