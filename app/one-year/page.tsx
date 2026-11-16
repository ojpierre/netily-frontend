import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CalendarHeart, Check } from "lucide-react"
import MarketingLayout from "@/components/marketing/layout"
import { SectionHeading } from "@/components/marketing/sections"
import s from "@/components/marketing/marketing.module.css"
import { academyCourses } from "@/lib/academy-data"
import { blogPosts } from "@/lib/blog-data"
import { BANKS, SMS_GATEWAYS } from "@/lib/integrations-data"
import { ANNIVERSARY_START, ANNIVERSARY_PATH } from "@/lib/anniversary"
import { BRAND_NAME, SITE_URL } from "@/lib/brand"

const title = "Internetily (Netily) Turns One: A Year of ISP Billing"
const description = "Internetily, also known as Netily, is one year old. What we built for ISPs this year, from M-Pesa auto-reconnection to TR-069, and what comes next."
const url = `${SITE_URL}${ANNIVERSARY_PATH}`

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "Internetily (Netily)", images: [{ url: `${SITE_URL}/academy/wisp-backhaul.webp`, alt: "Internetily (Netily) one year" }] },
  twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/academy/wisp-backhaul.webp`] },
}

const highlights = [
  ["Payments that switch people back on", "An M-Pesa payment is matched to the subscriber and their PPPoE or hotspot access is restored automatically. No router login, no manual unblocking."],
  ["Expired customers can still pay", "Expired PPPoE subscribers are redirected to a renewal page, and returning hotspot customers reconnect while their time is still valid."],
  ["Money settles to the ISP", `M-Pesa with or without Daraja keys, ${BANKS.length} Kenyan banks and SACCOs, and MTN MoMo and Airtel Money in Uganda. We never take a cut of a payment.`],
  ["Customer routers, managed remotely", "A hosted TR-069 ACS shows customer routers and ONTs next to the subscriber, so Wi-Fi changes and reboots no longer need a site visit."],
  ["Tools for growing networks", "Staff roles, router maintenance mode, fair-usage policies, revenue per router and SMS through any of the supported gateways."],
]

const next = [
  "KopoKopo checkout, already in progress",
  "More payment options for ISPs outside Kenya and Uganda",
  "More Academy courses and practical guides for ISP teams",
]

export default function OneYearPage() {
  const stats = [
    ["Banks and SACCOs for settlement", String(BANKS.length)],
    ["SMS gateways supported", String(SMS_GATEWAYS.length)],
    ["Free ISP guides published", String(blogPosts.length)],
    ["Academy courses", String(academyCourses.length)],
  ]
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    datePublished: ANNIVERSARY_START.toISOString().slice(0, 10),
    author: { "@type": "Organization", name: BRAND_NAME, url: SITE_URL },
    publisher: { "@id": `${SITE_URL}/#organization` },
    about: { "@id": `${SITE_URL}/#software` },
  }

  return <MarketingLayout>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className={s.pageIntro}><div className={s.container}>
      <nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span aria-current="page">One year</span></nav>
      <p className={s.eyebrow}><CalendarHeart size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> November 2026</p>
      <h1>Internetily (Netily) is one year old.</h1>
      <p>A year ago we set out to make one thing simple for ISPs: when a subscriber pays, they should be back online without anyone touching a router. Thank you to every ISP, technician and agent who trusted us with their network, and told us honestly what to fix next.</p>
    </div></section>

    <section className={s.section}><div className={s.container}>
      <dl className={s.milestoneStats}>{stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </div></section>

    <section className={`${s.section} ${s.tinted}`}><div className={s.container}>
      <SectionHeading label="Year one" title="What we built with you." />
      <div className={s.threeColumns}>{highlights.map(([heading, text]) => <div className={s.plainItem} key={heading}><p className={s.itemTitle}>{heading}</p><p>{text}</p></div>)}</div>
    </div></section>

    <section className={s.section}><div className={s.container}>
      <SectionHeading label="Year two" title="What comes next.">We will keep the focus narrow: fewer manual steps between a payment and a working connection.</SectionHeading>
      <ul className={s.faq} style={{ listStyle: "none", padding: 0 }}>{next.map((item) => <li key={item} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0" }}><Check size={18} color="#16a34a" />{item}</li>)}</ul>
      <div className={s.actions} style={{ marginTop: 32 }}>
        <Link className={s.button} href="/contact">Start your free trial <ArrowRight size={18} /></Link>
        <Link className={s.secondary} href="/features">Explore features</Link>
      </div>
    </div></section>
  </MarketingLayout>
}
