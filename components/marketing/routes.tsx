import type { Metadata } from "next"
import { notFound } from "next/navigation"
import MarketingContentPage from "./content-page"
import MarketingLayout from "./layout"
import { answerEngineContent, detailPages, marketingIndexes, pageName } from "./content"
import { BANKS, SMS_GATEWAYS } from "@/lib/integrations-data"
import { BRAND_ALTERNATE_NAMES, BRAND_NAME, BRAND_PROFILES, PARENT_ORGANIZATION, SITE_URL, brandTitle } from "@/lib/brand"

const siteUrl = SITE_URL
const home = {
  title: "ISP Billing System for MikroTik & WiFi | Internetily (Netily)",
  intro: "Internetily (Netily) automates MikroTik PPPoE and hotspot billing, M-Pesa payments, invoices and renewals for ISPs. Explore pricing or book a demo.",
}

const servedMarkets = ["Kenya", "Uganda", "Tanzania", "South Africa", "United Kingdom", "United States", "Australia", "New Zealand"]
// Base titles only — brandTitle() appends the brand once.
const metaTitles: Record<string, string> = {
  "/features/mpesa-billing": "M-Pesa ISP Billing & Auto-Reconnection",
  "/features/mikrotik-provisioning": "MikroTik ISP Provisioning Software",
  "/features/pppoe-billing": "Expired PPPoE Payment Redirect & RADIUS Billing",
  "/features/hotspot-billing": "M-Pesa Hotspot Billing Software",
  "/features/subscriber-management": "ISP Subscriber Management Software",
  "/features/revenue-reporting": "ISP Revenue and Collections Reporting",
  "/features/tr069-device-management": "TR-069 ACS & CPE Management for ISPs",
  "/solutions/fibre-isps": "Billing and Operations Software for Fibre ISPs",
  "/solutions/rural-wisps": "WISP Billing and MikroTik Operations",
  "/solutions/managed-wifi": "Managed Wi-Fi and Hotspot Billing",
  "/countries/kenya": "ISP Billing Software Kenya | M-Pesa & MikroTik",
  "/integrations": "ISP Payment Gateways, Banks & SMS Integrations",
}

// Named integrations for SoftwareApplication.featureList, so search and AI engines can cite them.
const featureList = [
  "M-Pesa STK push, Paybill and Till billing (with or without Daraja API keys)",
  `Direct settlement to Kenyan banks and SACCOs: ${BANKS.map((b) => b.name).join(", ")}`,
  "MTN MoMo and Airtel Money in Uganda via iotec",
  `SMS gateways: ${SMS_GATEWAYS.map((g) => g.name).join(", ")}, plus built-in SMS`,
  "MikroTik PPPoE and hotspot automation with RADIUS",
  "TR-069 ACS for customer routers and ONTs",
]

function pageFor(path: string) {
  const key = path.replace(/^\//, "")
  return path ? marketingIndexes[key] || detailPages.find((item) => item.path === path) : home
}

export function marketingMetadata(path = ""): Metadata {
  const page = pageFor(path)
  if (!page) notFound()
  const title = path ? brandTitle(metaTitles[path] || `${pageName(path)} for ISPs`) : home.title
  const url = `${siteUrl}${path || "/"}`
  return {
    title: { absolute: title },
    description: page.intro,
    keywords: ["Internetily", "Netily", "ISP billing system", "MikroTik billing", "M-Pesa billing", "PPPoE billing", "hotspot management", ...(path === "/features/pppoe-billing" ? ["expired PPPoE payment redirect", "MikroTik renewal portal", "RADIUS walled garden", "automatic PPPoE reconnection"] : []), ...(path === "" || path === "/integrations" ? ["ISP payment gateways Kenya", "M-Pesa Daraja ISP billing", "ISP bank settlement Kenya", "MTN MoMo ISP billing Uganda", "ISP SMS gateway", "Africa's Talking ISP billing"] : []), ...(path ? [pageName(path)] : [])],
    alternates: { canonical: url },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: { title, description: page.intro, url, siteName: "Internetily (Netily)", type: "website", images: [{ url: `${siteUrl}/academy/wisp-backhaul.webp`, alt: "Internetily (Netily) ISP billing and network management" }] },
    twitter: { card: "summary_large_image", title, description: page.intro, images: [`${siteUrl}/academy/wisp-backhaul.webp`] },
  }
}

export function MarketingStructuredData({ path = "" }: { path?: string }) {
  const url = `${siteUrl}${path || "/"}`
  const page = pageFor(path)
  if (!page) return null
  const organization = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: BRAND_NAME,
    alternateName: BRAND_ALTERNATE_NAMES,
    description: "Internetily, also known as Netily, makes ISP billing and network management software for internet service providers in Kenya, Uganda, Tanzania and beyond.",
    url: siteUrl,
    logo: `${siteUrl}/internetily-logo-320.webp`,
    email: "sales@netily.co.ke",
    sameAs: BRAND_PROFILES,
    parentOrganization: PARENT_ORGANIZATION,
    areaServed: servedMarkets.map((name) => ({ "@type": "Country", name })),
    contactPoint: { "@type": "ContactPoint", contactType: "sales", telephone: "+254100034307", availableLanguage: ["English", "Swahili"] },
  }
  const webPage = { "@type": "WebPage", "@id": `${url}#webpage`, url, name: path ? pageName(path) : home.title, description: page.intro, isPartOf: { "@id": `${siteUrl}/#website` }, about: { "@id": `${siteUrl}/#software` } }
  const answerEngine = answerEngineContent[path]
  const graph = [
    organization,
    // Google reads WebSite name/alternateName on the homepage for the site name shown in results.
    { "@type": "WebSite", "@id": `${siteUrl}/#website`, name: BRAND_NAME, alternateName: BRAND_ALTERNATE_NAMES, url: `${siteUrl}/`, publisher: { "@id": `${siteUrl}/#organization` }, inLanguage: "en" },
    { "@type": "SoftwareApplication", "@id": `${siteUrl}/#software`, name: BRAND_NAME, alternateName: BRAND_ALTERNATE_NAMES, applicationCategory: "BusinessApplication", applicationSubCategory: "ISP billing and network management software", operatingSystem: "Web", description: home.intro, featureList, provider: { "@id": `${siteUrl}/#organization` }, areaServed: servedMarkets.map((name) => ({ "@type": "Country", name })), offers: { "@type": "Offer", priceCurrency: "KES", price: "500", description: "Monthly minimum; usage-based billing applies." } },
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
    ...(answerEngine ? [{
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: answerEngine.questions.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
    }] : []),
    ...(path ? [{
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Internetily (Netily)", item: `${siteUrl}/` },
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
