import type React from "react"

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="w-full min-h-screen">
      {children}
    </section>
  )
}

