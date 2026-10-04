"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ShoppingCart } from "lucide-react"
import { academyCourses } from "@/lib/academy-data"
import { CourseGrid } from "./academy-components"
import { coursePrice, formatCoursePrice, useAcademyCart } from "./academy-cart"

export function AcademyCartPage({
  selectedCourse
}: {
  selectedCourse?: string
}) {
  const { courses, ready, add, remove } = useAcademyCart()
  const selectedAdded = useRef<string | null>(null)
  useEffect(() => {
    if (
      ready &&
      selectedCourse &&
      selectedAdded.current !== selectedCourse &&
      academyCourses.some((course) => course.slug === selectedCourse)
    ) {
      add(selectedCourse)
      selectedAdded.current = selectedCourse
    }
  }, [ready, selectedCourse, add])
  const total = courses.reduce((sum, course) => sum + coursePrice(course), 0)
  const otherCourses = academyCourses.filter(
    (course) => !courses.some((item) => item.slug === course.slug)
  )
  return (
    <div className="academy-container academy-content">
      <h1 className="academy-title">Shopping cart</h1>
      <p className="academy-muted mt-2 text-sm" aria-live="polite">
        {ready
          ? `${courses.length} ${courses.length === 1 ? "course" : "courses"} in your cart`
          : "Loading your cart..."}
      </p>
      {ready && courses.length > 0 ? (
        <div className="academy-commerce">
          <div>
            {courses.map((course) => (
              <article key={course.slug} className="academy-cart-row">
                <Link
                  href={`/academy/courses/${course.slug}`}
                  className="academy-thumbnail"
                >
                  <Image
                    src={course.image}
                    alt={course.imageAlt}
                    fill
                    sizes="136px"
                    className="object-cover"
                  />
                </Link>
                <div>
                  <h2 className="text-base font-semibold">
                    <Link href={`/academy/courses/${course.slug}`}>
                      {course.title}
                    </Link>
                  </h2>
                  <p className="academy-muted mt-2 line-clamp-2 text-xs leading-5">
                    {course.summary}
                  </p>
                  <p className="academy-muted mt-2 text-xs">
                    Internetily Academy
                  </p>
                  <p className="academy-muted mt-2 text-xs">
                    {course.duration} / {course.lessons.length} lessons /{" "}
                    {course.level}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{course.price}</p>
                  <button
                    type="button"
                    className="academy-link mt-1 min-h-12 px-2 text-sm"
                    onClick={() => remove(course.slug)}
                    aria-label={`Remove ${course.title} from cart`}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
          <aside className="academy-order-panel" aria-label="Cart total">
            <p className="academy-muted text-sm">Total</p>
            <p className="mb-5 mt-2 text-3xl font-semibold">
              {formatCoursePrice(total)}
            </p>
            <Link href="/academy/checkout" className="academy-button w-full">
              Proceed to checkout
              <ArrowRight size={16} />
            </Link>
            <p className="academy-muted mt-4 text-xs leading-5">
              We will confirm your enrollment and payment instructions before
              you pay.
            </p>
          </aside>
        </div>
      ) : (
        ready && (
          <div
            className="mt-6 border-y py-12"
            style={{ borderColor: "var(--academy-line)" }}
          >
            <ShoppingCart size={28} className="academy-link mb-4" />
            <h2 className="academy-heading">Your next course is waiting</h2>
            <p className="academy-muted mb-6">
              Choose a course to start building your skills.
            </p>
            <Link href="/academy/courses" className="academy-button">
              Browse courses
              <ArrowRight size={16} />
            </Link>
          </div>
        )
      )}
      {otherCourses.length > 0 && (
        <section className="academy-related">
          <h2 className="academy-heading">Other courses</h2>
          <CourseGrid courses={otherCourses} />
          <Link
            className="academy-link mt-5 inline-flex min-h-12 items-center gap-2 text-sm"
            href="/academy/courses"
          >
            View all courses
            <ArrowRight size={16} />
          </Link>
        </section>
      )}
    </div>
  )
}
