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
    description: "ISP billing and management workflows for Ugandan fiber, wireless, and hotspot operators expanding subscriber operations.",
    eyebrow: "Uganda ISP growth",
    hero: "Run billing, subscribers, staff roles, reminders, and network-linked operations from one ISP platform built for East African growth.",
    summary: "Netily helps Ugandan ISPs organize subscriber billing, payment follow-up, MikroTik operations, support tickets, staff permissions, and lead conversion without stitching together spreadsheets and disconnected tools.",
    bullets: [
      "Manage PPPoE, hotspot, and subscriber lifecycle workflows",
      "Track leads, support, reminders, and billing activity in one place",
      "Support regional growth with local East African operating context",
    ],
    seoTitle: "ISP Billing Software Uganda | Netily",
    seoDescription: "Netily helps Ugandan ISPs manage billing, subscribers, MikroTik workflows, hotspot operations, staff roles, support, and organic growth leads.",
  },
  "isp-billing-software-tanzania": {
    title: "ISP Billing Software Tanzania",
    description: "ISP management software for Tanzanian WISPs, fiber operators, hotspot providers, and growing internet businesses.",
    eyebrow: "Tanzania ISP operations",
    hero: "Bring billing, customers, routers, hotspot access, and team workflows into one platform for Tanzanian ISP growth.",
    summary: "Netily supports Tanzanian ISPs with a practical operating layer for recurring billing, MikroTik-aware subscriber workflows, customer support, staff permissions, dashboard visibility, and sales lead handling.",
    bullets: [
      "Unify customers, payments, support, and router-linked operations",
      "Use staff roles and dashboards to keep teams accountable",
      "Build an organic lead funnel from search to demo to onboarding",
    ],
    seoTitle: "ISP Billing Software Tanzania | Netily",
    seoDescription: "Netily is ISP billing software for Tanzania with subscriber management, MikroTik workflows, hotspot operations, staff roles, support, and lead capture.",
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
      <main className="min-h-screen bg-white px-4 py-24 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Not found</p>
          <h1 className="mt-4 text-4xl font-bold">Solution page unavailable</h1>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-primary dark:text-primary/80">
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

  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-blue-950/30 dark:via-slate-950 dark:to-slate-950" />
        <div className="relative mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary dark:border-primary/20 dark:bg-blue-950/40 dark:text-primary/60">
            <HeroIcon className="h-4 w-4" />
            {solution.eyebrow}
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight md:text-6xl">
            {solution.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            {solution.hero}
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/90">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{solution.summary}</p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">What this page covers</p>
              <div className="mt-4 space-y-3">
                {solution.bullets.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
            >
              Talk to Netily
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary dark:text-primary/80"
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
