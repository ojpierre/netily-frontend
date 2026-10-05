"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { BookOpen, LogOut } from "lucide-react"
import { academyCourses } from "@/lib/academy-data"
import { getCourseLessons } from "@/lib/academy-curriculum"
import {
  logoutLearner,
  readLearner,
  readPreviewOrders,
  type LearnerSession
} from "@/lib/academy-preview"

export function LearnerWorkspace({ slug }: { slug?: string }) {
  const router = useRouter()
  const [learner, setLearner] = useState<LearnerSession | null>(null)
  const [owned, setOwned] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [lesson, setLesson] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])
  const [notice, setNotice] = useState("")
  useEffect(() => {
    setLesson(0)
    setCompleted([])
    setNotice("")
    const session = readLearner()
    setLearner(session)
    if (session) {
      setOwned([
        ...new Set(
          readPreviewOrders()
            .filter(
              (order) =>
                order.email.toLowerCase() === session.email.toLowerCase() &&
                order.status === "completed"
            )
            .flatMap((order) => order.courses)
        )
      ])
      if (slug) {
        try {
          const saved = JSON.parse(
            localStorage.getItem(
              "academy-progress:" + session.email + ":" + slug
            ) || "[]"
          )
          if (Array.isArray(saved))
            setCompleted(
              saved.filter(
                (item) =>
                  Number.isInteger(item) &&
                  item >= 0 &&
                  item <
                    (academyCourses.find((course) => course.slug === slug)
                      ?.lessons.length || 0)
              )
            )
        } catch {
          setCompleted([])
        }
      }
    }
    setReady(true)
  }, [slug])
  if (!ready) return <p role="status">Loading your learning...</p>
  if (!learner)
    return (
      <div>
        <h1 className="academy-title">Your learning starts here</h1>
        <p className="academy-muted my-5">
          Sign in to see your courses and saved progress.
        </p>
        <Link
          className="academy-button"
          href={
            "/academy/login?next=" +
            encodeURIComponent(
              slug ? "/academy/learn/" + slug : "/academy/account"
            )
          }
        >
          Sign in
        </Link>
      </div>
    )
  const course = academyCourses.find((item) => item.slug === slug)
  function complete() {
    if (!learner || !slug) return
    const next = [...new Set([...completed, lesson])]
    try {
      localStorage.setItem(
        "academy-progress:" + learner.email + ":" + slug,
        JSON.stringify(next)
      )
      setCompleted(next)
      setNotice("Progress saved.")
      if (course && lesson < course.lessons.length - 1) setLesson(lesson + 1)
    } catch {
      setNotice(
        "Progress could not be saved. Please allow browser storage and try again."
      )
    }
  }
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="academy-muted text-sm">Welcome, {learner.name}</p>
          <h1 className="academy-title">
            {slug ? course?.title || "Course not found" : "My learning"}
          </h1>
        </div>
        <button
          className="academy-button secondary"
          onClick={() => {
            logoutLearner()
            router.push("/academy/login")
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
      <p className="academy-muted text-sm mb-6">
        Preview account. Your courses and progress are saved on this browser
        only.
      </p>
      {slug && course ? (
        owned.includes(slug) ? (
          <div className="academy-catalog">
            <nav className="academy-filters" aria-label="Lessons">
              {course.lessons.map((title, index) => (
                <button
                  className={
                    "academy-button " + (index !== lesson ? "secondary" : "")
                  }
                  key={title}
                  onClick={() => {
                    setLesson(index)
                    setNotice("")
                  }}
                  aria-current={index === lesson ? "step" : undefined}
                >
                  {index + 1}. {title}
                  {completed.includes(index) ? " / Done" : ""}
                </button>
              ))}
            </nav>
            <section>
              <p className="academy-muted text-sm mb-4">
                {completed.length} of {course.lessons.length} lessons complete
              </p>
              <div className="academy-thumbnail">
                <Image
                  src={course.image}
                  alt={course.imageAlt}
                  fill
                  sizes="(max-width:700px) 100vw, 700px"
                  className="object-cover"
                />
              </div>
              <h2 className="academy-heading mt-6">{course.lessons[lesson]}</h2>
              <p className="academy-muted leading-8">
                {getCourseLessons(course)[lesson].guide}
              </p>
              <button className="academy-button mt-6" onClick={complete}>
                Mark complete and continue
              </button>
              <p role="status" className="mt-4 text-sm">
                {notice}
              </p>
            </section>
          </div>
        ) : (
          <div>
            <p>This course is not in your learning library.</p>
            <Link
              href={"/academy/courses/" + slug}
              className="academy-button mt-6"
            >
              View course
            </Link>
          </div>
        )
      ) : (
        <>
          {owned.length ? (
            <div className="academy-card-grid">
              {academyCourses
                .filter((item) => owned.includes(item.slug))
                .map((item) => (
                  <article key={item.slug} className="academy-course-card">
                    <div className="academy-thumbnail">
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        sizes="(max-width:700px) 100vw, 320px"
                        className="object-cover"
                      />
                    </div>
                    <div className="academy-card-body">
                      <h2 className="academy-heading">{item.title}</h2>
                      <Link
                        href={"/academy/learn/" + item.slug}
                        className="academy-button"
                      >
                        <BookOpen size={16} />
                        Continue learning
                      </Link>
                    </div>
                  </article>
                ))}
            </div>
          ) : (
            <div>
              <p className="academy-muted mb-5">
                No courses yet. Find a topic you want to put into practice.
              </p>
              <Link className="academy-button" href="/academy/courses">
                Browse courses
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
