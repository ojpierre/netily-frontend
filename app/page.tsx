import { LandingPage } from "./landing-page"
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

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Netily",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://netily.co.ke",
    description:
      "ISP management platform with automated billing, M-Pesa integration, MikroTik provisioning, and hotspot management for Kenyan ISPs.",
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
    author: {
      "@type": "Organization",
      name: "Netily",
      url: "https://netily.co.ke",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Nairobi",
        addressCountry: "KE",
      },
    },
    areaServed: [
      { "@type": "Country", name: "Kenya" },
      { "@type": "Country", name: "Tanzania" },
      { "@type": "Country", name: "Uganda" },
      { "@type": "Country", name: "Rwanda" },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  )
}