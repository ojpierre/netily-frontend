"use client"

/*
 * Isometric step illustrations for the marketing homepage.
 * Original Internetily artwork: 2:1 isometric boxes drawn from one projection helper,
 * coloured with the marketing tokens (--paper, --ink, --wash, --blue) so they follow
 * light and dark mode. Each scene animates when its card ([data-art-host]) is hovered
 * or focused, and plays once it scrolls into view on touch screens (no hover there).
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import s from "./step-art.module.css"

export type StepArtName = "pay" | "router" | "dashboard" | "brief" | "connect" | "live"

const OX = 120
const OY = 116

/** World (x right-down, y left-down, z up) to screen. */
const sx = (x: number, y: number) => OX + x - y
const sy = (x: number, y: number, z: number) => OY + (x + y) / 2 - z
const pt = (x: number, y: number, z: number) => `${sx(x, y).toFixed(1)},${sy(x, y, z).toFixed(1)}`

/** Draw flat 2D content on a face: front (y = const), side (x = const) or top (z = const). */
const onFront = (x: number, y: number, z: number) => `matrix(1 0.5 0 1 ${sx(x, y)} ${sy(x, y, z)})`
const onSide = (x: number, y: number, z: number) => `matrix(1 -0.5 0 1 ${sx(x, y)} ${sy(x, y, z)})`
const onTop = (x: number, y: number, z: number) => `matrix(1 0.5 -1 0.5 ${sx(x, y)} ${sy(x, y, z)})`

type BoxProps = { x: number; y: number; z: number; w: number; d: number; h: number; tone?: "base" | "accent" | "plate" | "dark"; className?: string; children?: ReactNode }

function Box({ x, y, z, w, d, h, tone = "base", className, children }: BoxProps) {
  const top = [pt(x, y, z + h), pt(x + w, y, z + h), pt(x + w, y + d, z + h), pt(x, y + d, z + h)].join(" ")
  const front = [pt(x, y + d, z + h), pt(x + w, y + d, z + h), pt(x + w, y + d, z), pt(x, y + d, z)].join(" ")
  const side = [pt(x + w, y, z + h), pt(x + w, y + d, z + h), pt(x + w, y + d, z), pt(x + w, y, z)].join(" ")
  return (
    <g className={`${s[tone]} ${className ?? ""}`}>
      <polygon className={s.faceTop} points={top} />
      <polygon className={s.faceFront} points={front} />
      <polygon className={s.faceSide} points={side} />
      {children}
    </g>
  )
}

function Platform() {
  return <Box x={-46} y={-46} z={0} w={92} d={92} h={4} tone="plate" />
}

/** Internetily mark: blue bolt over the rounded "i" bar, drawn at roughly 10 x 33 units. */
function Mark({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`scale(${scale * 0.13})`}>
      <path className={s.markBolt} d="M75 4 6 74l36-5-17 46 51-68-34 5Z" />
      <rect className={s.markBar} x="22" y="92" width="38" height="160" rx="19" />
    </g>
  )
}

function Coin({ cx, cy, className }: { cx: number; cy: number; className?: string }) {
  const rx = 13, ry = 6.5, t = 4
  return (
    <g className={className}>
      <ellipse className={s.coinSide} cx={cx} cy={cy} rx={rx} ry={ry} />
      <rect className={s.coinSideFill} x={cx - rx} y={cy - t} width={rx * 2} height={t} />
      <path className={s.coinEdge} d={`M${cx - rx} ${cy - t}v${t}M${cx + rx} ${cy - t}v${t}`} />
      <ellipse className={s.coinTop} cx={cx} cy={cy - t} rx={rx} ry={ry} />
      <ellipse className={s.coinRing} cx={cx} cy={cy - t} rx={rx - 4} ry={ry - 2} />
    </g>
  )
}

/** A cable plus a light pulse that runs along it while the card is active. */
function Cable({ d, delay = 0 }: { d: string; delay?: number }) {
  return (
    <g>
      <path className={s.cableEdge} d={d} />
      <path className={s.cable} d={d} />
      <path className={s.packet} d={d} pathLength={1} style={{ animationDelay: `${delay}ms` }} />
    </g>
  )
}

function Check({ className, d = "M-4 0l3 3 5-6" }: { className?: string; d?: string }) {
  return <path className={`${s.check} ${className ?? ""}`} d={d} pathLength={1} />
}

// ─── Scenes ─────────────────────────────────────────────────────────────────

function PayScene() {
  return (
    <>
      <Platform />
      {/* phone standing on the plate, screen facing the viewer */}
      <Box x={-24} y={-14} z={4} w={36} d={7} h={68} className={s.lift}>
        <g transform={onFront(-24, -7, 72)}>
          <rect className={s.screen} x="2.5" y="4" width="31" height="60" rx="3" />
          <rect className={s.screenBar} x="13" y="7" width="10" height="1.6" rx=".8" />
          <g className={s.pop}>
            <rect className={s.card} x="5" y="15" width="26" height="27" rx="2.5" />
            <rect className={s.accentFill} x="8" y="18.5" width="13" height="2.2" rx="1.1" />
            <rect className={s.cardLine} x="8" y="23" width="20" height="1.6" rx=".8" />
            <rect className={s.cardLine} x="8" y="26" width="15" height="1.6" rx=".8" />
            <g className={s.pinDots}>
              {[0, 1, 2, 3].map((i) => <circle key={i} cx={11 + i * 4.6} cy="32" r="1.2" style={{ transitionDelay: `${150 + i * 90}ms` }} />)}
            </g>
            <rect className={s.accentFill} x="17" y="36" width="11" height="3.4" rx="1.7" />
          </g>
          <g transform="translate(18 53)">
            <circle className={s.okDisc} r="5.5" />
            <Check className={s.checkLate} d="M-2.6 0l1.8 1.9 3.4-3.8" />
          </g>
        </g>
      </Box>
      {/* coin stack, the fourth coin drops in on hover */}
      <Coin cx={146} cy={140} />
      <Coin cx={146} cy={136} />
      <Coin cx={146} cy={132} />
      <Coin cx={146} cy={128} className={s.drop} />
      {/* payment toast */}
      <g className={s.toast}>
        <rect className={s.toastCard} x="150" y="32" width="72" height="30" rx="8" />
        <circle className={s.toastDot} cx="163" cy="47" r="5" />
        <Check className={s.toastCheck} d="M160.6 47l1.6 1.7 3-3.4" />
        <text className={s.toastText} x="172" y="44.5">Payment</text>
        <text className={s.toastSub} x="172" y="54">matched</text>
      </g>
    </>
  )
}

function RouterScene() {
  const ports = [7, 15, 23, 31, 39]
  return (
    <>
      <Platform />
      {/* customer devices */}
      <Box x={-44} y={24} z={4} w={16} d={14} h={9} />
      <g transform={onFront(-44, 38, 13)}><circle className={s.led} cx="12" cy="4.5" r="1.3" style={{ animationDelay: "300ms" }} /></g>
      <Box x={24} y={-44} z={4} w={14} d={16} h={9} />
      <g transform={onFront(24, -28, 13)}><circle className={s.led} cx="10" cy="4.5" r="1.3" style={{ animationDelay: "650ms" }} /></g>
      {/* router (stays put so its cables stay plugged in) */}
      <Box x={-34} y={-22} z={4} w={60} d={38} h={16}>
        <g transform={onFront(-34, 16, 20)}>
          {ports.map((u) => <rect key={u} className={s.port} x={u} y="5" width="6" height="5" rx=".6" />)}
          {[49, 54].map((u, i) => <circle key={u} className={s.led} cx={u} cy="7.5" r="1.4" style={{ animationDelay: `${i * 220}ms` }} />)}
        </g>
        <g transform={`${onSide(26, 16, 20)} translate(18 1.5)`}><Mark scale={0.4} /></g>
        <Box x={-30} y={-20} z={20} w={3} d={3} h={26} />
        <Box x={20} y={-20} z={20} w={3} d={3} h={26} />
      </Box>
      {/* cables from the first and last router ports into each device */}
      <Cable d="M80 99.5 C79 113 66 117 61 109" delay={0} />
      <Cable d="M112 115.5 C116 133 170 131 179 109" delay={350} />
      {/* signal from the right antenna */}
      <g className={s.waves} transform={`translate(${sx(21.5, -18.5)} ${sy(21.5, -18.5, 48)})`}>
        {[8, 14, 20].map((r, i) => (
          <path key={r} d={`M${-r * 0.8} ${-r * 0.35}A${r} ${r} 0 0 1 ${r * 0.8} ${-r * 0.35}`} style={{ animationDelay: `${i * 180}ms` }} />
        ))}
      </g>
    </>
  )
}

function DashboardScene() {
  const bars = [{ u: 9, h: 9 }, { u: 18, h: 15 }, { u: 27, h: 12 }, { u: 36, h: 21 }]
  return (
    <>
      <Platform />
      {/* laptop: screen and base lift together */}
      <g className={s.lift}>
      <Box x={-36} y={-20} z={7} w={62} d={4} h={44}>
        <g transform={onFront(-36, -16, 51)}>
          <rect className={s.screen} x="2" y="2" width="58" height="40" rx="2.5" />
          <rect className={s.accentFill} x="6" y="6" width="14" height="2.4" rx="1.2" />
          <rect className={s.screenLine} x="6" y="10.5" width="9" height="1.5" rx=".75" />
          {bars.map(({ u, h }, i) => (
            <rect key={u} className={s.bar} x={u} y={37 - h} width="6" height={h} rx="1" style={{ transitionDelay: `${i * 90}ms` }} />
          ))}
          <polyline className={s.trend} points="46,33 50,28 53,30 57,20" pathLength={1} />
        </g>
      </Box>
      {/* laptop base with keys */}
      <Box x={-36} y={-16} z={4} w={62} d={40} h={3}>
        <g transform={onTop(-36, -16, 7)}>
          {Array.from({ length: 3 }).flatMap((_, r) => Array.from({ length: 8 }).map((__, c) => (
            <rect key={`${r}-${c}`} className={s.key} x={5 + c * 6.6} y={5 + r * 6} width="5" height="4.2" rx=".6" />
          )))}
          <rect className={s.key} x="21" y="25" width="20" height="10" rx="1" />
        </g>
      </Box>
      </g>
      {/* floating summary card */}
      <g className={s.toast}>
        <rect className={s.toastCard} x="166" y="22" width="60" height="38" rx="8" />
        <text className={s.toastSub} x="174" y="35">Renewals</text>
        <rect className={s.toastTrack} x="174" y="41" width="44" height="5" rx="2.5" />
        <rect className={s.toastFill} x="174" y="41" width="44" height="5" rx="2.5" />
        <text className={s.toastText} x="174" y="54">On track</text>
      </g>
    </>
  )
}

function BriefScene() {
  const rows = [16, 30, 44, 58]
  return (
    <>
      <Platform />
      {/* clipboard lying on the plate */}
      <Box x={-40} y={-34} z={4} w={58} d={74} h={3} className={s.lift}>
        <g transform={onTop(-40, -34, 7)}>
          <rect className={s.sheet} x="4" y="5" width="50" height="65" rx="2" />
          <rect className={s.clip} x="19" y="1" width="20" height="7" rx="2" />
          {rows.map((v, i) => (
            <g key={v}>
              <rect className={s.box} x="9" y={v} width="7" height="7" rx="1.2" />
              <path className={s.tick} d={`M10.2 ${v + 3.6}l2 2 3.4-4`} pathLength={1} style={{ transitionDelay: `${i * 140}ms` }} />
              <rect className={s.cardLine} x="20" y={v + 1.5} width={i % 2 ? 22 : 28} height="2" rx="1" />
              <rect className={s.cardLineSoft} x="20" y={v + 5} width="16" height="1.6" rx=".8" />
            </g>
          ))}
        </g>
      </Box>
      {/* conversation */}
      <g className={s.bubbleA}>
        <path className={s.bubbleAccent} d="M140 22h62a9 9 0 0 1 9 9v12a9 9 0 0 1-9 9h-50l-9 8v-8h-3a9 9 0 0 1-9-9V31a9 9 0 0 1 9-9Z" />
        {[0, 1, 2].map((i) => <circle key={i} className={s.typing} cx={158 + i * 9} cy="37" r="2.6" style={{ animationDelay: `${i * 140}ms` }} />)}
      </g>
      <g className={s.bubbleB}>
        <path className={s.bubblePlain} d="M164 64h48a8 8 0 0 1 8 8v8a8 8 0 0 1-8 8h-6v7l-8-7h-34a8 8 0 0 1-8-8v-8a8 8 0 0 1 8-8Z" />
        <rect className={s.cardLine} x="166" y="72" width="38" height="2.2" rx="1.1" />
        <rect className={s.cardLineSoft} x="166" y="78" width="26" height="2" rx="1" />
      </g>
    </>
  )
}

function ConnectScene() {
  return (
    <>
      <Platform />
      {/* subscriber records on the left, M-Pesa phone on the right */}
      {[0, 1, 2].map((i) => <Box key={i} x={-44} y={20} z={4 + i * 3.5} w={20} d={16} h={2.5} tone={i === 2 ? "accent" : "base"} />)}
      <Box x={22} y={-44} z={4} w={14} d={24} h={4}>
        <g transform={onTop(22, -44, 8)}><rect className={s.screen} x="2" y="2.5" width="10" height="19" rx="1.5" /></g>
      </Box>
      {/* lower device (core / OLT), cabled to the records and the phone */}
      <Box x={-30} y={-24} z={4} w={56} d={36} h={12}>
        <g transform={onFront(-30, 12, 16)}>
          {[6, 13, 20, 27].map((u) => <rect key={u} className={s.port} x={u} y="4" width="5" height="4.4" rx=".6" />)}
          <circle className={s.led} cx="46" cy="6" r="1.3" />
        </g>
      </Box>
      <Cable d="M86.5 101.5 C86 114 74 117 68 109" delay={0} />
      <Cable d="M107.5 112 C110 131 162 132 169 114.5" delay={400} />
      {/* upper device (router) */}
      <Box x={-30} y={-24} z={17.5} w={56} d={36} h={12} className={s.lift}>
        <g transform={onFront(-30, 12, 29.5)}>
          {[6, 13, 20, 27].map((u) => <rect key={u} className={s.port} x={u} y="4" width="5" height="4.4" rx=".6" />)}
          <circle className={s.led} cx="46" cy="6" r="1.3" style={{ animationDelay: "250ms" }} />
        </g>
        <g transform={`${onSide(26, 12, 29.5)} translate(16 .5)`}><Mark scale={0.33} /></g>
      </Box>
    </>
  )
}

function LiveScene() {
  return (
    <>
      <Platform />
      {/* switch base */}
      <Box x={-38} y={-14} z={4} w={66} d={30} h={9}>
        <g transform={onFront(-38, 16, 13)}>
          <circle className={s.liveDot} cx="7" cy="4.5" r="1.6" />
          <text className={s.liveText} x="11" y="6.6">LIVE</text>
        </g>
        <g transform={onTop(-38, -14, 13)}>
          <rect className={s.track} x="6" y="7" width="54" height="16" rx="8" />
          <rect className={s.trackOn} x="6" y="7" width="54" height="16" rx="8" />
        </g>
      </Box>
      {/* knob slides from off to on */}
      <g className={s.knob}>
        <Box x={-30} y={-9} z={13} w={18} d={20} h={7} tone="accent" />
      </g>
      {/* go-live badge */}
      <g className={s.badge}>
        <circle className={s.badgeRing} r="20" />
        <circle className={s.badgeDisc} r="15" />
        <Check className={s.badgeCheck} d="M-6.5 .5l4.5 4.5 8.5-9.5" />
      </g>
      <g className={s.confetti} transform="translate(120 40)">
        {[[-30, -8, 0], [28, -14, 1], [-22, 18, 2], [32, 12, 0], [-6, -30, 1], [12, -28, 2]].map(([x, y, c], i) => (
          <rect key={i} className={s[`bit${c}` as "bit0"]} x="-2" y="-1.2" width="4" height="2.4" rx="1" style={{ "--tx": `${x}px`, "--ty": `${y}px`, transitionDelay: `${120 + i * 40}ms` } as CSSProperties} />
        ))}
      </g>
    </>
  )
}

const SCENES: Record<StepArtName, () => ReactNode> = {
  pay: PayScene,
  router: RouterScene,
  dashboard: DashboardScene,
  brief: BriefScene,
  connect: ConnectScene,
  live: LiveScene,
}

const ACCENTS = ["#0874cf", "#22a67d", "#d19b24"] as const

export function StepArt({ name, accent = 0 }: { name: StepArtName; accent?: 0 | 1 | 2 }) {
  const ref = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)

  // Touch screens have no hover: play the scene once it is mostly on screen.
  useEffect(() => {
    const el = ref.current
    if (!el || !window.matchMedia("(hover: none)").matches || !("IntersectionObserver" in window)) return
    const io = new IntersectionObserver(([entry]) => setPlay(entry.isIntersecting && entry.intersectionRatio > 0.55), { threshold: [0, 0.55, 1] })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const Scene = SCENES[name]
  return (
    <div ref={ref} className={s.wrap} data-play={play || undefined} style={{ "--a": ACCENTS[accent] } as CSSProperties} aria-hidden="true">
      <svg viewBox="12 14 216 154" fill="none" className={s.art} focusable="false">
        <Scene />
      </svg>
    </div>
  )
}
