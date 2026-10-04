import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { caseStudies } from "@/lib/case-studies"

export const metadata: Metadata = {
  title: "ISP Billing Case Studies | Internetily",
  description:
    "Explore Internetily case studies for ISP billing, hotspot renewals, altnet support, revenue visibility, customer growth, and broadband operations.",
  alternates: { canonical: "https://netily.co.ke/case-studies" },
  openGraph: {
    title: "ISP Billing Case Studies | Internetily",
    description:
      "Example ISP, WISP, hotspot, and altnet case studies showing billing, renewal, support, and customer growth workflows.",
    url: "https://netily.co.ke/case-studies",
    images: [{ url: caseStudies[0]?.image || "/og-image.svg", width: 1536, height: 864, alt: "Internetily case studies" }],
  },
}

export default function CaseStudiesIndexPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-zinc-800 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-300">Internetily case studies</p>
          <h1 className="mt-6 max-w-4xl text-balance text-4xl font-normal leading-tight md:text-6xl">
            Example wins from ISP billing, support, renewals, and revenue visibility.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            See how different ISP teams can use Internetily to connect payments, customers, network access, support, and growth workflows.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 md:px-12 lg:grid-cols-3 lg:px-16">
          {caseStudies.map((study) => (
            <Link key={study.slug} href={`/case-studies/${study.slug}`} className="group overflow-hidden border border-zinc-800 bg-zinc-900 transition hover:border-zinc-600">
              <div className="relative aspect-[4/3] overflow-hidden border-b border-zinc-800">
                <Image src={study.image} alt={study.imageAlt} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover opacity-80 transition group-hover:scale-105 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/15 to-transparent" />
              </div>
              <div className="p-6">
                <p className="text-sm uppercase tracking-[0.22em] text-amber-300">{study.region}</p>
                <h2 className="mt-4 text-2xl font-normal leading-tight">{study.title}</h2>
                <p className="mt-4 text-sm leading-6 text-zinc-400">{study.summary}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-400">
                  Read case study
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
