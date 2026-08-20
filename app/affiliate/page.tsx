import React from "react"
import type { Metadata } from "next"
import { AffiliateLandingClient } from "./affiliate-landing"

const affiliateFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the Internetily affiliate program?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Internetily affiliate program, also known as the Netily affiliate program, lets partners refer ISPs, WISPs, hotspot operators, managed Wi-Fi providers, consultants, and MikroTik teams to Internetily ISP billing software. Referred leads are tracked with an affiliate link and reviewed manually for commission eligibility.",
      },
    },
    {
      "@type": "Question",
      name: "Who should join the Netily affiliate program in 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The program is built for ISP consultants, MikroTik engineers, network installers, WISP communities, Wi-Fi hotspot resellers, content creators, B2B SaaS affiliates, and technology partners who already speak with internet providers worldwide.",
      },
    },
    {
      "@type": "Question",
      name: "Can international affiliates join?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Internetily welcomes qualified affiliates from Kenya, Uganda, Tanzania, South Africa, Nigeria, Ghana, Rwanda, Ethiopia, Europe, Asia, the Americas, and other regions where ISP, WISP, fiber, and hotspot operators need billing automation.",
      },
    },
    {
      "@type": "Question",
      name: "How are affiliate commissions paid?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Commissions are reviewed manually after referral attribution and customer quality checks. Approved payouts can be recorded for M-Pesa, bank transfer, or other agreed payment methods depending on the affiliate country and Netily approval.",
      },
    },
  ],
}

const affiliateProgramSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Internetily Affiliate Program",
  alternateName: ["Netily Affiliate Program", "Internetily Partner Network", "Netily Partner Network"],
  serviceType: "B2B SaaS affiliate program for ISP billing software referrals",
  url: "https://netily.co.ke/affiliate",
  provider: {
    "@type": "Organization",
    name: "Internetily",
    alternateName: "Netily",
    url: "https://netily.co.ke",
  },
  areaServed: [
    { "@type": "Country", name: "Kenya" },
    { "@type": "Country", name: "Uganda" },
    { "@type": "Country", name: "Tanzania" },
    { "@type": "Country", name: "South Africa" },
    { "@type": "Country", name: "Nigeria" },
    { "@type": "Country", name: "Ghana" },
    { "@type": "AdministrativeArea", name: "Worldwide" },
  ],
  audience: {
    "@type": "Audience",
    audienceType: "ISP consultants, MikroTik engineers, WISP operators, hotspot resellers, telecom creators, B2B SaaS affiliates, and network installers",
  },
  termsOfService: "https://netily.co.ke/terms",
}

export const metadata: Metadata = {
  title: "Best ISP Affiliate Program 2026 | Internetily & Netily Partner Network",
  description:
    "Join the Internetily / Netily Affiliate Program for 2026. Refer ISPs, WISPs, hotspot operators, MikroTik teams, and fiber providers worldwide and track qualified leads from one partner dashboard.",
  keywords: [
    "best affiliate program 2026",
    "best isp affiliate program 2026",
    "best b2b saas affiliate program 2026",
    "global affiliate program for isp software",
    "worldwide isp affiliate program",
    "international affiliate program for telecom software",
    "internetily affiliate program",
    "internetily partner network",
    "isp affiliate program kenya",
    "isp affiliate program uganda",
    "isp affiliate program tanzania",
    "isp affiliate program south africa",
    "isp affiliate program nigeria",
    "isp affiliate program ghana",
    "earn money referring isps nigeria",
    "earn money referring isps",
    "earn money referring internet providers",
    "refer internet service providers",
    "isp billing software affiliate",
    "isp management software affiliate program",
    "mikrotik affiliate program lagos",
    "mikrotik affiliate program",
    "mikrotik consultant referral program",
    "wisp referral program africa",
    "wisp affiliate program worldwide",
    "hotspot billing affiliate program",
    "m-pesa hotspot affiliate",
    "best isp affiliate network nairobi",
    "best isp affiliate network africa",
    "netily affiliate",
    "netily partner program",
    "make money online kenya tech",
    "b2b saas affiliate program africa",
  ],
  alternates: {
    canonical: "https://netily.co.ke/affiliate",
  },
  openGraph: {
    title: "Best ISP Affiliate Program 2026 | Internetily & Netily",
    description:
      "Refer ISPs, WISPs, hotspot operators, MikroTik teams, and fiber providers worldwide through the Internetily / Netily affiliate program.",
    url: "https://netily.co.ke/affiliate",
    siteName: "Internetily",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Internetily Netily Affiliate Program" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Internetily / Netily Affiliate Program 2026",
    description: "A global ISP billing software affiliate program for partners who refer ISPs, WISPs, hotspot operators, and MikroTik teams.",
    images: ["/og-image.svg"],
  },
}

export default function AffiliateLandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(affiliateProgramSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(affiliateFaqSchema) }}
      />
      <AffiliateLandingClient />
    </>
  )
}
