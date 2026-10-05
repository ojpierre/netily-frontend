"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { readLearner, type LearnerSession } from "@/lib/academy-preview"
import { ShoppingCart } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { academyCourses, type AcademyCourse } from "@/lib/academy-data"
import { AddCourseButton, useAcademyCart } from "./academy-cart"

export function AcademyHeader() {
  const pathname = usePathname()
  const { courses, ready } = useAcademyCart()
  const [learner, setLearner] = useState<LearnerSession | null>(null)
  useEffect(() => setLearner(readLearner()), [pathname])
  return (
    <header className="academy-nav" aria-busy={!ready}>
      <div className="academy-container academy-nav-inner">
        <Link
          href="/academy"
          className="inline-flex min-h-12 items-center gap-3"
          aria-label="Internetily Academy home"
        >
          <Image
            src="/internetily-logo-320.webp"
            alt="Internetily"
            width={160}
            height={54}
            className="h-10 w-auto object-contain dark:hidden"
          />
          <Image
            src="/internetily-white-logo-320.webp"
            alt="Internetily"
            width={160}
            height={54}
            className="hidden h-10 w-auto object-contain dark:block"
          />
          <span className="border-l pl-3 text-sm academy-muted">Academy</span>
        </Link>
        <nav className="academy-nav-links" aria-label="Academy">
          <Link
            href="/academy"
            aria-current={pathname === "/academy" ? "page" : undefined}
          >
            Home
          </Link>
          <Link
            href="/academy/courses"
            aria-current={
              pathname.startsWith("/academy/courses") ? "page" : undefined
            }
          >
            Courses
          </Link>
          <Link
            href="/academy/cart"
            aria-current={pathname === "/academy/cart" ? "page" : undefined}
            aria-label={`Cart, ${courses.length} courses`}
          >
            <ShoppingCart size={17} />
            Cart
            {courses.length > 0 && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                {courses.length}
              </span>
            )}
          </Link>
          <ThemeToggle className="min-h-12 min-w-12" />
          <Link
            href={learner ? "/academy/account" : "/academy/login"}
            aria-label={learner ? "My learning" : "Sign in to academy"}
          >
            {learner ? "My learning" : "Sign in"}
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function AcademyFooter() {
  return (
    <footer className="academy-footer">
      <div className="academy-container flex flex-wrap items-center justify-between gap-4">
        <p>Internetily Academy</p>
        <nav className="flex flex-wrap gap-4" aria-label="Academy footer">
          <Link href="/">Internetily</Link>
          <Link href="/academy/become-an-instructor">Become an instructor</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="mailto:netilysupport@gmail.com">Get help</a>
        </nav>
      </div>
    </footer>
  )
}

export function CourseGrid({
  courses = academyCourses
}: {
  courses?: AcademyCourse[]
}) {
  return (
    <div className="academy-card-grid">
      {courses.map((course) => (
        <article key={course.slug} className="academy-course-card">
          <Link
            href={`/academy/courses/${course.slug}`}
            className="academy-thumbnail"
          >
            <Image
              src={course.image}
              alt={course.imageAlt}
              fill
              sizes="(max-width: 420px) 100vw, (max-width: 1100px) 50vw, 25vw"
              className="object-cover"
            />
          </Link>
          <div className="academy-card-body">
            <p className="academy-link text-xs">{course.category}</p>
            <h3 className="mt-2 text-lg font-semibold leading-snug">
              <Link href={`/academy/courses/${course.slug}`}>
                {course.title}
              </Link>
            </h3>
            <p className="academy-muted mt-3 line-clamp-2 text-sm leading-6">
              {course.summary}
            </p>
            <p className="academy-muted mt-3 text-xs">Internetily Academy</p>
            <div className="academy-course-meta">
              <span>{course.level}</span>
              <span>{course.duration}</span>
              <span>Self-paced</span>
            </div>
            <p className="mt-5 font-semibold">{course.price}</p>
            <div className="mt-auto grid gap-2 pt-4">
              <AddCourseButton slug={course.slug} />
              <Link
                href={`/academy/courses/${course.slug}`}
                className="academy-button secondary"
              >
                View details
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
