import { LandingPage } from "./landing-page"
import type { Metadata } from "next"
import { blogPosts } from "@/lib/blog-data"

// Static page — no per-request rendering needed; maximises caching and Core Web Vitals
export const metadata: Metadata = {
  title: "ISP Billing Software Kenya | M-Pesa & MikroTik — Netily",
  description:
    "Kenya's leading ISP billing software. Automate M-Pesa STK Push, MikroTik PPPoE & hotspot billing. Free trial, no card required.",
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
    // ── 2026-specific keywords ────────────────────────
    "isp billing software kenya 2026",
    "best isp management software 2026",
    "isp automation software 2026",
    "cloud isp billing 2026",
    "ai-powered isp billing 2026",
    "modern isp management platform 2026",
    "next-gen isp billing kenya 2026",
    "isp saas platform 2026",
    "isp billing automation 2026",
    "smart isp management 2026",
    "isp revenue optimization 2026",
    "fiber isp billing 2026",
    "wisp billing software 2026",
    "5g isp billing kenya 2026",
    "starlink isp billing kenya 2026",
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
    "free trial ISP software",
    // ── Emerging tech & trends 2026 ──────────────────
    "ai isp billing kenya",
    "machine learning isp churn prediction",
    "predictive isp analytics 2026",
    "isp revenue forecasting software",
    "automated isp customer retention",
    "isp business intelligence 2026",
    "isp data analytics platform kenya",
    "isp ml-powered billing",
    "smart isp operations 2026",
    "isp digital transformation kenya",
    "cloud-native isp platform",
    "kubernetes isp deployment",
    "serverless isp billing",
    "api-first isp management",
    "headless isp billing cms",
    // ── Competitor comparisons ────────────────────────
    "Splynx alternative Kenya",
    "WHMCS alternative ISP Africa",
    "Ucrm alternative Kenya",
    "Centipid Billing alternative",
    "ISP Man alternative",
    "Wisp Man alternative",
    "Jasiyo alternative",
    "Pawanet alternative",
    "Lipanet alternative",
    "Splynx vs Netily",
    "better than Splynx for Kenya ISP",
    "affordable Splynx alternative East Africa",
    "ISP billing software better than Splynx",
    "Splynx alternative 2026",
    "modern splynx competitor",
    "splynx replacement kenya",
    // ── Vertical / use-case ───────────────────────────
    "school WiFi billing software Kenya",
    "hotel WiFi billing system Kenya",
    "matatu WiFi billing Kenya",
    "apartment estate WiFi management Kenya",
    "FTTH billing software Kenya",
    "fiber to the home ISP billing",
    "fixed wireless access billing Kenya",
    "church WiFi billing Kenya",
    "campus WiFi management Kenya",
    // ── Long-tail queries ─────────────────────────────
    "how to automate ISP billing with M-Pesa",
    "best ISP billing software with mikrotik api",
    "mikrotik pppoe auto suspend on expiry Kenya",
    "mikrotik hotspot billing with mpesa Kenya",
    "ISP billing software with radius integration",
    "internet subscription management Kenya",
    "ISP reconciliation software M-Pesa Safaricom",
    "automated internet billing Kenya",
    "PPPoE subscriber auto-suspend software Kenya",
    // ── More cities/regions ───────────────────────────
    "Thika ISP billing",
    "Machakos ISP software",
    "Nyeri internet billing",
    "Kampala ISP billing Uganda",
    "Dar es Salaam ISP billing Tanzania",
    "Kigali ISP software Rwanda",
    "Bujumbura ISP billing Burundi",
    "Juba ISP billing South Sudan",
    "ISP billing software Uganda",
    "ISP billing software Tanzania",
    "ISP billing software Rwanda",
    "ISP billing software Burundi",
    "ISP billing software South Sudan",
    // ── Brand ─────────────────────────────────────────
    "Netily",
    "Netily ISP billing",
    "Netily vs Splynx",
    "Netily MikroTik integration",
    "Netily hotspot billing",
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
      "Kenya's #1 ISP billing software. Automate M-Pesa STK Push, MikroTik PPPoE, RADIUS & hotspot billing. Free trial available.",
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
    "SMS payment reminders",
    "Subscriber auto-suspension",
    "Revenue analytics dashboard",
    "Dashboard themes",
    "Staff role edits and permissions",
    "Lead capture and sales follow-up",
    "Previous billing cycle breakdowns",
  ],
  areaServed: [
    { "@type": "Country", name: "Kenya" },
    { "@type": "Country", name: "Tanzania" },
    { "@type": "Country", name: "Uganda" },
    { "@type": "Country", name: "Rwanda" },
    { "@type": "Country", name: "Burundi" },
    { "@type": "Country", name: "South Sudan" },
  ],
  paymentAccepted: [
    "M-Pesa",
    "Airtel Money",
    "Telkom Kash",
    "Co-operative Bank",
    "Equity Bank",
    "I&M Bank",
    "Kingdom Bank",
    "National Bank",
    "SBM Bank",
    "Stanbic Bank",
    "Standard Chartered",
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
  knowsAbout: [
    "ISP billing software",
    "M-Pesa billing automation",
    "MikroTik provisioning",
    "Hotspot billing",
    "Kenyan bank payment operations",
    "RADIUS authentication",
    "PPPoE subscriber management",
    "Dashboard themes for ISP teams",
    "Staff role edits and permission controls",
    "Lead generation for internet service providers",
    "Centipid Billing alternative",
    "ISP Man alternative",
    "Wisp Man alternative",
    "Jasiyo alternative",
    "Pawanet alternative",
    "Lipanet alternative",
  ],
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

const financialWorkflowSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Netily Payment and Billing Workflow",
  serviceType: "ISP billing automation",
  provider: {
    "@type": "Organization",
    name: "Netily",
    url: "https://netily.co.ke",
  },
  areaServed: [
    { "@type": "Country", name: "Kenya" },
    { "@type": "Country", name: "Uganda" },
    { "@type": "Country", name: "Tanzania" },
    { "@type": "Country", name: "Rwanda" },
    { "@type": "Country", name: "Burundi" },
    { "@type": "Country", name: "South Sudan" },
  ],
  availableChannel: [
    { "@type": "ServiceChannel", name: "M-Pesa" },
    { "@type": "ServiceChannel", name: "Airtel Money" },
    { "@type": "ServiceChannel", name: "Telkom Kash" },
    { "@type": "ServiceChannel", name: "Bank-aligned billing workflows" },
  ],
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
        text: "Yes. Netily offers a free trial. No credit card required. Start managing your ISP with full access to all features immediately.",
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
    {
      "@type": "Question",
      name: "What is the best ISP billing software in Kenya?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Netily is widely regarded as the best ISP billing software in Kenya for small and medium ISPs. It natively supports M-Pesa STK Push, MikroTik PPPoE auto-provisioning, RADIUS authentication, and hotspot billing — all priced in KES with a free trial.",
      },
    },
    {
      "@type": "Question",
      name: "Is there free ISP billing software?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Netily offers a free trial with no credit card required — giving ISPs full access to billing, M-Pesa integration, and MikroTik provisioning before committing. After the trial, tenants activate with KES 500, then recurring billing is based on PPPoE footprint and hotspot revenue usage. Open-source alternatives like ZAL ISP Management System exist but require self-hosting and technical setup.",
      },
    },
    {
      "@type": "Question",
      name: "What is an ISP management system?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An ISP management system is software that helps internet service providers manage subscribers, billing, payments, router provisioning, and network access. Netily is an ISP management system built for Kenya and East Africa, integrating M-Pesa payments and MikroTik routers natively.",
      },
    },
    {
      "@type": "Question",
      name: "Does Netily work with MikroTik routers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Netily integrates with MikroTik RouterOS via the RouterOS API for zero-touch PPPoE and Hotspot provisioning, automatic subscriber suspension and reactivation, and bandwidth policy enforcement.",
      },
    },
    {
      "@type": "Question",
      name: "How does Netily compare to Splynx?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Netily is built specifically for Kenyan and East African ISPs. Unlike Splynx, Netily has native M-Pesa STK Push integration, is priced in KES, and is significantly more affordable for small and medium ISPs. Splynx is a European product that does not natively support M-Pesa.",
      },
    },
    {
      "@type": "Question",
      name: "Is Netily a good Splynx alternative for Kenya?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Netily is Kenya's leading Splynx alternative. It offers native M-Pesa STK Push, MikroTik auto-provisioning, RADIUS integration, and hotspot billing — all at a fraction of Splynx's cost and priced in KES. Most Kenyan ISPs switching from Splynx are live on Netily within 24 hours.",
      },
    },
  ],
}

// ─── LocalBusiness Schema (2026) — Enhanced GEO targeting ──────────────────────
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://netily.co.ke/#business",
  name: "Netily",
  alternateName: "Netily ISP Billing Software",
  description: "Cloud-based ISP billing and management platform for Kenya and East Africa. Automates M-Pesa STK Push payments, MikroTik PPPoE provisioning, RADIUS authentication, and hotspot billing for internet service providers.",
  url: "https://netily.co.ke",
  telephone: "+254-700-000-000",
  email: "hello@netily.co.ke",
  foundingDate: "2024",
  foundingLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nairobi",
      addressRegion: "Nairobi County",
      addressCountry: "KE",
    },
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Nairobi",
    addressRegion: "Nairobi County",
    addressCountry: "KE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "-1.286389",
    longitude: "36.817223",
  },
  areaServed: [
    { "@type": "Country", name: "Kenya", "@id": "https://www.wikidata.org/wiki/Q114" },
    { "@type": "Country", name: "Tanzania", "@id": "https://www.wikidata.org/wiki/Q924" },
    { "@type": "Country", name: "Uganda", "@id": "https://www.wikidata.org/wiki/Q1036" },
    { "@type": "Country", name: "Rwanda", "@id": "https://www.wikidata.org/wiki/Q1037" },
    { "@type": "Country", name: "Burundi", "@id": "https://www.wikidata.org/wiki/Q967" },
    { "@type": "Country", name: "South Sudan", "@id": "https://www.wikidata.org/wiki/Q958" },
    { "@type": "City", name: "Nairobi", containedInPlace: "Kenya" },
    { "@type": "City", name: "Mombasa", containedInPlace: "Kenya" },
    { "@type": "City", name: "Kisumu", containedInPlace: "Kenya" },
    { "@type": "City", name: "Nakuru", containedInPlace: "Kenya" },
    { "@type": "City", name: "Eldoret", containedInPlace: "Kenya" },
    { "@type": "City", name: "Thika", containedInPlace: "Kenya" },
    { "@type": "City", name: "Kampala", containedInPlace: "Uganda" },
    { "@type": "City", name: "Dar es Salaam", containedInPlace: "Tanzania" },
    { "@type": "City", name: "Kigali", containedInPlace: "Rwanda" },
    { "@type": "City", name: "Bujumbura", containedInPlace: "Burundi" },
    { "@type": "City", name: "Juba", containedInPlace: "South Sudan" },
  ],
  sameAs: [
    "https://x.com/netily",
    "https://linkedin.com/company/netily",
    "https://facebook.com/netily",
    "https://instagram.com/netily",
    "https://github.com/netily",
  ],
  logo: {
    "@type": "ImageObject",
    url: "https://netily.co.ke/logo.png",
    width: "512",
    height: "512",
  },
  image: {
    "@type": "ImageObject",
    url: "https://netily.co.ke/og-image.svg",
    width: "1200",
    height: "630",
  },
  priceRange: "KES 500 - KES 50000",
  paymentAccepted: ["M-Pesa", "Airtel Money", "Telkom Kash", "Bank Transfer", "Credit Card"],
  currenciesAccepted: "KES",
  openingHours: "Mo-Fr 08:00-18:00",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+254-700-000-000",
      contactType: "customer support",
      email: "support@netily.co.ke",
      areaServed: "KE",
      availableLanguage: ["English", "Swahili"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00",
      },
    },
    {
      "@type": "ContactPoint",
      telephone: "+254-700-000-000",
      contactType: "sales",
      email: "sales@netily.co.ke",
      areaServed: ["KE", "TZ", "UG", "RW"],
      availableLanguage: ["English", "Swahili"],
    },
    {
      "@type": "ContactPoint",
      contactType: "technical support",
      email: "support@netily.co.ke",
      areaServed: ["KE", "TZ", "UG", "RW"],
      availableLanguage: ["English", "Swahili"],
    },
  ],
  makesOffer: [
    {
      "@type": "Offer",
      name: "Starter Plan — ISP Billing Software",
      description: "Usage-based metered billing for small to medium ISPs. KES 500 activation + KES 25/PPPoE subscriber + 3% hotspot revenue share.",
      price: "500",
      priceCurrency: "KES",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "25",
        priceCurrency: "KES",
        unitText: "per PPPoE subscriber per month",
      },
      availability: "https://schema.org/InStock",
      url: "https://netily.co.ke/register",
      eligibleRegion: ["KE", "TZ", "UG", "RW"],
      itemOffered: {
        "@type": "SoftwareApplication",
        name: "Netily Starter Plan",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
      },
    },
    {
      "@type": "Offer",
      name: "Enterprise Plan — Custom ISP Billing",
      description: "Custom pricing for large ISPs with white-label branding, dedicated support, and SLA guarantees.",
      price: "0",
      priceCurrency: "KES",
      availability: "https://schema.org/InStock",
      url: "https://netily.co.ke/register",
      eligibleRegion: ["KE", "TZ", "UG", "RW"],
      itemOffered: {
        "@type": "SoftwareApplication",
        name: "Netily Enterprise Plan",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
      },
    },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "ISP Billing Software Services",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "M-Pesa Integration Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "M-Pesa STK Push Integration",
              description: "Automated M-Pesa payment collection via Safaricom Daraja API with real-time subscriber activation",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "M-Pesa Payment Reconciliation",
              description: "Automatic payment reconciliation from M-Pesa paybill and till number transactions",
            },
          },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "MikroTik Router Management",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "MikroTik PPPoE Auto-Provisioning",
              description: "Zero-touch subscriber provisioning on MikroTik RouterOS with automatic suspend/restore",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "MikroTik Hotspot Billing",
              description: "Captive portal management with voucher generation and session control",
            },
          },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "ISP Management Features",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "RADIUS Authentication",
              description: "FreeRADIUS integration for PPPoE and hotspot authentication",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Customer Self-Service Portal",
              description: "Subscriber portal for balance checks, M-Pesa payments, and support tickets",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Automated ISP Invoicing",
              description: "Recurring invoice generation with SMS payment reminders",
            },
          },
        ],
      },
    ],
  },
  knowsAbout: [
    "ISP billing software Kenya 2026",
    "M-Pesa STK Push integration",
    "MikroTik RouterOS API automation",
    "RADIUS authentication systems",
    "PPPoE subscriber management",
    "Hotspot captive portal billing",
    "ISP payment automation East Africa",
    "ISP billing software Uganda",
    "ISP billing software Tanzania",
    "ISP billing software Rwanda",
    "ISP billing software Burundi",
    "ISP billing software South Sudan",
    "Fiber ISP management Kenya",
    "WISP billing software",
    "Internet service provider SaaS",
    "Safaricom Daraja API integration",
    "Kenyan mobile money billing",
    "ISP customer self-service portals",
    "Bandwidth management systems",
    "ISP analytics and reporting",
    "Dashboard themes for ISP teams",
    "Staff role edits and permissions",
    "ISP lead generation software",
    "Centipid Billing alternative",
    "ISP Man alternative",
    "Wisp Man alternative",
    "Jasiyo alternative",
    "Pawanet alternative",
    "Lipanet alternative",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "17",
    reviewCount: "17",
    bestRating: "5",
    worstRating: "1",
  },
}

// ─── BreadcrumbList Schema (2026) — Helps Google understand site hierarchy ────
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://netily.co.ke",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "ISP Billing Software",
      item: "https://netily.co.ke/#features",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Pricing",
      item: "https://netily.co.ke/#pricing",
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Blog",
      item: "https://netily.co.ke/blog",
    },
  ],
}

export default function Page() {
  // Blog list schema — helps Google understand the content cluster
  const blogListSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Netily ISP Blog",
    url: "https://netily.co.ke/blog",
    description: "Expert guides on ISP billing software, MikroTik automation, and M-Pesa integration for Kenyan ISPs",
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription,
      url: `https://netily.co.ke/blog/${post.slug}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: { "@type": "Person", name: post.author.name },
      keywords: post.keywords.join(", "),
    })),
  }

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(financialWorkflowSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LandingPage />
    </>
  )
}
