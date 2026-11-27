"use client"

import { useId, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { useColorTheme, type ColorTheme } from "@/components/theme-provider"
import { lightStrings, pineRow } from "@/lib/festive-art"

/*
 * Ambient background for the motion themes (including the Christmas ones). Purely decorative:
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

// ── Christmas ────────────────────────────────────────────────────

const BACK_PINES = pineRow(16, 240, 60, 110, 5)
const FRONT_PINES = pineRow(10, 240, 85, 150, 13)

function EvergreenBackdrop() {
  return (
    <>
      <div className="nm-snow-sway">
        <div className="nm-snow nm-snow-far" />
      </div>
      <svg className="nm-pines" viewBox="0 0 1000 240" preserveAspectRatio="xMidYMax slice">
        <path className="nm-pines-back" d={BACK_PINES} />
        <path className="nm-pines-front" d={FRONT_PINES} />
        <path className="nm-pines-snow" d="M0 228 C 180 216 330 236 520 224 S 850 214 1000 226 V240 H0Z" />
      </svg>
      <div className="nm-snow-sway">
        <div className="nm-snow nm-snow-mid" />
        <div className="nm-snow nm-snow-near" />
      </div>
    </>
  )
}

// Classic bulb colours: red, gold, green, blue
const BULB_TONES = ["oklch(0.62 0.22 25)", "oklch(0.84 0.15 85)", "oklch(0.64 0.16 150)", "oklch(0.68 0.15 245)"]

// Hung from the top edge: the loops dip just below the floating header, so the lowest
// bulbs show in the gap above the page content instead of hiding behind cards.
const LIGHT_STRINGS = lightStrings([
  { anchors: [-80, 560, 1180, 1520], y: -14, sag: 104, perSpan: 13 },
  { anchors: [-80, 260, 880, 1520], y: -24, sag: 110, perSpan: 12 },
])

const BOKEH = [
  { x: "72%", y: "38%", size: 120, dur: 19, delay: -2, red: false },
  { x: "88%", y: "62%", size: 90, dur: 23, delay: -9, red: true },
  { x: "56%", y: "74%", size: 150, dur: 27, delay: -14, red: false },
  { x: "30%", y: "56%", size: 80, dur: 21, delay: -6, red: true },
  { x: "18%", y: "82%", size: 130, dur: 25, delay: -17, red: false },
]

function FairyLightsBackdrop() {
  // Unique gradient ids: the backdrop can render more than once (Settings previews + the shell)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  return (
    <>
      {BOKEH.map((b, i) => (
        <span
          key={i}
          className={cn("nm-bokeh", b.red && "nm-bokeh-red")}
          style={{ left: b.x, top: b.y, width: b.size, height: b.size, "--nm-dur": `${b.dur}s`, "--nm-delay": `${b.delay}s` } as Vars}
        />
      ))}
      <svg className="nm-lights" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMin slice">
        <defs>
          {BULB_TONES.map((tone, i) => (
            <radialGradient key={i} id={`${uid}-glow-${i}`}>
              <stop offset="0%" stopColor={tone} stopOpacity={0.9} />
              <stop offset="45%" stopColor={tone} stopOpacity={0.35} />
              <stop offset="100%" stopColor={tone} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
        {LIGHT_STRINGS.map((string, s) => (
          <g key={s}>
            <path className="nm-light-wire" d={string.d} />
            {string.bulbs.map((bulb, i) => (
              <g key={i} transform={`translate(${bulb.x} ${bulb.y}) rotate(${bulb.angle})`}>
                <circle
                  className="nm-bulb-glow"
                  cx={0}
                  cy={10}
                  r={16}
                  fill={`url(#${uid}-glow-${bulb.tone})`}
                  style={{ "--nm-dur": `${bulb.dur}s`, "--nm-delay": `${bulb.delay}s` } as Vars}
                />
                <rect className="nm-bulb-cap" x={-2.6} y={0.5} width={5.2} height={4} rx={1} />
                <ellipse
                  className="nm-bulb"
                  cx={0}
                  cy={10}
                  rx={4.2}
                  ry={6.4}
                  fill={BULB_TONES[bulb.tone]}
                  style={{ "--nm-dur": `${bulb.dur}s`, "--nm-delay": `${bulb.delay}s` } as Vars}
                />
              </g>
            ))}
          </g>
        ))}
      </svg>
    </>
  )
}

const BACKDROPS: Partial<Record<ColorTheme, () => React.JSX.Element>> = {
  "fibre-pulse": FibreBackdrop,
  airwave: AirwaveBackdrop,
  "packet-flow": PacketBackdrop,
  evergreen: EvergreenBackdrop,
  "fairy-lights": FairyLightsBackdrop,
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
