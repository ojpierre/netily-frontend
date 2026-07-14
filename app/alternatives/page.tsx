import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Search } from "lucide-react"
import { alternativePages } from "@/lib/alternatives-data"

export const metadata: Metadata = {
  title: "ISP Billing Software Alternatives Kenya | Internetily",
  description:
    "Informational comparison hub for Kenyan ISPs evaluating ISP billing software, M-Pesa workflows, MikroTik automation, PPPoE, hotspot billing, and team controls.",
  keywords: [
    "Centipid Billing alternative",
    "ISP Man alternative",
    "Wisp Man alternative",
    "Jasiyo alternative",
    "Pawanet alternative",
    "Lipanet alternative",
    "ISP billing software alternatives Kenya",
    "M-Pesa ISP billing software",
    "Internetily alternatives",
    "Netily alternatives",
  ],
  alternates: {
    canonical: "https://netily.co.ke/alternatives",
  },
  openGraph: {
    title: "ISP Billing Software Alternatives Kenya | Internetily",
    description:
      "Informational comparison hub for Kenyan and East African ISPs that need M-Pesa, MikroTik, PPPoE, hotspot billing, and team controls.",
    url: "https://netily.co.ke/alternatives",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Internetily ISP billing alternatives" }],
  },
}

export default function AlternativesPage() {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ISP Billing Software Alternatives Kenya",
    url: "https://netily.co.ke/alternatives",
    description:
      "Informational comparison hub for Kenyan ISPs evaluating ISP billing software alternatives and Internetily, formerly Netily.",
    mainEntity: alternativePages.map((page) => ({
      "@type": "WebPage",
      name: page.metaTitle,
      url: `https://netily.co.ke/alternatives/${page.slug}`,
      about: page.competitor,
    })),
  }

  return (
    <main className="public-site min-h-screen bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <section className="relative overflow-hidden border-b border-zinc-800 px-4 py-20 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 result=%22noise%22 /></filter><rect width=%22100%22 height=%22100%22 filter=%22url(%23noise)%22 fill=%22%23ffffff%22/></svg>')",
          }}
        />
        <div className="relative mx-auto max-w-6xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-white">
            Back to Internetily
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200">
                <Search className="h-4 w-4" />
                Informational comparison hub
              </div>
              <h1 className="mt-6 text-4xl font-normal tracking-tight md:text-6xl">
                ISP billing software alternatives for Kenyan ISPs
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
                If your team is comparing ISP systems, use these pages as a neutral checklist for operator outcomes:
                faster collections, cleaner subscriber control, stronger roles, support visibility, and lead conversion.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/#contact" className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
                  Talk to Internetily
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/blog/isp-billing-software-kenya-2026" className="inline-flex items-center gap-2 border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-amber-500/60 hover:text-amber-200">
                  Read buyer guide
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm font-medium text-white">What to evaluate</p>
              <div className="mt-5 space-y-4">
                {[
                  "M-Pesa STK Push and payment-aware subscriber workflows",
                  "MikroTik PPPoE, hotspot, and RADIUS operations",
                  "Staff permissions, dashboards, leads, and support controls",
                  "Customer self-service, reminders, invoices, and receipts",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 border-t border-zinc-800 pt-5 text-xs leading-6 text-zinc-500">
                Competitor names are retained for search intent and buyer education, while the visible copy focuses on practical feature fit and implementation quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">Compare options</p>
              <h2 className="mt-3 text-3xl font-normal tracking-tight md:text-4xl">Alternative pages built for search intent</h2>
            </div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {alternativePages.map((page) => (
              <Link
                key={page.slug}
                href={`/alternatives/${page.slug}`}
                className="group border border-zinc-800 bg-zinc-900 p-6 transition hover:-translate-y-1 hover:border-amber-500/50"
              >
                <p className="text-sm font-semibold text-amber-300">{page.competitor}</p>
                <h3 className="mt-3 text-xl font-medium tracking-tight text-white group-hover:text-amber-200">
                  {page.headline}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{page.intro}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-300">
                  Read comparison
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
