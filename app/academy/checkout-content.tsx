"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { getAcademyCourse } from "@/lib/academy-data"
import { CheckCircle2, Loader2, Smartphone, CircleAlert } from "lucide-react"
import { coursePrice, formatCoursePrice, useAcademyCart } from "./academy-cart"
import {
  normalizeMpesaPhone,
  readLearner,
  readPreviewOrders,
  savePreviewOrder,
  type LearnerSession,
  type AcademyPreviewOrder
} from "@/lib/academy-preview"

type State =
  "details" | "waiting" | "completed" | "failed" | "cancelled" | "timeout"
export function AcademyCheckout() {
  const { courses, ready, clear } = useAcademyCart()
  const [learner, setLearner] = useState<LearnerSession | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [state, setState] = useState<State>("details")
  const [error, setError] = useState("")
  const [remaining, setRemaining] = useState(30)
  const [order, setOrder] = useState<AcademyPreviewOrder | null>(null)
  const busy = useRef(false)
  const resumed = useRef(false)
  useEffect(() => {
    setLearner(readLearner())
    setLoaded(true)
  }, [])
  useEffect(() => {
    if (!ready || !learner || resumed.current) return
    resumed.current = true
    const pending = readPreviewOrders().find(
      (item) =>
        item.email === learner.email &&
        item.status === "pending" &&
        item.courses.length === courses.length &&
        item.courses.every((slug) =>
          courses.some((course) => course.slug === slug)
        )
    )
    if (pending) {
      setOrder(pending)
      setState("timeout")
    }
  }, [ready, learner, courses])
  useEffect(() => {
    if (state !== "waiting") return
    const deadline = Date.now() + 30000
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(seconds)
      if (!seconds) {
        setState("timeout")
        busy.current = false
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [state])
  const total = courses.reduce((sum, course) => sum + coursePrice(course), 0)
  const summaryCourses =
    state === "completed" && order
      ? order.courses.flatMap((slug) => {
          const course = getAcademyCourse(slug)
          return course ? [course] : []
        })
      : courses
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || !learner || !courses.length) return
    const data = new FormData(event.currentTarget)
    const mpesaPhone = normalizeMpesaPhone(String(data.get("mpesa")))
    if (!mpesaPhone) {
      setError("Enter a valid M-Pesa number, such as 0712 345 678.")
      return
    }
    setError("")
    try {
      const next: AcademyPreviewOrder = {
        id:
          order?.status === "pending"
            ? order.id
            : "AC-PREVIEW-" + crypto.randomUUID(),
        email: learner.email,
        courses: courses.map((course) => course.slug),
        total,
        createdAt:
          order?.status === "pending"
            ? order.createdAt
            : new Date().toISOString(),
        status: "pending",
        buyer: {
          name: String(data.get("name")).trim(),
          email: String(data.get("email")).trim(),
          contact: String(data.get("contact")).trim(),
          country: String(data.get("country")).trim(),
          company: String(data.get("company")).trim(),
          mpesaPhone
        }
      }
      savePreviewOrder(next)
      setOrder(next)
      setRemaining(30)
      busy.current = true
      setState("waiting")
    } catch {
      setError(
        "We could not save your checkout. Your cart is still here. Please try again."
      )
    }
  }
  function finish(status: "completed" | "failed" | "cancelled") {
    if (!order) return
    try {
      const next = { ...order, status }
      savePreviewOrder(next)
      setOrder(next)
      setState(status)
      busy.current = false
      if (status === "completed") clear()
    } catch {
      setError("We could not save the payment result. Please try again.")
    }
  }
  if (!ready || !loaded)
    return (
      <div className="academy-container academy-content" role="status">
        Loading checkout...
      </div>
    )
  if (!learner)
    return (
      <div className="academy-container academy-content">
        <h1 className="academy-title">Sign in to continue</h1>
        <p className="academy-muted my-5">
          Your cart is saved. Sign in or create an account so your courses stay
          together.
        </p>
        <Link
          className="academy-button"
          href="/academy/login?next=%2Facademy%2Fcheckout"
        >
          Sign in
        </Link>{" "}
        <Link
          className="academy-button secondary"
          href="/academy/register?next=%2Facademy%2Fcheckout"
        >
          Create an account
        </Link>
      </div>
    )
  if (!courses.length && state !== "completed")
    return (
      <div className="academy-container academy-content">
        <h1 className="academy-title">Your cart is empty</h1>
        <Link className="academy-button mt-6" href="/academy/courses">
          Find a course
        </Link>
      </div>
    )
  return (
    <div className="mx-auto max-w-7xl academy-checkout">
      <section className="academy-checkout-main">
        <h1 className="academy-title">Checkout</h1>
        <p className="academy-muted mt-4 text-sm">
          1. Your details / 2. M-Pesa / 3. Confirmation
        </p>
        <div className="academy-payment-panel text-sm leading-6">
          <strong>Payment preview</strong>
          <p>
            No STK request is sent and no money is collected. You can try the
            payment screens before checkout launches.
          </p>
        </div>
        {state === "details" ? (
          <form className="academy-form" onSubmit={submit}>
            <h2 className="academy-heading">Your details</h2>
            <label>
              Full name
              <input
                className="academy-input"
                name="name"
                defaultValue={learner.name === "Learner" ? "" : learner.name}
                autoComplete="name"
                required
                maxLength={100}
              />
            </label>
            <label>
              Email address
              <input
                className="academy-input"
                name="email"
                type="email"
                defaultValue={learner.email}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Contact phone
              <input
                className="academy-input"
                name="contact"
                type="tel"
                autoComplete="tel"
                required
                maxLength={24}
                placeholder="Include your country code"
              />
            </label>
            <label>
              Country
              <input
                className="academy-input"
                name="country"
                autoComplete="country-name"
                required
                maxLength={80}
                placeholder="Your country"
              />
            </label>
            <label>
              Company or team (optional)
              <input
                className="academy-input"
                name="company"
                autoComplete="organization"
                maxLength={150}
              />
            </label>
            <h2 className="academy-heading mb-0!">Pay with M-Pesa</h2>
            <label>
              M-Pesa phone number
              <input
                className="academy-input"
                name="mpesa"
                type="tel"
                inputMode="tel"
                required
                placeholder="0712 345 678"
                maxLength={24}
              />
            </label>
            <p className="academy-muted text-sm">
              Use a Kenyan M-Pesa number. When payments launch, a prompt will
              appear on this phone. Never share your PIN here.
            </p>
            <label className="flex! gap-3! items-start">
              <input required type="checkbox" />
              <span>
                I agree to the{" "}
                <Link className="academy-link" href="/terms">
                  terms
                </Link>{" "}
                and{" "}
                <Link className="academy-link" href="/privacy">
                  privacy policy
                </Link>
                .
              </span>
            </label>
            <button className="academy-button" type="submit">
              <Smartphone size={18} />
              Preview M-Pesa payment
            </button>
          </form>
        ) : (
          <div
            className="academy-payment-panel"
            aria-live="polite"
            aria-atomic="true"
          >
            {state === "waiting" ? (
              <>
                <Loader2 className="academy-link animate-spin mb-4" />
                <h2 className="academy-heading">Check your phone</h2>
                <p>
                  In a live checkout, you would enter your M-Pesa PIN on your
                  phone. Waiting for confirmation: {remaining}s.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className="academy-button"
                    onClick={() => finish("completed")}
                  >
                    Preview success
                  </button>
                  <button
                    className="academy-button secondary"
                    onClick={() => finish("failed")}
                  >
                    Preview failure
                  </button>
                  <button
                    className="academy-link min-h-12"
                    onClick={() => finish("cancelled")}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : state === "completed" ? (
              <>
                <CheckCircle2 className="academy-link mb-4" />
                <h2 className="academy-heading">Payment preview complete</h2>
                <p>
                  No charge was made. Your selected courses are saved in your
                  preview account.
                </p>
                <Link className="academy-button mt-6" href="/academy/account">
                  Go to my learning
                </Link>
              </>
            ) : (
              <>
                <CircleAlert className="academy-link mb-4" />
                <h2 className="academy-heading">
                  {state === "timeout"
                    ? "Confirmation is taking longer"
                    : state === "cancelled"
                      ? "Payment cancelled"
                      : "Payment did not complete"}
                </h2>
                <p>
                  {state === "timeout"
                    ? "Your order is saved. In a live checkout, check its status before paying again."
                    : "Your cart is saved. Check your number and try again."}
                </p>
                <button
                  className="academy-button mt-6"
                  onClick={() => {
                    setState("details")
                    setError("")
                  }}
                >
                  Back to details
                </button>
              </>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 text-red-600">
            {error}
          </p>
        )}
      </section>
      <aside className="academy-checkout-summary" aria-label="Order summary">
        <h2 className="academy-heading">Order summary</h2>
        <ul className="space-y-5">
          {summaryCourses.map((course) => (
            <li
              key={course.slug}
              className="flex justify-between gap-4 text-sm"
            >
              <span>{course.title}</span>
              <strong className="shrink-0">{course.price}</strong>
            </li>
          ))}
        </ul>
        <div
          className="mt-6 border-t pt-6 flex justify-between gap-4 font-semibold"
          style={{ borderColor: "var(--academy-line)" }}
        >
          <span>Total</span>
          <span>
            {formatCoursePrice(
              order && state !== "details" ? order.total : total
            )}
          </span>
        </div>
        {order && (
          <p className="academy-muted mt-5 break-all text-xs">
            Order: {order.id}
          </p>
        )}
        {state === "details" && (
          <Link
            className="academy-link inline-flex min-h-12 mt-5 items-center"
            href="/academy/cart"
          >
            Edit cart
          </Link>
        )}
      </aside>
    </div>
  )
}
