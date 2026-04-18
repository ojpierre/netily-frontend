import { LandingPage } from "./landing-page"
import Script from "next/script"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Netily — #1 ISP Management Platform in Kenya | Billing, M-Pesa & MikroTik",
  description:
    "Netily automates ISP billing, M-Pesa STK Push payments, MikroTik router provisioning, hotspot management, and RADIUS authentication. Trusted by ISPs across Kenya and East Africa. Start your free trial today.",
  alternates: {
    canonical: "https://netily.co.ke",
  },
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Netily",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://netily.co.ke",
  description:
    "ISP management platform automating billing, M-Pesa payments, and MikroTik provisioning in Kenya.",
  publisher: {
    "@type": "Organization",
    name: "Netily",
    url: "https://netily.co.ke",
    location: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Nairobi",
        addressCountry: "KE",
      },
    },
  },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "KES",
    lowPrice: "500",
    offerCount: "4",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "50",
  },
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
  sameAs: [],
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

export default function Page() {
  return (
    <>
      <Script
        id="schema-software"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <Script
        id="schema-org"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <LandingPage />
    </>
  )
}