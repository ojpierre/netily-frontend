import type { Metadata } from "next"
import { BrandGuideClient } from "./brand-guide-client"

export const metadata: Metadata = {
  title: "Brand Guidelines",
  description: "Official Internetily logos, colors, typography, voice, partner badges, and digital media guidance.",
  robots: { index: false, follow: false },
}

export default function BrandGuidePage() {
  return <BrandGuideClient />
}
