import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ShoppingCart } from "lucide-react"
import { AcademyHeader, CourseGrid } from "../academy-components"

export const metadata: Metadata = {
  title: "Academy Enrollment | Internetily Academy",
  description:
    "Choose an Internetily Academy course and request enrollment for practical ISP, WISP, MikroTik, hotspot, billing, and growth training.",
  alternates: { canonical: "https://netily.co.ke/academy/enrollment" },
}

export default function AcademyEnrollmentPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <AcademyHeader />
      <section className="border-b border-zinc-800 bg-zinc-900 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Enrollment</p>
            <h1 className="mt-5 text-balance text-4xl font-normal leading-tight md:text-6xl">
              Pick a course, then share your details.
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Internetily Academy is built for practical team training. Choose the course you want,
              then request enrollment and we will confirm access, payment, and learning next steps.
            </p>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-6">
            <ShoppingCart className="h-7 w-7 text-amber-300" />
            <h2 className="mt-6 text-2xl font-medium">Simple enrollment flow</h2>
            <div className="mt-6 grid gap-3">
              {[
                "Choose the course that fits your current work",
                "Submit your enrollment request",
                "Get payment and access instructions",
                "Train at your pace or request team onboarding",
              ].map((item) => (
                <div key={item} className="flex gap-3 border border-zinc-800 bg-zinc-900 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
            <Link href="/academy/courses" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
              Choose a course
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <CourseGrid />
        </div>
      </section>
    </main>
  )
}
