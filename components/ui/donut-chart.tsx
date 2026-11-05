"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface DonutDatum {
  label: string
  value: number
  color?: string
}

export interface DonutChartProps {
  data: DonutDatum[]
  centerLabel?: string
  formatValue?: (value: number) => string
  variant?: "donut" | "gauge"
  thickness?: number
  showLegend?: boolean
  legendPosition?: "bottom" | "right"
  colors?: string[]
  className?: string
}

const DEFAULT_COLORS = ["#d97234", "#3d7a5f", "#6366f1", "#0ea5e9", "#c5840a", "#c0392b"]
const R = 40
const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as const

function AnimatedNumber({ value, format, instant }: { value: number; format: (v: number) => string; instant: boolean }) {
  const [display, setDisplay] = useState(instant ? value : 0)
  useEffect(() => {
    if (instant) return setDisplay(value)
    const controls = animate(display, value, {
      duration: 0.7,
      ease: EASE_OUT,
      onUpdate: setDisplay,
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, instant])
  return <>{format(display)}</>
}

export function DonutChart({
  data,
  centerLabel = "Total",
  formatValue = (v) => v.toLocaleString(),
  variant = "donut",
  thickness = 12,
  showLegend = true,
  legendPosition = "bottom",
  colors = DEFAULT_COLORS,
  className,
}: DonutChartProps) {
  const reduce = useReducedMotion()
  const [off, setOff] = useState<Set<number>>(() => new Set())
  const [active, setActive] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const gauge = variant === "gauge"
  const span = gauge ? 50 : 100 // share of the pathLength=100 ring that is drawn

  const { segs, total } = useMemo(() => {
    const items = data.map((d, i) => ({
      ...d,
      value: Math.max(0, Number.isFinite(d.value) ? d.value : 0),
      color: d.color ?? colors[i % colors.length],
      off: off.has(i),
    }))
    const visible = items.reduce((s, d) => s + (d.off ? 0 : d.value), 0)
    const shown = items.filter((d) => !d.off && d.value > 0).length
    const gap = shown > 1 ? 0.8 : 0
    let cursor = 0
    const segs = items.map((d) => {
      const f = d.off || visible === 0 ? 0 : d.value / visible
      const start = cursor
      cursor += f * span
      return { ...d, f, start, len: Math.max(0, f * span - gap), gap }
    })
    return { segs, total: visible }
  }, [data, colors, off, span])

  const toggle = (i: number) =>
    setOff((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const act = active !== null ? segs[active] : null
  const side = legendPosition === "right"
  const viewBox = gauge ? "0 0 100 56" : "0 0 100 100"
  const rotate = gauge ? 180 : -90

  return (
    <div className={cn("flex w-full items-center gap-5", side ? "flex-col sm:flex-row" : "flex-col", className)}>
      <div className={cn("relative w-full shrink-0", gauge ? "max-w-[240px]" : "max-w-[200px]")}>
        <svg viewBox={viewBox} className="block w-full overflow-visible" role="img" aria-label={`${centerLabel}: ${formatValue(total)}`}>
          <circle
            cx="50" cy="50" r={R} fill="none" pathLength={100}
            strokeWidth={thickness}
            strokeDasharray={`${span} ${100 - span}`}
            transform={`rotate(${rotate} 50 50)`}
            className="stroke-black/[0.06] dark:stroke-white/[0.08]"
          />
          {segs.map((sg, i) =>
            sg.f > 0 ? (
              <circle
                key={i}
                cx="50" cy="50" r={R} fill="none" pathLength={100}
                stroke={sg.color}
                strokeWidth={active === i ? thickness + 1.5 : thickness}
                strokeDasharray={`${mounted ? sg.len : 0} 100`}
                strokeDashoffset={-(sg.start + sg.gap / 2)}
                transform={`rotate(${rotate} 50 50)`}
                opacity={active !== null && active !== i ? 0.35 : 1}
                style={{
                  transition: reduce ? "none" : "stroke-dasharray .7s cubic-bezier(.25,.46,.45,.94), stroke-dashoffset .7s cubic-bezier(.25,.46,.45,.94), stroke-width .15s, opacity .15s",
                  cursor: "pointer",
                }}
                onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
                onClick={() => setActive((p) => (p === i ? null : i))}
              />
            ) : null,
          )}
        </svg>

        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex justify-center text-center",
            gauge ? "items-end pb-[2%]" : "items-center",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active ?? "total"}
              className="max-w-[70%]"
              initial={{ opacity: 0, y: reduce ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -4 }}
              transition={{ duration: 0.16, ease: EASE_OUT }}
            >
              <p className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">{act ? act.label : centerLabel}</p>
              <p className="text-[clamp(15px,2.2vw,20px)] font-semibold leading-tight tracking-[-0.03em] tabular-nums text-neutral-900 dark:text-neutral-50">
                {act ? formatValue(act.value) : <AnimatedNumber value={total} format={formatValue} instant={!!reduce} />}
              </p>
              {act && <p className="text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400">{Math.round(act.f * 100)}%</p>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {showLegend && (
        <ul className={cn("w-full", side ? "max-w-[280px] flex-1" : "max-w-sm")} aria-label="Legend">
          {segs.map((sg, i) => (
            <li key={i}>
              <button
                type="button"
                aria-pressed={!sg.off}
                onClick={() => toggle(i)}
                onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={cn(
                  "flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left text-[13px] outline-none transition-[background-color,opacity] duration-150 sm:h-10",
                  "focus-visible:ring-2 focus-visible:ring-ring/50 [-webkit-tap-highlight-color:transparent]",
                  "[@media(hover:hover)]:hover:bg-black/[0.04] dark:[@media(hover:hover)]:hover:bg-white/[0.05]",
                  sg.off && "opacity-45",
                )}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: sg.color }} />
                <span className={cn("min-w-0 flex-1 truncate text-neutral-700 dark:text-neutral-300", sg.off && "line-through")}>{sg.label}</span>
                <span className="tabular-nums text-neutral-900 dark:text-neutral-100">{formatValue(sg.value)}</span>
                <span className="w-9 text-right text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400">
                  {sg.off ? "—" : `${Math.round(sg.f * 100)}%`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}