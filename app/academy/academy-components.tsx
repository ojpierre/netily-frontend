import Image from "next/image"
import Link from "next/link"
import { academyCourses } from "@/lib/academy-data"

export function AcademyHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/88 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-12 lg:px-16">
        <Link href="/" className="inline-flex items-center gap-3">
          <Image src="/internetily-white-logo-320.webp" alt="Internetily" width={150} height={52} className="h-10 w-auto object-contain" />
          <span className="hidden border-l border-white/15 pl-3 text-sm font-medium text-zinc-300 sm:inline">Academy</span>
        </Link>
        <nav className="hidden items-center gap-2 text-sm text-zinc-300 md:flex">
          <Link href="/academy" className="inline-flex min-h-12 items-center px-3 hover:text-white">Home</Link>
          <Link href="/academy/courses" className="inline-flex min-h-12 items-center px-3 hover:text-white">Courses</Link>
          <Link href="/academy/enrollment" className="inline-flex min-h-12 items-center px-3 hover:text-white">Enrollment</Link>
          <Link href="/academy/become-an-instructor" className="inline-flex min-h-12 items-center bg-white px-4 text-zinc-950 hover:bg-zinc-200">Become an instructor</Link>
        </nav>
        <Link href="/academy/courses" className="inline-flex min-h-12 items-center bg-white px-4 text-sm font-semibold text-zinc-950 md:hidden">
          Courses
        </Link>
      </div>
    </header>
  )
}

export function CourseGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {academyCourses.map((course) => (
        <article key={course.slug} className="flex h-full flex-col overflow-hidden border border-zinc-800 bg-zinc-900">
          <Link href={`/academy/courses/${course.slug}`} className="relative block aspect-[16/10] overflow-hidden border-b border-zinc-800">
            <Image src={course.image} alt={course.imageAlt} fill sizes="(max-width: 1280px) 50vw, 25vw" className="object-cover opacity-75 transition hover:scale-105 hover:opacity-100" />
            <span className="absolute left-3 top-3 bg-zinc-950/80 px-3 py-1.5 text-xs font-medium text-amber-200 backdrop-blur">{course.status}</span>
          </Link>
          <div className="flex flex-1 flex-col p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{course.category}</p>
            <h3 className="mt-3 text-xl font-medium leading-tight">{course.title}</h3>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">{course.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span className="border border-zinc-700 px-2 py-1">{course.level}</span>
              <span className="border border-zinc-700 px-2 py-1">{course.duration}</span>
              <span className="border border-zinc-700 px-2 py-1">Rating {course.rating}</span>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="font-semibold text-white">{course.price}</span>
              <span className="text-xs text-zinc-500">{course.ratingsCount} ratings</span>
            </div>
            <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
              <Link href={`/academy/enrollment?course=${course.slug}`} className="inline-flex min-h-11 items-center justify-center bg-white px-3 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200">
                Add to cart
              </Link>
              <Link href={`/academy/courses/${course.slug}`} className="inline-flex min-h-11 items-center justify-center border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800">
                View details
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
