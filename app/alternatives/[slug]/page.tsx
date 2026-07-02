import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check, CircleDollarSign, LayoutDashboard, ShieldCheck, Users, Wifi } from "lucide-react"
import { alternativeFeatureRows, alternativePages, getAlternativePage } from "@/lib/alternatives-data"

export function generateStaticParams() {
  return alternativePages.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = getAlternativePage(slug)
  if (!page) return {}

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: {
      canonical: `https://netily.co.ke/alternatives/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `https://netily.co.ke/alternatives/${page.slug}`,
      images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: page.metaTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
      images: ["/og-image.svg"],
    },
  }
}

export default async function AlternativeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = getAlternativePage(slug)
  if (!page) notFound()

  const pageUrl = `https://netily.co.ke/alternatives/${page.slug}`
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metaTitle,
    description: page.metaDescription,
    url: pageUrl,
    about: [
      { "@type": "SoftwareApplication", name: "Netily", applicationCategory: "BusinessApplication" },
      { "@type": "Thing", name: page.competitor },
    ],
    mentions: page.searchNames.map((name) => ({ "@type": "Thing", name })),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://netily.co.ke" },
        { "@type": "ListItem", position: 2, name: "Alternatives", item: "https://netily.co.ke/alternatives" },
        { "@type": "ListItem", position: 3, name: page.competitor, item: pageUrl },
      ],
    },
  }

  const highlights = [
    { icon: CircleDollarSign, label: "M-Pesa-first billing", text: "Payment prompts, receipts, reminders, and billing-cycle visibility." },
    { icon: Wifi, label: "PPPoE and hotspot workflows", text: "Built around MikroTik, RADIUS, subscriber state, and access control." },
    { icon: Users, label: "Growth and lead management", text: "Capture prospects, follow up faster, and turn interest into active tenants." },
    { icon: LayoutDashboard, label: "Operator-grade dashboard", text: "Dashboard themes, current-cycle estimates, breakdowns, and admin clarity." },
    { icon: ShieldCheck, label: "Staff role edits", text: "Delegate work with clearer permissions and safer team operations." },
  ]

  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/25" />
        <div className="relative mx-auto max-w-6xl">
          <Link href="/alternatives" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
            ISP billing alternatives
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
                {page.competitor} comparison
              </p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl">{page.headline}</h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-400">{page.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/#contact" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
                  Compare your workflow
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/demo" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
                  Request demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <aside className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/90">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Search terms this page supports</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {page.searchNames.map((name) => (
                  <span key={name} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {name}
                  </span>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                {page.bestFor}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {highlights.map((item) => (
              <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-base font-bold">{item.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 dark:bg-slate-900/50 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
              Why Netily should be on the shortlist
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              More than billing: a growth operating system for ISPs
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              {page.netilyAngle}
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-bold">Area</th>
                  <th className="px-5 py-4 font-bold">How Netily helps</th>
                </tr>
              </thead>
              <tbody>
                {alternativeFeatureRows.map(([area, detail]) => (
                  <tr key={area} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{area}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 rounded-[28px] bg-blue-600 p-8 text-white md:p-10">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Turn comparison traffic into qualified ISP leads</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100">
                  Netily gives prospects a clear path from Google search to demo, trial, onboarding, M-Pesa setup, MikroTik connection, and active subscriber billing.
                </p>
              </div>
              <Link href="/#contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                Start conversation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {alternativePages
              .filter((item) => item.slug !== page.slug)
              .slice(0, 4)
              .map((item) => (
                <Link
                  key={item.slug}
                  href={`/alternatives/${item.slug}`}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-blue-950/20"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                  <span>
                    Also compare Netily with <strong>{item.competitor}</strong>
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  )
}
