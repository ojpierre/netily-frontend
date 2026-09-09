import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "Affiliate Signup | Internetily",
  description:
    "Create an Internetily affiliate account to refer ISPs, WISPs, MikroTik consultants, hotspot operators, and broadband teams.",
  alternates: {
    canonical: "https://netily.co.ke/affiliate/register",
  },
}

export default function AffiliateRegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
