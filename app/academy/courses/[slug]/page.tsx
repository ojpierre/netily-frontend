import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarDays, Check, ChevronRight, Clock, Globe } from "lucide-react"
import { AcademyFooter, AcademyHeader } from "../../academy-components"
import { AddCourseButton } from "../../academy-cart"
import { CourseCurriculum } from "../../course-curriculum"
import { academyCourses, getAcademyCourse } from "@/lib/academy-data"
import {
  getCourseLessons,
  getCourseRequirements
} from "@/lib/academy-curriculum"

type PageProps = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return academyCourses.map((course) => ({ slug: course.slug }))
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const course = getAcademyCourse(slug)
  if (!course) return {}
  return {
    title: course.seoTitle,
    description: course.seoDescription,
    keywords: course.keywords,
    alternates: {
      canonical: `https://netily.co.ke/academy/courses/${course.slug}`
    },
    openGraph: {
      title: course.seoTitle,
      description: course.seoDescription,
      url: `https://netily.co.ke/academy/courses/${course.slug}`,
      images: [{ url: course.image, alt: course.imageAlt }]
    }
  }
}

export default async function AcademyCourseDetailPage({ params }: PageProps) {
  const { slug } = await params
  const course = getAcademyCourse(slug)
  if (!course) notFound()
  const lessons = getCourseLessons(course)
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    url: `https://netily.co.ke/academy/courses/${course.slug}`,
    provider: {
      "@type": "Organization",
      name: "Internetily Academy",
      url: "https://netily.co.ke/academy"
    },
    educationalLevel: course.level,
    teaches: course.lessons,
    inLanguage: "en",
    offers: {
      "@type": "Offer",
      price: course.price.replace(/[^0-9.]/g, ""),
      priceCurrency: "KES",
      url: `https://netily.co.ke/academy/courses/${course.slug}`
    }
  }
  return (
    <main className="academy-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c")
        }}
      />
      <AcademyHeader />
      <section className="academy-detail-hero">
        <div className="academy-container">
          <div className="academy-detail-column">
            <nav className="academy-breadcrumb" aria-label="Breadcrumb">
              <Link href="/academy/courses">Courses</Link>
              <ChevronRight size={12} />
              <Link href={`/academy/courses?level=${course.level}`}>
                {course.level}
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/academy/courses?category=${encodeURIComponent(course.category)}`}
              >
                {course.category}
              </Link>
            </nav>
            <h1>{course.title}</h1>
            <p className="academy-detail-summary">{course.summary}</p>
            <p className="mt-5 text-sm text-sky-200">
              No ratings yet / {course.level} / Self-paced learning
            </p>
            <p className="mt-5 text-sm text-sky-100">
              Created by{" "}
              <Link href="/academy" className="font-semibold">
                Internetily Academy
              </Link>
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs text-sky-100">
              <span className="flex items-center gap-2">
                <CalendarDays size={14} />
                Updated October 2026
              </span>
              <span className="flex items-center gap-2">
                <Globe size={14} />
                English
              </span>
              <span className="flex items-center gap-2">
                <Clock size={14} />
                {course.duration}
              </span>
              <span>Self-paced</span>
              <span>{course.level}</span>
            </div>
            <p className="mb-3 mt-6 text-2xl font-semibold">{course.price}</p>
            <AddCourseButton slug={course.slug} />
          </div>
        </div>
      </section>
      <div className="academy-container academy-content">
        <div className="academy-detail-column">
          <section className="academy-learn-box">
            <h2 className="academy-heading">What you&apos;ll learn</h2>
            <ul className="academy-learn-grid">
              {lessons.map((lesson) => (
                <li key={lesson.title}>
                  <Check size={16} className="academy-link mt-1 shrink-0" />
                  <span>
                    {lesson.title}. {lesson.guide.split(". ")[0]}.
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="academy-detail-section">
            <h2 className="academy-heading">Explore related topics</h2>
            <div className="academy-topics">
              <Link
                href={`/academy/courses?category=${encodeURIComponent(course.category)}`}
              >
                {course.category}
              </Link>
              <Link href={`/academy/courses?level=${course.level}`}>
                {course.level}
              </Link>
              <Link href="/academy/courses">Self-paced</Link>
            </div>
          </section>
          <section className="academy-detail-section">
            <h2 className="academy-heading mb-0!">Course content</h2>
            <CourseCurriculum course={course} />
          </section>
          <section className="academy-detail-section">
            <h2 className="academy-heading">Requirements</h2>
            <ul className="academy-muted list-disc space-y-3 pl-5 text-sm leading-7">
              {getCourseRequirements(course).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="academy-detail-section">
            <h2 className="academy-heading">Description</h2>
            <div className="academy-muted max-w-3xl space-y-4 text-sm leading-7">
              <p>{course.summary}</p>
              <p>{course.outcome}</p>
              <p>
                {lessons
                  .map((lesson) => lesson.guide.split(". ")[0])
                  .join(". ")}
                .
              </p>
              <p>
                Take the lessons at your own pace and use the ideas on a network
                you know. You can come back to each topic as your team and
                customer base grow.
              </p>
            </div>
          </section>
          <section className="academy-detail-section">
            <h2 className="academy-heading">Who this course is for</h2>
            <ul className="academy-muted list-disc space-y-2 pl-5 text-sm">
              {course.audience.map((audience) => (
                <li key={audience}>{audience}</li>
              ))}
            </ul>
          </section>
          <section className="academy-detail-section">
            <h2 className="academy-heading">Learner reviews</h2>
            <div className="academy-review-empty">
              No reviews yet. Learner feedback will appear here when it is
              available.
            </div>
          </section>
        </div>
      </div>
      <AcademyFooter />
    </main>
  )
}
