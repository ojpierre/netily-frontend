import type { Metadata } from "next"
import { notFound } from "next/navigation"
import MarketingContentPage from "./content-page"
import MarketingLayout from "./layout"
import { detailPages, marketingIndexes, pageName } from "./content"

const siteUrl = "https://netily.co.ke"
const home = {
  title: "ISP Billing System | MikroTik, Hotspot & WiFi Billing | Internetily",
  intro: "Connect M-Pesa payments, MikroTik access, subscriber management, invoices, and renewals with Internetily. Explore ISP billing and book a demo for your network.",
}

export function marketingMetadata(path = ""): Metadata {
  const key = path.replace(/^\//, "")
  const page = path ? marketingIndexes[key] || detailPages.find((item) => item.path === path) : home
  if (!page) notFound()
  const title = path ? `${pageName(path)} | Internetily ISP Management` : home.title
  const url = `${siteUrl}${path || "/"}`
  return {
    title: { absolute: title },
    description: page.intro,
    keywords: ["Internetily", "Netily", "ISP billing system", "MikroTik billing", "M-Pesa billing", "PPPoE billing", "hotspot management", ...(path ? [pageName(path)] : [])],
    alternates: { canonical: url },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: { title, description: page.intro, url, siteName: "Internetily", type: "website", images: [{ url: `${siteUrl}/academy/wisp-backhaul.webp`, alt: "Internetily ISP billing and network management" }] },
    twitter: { card: "summary_large_image", title, description: page.intro, images: [`${siteUrl}/academy/wisp-backhaul.webp`] },
  }
}

export function MarketingStructuredData({ path = "" }: { path?: string }) {
  const url = `${siteUrl}${path || "/"}`
  const graph = path ? [{
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Internetily", item: `${siteUrl}/` },
      ...path.slice(1).split("/").map((part, index, parts) => ({
        "@type": "ListItem", position: index + 2, name: pageName(part), item: `${siteUrl}/${parts.slice(0, index + 1).join("/")}`,
      })),
    ],
  }] : [
    { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: "Internetily", alternateName: "Netily", url: siteUrl, logo: `${siteUrl}/internetily-logo-320.webp` },
    { "@type": "WebSite", "@id": `${siteUrl}/#website`, name: "Internetily", alternateName: "Netily", url, publisher: { "@id": `${siteUrl}/#organization` } },
  ]
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") }} />
}

export function MarketingRoute({ path }: { path: string }) {
  return <MarketingLayout><MarketingStructuredData path={path} /><MarketingContentPage path={path.replace(/^\//, "")} /></MarketingLayout>
}
