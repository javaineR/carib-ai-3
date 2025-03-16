"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { HomeIcon, BarChart3Icon, BookIcon, UserIcon, GraduationCapIcon, HeadphonesIcon, Sparkles } from "lucide-react"
import { MercuryIcon, VenusIcon, MarsIcon, EarthIcon, JupiterIcon } from "@/components/ui/decorative-icons"

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()

  // Navigation links with icons and planet icons
  const navLinks = [
    { href: "/", label: "Home", icon: HomeIcon, planetIcon: EarthIcon },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3Icon, planetIcon: JupiterIcon },
    { href: "/?tab=modules", label: "Modules", icon: BookIcon, planetIcon: MarsIcon },
    { href: "/generate-modules", label: "Create Modules", icon: GraduationCapIcon, planetIcon: VenusIcon },
    { href: "/eleven-labs-tutorial", label: "Voice Tutor", icon: HeadphonesIcon, planetIcon: MercuryIcon },
    { href: "/profile", label: "Profile", icon: UserIcon, planetIcon: EarthIcon },
  ]

  // Check if link is active
  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false
    return pathname === path || pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20 z-0"></div>
      <div className="container flex h-16 max-w-screen-2xl items-center relative z-10">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2 hover-scale">
            <div className="relative">
              <GraduationCapIcon className="h-7 w-7 text-primary" />
              <div className="absolute -top-1 -right-1 animate-pulse">
                <Sparkles className="h-3 w-3 text-yellow-400" />
              </div>
            </div>
            <span className="inline-block font-bold text-xl bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">QuantumEd</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant={isActive(link.href) ? "default" : "ghost"}
                size="sm"
                className={`h-10 relative overflow-hidden transition-all duration-300 ${isActive(link.href) ? 'btn-gradient-purple' : 'hover:bg-purple-500/10'}`}
                asChild
              >
                <Link href={link.href} className="flex items-center space-x-1">
                  {isActive(link.href) ? (
                    <>
                      <link.icon className="h-4 w-4" />
                      <span className="hidden sm:inline-block">{link.label}</span>
                      <div className="absolute -bottom-1 -right-1 opacity-70">
                        <link.planetIcon className="h-4 w-4" />
                      </div>
                    </>
                  ) : (
                    <>
                      <link.icon className="h-4 w-4" />
                      <span className="hidden sm:inline-block">{link.label}</span>
                    </>
                  )}
                </Link>
              </Button>
            ))}
          </nav>
          <div className="flex items-center">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

