"use client"

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { useColorTheme, type ColorTheme } from "@/components/theme-provider"

/*
 * Ambient background for the three motion themes. Purely decorative:
 * fixed behind the admin shell, aria-hidden, no pointer events, and only
 * transform / opacity / stroke-dashoffset animations so it stays cheap.
 * Styling and reduced-motion / paused handling live in globals.css (.nm-*).
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>

const FIBRE_STRANDS = [
  { d: "M-60 170 C 280 110 520 250 820 195 S 1250 115 1500 165", dur: 9, delay: -1 },
  { d: "M-60 330 C 250 385 560 275 860 340 S 1240 420 1500 355", dur: 12, delay: -6 },
  { d: "M-60 520 C 340 465 610 600 900 535 S 1300 465 1500 520", dur: 10, delay: -3 },
  { d: "M-60 700 C 290 760 620 640 940 700 S 1280 785 1500 720", dur: 14, delay: -9 },
  { d: "M-60 835 C 360 795 700 885 1000 830 S 1320 785 1500 815", dur: 11, delay: -5 },
  { d: "M1040 -60 C 990 200 1130 420 1080 640 S 1010 860 1060 960", dur: 13, delay: -2 },
]

const FIBRE_NODES = [
  { cx: 820, cy: 195, delay: 0 },
  { cx: 1086, cy: 340, delay: -1.2 },
  { cx: 900, cy: 535, delay: -2.4 },
  { cx: 1078, cy: 700, delay: -0.6 },
]

const AIRWAVE_SOURCES = [
  { x: "84%", y: "16%", size: "62vmax" },
  { x: "38%", y: "96%", size: "54vmax" },
]

const PACKET_LANES_X = [
  { row: 4, dur: 9, delay: -2, tone: "primary" },
  { row: 9, dur: 13, delay: -7, tone: "accent" },
  { row: 13, dur: 8, delay: -4, tone: "primary" },
  { row: 18, dur: 11, delay: -1, tone: "accent" },
  { row: 22, dur: 15, delay: -10, tone: "primary" },
  { row: 27, dur: 10, delay: -6, tone: "accent" },
]

const PACKET_LANES_Y = [
  { col: 16, dur: 12, delay: -3, tone: "accent" },
  { col: 29, dur: 9, delay: -8, tone: "primary" },
  { col: 41, dur: 14, delay: -1, tone: "accent" },
  { col: 53, dur: 11, delay: -5, tone: "primary" },
]

const PACKET_NODES = [
  { col: 16, row: 9, delay: 0 },
  { col: 29, row: 18, delay: -1.6 },
  { col: 41, row: 4, delay: -0.8 },
  { col: 53, row: 22, delay: -2.4 },
  { col: 29, row: 27, delay: -3.2 },
]

function FibreBackdrop() {
  return (
    <svg className="nm-fibre" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      {FIBRE_STRANDS.map((strand, index) => (
        <g key={index}>
          <path className="nm-fibre-strand" d={strand.d} />
          <path
            className="nm-fibre-glow"
            d={strand.d}
            pathLength={100}
            style={{ "--nm-dur": `${strand.dur}s`, "--nm-delay": `${strand.delay}s` } as Vars}
          />
          <path
            className="nm-fibre-pulse"
            d={strand.d}
            pathLength={100}
            style={{ "--nm-dur": `${strand.dur}s`, "--nm-delay": `${strand.delay}s` } as Vars}
          />
        </g>
      ))}
      {FIBRE_NODES.map((node, index) => (
        <g key={index}>
          <circle className="nm-fibre-halo" cx={node.cx} cy={node.cy} r={14} style={{ "--nm-delay": `${node.delay}s` } as Vars} />
          <circle className="nm-fibre-node" cx={node.cx} cy={node.cy} r={3.5} />
        </g>
      ))}
    </svg>
  )
}

function AirwaveBackdrop() {
  return (
    <>
      {AIRWAVE_SOURCES.map((source, index) => (
        <div
          key={index}
          className="nm-air-source"
          style={{ "--nm-x": source.x, "--nm-y": source.y, "--nm-size": source.size, "--nm-offset": `${index * -2.2}s` } as Vars}
        >
          {[0, 1, 2, 3].map((ring) => (
            <span key={ring} className="nm-air-ring" style={{ "--nm-ring": ring } as Vars} />
          ))}
          <span className="nm-air-core" />
        </div>
      ))}
    </>
  )
}

function PacketBackdrop() {
  return (
    <div className="nm-packet-grid">
      {PACKET_LANES_X.map((lane, index) => (
        <span
          key={`x${index}`}
          className={cn("nm-packet nm-packet-x", lane.tone === "accent" && "nm-packet-accent")}
          style={{ "--nm-row": lane.row, "--nm-dur": `${lane.dur}s`, "--nm-delay": `${lane.delay}s` } as Vars}
        />
      ))}
      {PACKET_LANES_Y.map((lane, index) => (
        <span
          key={`y${index}`}
          className={cn("nm-packet nm-packet-y", lane.tone === "accent" && "nm-packet-accent")}
          style={{ "--nm-col": lane.col, "--nm-dur": `${lane.dur}s`, "--nm-delay": `${lane.delay}s` } as Vars}
        />
      ))}
      {PACKET_NODES.map((node, index) => (
        <span
          key={`n${index}`}
          className="nm-packet-node"
          style={{ "--nm-col": node.col, "--nm-row": node.row, "--nm-delay": `${node.delay}s` } as Vars}
        />
      ))}
    </div>
  )
}

const BACKDROPS: Partial<Record<ColorTheme, () => React.JSX.Element>> = {
  "fibre-pulse": FibreBackdrop,
  airwave: AirwaveBackdrop,
  "packet-flow": PacketBackdrop,
}

/** Renders the moving background when a motion theme is active, otherwise nothing. */
export function MotionThemeBackdrop({ theme, className }: { theme?: ColorTheme; className?: string }) {
  const { colorTheme } = useColorTheme()
  const active = theme ?? colorTheme
  const Backdrop = BACKDROPS[active]
  if (!Backdrop) return null

  return (
    <div className={cn("nm-backdrop", className)} data-nm={active} aria-hidden="true">
      <Backdrop />
    </div>
  )
}
