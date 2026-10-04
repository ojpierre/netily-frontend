import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen, Check, GraduationCap, Router, Wifi } from "lucide-react"
import { AcademyHeader, CourseGrid } from "./academy-components"
import { academyCourses, academyStats } from "@/lib/academy-data"

export const metadata: Metadata = {
  title: "Internetily Academy | Practical ISP, MikroTik, WISP and Hotspot Training",
  description:
    "Internetily Academy offers practical courses for ISP owners, WISP operators, MikroTik technicians, hotspot teams, support staff, and broadband founders.",
  keywords: [
    "ISP academy",
    "ISP training",
    "MikroTik training",
    "WISP course",
    "hotspot billing course",
    "ISP operations course",
    "internet provider training",
  ],
  alternates: { canonical: "https://netily.co.ke/academy" },
  openGraph: {
    title: "Internetily Academy | Practical ISP Training",
    description: "Practical ISP, WISP, MikroTik, hotspot, billing, support, and growth courses for broadband teams.",
    url: "https://netily.co.ke/academy",
    images: [{ url: "/academy/internetily-academy-training.webp", alt: "Internetily Academy training workspace" }],
  },
}

export default function AcademyPage() {
  const learningPaths = [
    { icon: Router, title: "Network basics", body: "Routers, IP planning, PPPoE, hotspot access, and troubleshooting." },
    { icon: Wifi, title: "WISP and hotspot work", body: "Backhaul, access points, vouchers, customer sessions, and support flows." },
    { icon: BookOpen, title: "Billing and operations", body: "Plans, renewals, invoices, customer records, and daily owner dashboards." },
    { icon: GraduationCap, title: "Growth skills", body: "Market surveys, pricing, local campaigns, and lead follow-up habits." },
  ]

  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Internetily Academy",
    url: "https://netily.co.ke/academy",
    description:
      "Practical ISP, WISP, MikroTik, hotspot, billing, support, and growth courses for internet provider teams.",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Internetily Academy courses",
      itemListElement: academyCourses.map((course) => ({
        "@type": "Course",
        name: course.title,
        description: course.summary,
        url: `https://netily.co.ke/academy/courses/${course.slug}`,
        provider: { "@type": "Organization", name: "Internetily Academy" },
      })),
    },
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <AcademyHeader />

      <section className="relative overflow-hidden border-b border-zinc-800">
        <Image
          src="/academy/internetily-academy-training.webp"
          alt="Internetily Academy networking training workspace"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/20" />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-zinc-950/20" />
        <div className="relative z-10 mx-auto grid min-h-[720px] max-w-7xl items-end gap-10 px-6 pb-16 pt-36 md:px-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-16">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.28em] text-amber-300">Internetily Academy</p>
            <h1 className="mt-6 text-balance text-4xl font-normal leading-tight md:text-6xl">
              Learn the practical skills behind real ISP operations.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Simple, straight-to-work courses for ISP owners, WISP operators, MikroTik technicians, hotspot teams, support staff, and broadband founders.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/academy/courses" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200">
                Explore courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/academy/enrollment" className="inline-flex min-h-12 items-center justify-center border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                View enrollment
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:self-end">
            {academyStats.map(([value, label]) => (
              <div key={label} className="border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-3xl font-light">{value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-zinc-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 bg-zinc-900 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-16">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Learning paths</p>
            <h2 className="mt-5 text-balance text-4xl font-normal leading-tight md:text-5xl">
              Built for people who need to run networks, not just pass theory.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {learningPaths.map(({ icon: Icon, title, body }) => (
              <article key={title} className="border border-zinc-800 bg-zinc-950 p-6">
                <Icon className="h-6 w-6 text-amber-300" />
                <h3 className="mt-6 text-xl font-medium">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Start learning</p>
              <h2 className="mt-4 text-4xl font-normal">Featured courses</h2>
            </div>
            <Link href="/academy/courses" className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-amber-300">
              View all courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <CourseGrid />
        </div>
      </section>

      <section className="bg-zinc-900 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-16 lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">For teams</p>
            <h2 className="mt-5 text-4xl font-normal leading-tight md:text-5xl">
              Use the courses to train owners, support teams, technicians, and sales staff.
            </h2>
          </div>
          <div className="grid gap-3">
            {["Beginner-friendly lessons", "Practical ISP examples", "Course pages with clear outcomes", "Simple enrollment journey"].map((item) => (
              <div key={item} className="flex items-center gap-3 border border-zinc-800 bg-zinc-950 p-4">
                <Check className="h-5 w-5 text-emerald-300" />
                <span className="text-sm text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
