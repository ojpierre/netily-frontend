import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, GraduationCap, Users } from "lucide-react"
import { AcademyHeader } from "../../academy-components"
import { academyCourses, getAcademyCourse } from "@/lib/academy-data"

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return academyCourses.map((course) => ({ slug: course.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const course = getAcademyCourse(slug)
  if (!course) {
    return {}
  }

  return {
    title: course.seoTitle,
    description: course.seoDescription,
    keywords: course.keywords,
    alternates: { canonical: `https://netily.co.ke/academy/courses/${course.slug}` },
    openGraph: {
      title: course.seoTitle,
      description: course.seoDescription,
      url: `https://netily.co.ke/academy/courses/${course.slug}`,
      images: [{ url: course.image, width: 1536, height: 864, alt: course.imageAlt }],
    },
  }
}

export default async function AcademyCourseDetailPage({ params }: PageProps) {
  const { slug } = await params
  const course = getAcademyCourse(slug)
  if (!course) {
    notFound()
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    url: `https://netily.co.ke/academy/courses/${course.slug}`,
    provider: { "@type": "Organization", name: "Internetily Academy", url: "https://netily.co.ke/academy" },
    educationalLevel: course.level,
    teaches: course.lessons,
    audience: course.audience.map((name) => ({ "@type": "Audience", audienceType: name })),
    offers: {
      "@type": "Offer",
      price: course.price.replace(/[^0-9.]/g, ""),
      priceCurrency: course.price.startsWith("KES") ? "KES" : "USD",
      availability: "https://schema.org/InStock",
      url: `https://netily.co.ke/academy/enrollment?course=${course.slug}`,
    },
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <AcademyHeader />

      <section className="border-b border-zinc-800 bg-zinc-900 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-16 lg:items-end">
          <div>
            <Link href="/academy/courses" className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to courses
            </Link>
            <p className="mt-8 text-sm uppercase tracking-[0.24em] text-amber-300">{course.category}</p>
            <h1 className="mt-5 text-balance text-4xl font-normal leading-tight md:text-6xl">{course.title}</h1>
            <p className="mt-6 text-lg leading-8 text-zinc-300">{course.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-300">
              <span className="inline-flex min-h-11 items-center gap-2 border border-zinc-700 px-3">
                <GraduationCap className="h-4 w-4 text-amber-300" />
                {course.level}
              </span>
              <span className="inline-flex min-h-11 items-center gap-2 border border-zinc-700 px-3">
                <Clock className="h-4 w-4 text-amber-300" />
                {course.duration}
              </span>
              <span className="inline-flex min-h-11 items-center gap-2 border border-zinc-700 px-3">
                <Users className="h-4 w-4 text-amber-300" />
                {course.status}
              </span>
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={`/academy/enrollment?course=${course.slug}`} className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
                Add to enrollment
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="inline-flex min-h-12 items-center justify-center border border-zinc-700 px-6 text-sm font-semibold text-white">
                {course.price}
              </span>
            </div>
          </div>
          <div className="relative aspect-[16/11] overflow-hidden border border-zinc-800">
            <Image src={course.image} alt={course.imageAlt} fill priority sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:px-12 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Course outcome</p>
            <h2 className="mt-4 text-3xl font-normal md:text-4xl">{course.outcome}</h2>
          </div>
          <div className="grid gap-4">
            {course.lessons.map((lesson) => (
              <div key={lesson} className="flex gap-4 border border-zinc-800 bg-zinc-900 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-sm leading-6 text-zinc-300">{lesson}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800 bg-zinc-900 py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Best for</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {course.audience.map((item) => (
              <span key={item} className="border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
