import type { Metadata } from "next"
import type { ReactNode } from "react"
import { PreviewNavigation } from "./navigation"
import { PreviewFooter } from "./sections"
import s from "./preview.module.css"

export const metadata: Metadata = {
  title: "Internetily | Homepage Preview",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default function LandingPreviewLayout({ children }: { children: ReactNode }) {
  return <div className={s.site}><a href="#preview-main" className={s.skip}>Skip to content</a><PreviewNavigation /><main id="preview-main">{children}</main><PreviewFooter /></div>
}
