import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "Netily Docs | Onboarding and Support",
  description: "Netily onboarding, navigation, billing, router setup, and tenant support documentation.",
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
