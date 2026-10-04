import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { AcademyHeader } from "../academy-components"

export const metadata: Metadata = {
  title: "Become an Instructor | Internetily Academy",
  description:
    "Share practical ISP, WISP, MikroTik, hotspot, billing, support, or broadband growth knowledge through Internetily Academy.",
  alternates: { canonical: "https://netily.co.ke/academy/become-an-instructor" },
}

export default function BecomeInstructorPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <AcademyHeader />
      <section className="border-b border-zinc-800 bg-zinc-900 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Teach practical ISP work</p>
            <h1 className="mt-5 text-balance text-4xl font-normal leading-tight md:text-6xl">
              Help operators learn what actually works in the field.
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Internetily Academy welcomes practical instructors with real experience in ISP operations,
              MikroTik, wireless rollout, customer support, billing, field work, or local growth.
            </p>
            <Link href="/#contact" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
              Talk to the academy team
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3">
            {[
              "Teach short, useful lessons",
              "Use plain language and real operating examples",
              "Help ISP teams avoid expensive mistakes",
              "Build courses around outcomes, not theory alone",
            ].map((item) => (
              <div key={item} className="flex gap-3 border border-zinc-800 bg-zinc-950 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-sm leading-6 text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
