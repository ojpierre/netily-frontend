"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { featureGroups, pageName, previewHref, resources, solutionPages } from "./content"
import s from "./preview.module.css"

export function PreviewNavigation() {
  const [open, setOpen] = useState<string | null>(null)
  const [mobile, setMobile] = useState(false)
  const header = useRef<HTMLElement>(null)
  const pathname = usePathname()

  useEffect(() => { setOpen(null); setMobile(false) }, [pathname])
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase() || ""
    if (/^[A-Z0-9_-]{4,64}$/.test(ref)) {
      try { sessionStorage.setItem("internetily-preview-referral", ref) } catch {}
    }
  }, [])
  useEffect(() => {
    function close(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) { setOpen(null); setMobile(false) }
    }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [])

  return (
    <header ref={header} className={s.header} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(null); setMobile(false) }
    }} onKeyDown={(event) => {
      if (event.key === "Escape") {
        const target = header.current?.querySelector<HTMLButtonElement>(`[aria-controls="preview-${open}"]`)
        setOpen(null); setMobile(false); target?.focus()
      }
    }}>
      <div className={s.headerInner}>
        <Link href={previewHref()} aria-label="Internetily home" className={s.logo}>
          <Image src="/internetily-logo-320.webp" width={112} height={78} alt="Internetily" className={s.lightLogo} priority />
          <Image src="/internetily-white-logo-320.webp" width={112} height={78} alt="Internetily" className={s.darkLogo} priority />
        </Link>
        <button className={s.mobileToggle} aria-label={mobile ? "Close navigation" : "Open navigation"} aria-expanded={mobile} aria-controls="preview-navigation" onClick={() => setMobile(!mobile)}>{mobile ? <X /> : <Menu />}</button>
        <nav id="preview-navigation" aria-label="Main navigation" className={`${s.nav} ${mobile ? s.navOpen : ""}`}>
          {["Features", "Solutions", "Resources"].map((name) => (
            <div key={name} className={s.navGroup}>
              <button aria-expanded={open === name} aria-controls={`preview-${name}`} onClick={() => setOpen(open === name ? null : name)}>{name}<ChevronDown size={14} /></button>
              {open === name && <div id={`preview-${name}`} className={s.mega}>
                {name === "Features" ? featureGroups.map((group) => <div key={group.title}><p className={s.menuTitle}>{group.title}</p>{group.slugs.map((slug) => <Link key={slug} href={previewHref(`/features/${slug}`)}>{pageName(slug)}</Link>)}</div>) : name === "Solutions" ? <div className={s.menuWide}>{solutionPages.map((page) => <Link key={page.path} href={previewHref(page.path)}><strong>{pageName(page.path)}</strong><span>{page.intro}</span></Link>)}</div> : <div className={s.menuWide}>{resources.map((item) => <Link key={item.href} href={item.href}><strong>{item.title}</strong><span>{item.text}</span></Link>)}</div>}
                <Link className={s.menuAll} href={previewHref(`/${name.toLowerCase()}`)}>Explore all {name.toLowerCase()} <ArrowRight size={16} /></Link>
              </div>}
            </div>
          ))}
          <Link href={previewHref("/pricing")} aria-current={pathname === previewHref("/pricing") ? "page" : undefined}>Pricing</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className={s.headerActions}>
          <ThemeToggle className={s.themeToggle} />
          <Link className={s.button} href={previewHref("/contact")}>Book a demo <ArrowRight size={16} /></Link>
        </div>
      </div>
    </header>
  )
}
