import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Search, TrendingUp } from "lucide-react"
import { alternativePages } from "@/lib/alternatives-data"

export const metadata: Metadata = {
  title: "ISP Billing Software Alternatives Kenya | Netily",
  description:
    "Compare Netily with ISP billing software alternatives searched by Kenyan ISPs, including Centipid Billing, ISP Man, Wisp Man, Jasiyo, Pawanet, and Lipanet.",
  keywords: [
    "Centipid Billing alternative",
    "ISP Man alternative",
    "Wisp Man alternative",
    "Jasiyo alternative",
    "Pawanet alternative",
    "Lipanet alternative",
    "ISP billing software alternatives Kenya",
    "M-Pesa ISP billing software",
  ],
  alternates: {
    canonical: "https://netily.co.ke/alternatives",
  },
  openGraph: {
    title: "ISP Billing Software Alternatives Kenya | Netily",
    description:
      "Compare Netily with ISP billing alternatives for Kenyan and East African ISPs that need M-Pesa, MikroTik, PPPoE, hotspot billing, and team controls.",
    url: "https://netily.co.ke/alternatives",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Netily ISP billing alternatives" }],
  },
}

export default function AlternativesPage() {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ISP Billing Software Alternatives Kenya",
    url: "https://netily.co.ke/alternatives",
    description:
      "Comparison hub for Kenyan ISPs evaluating ISP billing software alternatives and Netily.",
    mainEntity: alternativePages.map((page) => ({
      "@type": "WebPage",
      name: page.metaTitle,
      url: `https://netily.co.ke/alternatives/${page.slug}`,
      about: page.competitor,
    })),
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-emerald-50 dark:from-blue-950/30 dark:via-slate-950 dark:to-slate-950" />
        <div className="relative mx-auto max-w-6xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
            Back to Netily
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm dark:border-blue-900 dark:bg-slate-900/80 dark:text-blue-300">
                <Search className="h-4 w-4" />
                Organic growth comparison hub
              </div>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl">
                ISP billing software alternatives for Kenyan ISPs
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                If your team is comparing Centipid Billing, ISP Man, Wisp Man, Jasiyo, Pawanet, Lipanet, or other ISP systems, use these pages to judge Netily by practical operator outcomes: faster collections, cleaner subscriber control, stronger roles, and better lead conversion.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/#contact" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
                  Talk to Netily
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/blog/isp-billing-software-kenya-2026" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
                  Read buyer guide
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/90">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Why compare Netily?</p>
              <div className="mt-5 space-y-4">
                {[
                  "M-Pesa STK Push and payment-aware subscriber workflows",
                  "MikroTik PPPoE, hotspot, and RADIUS operations",
                  "Dashboard themes, staff role edits, and permission-aware admin tools",
                  "Lead capture, support tickets, reminders, and customer self-service",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Compare options</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Alternative pages built for search intent</h2>
            </div>
            <TrendingUp className="hidden h-10 w-10 text-blue-500 md:block" />
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {alternativePages.map((page) => (
              <Link
                key={page.slug}
                href={`/alternatives/${page.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">{page.competitor}</p>
                <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-300">
                  {page.headline}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{page.intro}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Compare with Netily
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
