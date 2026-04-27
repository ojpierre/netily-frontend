import { LandingPage } from "./landing-page"
import type { Metadata } from "next"

// Static page — no per-request rendering needed; maximises caching and Core Web Vitals
export const metadata: Metadata = {
  title: "ISP Billing Software Kenya | M-Pesa & MikroTik — Netily",
  description:
    "Kenya's leading ISP billing software. Automate M-Pesa STK Push, MikroTik PPPoE & hotspot billing. 14-day free trial, no card required.",
  keywords: [
    // ── Exact-match Ahrefs targets (high intent) ──────
    "isp billing software",
    "isp billing software kenya",
    "best isp billing software",
    "best isp billing software in kenya",
    "isp billing software free",
    "free isp billing software",
    "open source isp billing software",
    "isp billing software open source",
    "wireless isp billing software",
    "isp billing software mikrotik",
    "mikrotik isp billing software",
    "free isp billing software for mikrotik",
    "isp billing software github",
    "isp management system",
    "isp management software",
    "isp management software free",
    "free isp management software",
    "free isp management system",
    "best isp management software",
    "open source isp management software",
    "isp management system php",
    "isp management system github",
    "radius isp management system",
    "isp management system with mikrotik api",
    "mikrotik isp management software",
    "isp management",
    // ── Branded & geo ─────────────────────────────────
    "ISP billing software Kenya",
    "ISP management software Kenya 2026",
    "best ISP billing system Kenya",
    "internet service provider software Kenya",
    "M-Pesa ISP billing automation",
    "M-Pesa STK push integration ISP",
    "Safaricom Daraja API ISP billing",
    "M-Pesa paybill internet subscription",
    "MikroTik PPPoE billing software",
    "MikroTik auto-provisioning Kenya",
    "MikroTik RouterOS API billing",
    "RADIUS authentication Kenya",
    "FreeRADIUS management Kenya",
    "hotspot billing software Kenya",
    "captive portal billing M-Pesa",
    "WiFi hotspot management Kenya",
    "fiber ISP billing software Kenya",
    "WISP billing Kenya",
    "PPPoE subscriber management",
    "ISP customer self-service portal Kenya",
    "ISP subscriber portal M-Pesa",
    "ISP auto-invoicing Kenya",
    "ISP bandwidth management Kenya",
    "ISP subscription management Kenya",
    "ISP SMS payment reminder Kenya",
    "Nairobi ISP software",
    "Mombasa ISP billing",
    "Kenya broadband billing system",
    "East Africa ISP SaaS",
    "affordable ISP billing software Africa",
    "14 day free trial ISP software",
    "Netily",
    "Netily ISP billing",
  ],
  alternates: {
    canonical: "https://netily.co.ke",
    languages: {
      "en-KE": "https://netily.co.ke",
      "x-default": "https://netily.co.ke",
    },
  },
  openGraph: {
    title: "ISP Billing Software Kenya | M-Pesa & MikroTik — Netily",
    description:
      "Kenya's #1 ISP billing software. Automate M-Pesa STK Push, MikroTik PPPoE, RADIUS & hotspot billing. 14-day free trial.",
    url: "https://netily.co.ke",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Netily — ISP Billing Software Kenya" }],
  },
}

// ─── Structured Data (server-rendered in initial HTML) ────────────────────────

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Netily",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://netily.co.ke",
  description:
    "ISP billing software for Kenya and East Africa. Automates M-Pesa STK Push payments, MikroTik PPPoE provisioning, RADIUS authentication, hotspot billing, and ISP management.",
  publisher: {
    "@type": "Organization",
    name: "Netily",
    url: "https://netily.co.ke",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
  },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "KES",
    lowPrice: "500",
    offerCount: "4",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "M-Pesa STK Push integration",
    "MikroTik PPPoE auto-provisioning",
    "RADIUS authentication",
    "Hotspot billing and captive portal",
    "ISP customer self-service portal",
    "Automated invoicing",
    "Bandwidth management",
    "ISP management dashboard",
  ],
  areaServed: [
    { "@type": "Country", name: "Kenya" },
    { "@type": "Country", name: "Tanzania" },
    { "@type": "Country", name: "Uganda" },
    { "@type": "Country", name: "Rwanda" },
  ],
}

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Netily",
  url: "https://netily.co.ke",
  logo: "https://netily.co.ke/logo.png",
  sameAs: [
    "https://x.com/netily",
    "https://linkedin.com/company/netily",
    "https://facebook.com/netily",
    "https://instagram.com/netily",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Nairobi",
    addressCountry: "KE",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    areaServed: "KE",
    availableLanguage: "English",
  },
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Netily",
  url: "https://netily.co.ke",
  description: "ISP billing software and management platform for Kenya and East Africa",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://netily.co.ke/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Netily?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Netily is ISP billing software for Kenya and East Africa. It automates M-Pesa STK Push payments, MikroTik PPPoE provisioning, RADIUS authentication, hotspot billing, and customer self-service for internet service providers.",
      },
    },
    {
      "@type": "Question",
      name: "Does Netily support M-Pesa STK Push?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Netily has native M-Pesa STK Push integration. When a subscriber pays, their internet service activates automatically within seconds — no manual reconciliation.",
      },
    },
    {
      "@type": "Question",
      name: "Does Netily work with MikroTik routers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Netily connects to MikroTik RouterOS via API for zero-touch PPPoE and Hotspot provisioning, subscriber management, and bandwidth control.",
      },
    },
    {
      "@type": "Question",
      name: "How long does setup take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most ISPs are fully operational on Netily within 24 hours. Setup includes MikroTik integration, M-Pesa STK Push configuration, and RADIUS authentication.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free trial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Netily offers a 14-day free trial. No credit card required. Start managing your ISP with full access to all features immediately.",
      },
    },
    {
      "@type": "Question",
      name: "Does Netily support hotspot billing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Netily supports hotspot billing with branded captive portals, M-Pesa payments, voucher management, and session management for Wi-Fi hotspot providers.",
      },
    },
  ],
}

export default function Page() {
  return (
    <>
      {/* JSON-LD schemas in initial server HTML — not afterInteractive */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingPage />
    </>
  )
}