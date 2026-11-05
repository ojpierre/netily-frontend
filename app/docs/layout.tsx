import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: { absolute: "Internetily Docs | ISP Setup Guides" },
  description: "Internetily documentation for ISP onboarding, billing, routers, payments, staff access, support, and tenant workflows.",
  alternates: {
    canonical: "https://netily.co.ke/docs",
  },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
