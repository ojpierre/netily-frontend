import type { Metadata } from "next"
import { notFound } from "next/navigation"
import MarketingContentPage from "./content-page"
import MarketingLayout from "./layout"
import { detailPages, marketingIndexes, pageName } from "./content"

const siteUrl = "https://netily.co.ke"
const home = {
  title: "ISP Billing System | MikroTik, Hotspot & WiFi Billing | Internetily",
  intro: "Automate MikroTik PPPoE and hotspot billing, M-Pesa payments, invoices and renewals with Internetily. Explore pricing or book an ISP demo.",
}

const servedMarkets = ["Kenya", "Uganda", "Tanzania", "South Africa", "United Kingdom", "United States", "Australia", "New Zealand"]
const metaTitles: Record<string, string> = {
  "/features/mpesa-billing": "M-Pesa ISP Billing & Auto-Reconnection | Internetily",
  "/features/mikrotik-provisioning": "MikroTik ISP Provisioning Software | Internetily",
  "/features/pppoe-billing": "PPPoE Billing and RADIUS Automation | Internetily",
  "/features/hotspot-billing": "M-Pesa Hotspot Billing Software | Internetily",
  "/features/subscriber-management": "ISP Subscriber Management Software | Internetily",
  "/features/revenue-reporting": "ISP Revenue and Collections Reporting | Internetily",
  "/solutions/fibre-isps": "Billing and Operations Software for Fibre ISPs | Internetily",
  "/solutions/rural-wisps": "WISP Billing and MikroTik Operations | Internetily",
  "/solutions/managed-wifi": "Managed Wi-Fi and Hotspot Billing | Internetily",
  "/countries/kenya": "ISP Billing Software for Kenya | M-Pesa & MikroTik",
}

function pageFor(path: string) {
  const key = path.replace(/^\//, "")
  return path ? marketingIndexes[key] || detailPages.find((item) => item.path === path) : home
}

export function marketingMetadata(path = ""): Metadata {
  const page = pageFor(path)
  if (!page) notFound()
  const title = path ? metaTitles[path] || `${pageName(path)} for ISPs | Internetily` : home.title
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
  const page = pageFor(path)
  if (!page) return null
  const organization = { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: "Internetily", alternateName: "Netily", url: siteUrl, logo: `${siteUrl}/internetily-logo-320.webp`, email: "sales@netily.co.ke", contactPoint: { "@type": "ContactPoint", contactType: "sales", telephone: "+254100034307", availableLanguage: ["English", "Swahili"] } }
  const webPage = { "@type": "WebPage", "@id": `${url}#webpage`, url, name: path ? pageName(path) : home.title, description: page.intro, isPartOf: { "@id": `${siteUrl}/#website` }, about: { "@id": `${siteUrl}/#software` } }
  const graph = [
    organization,
    { "@type": "WebSite", "@id": `${siteUrl}/#website`, name: "Internetily", alternateName: "Netily", url: siteUrl, publisher: { "@id": `${siteUrl}/#organization` }, inLanguage: "en" },
    { "@type": "SoftwareApplication", "@id": `${siteUrl}/#software`, name: "Internetily", alternateName: "Netily", applicationCategory: "BusinessApplication", applicationSubCategory: "ISP billing and network management software", operatingSystem: "Web", description: home.intro, provider: { "@id": `${siteUrl}/#organization` }, areaServed: servedMarkets.map((name) => ({ "@type": "Country", name })), offers: { "@type": "Offer", priceCurrency: "KES", price: "500", description: "Monthly minimum; usage-based billing applies." } },
    webPage,
    ...(path.startsWith("/features/") || path.startsWith("/solutions/") ? [{
      "@type": "Service",
      "@id": `${url}#service`,
      name: pageName(path),
      serviceType: path.startsWith("/features/") ? "ISP operations software feature" : "ISP operations solution",
      description: page.intro,
      url,
      provider: { "@id": `${siteUrl}/#organization` },
      audience: { "@type": "BusinessAudience", audienceType: "Internet service providers and network operators" },
      areaServed: servedMarkets.map((name) => ({ "@type": "Country", name })),
      isRelatedTo: { "@id": `${siteUrl}/#software` },
    }] : []),
    ...(path ? [{
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Internetily", item: `${siteUrl}/` },
        ...path.slice(1).split("/").map((part, index, parts) => ({
          "@type": "ListItem", position: index + 2, name: pageName(part), item: `${siteUrl}/${parts.slice(0, index + 1).join("/")}`,
        })),
      ],
    }] : []),
  ]
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") }} />
}

export function MarketingRoute({ path }: { path: string }) {
  return <MarketingLayout><MarketingStructuredData path={path} /><MarketingContentPage path={path.replace(/^\//, "")} /></MarketingLayout>
}
