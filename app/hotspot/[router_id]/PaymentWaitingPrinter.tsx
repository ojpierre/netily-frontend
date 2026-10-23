"use client"

import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion"
import { AlertCircle, Loader2, Wifi } from "lucide-react"
import { useState } from "react"

interface PaymentWaitingPrinterProps {
  status: "sending" | "waiting"
  planName: string
  durationDisplay: string
  amountText: string
  countdown: number
  totalSeconds?: number
  providerLabel: string
  reference?: string | null
  sendingTitle: string
  waitingTitle: string
  waitingHint: string
  showCancellationWarning: boolean
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const

// Zig-zag torn edge at the bottom of the paper
const TEETH = 40
const DEPTH = 4
const teethPoints = Array.from({ length: TEETH * 2 }, (_, i) => {
  const x = 100 - ((i + 1) * 100) / (TEETH * 2)
  const y = i % 2 === 0 ? "100%" : `calc(100% - ${DEPTH}px)`
  return `${x}% ${y}`
}).join(", ")
const PAPER_CLIP = `polygon(0 0, 100% 0, 100% calc(100% - ${DEPTH}px), ${teethPoints})`

// Stepped "line by line" feed
const FEED_Y = [
  "-100%", "-91%", "-91%", "-81%", "-81%", "-70%", "-70%", "-58%", "-58%",
  "-45%", "-45%", "-32%", "-32%", "-20%", "-20%", "-10%", "-10%", "-3%", "-3%", "0%",
]
const FEED_TIMES = [
  0, 0.075, 0.105, 0.18, 0.21, 0.285, 0.315, 0.39, 0.42, 0.495, 0.525, 0.6,
  0.63, 0.705, 0.735, 0.81, 0.84, 0.915, 0.945, 1,
]

function fmt(seconds: number) {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`
}

export default function PaymentWaitingPrinter({
  status,
  planName,
  durationDisplay,
  amountText,
  countdown,
  totalSeconds = 120,
  providerLabel,
  reference,
  sendingTitle,
  waitingTitle,
  waitingHint,
  showCancellationWarning,
}: PaymentWaitingPrinterProps) {
  const reduce = useReducedMotion()
  const printing = status === "waiting"
  const [printedAt] = useState(() =>
    new Date().toLocaleString(undefined, {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }),
  )
  const pct = Math.max(0, Math.min(100, (countdown / totalSeconds) * 100))
  const urgent = countdown <= 20

  return (
    <LazyMotion features={domAnimation}>
      <section className="w-full max-w-sm mx-auto flex flex-col items-center" aria-label="Payment receipt printer">
        {/* ── Machine ── */}
        <div className="relative z-10 w-full rounded-3xl border border-slate-900 bg-slate-800 p-3 pb-8 shadow-[0_20px_36px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex h-11 items-start justify-between">
            <div className="grid size-8 place-items-center rounded-lg bg-slate-700/80 text-slate-300">
              <Wifi className="size-4" />
            </div>
            <span className="rounded-lg bg-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-200">
              {providerLabel}
            </span>
          </div>

          {/* Screen */}
          <div className="rounded-2xl border border-slate-950 bg-slate-950 p-4 text-slate-100 shadow-inner">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{planName}</p>
                <p className="text-xs text-slate-400">{durationDisplay}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Total</p>
                <p className="text-lg font-bold tabular-nums">{amountText}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2" role="status" aria-live="polite">
              <span className="relative grid size-5 shrink-0 place-items-center">
                {printing ? (
                  <span className="text-amber-400">
                    <Loader2 className={`size-[18px] ${reduce ? "" : "animate-spin"}`} />
                  </span>
                ) : (
                  <Loader2 className={`size-[18px] text-slate-400 ${reduce ? "" : "animate-spin"}`} />
                )}
              </span>
              <div className="grid min-w-0 flex-1">
                <AnimatePresence mode="wait" initial={false}>
                  <m.p
                    key={status}
                    initial={{ opacity: 0, y: reduce ? 0 : 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -4 }}
                    transition={{ duration: 0.16, ease: EASE_OUT }}
                    className="truncate text-sm font-medium text-slate-200"
                  >
                    {printing ? waitingTitle : sendingTitle}
                  </m.p>
                </AnimatePresence>
              </div>
              {printing && (
                <span className={`font-mono text-sm font-bold tabular-nums ${urgent ? "text-red-400" : "text-amber-300"}`}>
                  {fmt(countdown)}
                </span>
              )}
            </div>

            {printing && (
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${urgent ? "bg-red-400" : "bg-amber-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>

          {/* Paper slot */}
          <div aria-hidden="true" className="absolute inset-x-6 bottom-3 z-40 h-2 rounded bg-black shadow-inner" />
        </div>

        {/* ── Output (paper feeds out from the slot) ── */}
        <div className="relative z-20 -mt-4 h-[22rem] w-[84%] max-w-full overflow-hidden px-3">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 -top-1 z-20 h-2 bg-black/60 blur-[5px]" />
          <m.div
            initial={false}
            animate={
              printing
                ? reduce
                  ? { y: "0%", opacity: 1 }
                  : { y: FEED_Y, opacity: 1 }
                : { y: "-100%", opacity: 0 }
            }
            transition={
              printing && !reduce
                ? { y: { duration: 2.2, ease: "linear", times: FEED_TIMES }, opacity: { duration: 0.15 } }
                : { duration: 0 }
            }
            className="will-change-transform"
          >
            <article
              className="min-h-80 bg-white px-5 pt-6 pb-8 font-mono text-slate-900 drop-shadow-md"
              style={{ clipPath: PAPER_CLIP }}
            >
              <div className="text-center">
                <p className="text-sm font-bold tracking-widest">PAYMENT PENDING</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{printedAt}</p>
              </div>

              <div className="my-4 border-t border-dashed border-slate-300" />

              <div className="flex items-start justify-between gap-3 text-xs">
                <span className="font-bold uppercase">{planName}</span>
                <span className="shrink-0 font-bold tabular-nums">{amountText}</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">{durationDisplay}</p>

              <div className="my-4 border-t border-dashed border-slate-300" />

              <div className="space-y-1 text-[10px] text-slate-500">
                <div className="flex justify-between"><span>Method</span><span className="text-slate-800">{providerLabel}</span></div>
                {reference && (
                  <div className="flex justify-between"><span>Ref</span><span className="text-slate-800">{reference}</span></div>
                )}
                <div className="flex justify-between"><span>Status</span><span className="font-bold text-amber-600">AWAITING PIN</span></div>
              </div>

              <p className="mt-4 text-center text-[10px] leading-4 text-slate-600">{waitingHint}</p>

              <div
                aria-hidden="true"
                className="mx-auto mt-4 h-8 w-40"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg,#111 0 2px,transparent 2px 4px,#111 4px 5px,transparent 5px 8px,#111 8px 11px,transparent 11px 13px)",
                }}
              />
            </article>
          </m.div>
        </div>

        {showCancellationWarning && printing && (
          <div className="mt-3 flex w-full items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-left text-xs text-red-600">
              Do not cancel this M-Pesa prompt more than 3 times. Repeated cancellations
              may permanently block you from making further purchases.
            </p>
          </div>
        )}
      </section>
    </LazyMotion>
  )
}