import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { AcademyHeader, CourseGrid } from "../academy-components"
import { academyCourses } from "@/lib/academy-data"

export const metadata: Metadata = {
  title: "Internetily Academy Courses | ISP, WISP, MikroTik and Hotspot Training",
  description:
    "Browse practical Internetily Academy courses for ISP owners, WISP teams, MikroTik technicians, hotspot operators, support teams, and broadband founders.",
  alternates: { canonical: "https://netily.co.ke/academy/courses" },
}

export default function AcademyCoursesPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <AcademyHeader />
      <section className="border-b border-zinc-800 bg-zinc-900 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Course catalog</p>
            <h1 className="mt-5 text-balance text-4xl font-normal leading-tight md:text-6xl">
              Practical ISP courses you can start from today.
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Pick a course by the work you need to do next: understand the network, plan rollout,
              improve billing operations, or grow subscriber demand.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {academyCourses.map((course) => (
              <Link
                key={course.slug}
                href={`/academy/courses/${course.slug}`}
                className="group border border-zinc-800 bg-zinc-950 p-5 transition hover:border-amber-400"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{course.category}</p>
                <h2 className="mt-3 text-lg font-medium">{course.title}</h2>
                <p className="mt-3 text-sm text-zinc-400">{course.duration} · {course.level}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-amber-300">
                  View course
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <CourseGrid />
        </div>
      </section>

      <section className="border-t border-zinc-800 bg-zinc-900 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">What you get</p>
            <h2 className="mt-4 text-3xl font-normal md:text-4xl">Learning built around real ISP work.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Plain-English lessons",
              "ISP, WISP, hotspot, and MikroTik examples",
              "Course outcomes before purchase",
              "Easy enrollment request flow",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 border border-zinc-800 bg-zinc-950 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <span className="text-sm text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
