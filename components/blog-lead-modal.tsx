"use client"

import { useState, useRef, useEffect } from "react"
import { submitLead } from "@/lib/api"

interface BlogLeadModalProps {
  /** Text shown on the trigger button */
  triggerLabel?: string
  /** Tailwind classes for the trigger button */
  triggerClassName?: string
  /** Show an arrow icon on the trigger */
  showArrow?: boolean
}

export default function BlogLeadModal({
  triggerLabel = "Get in Touch",
  triggerClassName = "inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg",
  showArrow = true,
}: BlogLeadModalProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  // Focus first field when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => nameRef.current?.focus(), 60)
    } else {
      // Reset form when closed (after animation)
      setTimeout(() => {
        setForm({ name: "", email: "", phone: "", company: "", message: "" })
        setError(null)
        setSuccess(false)
      }, 300)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.company.trim()) {
      setError("Please fill in all required fields.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitLead(form)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button onClick={() => setOpen(true)} className={triggerClassName} type="button">
        {triggerLabel}
        {showArrow && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )}
      </button>

      {/* ── Modal ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Gradient header bar */}
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 pt-5">
              {success ? (
                /* ── Success state ───────────────────────────────────── */
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">We&apos;ll be in touch!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Thanks for reaching out. Our team will contact you within <strong>24 hours</strong> to walk you through Netily and get you set up.
                  </p>
                  <button
                    onClick={() => setOpen(false)}
                    className="mt-6 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline"
                  >
                    Close
                  </button>
                </div>
              ) : (
                /* ── Form ─────────────────────────────────────────────── */
                <>
                  <h2
                    id="lead-modal-title"
                    className="text-xl font-bold text-slate-900 dark:text-white mb-1"
                  >
                    Get started with Netily
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                    Leave your details and we&apos;ll set up your account personally — no self-signup needed.
                  </p>

                  <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          ref={nameRef}
                          type="text"
                          value={form.name}
                          onChange={(e) => update("name", e.target.value)}
                          placeholder="Jane Mwangi"
                          className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Phone / WhatsApp <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => update("phone", e.target.value)}
                          placeholder="0712 345 678"
                          className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="jane@yourISP.co.ke"
                        className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ISP / Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={(e) => update("company", e.target.value)}
                        placeholder="Mwangi Networks Ltd"
                        className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tell us about your ISP <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={form.message}
                        onChange={(e) => update("message", e.target.value)}
                        placeholder="How many subscribers, what location, what billing system you use now…"
                        className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                      />
                    </div>

                    {error && (
                      <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm"
                    >
                      {submitting ? "Sending…" : "Request Access — We'll Set You Up"}
                    </button>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                      No credit card. No self-signup. We onboard you personally.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
