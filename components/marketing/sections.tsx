import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check, ArrowUpRight } from "lucide-react"
import { type DetailPage, pageName, marketingHref, resources } from "./content"
import s from "./marketing.module.css"
import { SOCIAL_PROFILES, SITE_URL } from "@/lib/brand"

const shareUrl = encodeURIComponent(SITE_URL)
const shareText = encodeURIComponent("Internetily (Netily): ISP billing for MikroTik, hotspot and M-Pesa")
const SHARE_LINKS: [string, string][] = [
  ["Share on WhatsApp", `https://wa.me/?text=${shareText}%20${shareUrl}`],
  ["Share on Facebook", `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`],
  ["Share on LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`],
  ["Share on X", `https://x.com/intent/post?url=${shareUrl}&text=${shareText}`],
]

export function SectionHeading({ label, title, children }: { label: string; title: string; children?: ReactNode }) {
  return <div className={s.sectionHeading}><p className={s.eyebrow}>{label}</p><h2>{title}</h2>{children && <p>{children}</p>}</div>
}

export function Hero({ label, title, intro, image = "/academy/wisp-backhaul.webp", home = false, children }: { label: string; title: string; intro: string; image?: string; home?: boolean; children?: ReactNode }) {
  return <section className={`${s.hero} ${home ? s.homeHero : ""}`}>
    <Image src={image} alt="Network engineers working with communications equipment" fill priority sizes="100vw" className={s.heroImage} />
    <div className={s.heroShade} />
    <div className={`${s.container} ${s.heroContent}`}>
      <p className={s.eyebrow}>{label}</p>
      <h1 className={home ? s.heroStatement : undefined}>{title}</h1>
      <p className={s.heroIntro}>{intro}</p>
      {children && <div className={s.heroSlot}>{children}</div>}
      <div className={s.actions}><Link className={s.button} href={marketingHref("/contact")}>Book a demo <ArrowRight size={18} /></Link><a className={s.heroSecondary} href="https://demo.netily.co.ke/admin/login">Explore the demo <ArrowUpRight size={18} /></a></div>
      <p className={s.heroNote}>Your network. Your subscribers. One connected workflow.</p>
    </div>
  </section>
}

export function DetailCards({ pages }: { pages: DetailPage[] }) {
  // Only the short page name is the link text; a stretched ::after keeps the
  // whole card clickable without one huge anchor or repeated "Explore" links.
  return <div className={s.cardGrid}>{pages.map((page) => <article className={s.featureCard} key={page.path}><Link className={`${s.cardLabel} ${s.cardLink}`} href={marketingHref(page.path)}>{pageName(page.path)}</Link><span className={s.cardTitle}>{page.title}</span><p>{page.intro}</p><span className={s.cardArrow} aria-hidden="true">Explore <ArrowUpRight size={18} /></span></article>)}</div>
}

export function PricingSummary() {
  return <div className={s.priceGrid}>
    <div className={s.priceMain}><p className={s.eyebrow}>Pay as you grow</p><h3>One network. Room to grow.</h3><p className={s.price}>KSh 500 <span>/ month minimum</span></p><ul>{["KSh 25 per billable PPPoE subscriber", "3% of hotspot revenue", "Unlimited routers", "One dashboard for your team"].map((text) => <li key={text}><Check size={18} />{text}</li>)}</ul><p>Monthly usage is subject to the KSh 500 minimum. One-time activation after trial: KSh 500.</p><Link className={s.button} href={marketingHref("/pricing#calculator")}>Calculate your cost <ArrowRight size={18} /></Link></div>
    <div className={s.priceCustom}><p className={s.eyebrow}>Custom scale</p><h3>A plan around your footprint.</h3><p>Running multiple sites or planning a larger rollout? Tell us about your subscriber count, payment channels, and support needs.</p><Link className={s.secondary} href={marketingHref("/contact")}>Request a network quote <ArrowUpRight size={18} /></Link></div>
  </div>
}

export function ClosingCTA() {
  return <section className={s.ctaBand}><div className={s.container}><div><p className={s.eyebrow}>Let's connect</p><h2>See it work for your ISP.</h2><p>Tell us how you run your network. We will walk you through the rest.</p></div><Link className={s.button} href={marketingHref("/contact")}>Book a demo <ArrowRight size={18} /></Link></div></section>
}

export function MarketingFooter() {
  return <footer className={s.footer}><div className={s.container}><div className={s.footerGrid}><div><Link href={marketingHref()} aria-label="Internetily (Netily) home"><Image src="/internetily-white-logo-320.webp" alt="Internetily (Netily)" width={160} height={128} className={s.footerLogo} /></Link><p>Internetily, also known as Netily: ISP billing, network access, and subscriber care.<br />Built to work together.</p></div><div><p className={s.footerHeading}>Explore</p>{["features", "solutions", "pricing", "integrations", "countries", "contact"].map((path) => <Link href={marketingHref(`/${path}`)} key={path}>{pageName(path)}</Link>)}</div><div><p className={s.footerHeading}>Keep learning</p>{resources.map((item) => <Link key={item.href} href={item.href}>{item.title}</Link>)}</div><div><p className={s.footerHeading}>Talk to us</p><a href="https://wa.me/254100034307">WhatsApp: 0100 034 307</a><a href="mailto:sales@netily.co.ke">sales@netily.co.ke</a><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms of service</Link></div><div><p className={s.footerHeading}>Follow and share</p><a href={SOCIAL_PROFILES.facebook} target="_blank" rel="noopener noreferrer me">Facebook</a><a href={SOCIAL_PROFILES.instagram} target="_blank" rel="noopener noreferrer me">Instagram</a>{SHARE_LINKS.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}</a>)}</div></div><div className={s.footerBottom}><span>Internetily (Netily)</span><a href="https://mjengocorporate.com/" target="_blank" rel="noopener noreferrer">A product of Mjengo Corporate <ArrowUpRight size={14} /></a></div></div></footer>
}
