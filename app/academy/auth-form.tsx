"use client"

import { useEffect, useState, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, GraduationCap, ShieldCheck } from "lucide-react"
import { saveLearner, safeAcademyNext } from "@/lib/academy-preview"

export function AcademyAuthForm({
  mode
}: {
  mode: "login" | "register" | "reset"
}) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [next, setNext] = useState<string | null>(null)
  useEffect(
    () => setNext(new URLSearchParams(window.location.search).get("next")),
    []
  )
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const data = new FormData(event.currentTarget)
    const email = String(data.get("email") || "").trim()
    const password = String(data.get("password") || "")
    if (mode === "register" && password !== data.get("confirm")) {
      setError("Your passwords do not match.")
      return
    }
    setBusy(true)
    try {
      if (mode === "reset") {
        setSent(true)
        return
      }
      // Preview identity is isolated from tenant and platform authentication.
      saveLearner({ email, name: String(data.get("name") || "Learner").trim() })
      router.push(
        safeAcademyNext(new URLSearchParams(window.location.search).get("next"))
      )
    } catch {
      setError(
        "Your browser could not save this session. Please allow session storage and try again."
      )
    } finally {
      setBusy(false)
    }
  }
  const title =
    mode === "register"
      ? "Start your learning journey"
      : mode === "reset"
        ? "Reset your password"
        : "Continue learning"
  const suffix = next
    ? "?next=" + encodeURIComponent(safeAcademyNext(next))
    : ""
  return (
    <div className="academy-auth">
      <section className="academy-auth-story">
        <Image
          src="/academy/networking-foundations.webp"
          alt="African learners practising networking with an instructor"
          fill
          sizes="(max-width:700px) 100vw, 550px"
          priority
        />
        <div>
          <GraduationCap size={32} className="mb-5" />
          <h1 className="academy-title">
            Build skills you can use on a real network.
          </h1>
          <p className="mt-4 leading-7">
            Learn at your pace. Pick up where you left off and put each lesson
            into practice.
          </p>
          <p className="mt-6 flex items-center gap-3 text-sm">
            <ShieldCheck size={20} />
            One place for your courses and progress.
          </p>
        </div>
      </section>
      <section className="academy-auth-panel">
        <h2 className="academy-heading text-center">{title}</h2>
        <p className="academy-muted mb-6 text-center text-sm">
          Practical lessons for your next step.
        </p>
        {sent ? (
          <div role="status">
            <p>
              Password recovery will be available when academy accounts launch.
              No email has been sent.
            </p>
            <Link className="academy-button mt-6" href="/academy/login">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="academy-form">
            <p className="academy-muted text-xs leading-6">
              Academy preview: use sample details. Accounts and payments are not
              live yet.
            </p>
            {mode === "register" && (
              <label>
                Full name
                <input
                  className="academy-input"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </label>
            )}
            <label>
              Email address
              <input
                className="academy-input"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
              />
            </label>
            {mode !== "reset" && (
              <>
                <label>
                  Password
                  <div className="relative">
                    <input
                      className="academy-input pr-12"
                      name="password"
                      type={visible ? "text" : "password"}
                      minLength={8}
                      required
                      autoComplete={
                        mode === "register"
                          ? "new-password"
                          : "current-password"
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center"
                      onClick={() => setVisible(!visible)}
                      aria-label={visible ? "Hide password" : "Show password"}
                    >
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                {mode === "register" && (
                  <label>
                    Confirm password
                    <input
                      className="academy-input"
                      name="confirm"
                      type={visible ? "text" : "password"}
                      minLength={8}
                      required
                      autoComplete="new-password"
                    />
                  </label>
                )}
                {mode === "login" && (
                  <Link
                    href="/academy/forgot-password"
                    className="academy-link text-right text-sm"
                  >
                    Forgot your password?
                  </Link>
                )}
              </>
            )}
            {mode === "register" && (
              <label className="flex! items-start gap-3!">
                <input type="checkbox" required />
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
            )}
            {error && (
              <p role="alert" className="text-red-600">
                {error}
              </p>
            )}
            <button className="academy-button" disabled={busy} type="submit">
              {busy
                ? "Please wait..."
                : mode === "register"
                  ? "Create learner account"
                  : mode === "reset"
                    ? "Request reset link"
                    : "Sign in to the academy"}
            </button>
            {mode !== "reset" && (
              <p className="text-center text-sm">
                {mode === "register"
                  ? "Already learning with us?"
                  : "New here?"}{" "}
                <Link
                  className="academy-link"
                  href={
                    (mode === "register"
                      ? "/academy/login"
                      : "/academy/register") + suffix
                  }
                >
                  {mode === "register" ? "Sign in" : "Create an account"}
                </Link>
              </p>
            )}
          </form>
        )}
      </section>
    </div>
  )
}
