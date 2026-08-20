import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Check, Globe, Router, TrendingUp, Wifi } from "lucide-react"

type SolutionConfig = {
  title: string
  description: string
  eyebrow: string
  hero: string
  summary: string
  bullets: string[]
  paymentGateways?: string[]
  marketNotes?: string[]
  localUseCases?: string[]
  seoTitle: string
  seoDescription: string
}

const SOLUTIONS: Record<string, SolutionConfig> = {
  "isp-billing-software-kenya": {
    title: "ISP Billing Software Kenya",
    description: "Billing software for Kenyan fiber and broadband ISPs with M-Pesa collections, automated invoicing, and subscriber lifecycle workflows.",
    eyebrow: "Fiber and broadband operations",
    hero: "Run Kenyan ISP billing from payment collection to subscriber state changes without juggling disconnected tools.",
    summary: "Netily helps fiber and fixed broadband operators manage recurring plans, payment events, invoices, suspensions, and reconnections in one platform built for local ISP operations.",
    bullets: [
      "Automate M-Pesa collections and recurring billing cycles",
      "Keep subscriber, invoice, and service status in one workflow",
      "Reduce manual reconnection and follow-up work for your team",
    ],
    seoTitle: "ISP Billing Software Kenya | Netily",
    seoDescription: "Netily is ISP billing software for Kenya with M-Pesa automation, invoicing, subscriber management, and operational workflows for growing ISPs.",
  },
  "hotspot-billing-software-kenya": {
    title: "Hotspot Billing Software Kenya",
    description: "Manage captive portals, hotspot sessions, micropayments, and vouchers with a workflow shaped for Kenyan Wi-Fi operators.",
    eyebrow: "Hotspot providers",
    hero: "Launch branded hotspot billing with payment collection, user sessions, and access control in one place.",
    summary: "Netily gives hotspot operators a cleaner way to run Wi-Fi access sales, branded captive portals, session control, and customer communication without piecing together multiple systems.",
    bullets: [
      "Branded captive portal workflows for hotspot access",
      "Voucher, session, and user-state management in one tool",
      "Payment-aware hotspot operations for day-to-day control",
    ],
    seoTitle: "Hotspot Billing Software Kenya | Netily",
    seoDescription: "Netily helps Kenyan hotspot operators manage captive portals, vouchers, session control, and payment-linked hotspot billing workflows.",
  },
  "mikrotik-billing-software": {
    title: "MikroTik Billing Software",
    description: "MikroTik-aware billing and subscriber operations for PPPoE, hotspot, and router-linked internet service workflows.",
    eyebrow: "MikroTik workflows",
    hero: "Bring MikroTik provisioning, billing, and subscriber management into one operating layer.",
    summary: "Netily is designed for operators who rely on MikroTik for PPPoE or hotspot delivery and want payment events, provisioning logic, and customer service flow to stay aligned.",
    bullets: [
      "PPPoE and hotspot workflows built with MikroTik operations in mind",
      "Fewer manual subscriber state changes after payment updates",
      "Operational visibility across routers, sessions, and collections",
    ],
    seoTitle: "MikroTik Billing Software | Netily",
    seoDescription: "Netily offers MikroTik billing software for PPPoE and hotspot operators with subscriber automation, billing workflows, and operational visibility.",
  },
  "mpesa-isp-billing": {
    title: "M-Pesa ISP Billing",
    description: "M-Pesa-first ISP billing for operators who want a tighter payment-to-service workflow across subscriber operations.",
    eyebrow: "Mobile money billing",
    hero: "Collect payments through M-Pesa and keep service activation close to the actual billing event.",
    summary: "Netily is built for East African ISPs that need M-Pesa-linked billing operations, payment-aware follow-up, and cleaner visibility into collection and service status.",
    bullets: [
      "Payment collection workflows designed around M-Pesa habits",
      "Reduce lag between payment confirmation and subscriber action",
      "Track collections in the same system as ISP operations",
    ],
    seoTitle: "M-Pesa ISP Billing Software | Netily",
    seoDescription: "Netily gives Kenyan and East African ISPs an M-Pesa-first billing workflow for collections, subscriber status, and operational follow-up.",
  },
  "isp-billing-software-uganda": {
    title: "ISP Billing Software Uganda",
    description: "ISP billing and management workflows for Ugandan fiber, wireless, and hotspot operators using MTN MoMo, Airtel Money, card, and mobile-money collection flows.",
    eyebrow: "Uganda ISP growth",
    hero: "Run billing, subscribers, staff roles, reminders, and network-linked operations from one ISP platform shaped for Ugandan operators.",
    summary: "Netily helps Ugandan ISPs organize subscriber billing, payment follow-up, MikroTik operations, support tickets, staff permissions, and lead conversion without stitching together spreadsheets and disconnected tools. It is a practical fit for Kampala, Wakiso, Entebbe, Jinja, Mbarara, Gulu, and regional WISPs that need cleaner collection visibility.",
    bullets: [
      "Manage PPPoE, hotspot, and subscriber lifecycle workflows",
      "Track leads, support, reminders, and billing activity in one place",
      "Support MTN MoMo, Airtel Money, cards, and gateway-led mobile-money reconciliation planning",
    ],
    paymentGateways: ["MTN MoMo", "Airtel Money Uganda", "Flutterwave Uganda Mobile Money", "Pesapal", "Card and bank transfer workflows"],
    marketNotes: [
      "Use mobile-money-first payment prompts for residential broadband customers who already pay utilities from a phone.",
      "Keep payment status, reconnection work, and support follow-up close together so field teams do not depend on manual chat screenshots.",
      "Plan gateways around settlement needs, webhook availability, reversal handling, and how quickly paid customers should regain access.",
    ],
    localUseCases: ["Kampala apartment ISPs", "Wakiso WISPs", "Campus Wi-Fi", "Estate broadband", "Public hotspot operators"],
    seoTitle: "ISP Billing Software Uganda | MTN MoMo, Airtel Money & MikroTik | Netily",
    seoDescription: "Netily helps Ugandan ISPs manage billing, MTN MoMo and Airtel Money workflows, MikroTik, hotspot operations, staff roles, support, and growth leads.",
  },
  "isp-billing-software-tanzania": {
    title: "ISP Billing Software Tanzania",
    description: "ISP management software for Tanzanian WISPs, fiber operators, hotspot providers, and growing internet businesses using M-Pesa, Tigo Pesa, Airtel Money, cards, and mobile money gateways.",
    eyebrow: "Tanzania ISP operations",
    hero: "Bring billing, customers, routers, hotspot access, and team workflows into one platform for Tanzanian ISP growth.",
    summary: "Netily supports Tanzanian ISPs with a practical operating layer for recurring billing, MikroTik-aware subscriber workflows, customer support, staff permissions, dashboard visibility, and sales lead handling. It works well for Dar es Salaam, Arusha, Mwanza, Dodoma, Zanzibar, Moshi, and regional broadband teams comparing mobile-money-friendly ISP software.",
    bullets: [
      "Unify customers, payments, support, and router-linked operations",
      "Use staff roles and dashboards to keep teams accountable",
      "Plan collections around M-Pesa, Airtel Money, Tigo Pesa, cards, and regional gateway options",
    ],
    paymentGateways: ["Vodacom M-Pesa Tanzania", "Airtel Money Tanzania", "Tigo Pesa", "Flutterwave Tanzania Mobile Money", "Pesapal", "Visa and Mastercard cards"],
    marketNotes: [
      "Match payment prompts to local wallet habits so customers can pay from the channel they already trust.",
      "Keep hotspot revenue, PPPoE subscriptions, invoices, and customer state changes visible from one operating dashboard.",
      "Use gateway webhooks and transaction references to reduce manual reconciliation after busy evening and weekend payment periods.",
    ],
    localUseCases: ["Dar es Salaam fiber ISPs", "Arusha WISPs", "Zanzibar hospitality Wi-Fi", "Mwanza estates", "Campus and hostel hotspot billing"],
    seoTitle: "ISP Billing Software Tanzania | M-Pesa, Tigo Pesa, Airtel Money & MikroTik | Netily",
    seoDescription: "Netily is ISP billing software for Tanzania with M-Pesa, Tigo Pesa, Airtel Money planning, subscriber management, MikroTik, hotspot billing, support, and lead capture.",
  },
  "isp-billing-software-south-africa": {
    title: "ISP Billing Software South Africa",
    description: "ISP billing and subscriber management software for South African fiber, WISP, hotspot, estate, and managed Wi-Fi operators using EFT, cards, QR, and gateway payment flows.",
    eyebrow: "South Africa ISP operations",
    hero: "Give South African ISPs a cleaner operating layer for billing, subscribers, routers, support, payments, and recurring service visibility.",
    summary: "Netily helps South African ISPs and managed Wi-Fi teams organize customer records, billing cycles, MikroTik-linked operations, hotspot access, staff roles, and support follow-up. It is positioned for operators serving Johannesburg, Pretoria, Cape Town, Durban, Gqeberha, Bloemfontein, estates, student accommodation, and regional WISPs.",
    bullets: [
      "Manage PPPoE, hotspot, invoices, payments, support, and staff access from one dashboard",
      "Plan payment workflows around Instant EFT, PayShap, cards, QR payments, and bank transfer reconciliation",
      "Keep enterprise, estate, campus, and public Wi-Fi operations visible as subscriber counts grow",
    ],
    paymentGateways: ["Payfast by Network", "Ozow Pay by Bank", "Peach Payments", "PayShap Request", "Cards, Instant EFT, QR, and bank transfer workflows"],
    marketNotes: [
      "South African customers often expect card, EFT, QR, and bank-backed options, so gateway choice should match both online checkout and reconciliation needs.",
      "Estate and campus operators benefit from separating subscriber status, invoice state, support requests, and router actions without creating more spreadsheets.",
      "For larger ISPs, gateway reporting, settlement exports, refunds, and audit trails matter as much as the checkout screen.",
    ],
    localUseCases: ["Johannesburg WISPs", "Cape Town managed Wi-Fi", "Durban apartment internet", "Estate broadband", "Student accommodation networks"],
    seoTitle: "ISP Billing Software South Africa | Payfast, Ozow, EFT & MikroTik | Netily",
    seoDescription: "Netily helps South African ISPs manage billing, subscribers, MikroTik, hotspot access, support, staff roles, and payment workflows for Payfast, Ozow, EFT, cards, and QR.",
  },
  "isp-billing-software-rwanda": {
    title: "ISP Billing Software Rwanda",
    description: "ISP billing and customer management platform for Rwandan broadband, WISP, campus WiFi, and hotspot operators.",
    eyebrow: "Rwanda ISP management",
    hero: "Give your Rwanda ISP a cleaner system for billing, subscriber access, staff work, support, and growth follow-up.",
    summary: "Netily helps Rwandan ISPs manage customer records, billing cycles, MikroTik-linked operations, hotspot workflows, support tickets, staff permissions, and lead conversion from one hosted system.",
    bullets: [
      "Track billing cycles, customers, routers, and support together",
      "Improve operations with role-based team controls",
      "Capture and qualify leads from organic search and referrals",
    ],
    seoTitle: "ISP Billing Software Rwanda | Netily",
    seoDescription: "Netily helps Rwanda ISPs manage billing, subscriber workflows, MikroTik operations, hotspot access, support tickets, staff roles, and growth leads.",
  },
  "isp-billing-software-burundi": {
    title: "ISP Billing Software Burundi",
    description: "ISP management software for Burundi internet operators who need billing, subscribers, routers, support, and growth workflows.",
    eyebrow: "Burundi ISP growth",
    hero: "A modern ISP operating platform for Burundi teams managing subscribers, billing, support, routers, and customer growth.",
    summary: "Netily gives Burundi ISPs a single place to organize plans, customers, recurring billing activity, MikroTik-aware operations, hotspot access, staff permissions, and sales enquiries.",
    bullets: [
      "Manage ISP customers, plans, billing cycles, and support activity",
      "Keep router-linked subscriber actions closer to payment status",
      "Create a clearer path from lead enquiry to active customer",
    ],
    seoTitle: "ISP Billing Software Burundi | Netily",
    seoDescription: "Netily provides ISP billing software for Burundi with customer management, billing workflows, MikroTik operations, hotspot access, staff roles, and lead capture.",
  },
  "isp-billing-software-south-sudan": {
    title: "ISP Billing Software South Sudan",
    description: "ISP billing and operations software for South Sudan broadband, WISP, hotspot, and community internet providers.",
    eyebrow: "South Sudan ISP operations",
    hero: "Manage billing, subscribers, routers, support, and staff operations as your South Sudan ISP grows.",
    summary: "Netily helps South Sudan ISPs move from manual billing and scattered follow-up into a more organized system for customers, plans, support tickets, staff permissions, and MikroTik-aware workflows.",
    bullets: [
      "Coordinate customers, plans, billing activity, and support follow-up",
      "Use operational dashboards to reduce manual blind spots",
      "Build lead generation pages that convert search traffic into demos",
    ],
    seoTitle: "ISP Billing Software South Sudan | Netily",
    seoDescription: "Netily helps South Sudan ISPs manage billing, customers, MikroTik workflows, hotspot operations, support tickets, staff roles, and growth leads.",
  },
  "isp-billing-software-nairobi": {
    title: "ISP Billing Software Nairobi",
    description: "ISP billing and WiFi management for Nairobi enterprise ISPs, co-working spaces, hotels, apartments, estates, campuses, and office networks.",
    eyebrow: "Nairobi enterprise ISP growth",
    hero: "Manage Nairobi ISP billing, enterprise WiFi, co-working access, hotel internet, staff roles, and customer support from one operating system.",
    summary: "Netily helps Nairobi operators serve enterprise ISPs, co-working spaces, hotels, apartments, malls, student hostels, and residential estates with M-Pesa-first billing, MikroTik workflows, hotspot access, customer portals, reminders, and support tickets.",
    bullets: [
      "Enterprise ISP billing for Nairobi offices, estates, schools, and managed WiFi teams",
      "Co-working and hotel WiFi workflows with hotspot access, vouchers, and support visibility",
      "Lead capture and follow-up for Nairobi buyers comparing ISP software and WiFi billing tools",
    ],
    seoTitle: "ISP Billing Software Nairobi | Enterprise ISPs, Hotels & Co-working | Netily",
    seoDescription: "Netily helps Nairobi enterprise ISPs, hotels, co-working spaces, apartments, estates, and campuses manage billing, M-Pesa payments, MikroTik, hotspot access, and support.",
  },
  "isp-billing-software-mombasa": {
    title: "ISP Billing Software Mombasa",
    description: "ISP billing and hotspot management for Mombasa tourist hotels, beach resorts, apartments, restaurants, public WiFi, and coastal WISPs.",
    eyebrow: "Mombasa hotel and resort WiFi",
    hero: "Run Mombasa ISP billing, resort WiFi, hotel captive portals, apartment internet, and coastal hotspot operations in one place.",
    summary: "Netily helps Mombasa and coastal operators manage tourist hotels, beach resorts, apartments, restaurants, public hotspots, and WISP subscribers with billing cycles, M-Pesa payments, MikroTik workflows, vouchers, reminders, and support tickets.",
    bullets: [
      "Hotel and beach resort WiFi billing with captive portal and voucher workflows",
      "Apartment and residential internet billing for coastal property operators",
      "M-Pesa-first collections and support workflows for Mombasa ISPs and hotspot teams",
    ],
    seoTitle: "ISP Billing Software Mombasa | Hotels, Beach Resorts & Apartments | Netily",
    seoDescription: "Netily helps Mombasa hotels, beach resorts, apartments, coastal WISPs, and hotspot operators manage ISP billing, M-Pesa payments, MikroTik, vouchers, and support.",
  },
  "isp-billing-software-kisumu": {
    title: "ISP Billing Software Kisumu",
    description: "ISP billing software for Kisumu regional WISPs, student hostels, campuses, estates, hotspots, and Lake Victoria broadband operators.",
    eyebrow: "Kisumu WISP and hostel internet",
    hero: "Support Kisumu WISPs, student hostels, estates, and campus WiFi with cleaner billing, access control, and customer follow-up.",
    summary: "Netily helps Kisumu ISPs and Lake Region operators manage regional WISP customers, student hostels, campus WiFi, apartment internet, hotspot access, payment reminders, support tickets, and MikroTik-linked subscriber workflows.",
    bullets: [
      "Regional WISP billing for Kisumu, Lake Victoria towns, and nearby counties",
      "Student hostel and campus WiFi billing with vouchers, self-service, and support visibility",
      "Router-linked subscriber workflows for PPPoE, hotspot, and recurring internet plans",
    ],
    seoTitle: "ISP Billing Software Kisumu | WISPs, Student Hostels & Campus WiFi | Netily",
    seoDescription: "Netily helps Kisumu WISPs, student hostels, campuses, estates, and hotspot operators manage billing, M-Pesa payments, MikroTik, vouchers, and support.",
  },
  "isp-billing-software-eldoret": {
    title: "ISP Billing Software Eldoret",
    description: "ISP billing and network operations for Eldoret agricultural businesses, retail chains, estates, WISPs, and growing broadband operators.",
    eyebrow: "Eldoret agriculture and retail networks",
    hero: "Manage Eldoret ISP billing, agricultural business connectivity, retail chain WiFi, estates, routers, and support from one platform.",
    summary: "Netily helps Eldoret and North Rift internet operators serve agricultural businesses, retail chains, residential estates, hostels, WISPs, and branch networks with recurring billing, M-Pesa collections, MikroTik workflows, support tickets, and staff permissions.",
    bullets: [
      "Billing workflows for agricultural businesses, branch networks, and rural broadband teams",
      "Retail chain WiFi and customer access management with support and reminders",
      "MikroTik-aware operations for Eldoret WISPs and North Rift ISP teams",
    ],
    seoTitle: "ISP Billing Software Eldoret | Agriculture, Retail Chains & WISPs | Netily",
    seoDescription: "Netily helps Eldoret agricultural businesses, retail chains, WISPs, estates, and broadband operators manage ISP billing, M-Pesa, MikroTik, support, and staff roles.",
  },
  "isp-billing-software-nakuru": {
    title: "ISP Billing Software Nakuru",
    description: "ISP billing software for Nakuru shopping malls, residential complexes, apartments, estates, hotspots, and broadband operators.",
    eyebrow: "Nakuru malls and residential internet",
    hero: "Run Nakuru ISP billing for shopping malls, residential complexes, apartments, estates, hotspots, and growing broadband teams.",
    summary: "Netily helps Nakuru operators manage shopping mall WiFi, residential complex internet, estate networks, apartment billing, hotspots, customer support, reminders, staff roles, and MikroTik-linked subscriber workflows.",
    bullets: [
      "Shopping mall and retail WiFi billing with hotspot and support workflows",
      "Residential complex, apartment, and estate internet billing for recurring subscribers",
      "M-Pesa collections, PPPoE workflows, customer portals, and operational dashboards",
    ],
    seoTitle: "ISP Billing Software Nakuru | Malls, Residential Complexes & Estates | Netily",
    seoDescription: "Netily helps Nakuru malls, residential complexes, apartments, estates, hotspots, and ISPs manage billing, M-Pesa payments, MikroTik, support, and roles.",
  },
  "isp-billing-software-kenya-counties": {
    title: "ISP Billing Software for All Kenya Counties",
    description: "ISP billing and WiFi management for operators serving all 47 counties in Kenya, from major cities to rural WISPs and community networks.",
    eyebrow: "Serving ISPs in all counties",
    hero: "Serve ISP customers across every Kenyan county with one billing, payments, router, hotspot, and support platform.",
    summary: "Netily supports ISPs, WISPs, hotspot operators, hotels, estates, campuses, malls, retail chains, and community networks across all Kenya counties, including Nairobi, Mombasa, Kisumu, Nakuru, Uasin Gishu, Kiambu, Machakos, Kajiado, Kilifi, Meru, Nyeri, Kakamega, Kisii, Bungoma, Kericho, and more.",
    bullets: [
      "County-wide ISP billing for urban, peri-urban, rural, and community internet providers",
      "M-Pesa-first billing, MikroTik workflows, hotspot access, support tickets, and staff roles",
      "Organic lead-generation pages for local searches across Kenya counties and commercial verticals",
    ],
    seoTitle: "ISP Billing Software for All Kenya Counties | Netily",
    seoDescription: "Netily serves ISPs in all Kenya counties with billing, M-Pesa payments, MikroTik workflows, hotspot access, support tickets, staff roles, and lead generation.",
  },
}

export function generateStaticParams() {
  return Object.keys(SOLUTIONS).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const solution = SOLUTIONS[slug]
  if (!solution) {
    return {
      title: "Netily Solutions",
    }
  }

  return {
    title: solution.seoTitle,
    description: solution.seoDescription,
    keywords: [
      solution.title,
      solution.seoTitle,
      "Internetily",
      "Netily",
      "ISP billing software 2026",
      "ISP management software",
      "MikroTik billing software",
      "WISP billing software",
      "hotspot billing software",
      ...(solution.paymentGateways || []),
      ...(solution.localUseCases || []),
    ],
    alternates: {
      canonical: `https://netily.co.ke/solutions/${slug}`,
    },
    openGraph: {
      title: solution.seoTitle,
      description: solution.seoDescription,
      url: `https://netily.co.ke/solutions/${slug}`,
    },
  }
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const solution = SOLUTIONS[slug]

  if (!solution) {
    return (
      <main className="public-site min-h-screen bg-zinc-950 px-4 py-24 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Not found</p>
          <h1 className="mt-4 text-4xl font-normal">Solution page unavailable</h1>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-amber-300">
            Back to homepage
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    )
  }

  const iconMap = {
    "Fiber and broadband operations": Wifi,
    "Hotspot providers": Globe,
    "MikroTik workflows": Router,
    "Mobile money billing": TrendingUp,
  } as const

  const HeroIcon = iconMap[solution.eyebrow as keyof typeof iconMap] || Wifi
  const solutionSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: solution.title,
    alternateName: `${solution.title} by Internetily / Netily`,
    serviceType: "ISP billing software and ISP management platform",
    url: `https://netily.co.ke/solutions/${slug}`,
    description: solution.seoDescription,
    provider: {
      "@type": "Organization",
      name: "Internetily",
      alternateName: "Netily",
      url: "https://netily.co.ke",
    },
    areaServed: solution.title.replace("ISP Billing Software ", "") || "Worldwide",
    availableChannel: (solution.paymentGateways || []).map((gateway) => ({
      "@type": "ServiceChannel",
      name: gateway,
    })),
    audience: {
      "@type": "Audience",
      audienceType: "ISPs, WISPs, hotspot operators, fiber providers, MikroTik teams, and managed Wi-Fi businesses",
    },
  }

  return (
    <main className="public-site min-h-screen bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(solutionSchema) }}
      />
      <section className="relative overflow-hidden border-b border-zinc-800 px-4 py-24 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 result=%22noise%22 /></filter><rect width=%22100%22 height=%22100%22 filter=%22url(%23noise)%22 fill=%22%23ffffff%22/></svg>')",
          }}
        />
        <div className="relative mx-auto max-w-5xl">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-white">
            Back to Internetily
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="inline-flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200">
            <HeroIcon className="h-4 w-4" />
            {solution.eyebrow}
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-normal tracking-tight md:text-6xl">
            {solution.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-400">
            {solution.hero}
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm leading-relaxed text-zinc-400">{solution.summary}</p>
            </div>
            <div className="border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm font-semibold text-white">What we cover</p>
              <div className="mt-4 space-y-3">
                {solution.bullets.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {(solution.paymentGateways?.length || solution.marketNotes?.length || solution.localUseCases?.length) && (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {solution.paymentGateways?.length ? (
                <div className="border border-zinc-800 bg-zinc-900/80 p-6">
                  <p className="text-sm font-semibold text-white">Common payment rails</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {solution.paymentGateways.map((gateway) => (
                      <span key={gateway} className="border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                        {gateway}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {solution.marketNotes?.length ? (
                <div className="border border-zinc-800 bg-zinc-900/80 p-6 lg:col-span-2">
                  <p className="text-sm font-semibold text-white">Local billing details to plan for</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {solution.marketNotes.map((note) => (
                      <p key={note} className="text-sm leading-6 text-zinc-400">
                        {note}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
              {solution.localUseCases?.length ? (
                <div className="border border-zinc-800 bg-zinc-900/80 p-6 lg:col-span-3">
                  <p className="text-sm font-semibold text-white">Built for local ISP scenarios</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {solution.localUseCases.map((useCase) => (
                      <div key={useCase} className="border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300">
                        {useCase}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
          <div className="mt-6 border border-amber-500/20 bg-amber-500/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">GEO summary</p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Internetily, formerly Netily, is an ISP billing and management platform for operators searching for {solution.title.toLowerCase()}, MikroTik billing software, WISP billing software, hotspot billing, payment reconciliation, subscriber management, staff controls, lead capture, and regional ISP automation in 2026.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              Talk to Internetily
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300"
            >
              View pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
