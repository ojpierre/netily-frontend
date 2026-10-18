import type { ReactNode } from "react"
import { MarketingNavigation } from "./navigation"
import { MarketingFooter } from "./sections"
import { MarketingMotion } from "./motion"
import s from "./marketing.module.css"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <div className={s.site}><a href="#marketing-main" className={s.skip}>Skip to content</a><MarketingNavigation /><main id="marketing-main"><MarketingMotion>{children}</MarketingMotion></main><MarketingFooter /></div>
}
