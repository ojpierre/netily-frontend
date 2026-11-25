import type { ReactNode } from "react"
import { MarketingNavigation } from "./navigation"
import { AnniversaryBar } from "./anniversary"
import s from "./marketing.module.css"

/**
 * The homepage header (anniversary bar + main navigation) for public pages that keep
 * their own page design, e.g. blog, case studies, comparisons and legal pages.
 * The wrapper uses `display: contents`, so the marketing tokens and fonts reach the
 * header without the wrapper creating a box (the header stays sticky for the whole page).
 */
export default function PublicPageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className={`${s.site} ${s.headerOnly}`}>
        <AnniversaryBar />
        <MarketingNavigation />
      </div>
      {children}
    </>
  )
}
