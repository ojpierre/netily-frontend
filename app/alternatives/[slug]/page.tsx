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
    <main className="public-site min-h-screen bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
          <Link href="/alternatives" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-white">
            ISP billing alternatives
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
                Informational comparison
              </p>
              <h1 className="mt-4 text-4xl font-normal tracking-tight md:text-6xl">{page.headline}</h1>
              <p className="mt-5 text-lg leading-relaxed text-zinc-400">{page.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/#contact" className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
                  Compare your workflow
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/demo" className="inline-flex items-center gap-2 border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-amber-500/60 hover:text-amber-200">
                  Request demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <aside className="border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm font-semibold text-white">Search terms this page supports</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {page.searchNames.map((name) => (
                  <span key={name} className="border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-semibold text-zinc-300">
                    {name}
                  </span>
                ))}
              </div>
              <div className="mt-6 border border-zinc-800 bg-zinc-950 p-4 text-sm leading-relaxed text-zinc-400">
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
              <article key={item.label} className="border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex h-11 w-11 items-center justify-center bg-amber-500 text-black">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-base font-medium text-white">{item.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-900 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
              Why Internetily should be on the shortlist
            </p>
            <h2 className="mt-3 text-3xl font-normal tracking-tight md:text-4xl">
              More than billing: a growth operating system for ISPs
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              {page.netilyAngle}
            </p>
          </div>

          <div className="mt-8 overflow-hidden border border-zinc-800 bg-zinc-950">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-4 font-bold">Area</th>
                  <th className="px-5 py-4 font-bold">How Internetily helps</th>
                </tr>
              </thead>
              <tbody>
                {alternativeFeatureRows.map(([area, detail]) => (
                  <tr key={area} className="border-t border-zinc-800">
                    <td className="px-5 py-4 font-semibold text-white">{area}</td>
                    <td className="px-5 py-4 text-zinc-400">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 border border-amber-500/30 bg-amber-500 p-8 text-black md:p-10">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-normal tracking-tight md:text-3xl">Turn comparison traffic into qualified ISP leads</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/70">
                  Internetily gives prospects a clear path from Google search to demo, trial, onboarding, M-Pesa setup, MikroTik connection, and active subscriber billing.
                </p>
              </div>
              <Link href="/#contact" className="inline-flex items-center justify-center gap-2 bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-900">
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
                  className="flex items-start gap-3 border border-zinc-800 bg-zinc-950 p-4 text-sm transition hover:border-amber-500/50"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    Also compare Internetily with <strong>{item.competitor}</strong>
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  )
}
