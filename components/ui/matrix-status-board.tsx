"use client"

import { memo } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

export type MatrixTone = "ok" | "warn" | "bad" | "neutral"
export interface MatrixRow {
  label: string
  value: string
  tone?: MatrixTone
}

const GLYPHS: Record<string, readonly string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  ":": ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
}

const R = 0.34
const DOTS = Array.from({ length: 35 }, (_, i) => ({ x: i % 5, y: Math.floor(i / 5) }))
const dot = (x: number, y: number) =>
  `M${x - R},${y}a${R},${R} 0 1,0 ${R * 2},0a${R},${R} 0 1,0 ${-R * 2},0`
const INACTIVE = DOTS.map((d) => dot(d.x, d.y)).join("")
const PATHS: Record<string, string> = Object.fromEntries(
  Object.entries(GLYPHS).map(([ch, rows]) => [
    ch,
    DOTS.filter(({ x, y }) => rows[y][x] === "1").map(({ x, y }) => dot(x, y)).join(""),
  ]),
)

const TONE: Record<MatrixTone, string> = {
  ok: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-red-600 dark:text-red-400",
  neutral: "text-foreground",
}

const Glyph = memo(function Glyph({ ch }: { ch: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="-0.5 -0.5 5 7" className="block h-auto w-full overflow-visible">
      <path d={INACTIVE} fill="currentColor" opacity={0.12} />
      <path d={PATHS[ch] ?? PATHS[" "]} fill="currentColor" />
    </svg>
  )
})

const Cell = memo(function Cell({ ch, index, reduce }: { ch: string; index: number; reduce: boolean }) {
  return (
    <span aria-hidden className="relative inline-block w-[clamp(8px,1.4vw,14px)] shrink-0 overflow-hidden">
      <span className="invisible block">
        <Glyph ch="0" />
      </span>
      <AnimatePresence initial mode="sync">
        <motion.span
          key={ch}
          className="absolute inset-0"
          initial={reduce ? false : { y: "72%", opacity: 0.4 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: "-72%", opacity: 0.4 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 420, damping: 34, mass: 0.8, delay: Math.min(index * 0.015, 0.12) }
          }
        >
          <Glyph ch={ch} />
        </motion.span>
      </AnimatePresence>
    </span>
  )
})

export function MatrixStatusBoard({
  title = "LIVE STATUS",
  meta,
  rows,
  className,
}: {
  title?: string
  meta?: string
  rows: MatrixRow[]
  className?: string
}) {
  const reduce = useReducedMotion() ?? false

  return (
    <section
      aria-label={title}
      className={cn("w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm", className)}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 sm:px-5">
        <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">{title}</p>
        {meta && <p className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground/70">{meta}</p>}
      </header>
      <ul className="m-0 list-none p-0">
        {rows.map((row) => {
          const chars = Array.from(row.value.toUpperCase().slice(0, 18)).map((c) =>
            PATHS[c] !== undefined ? c : " ",
          )
          return (
            <li
              key={row.label}
              className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0 sm:grid-cols-[100px_minmax(0,1fr)] sm:px-5"
            >
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">{row.label}</span>
              <span className="sr-only">{`${row.label}: ${row.value}`}</span>
              <div className={cn("inline-flex items-center gap-[2px]", TONE[row.tone ?? "neutral"])}>
                {chars.map((ch, i) => (
                  <Cell key={i} ch={ch} index={i} reduce={reduce} />
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}