"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { HomeIcon, BarChart3Icon, BookIcon, UserIcon, GraduationCapIcon, HeadphonesIcon } from "lucide-react"

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()

  // Navigation links with icons
  const navLinks = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3Icon },
    { href: "/?tab=modules", label: "Modules", icon: BookIcon },
    { href: "/generate-modules", label: "Create Modules", icon: GraduationCapIcon },
    { href: "/eleven-labs-tutorial", label: "Voice Tutor", icon: HeadphonesIcon },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ]

  // Check if link is active
  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false
    return pathname === path || pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCapIcon className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold text-xl">QuantumEd</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant={isActive(link.href) ? "default" : "ghost"}
                size="sm"
                className="h-9"
                asChild
              >
                <Link href={link.href} className="flex items-center space-x-1">
                  <link.icon className="h-4 w-4" />
                  <span className="hidden sm:inline-block">{link.label}</span>
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

