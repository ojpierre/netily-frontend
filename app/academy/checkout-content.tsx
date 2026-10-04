"use client"

import { useRef, useState, useEffect, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { submitLead } from "@/lib/api"
import { coursePrice, formatCoursePrice, useAcademyCart } from "./academy-cart"

export function AcademyCheckout() {
  const { courses, ready, clear } = useAcademyCart()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState<{
    email: string
    titles: string[]
  } | null>(null)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  const total = courses.reduce((sum, course) => sum + coursePrice(course), 0)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending || !courses.length) return
    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") || "").trim()
    const email = String(form.get("email") || "").trim()
    const phone = String(form.get("phone") || "").trim()
    if (!name || !email) {
      setError("Please enter your name and email address.")
      return
    }
    setSending(true)
    setError("")
    const request = new AbortController()
    controller.current = request
    const timeout = window.setTimeout(() => request.abort(), 20000)
    try {
      await submitLead(
        {
          name,
          email,
          phone,
          company: String(form.get("company") || "").trim(),
          lead_source: "Internetily Academy",
          message: `Academy enrollment request:\n${courses.map((course) => `${course.title} (${course.price})`).join("\n")}\nTotal: ${formatCoursePrice(total)}\nPlease confirm enrollment, payment instructions, and course access.`
        },
        request.signal
      )
      setConfirmation({ email, titles: courses.map((course) => course.title) })
      clear()
    } catch (failure) {
      setError(
        request.signal.aborted
          ? "This is taking longer than expected. Your cart is saved. Please try again or contact us."
          : failure instanceof Error
            ? failure.message
            : "We could not send your request. Please try again."
      )
    } finally {
      window.clearTimeout(timeout)
      controller.current = null
      setSending(false)
    }
  }
  if (!ready)
    return (
      <div className="academy-container academy-content">
        <p role="status">Loading checkout...</p>
      </div>
    )
  if (confirmation)
    return (
      <div className="academy-container academy-content">
        <div className="max-w-2xl">
          <CheckCircle2 className="academy-link mb-5" size={36} />
          <h1 className="academy-title">Your enrollment request is in</h1>
          <p className="academy-muted mt-5 leading-7">
            We will contact you at <strong>{confirmation.email}</strong> with
            payment instructions and the next steps for your courses.
          </p>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-sm">
            {confirmation.titles.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
          <p className="academy-muted mt-6 text-sm">
            Need help?{" "}
            <a className="academy-link" href="mailto:netilysupport@gmail.com">
              Contact the academy team
            </a>
            .
          </p>
          <Link className="academy-button mt-8" href="/academy/courses">
            Explore more courses
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  if (!courses.length)
    return (
      <div className="academy-container academy-content">
        <h1 className="academy-title">Your cart is empty</h1>
        <p className="academy-muted my-5">
          Add a course before heading to checkout.
        </p>
        <Link href="/academy/courses" className="academy-button">
          Find a course
          <ArrowRight size={16} />
        </Link>
      </div>
    )
  return (
    <div className="mx-auto max-w-7xl academy-checkout">
      <div className="academy-checkout-main">
        <h1
          className="academy-title border-b pb-5"
          style={{ borderColor: "var(--academy-line)" }}
        >
          Checkout
        </h1>
        <h2 className="academy-heading mt-6">Your details</h2>
        <p className="academy-muted mb-6 max-w-md text-sm leading-7">
          Tell us who is learning. We will use your email to confirm enrollment
          and share payment instructions.
        </p>
        <form className="academy-form" onSubmit={submit}>
          <label>
            Full name
            <input
              name="name"
              required
              maxLength={150}
              autoComplete="name"
              placeholder="Your full name"
              className="academy-input"
              disabled={sending}
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              required
              type="email"
              maxLength={254}
              autoComplete="email"
              placeholder="you@example.com"
              className="academy-input"
              disabled={sending}
            />
          </label>
          <label>
            Phone or WhatsApp{" "}
            <span className="academy-muted text-xs">
              Optional. Include your country code.
            </span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={20}
              placeholder="e.g. +254 712 345 678"
              className="academy-input"
              disabled={sending}
            />
          </label>
          <label>
            Company or team{" "}
            <span className="academy-muted text-xs">Optional</span>
            <input
              name="company"
              autoComplete="organization"
              maxLength={200}
              placeholder="Company or team name"
              className="academy-input"
              disabled={sending}
            />
          </label>
          <label className="flex! items-start gap-3! leading-6">
            <input
              type="checkbox"
              required
              className="mt-1 h-4 w-4 shrink-0"
              disabled={sending}
            />
            <span>
              I agree to the{" "}
              <Link className="academy-link underline" href="/terms">
                terms
              </Link>{" "}
              and{" "}
              <Link className="academy-link underline" href="/privacy">
                privacy policy
              </Link>
              .
            </span>
          </label>
          {error && (
            <p
              className="text-sm leading-6 text-red-700 dark:text-red-300"
              role="alert"
            >
              {error}
            </p>
          )}
          <button className="academy-button" type="submit" disabled={sending}>
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending request...
              </>
            ) : (
              <>
                Request enrollment
                <ArrowRight size={16} />
              </>
            )}
          </button>
          <p className="academy-muted text-xs leading-6">
            No payment is taken here. We will confirm course access and how to
            pay.
          </p>
        </form>
        <section className="mt-10">
          <h2 className="academy-heading">
            Order details ({courses.length}{" "}
            {courses.length === 1 ? "course" : "courses"})
          </h2>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.slug} className="flex items-center gap-3">
                <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded">
                  <Image
                    src={course.image}
                    alt={course.imageAlt}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <p className="flex-1 text-sm font-medium">{course.title}</p>
                <p className="shrink-0 text-xs">{course.price}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <aside className="academy-checkout-summary" aria-label="Order summary">
        <h2 className="academy-heading">Order summary</h2>
        <div className="academy-muted mt-6 flex justify-between gap-4 text-sm">
          <span>Course total</span>
          <span>{formatCoursePrice(total)}</span>
        </div>
        <div
          className="mt-5 flex justify-between gap-4 border-t pt-5 font-semibold"
          style={{ borderColor: "var(--academy-line)" }}
        >
          <span>
            Total ({courses.length}{" "}
            {courses.length === 1 ? "course" : "courses"})
          </span>
          <span>{formatCoursePrice(total)}</span>
        </div>
        <Link
          href="/academy/cart"
          className="academy-link mt-6 inline-flex min-h-12 items-center text-sm"
        >
          Edit your cart
        </Link>
      </aside>
    </div>
  )
}
