import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, TrendingUp } from "lucide-react"
import { caseStudies, getCaseStudy } from "@/lib/case-studies"

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) return {}

  return {
    title: study.seoTitle,
    description: study.seoDescription,
    keywords: study.keywords,
    alternates: { canonical: `https://netily.co.ke/case-studies/${study.slug}` },
    openGraph: {
      type: "article",
      title: study.seoTitle,
      description: study.seoDescription,
      url: `https://netily.co.ke/case-studies/${study.slug}`,
      images: [{ url: study.image, width: 1536, height: 864, alt: study.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: study.seoTitle,
      description: study.seoDescription,
      images: [study.image],
    },
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) notFound()

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: study.title,
    description: study.seoDescription,
    image: `https://netily.co.ke${study.image}`,
    author: { "@type": "Organization", name: "Internetily" },
    publisher: {
      "@type": "Organization",
      name: "Internetily",
      logo: { "@type": "ImageObject", url: "https://netily.co.ke/internetily-icon-512.png" },
    },
    mainEntityOfPage: `https://netily.co.ke/case-studies/${study.slug}`,
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0">
          <Image src={study.image} alt={study.imageAlt} fill priority sizes="100vw" className="object-cover opacity-55" />
          <div className="absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/72 to-zinc-950/20" />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-zinc-950/25" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-28 md:px-12 lg:px-16 lg:py-36">
          <Link href="/#case-studies" className="inline-flex min-h-12 items-center gap-2 text-sm text-zinc-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to case studies
          </Link>
          <div className="mt-12 max-w-4xl">
            <p className="text-sm uppercase tracking-[0.28em] text-amber-300">{study.region} case study</p>
            <h1 className="mt-5 text-balance text-4xl font-normal leading-tight md:text-6xl">{study.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">{study.subtitle}</p>
          </div>
          <div className="mt-10 inline-flex items-end gap-4 border border-white/15 bg-white/10 p-6 backdrop-blur">
            <TrendingUp className="mb-2 h-6 w-6 text-amber-300" />
            <div>
              <p className="text-6xl font-light tracking-tight">{study.metric}</p>
              <p className="mt-2 text-sm lowercase text-zinc-300">/{study.metricLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-16">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Summary</p>
            <p className="mt-5 text-2xl font-light leading-9 text-white">{study.summary}</p>
          </div>
          <div className="grid gap-6">
            <article className="border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-2xl font-normal">The challenge</h2>
              <p className="mt-4 leading-7 text-zinc-300">{study.challenge}</p>
            </article>
            <article className="border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-2xl font-normal">What changed</h2>
              <ul className="mt-5 grid gap-3">
                {study.approach.map((item) => (
                  <li key={item} className="flex gap-3 text-zinc-300">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-2xl font-normal">Example outcome</h2>
              <ul className="mt-5 grid gap-3">
                {study.outcomes.map((item) => (
                  <li key={item} className="flex gap-3 text-zinc-300">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900 py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:px-12 lg:flex-row lg:items-center lg:justify-between lg:px-16">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Next step</p>
            <h2 className="mt-4 text-3xl font-normal">Map this workflow to your ISP.</h2>
          </div>
          <Link href="/#contact" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200">
            Request demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
