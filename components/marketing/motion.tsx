"use client"

import { useEffect, useRef } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import s from "./marketing.module.css"

const revealSelector = [
  `.${s.heroContent} > *`,
  `.${s.compatibility} .${s.container}`,
  `.${s.sectionHeading}`,
  `.${s.plainItem}`,
  `.${s.workflowStep}`,
  `.${s.featureCard}`,
  `.${s.editorialImage}`,
  `.${s.priceMain}`,
  `.${s.priceCustom}`,
  `.${s.contactGrid}`,
  `.${s.pageIntro} .${s.container}`,
  `.${s.detailPoints} > div`,
  `.${s.calculator}`,
  `.${s.ctaBand} .${s.container}`,
  `.${s.capabilityItem}`,
  `.${s.reviewCard}`,
  `.${s.productProofCopy}`,
  `.${s.productFrame}`,
].join(",")

export function MarketingMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const rootRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const elements = Array.from(root.querySelectorAll<HTMLElement>(revealSelector))
    const sectionCounts = new Map<Element, number>()

    for (const element of elements) {
      const group = element.closest("section") || root
      const position = sectionCounts.get(group) || 0
      sectionCounts.set(group, position + 1)
      element.dataset.marketingReveal = ""
      element.style.setProperty("--reveal-delay", `${Math.min(position * 55, 220)}ms`)
      if (reduceMotion) element.dataset.revealState = "visible"
    }

    root.dataset.motionReady = "true"
    if (reduceMotion) return

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const element = entry.target as HTMLElement
        element.dataset.revealState = "visible"
        observer.unobserve(element)
      }
    }, { rootMargin: "0px 0px -10%", threshold: 0.08 })

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [pathname, reduceMotion])

  return (
    <div ref={rootRef} className={s.motionRoot}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
