// Shared, deterministic geometry for the Christmas themes (captive portal snow and the
// admin Evergreen / Fairy Lights motion themes). Pure functions, so server and client
// renders always match.

/**
 * A row of tiered pine trees as one SVG path in a 1000-wide viewBox.
 * `baseY` is the ground line; heights vary between minH and maxH.
 */
export function pineRow(count: number, baseY: number, minH: number, maxH: number, seed: number): string {
  let d = ""
  for (let i = 0; i < count; i++) {
    const x = ((i + 0.5) / count) * 1000 + (((i * 37 + seed) % 23) - 11)
    const h = minH + (((i * 53 + seed * 7) % 100) / 100) * (maxH - minH)
    const w = h * 0.36
    const top = baseY - h
    // three stacked tiers, widest at the bottom, plus a short trunk
    for (let t = 0; t < 3; t++) {
      const tierTop = top + t * h * 0.24
      const tierBase = top + h * (0.42 + t * 0.24)
      const tierW = w * (0.55 + t * 0.25)
      d += `M${x.toFixed(1)} ${tierTop.toFixed(1)}L${(x + tierW).toFixed(1)} ${tierBase.toFixed(1)}L${(x - tierW).toFixed(1)} ${tierBase.toFixed(1)}Z`
    }
    d += `M${(x - w * 0.09).toFixed(1)} ${(baseY - h * 0.12).toFixed(1)}h${(w * 0.18).toFixed(1)}V${baseY}h${(-w * 0.18).toFixed(1)}Z`
  }
  return d
}

export interface Bulb {
  x: number
  y: number
  /** Rotation in degrees so the bulb hangs along the wire. */
  angle: number
  /** Index into the bulb colour cycle. */
  tone: number
  /** Twinkle duration and delay in seconds. */
  dur: number
  delay: number
}

export interface LightString {
  d: string
  bulbs: Bulb[]
}

/**
 * Strings of fairy lights draped between anchor points (quadratic sags), with bulbs
 * spaced evenly along each span.
 */
export function lightStrings(
  spans: { anchors: number[]; y: number; sag: number; perSpan: number }[],
  toneOffset = 0,
): LightString[] {
  let n = toneOffset
  return spans.map(({ anchors, y, sag, perSpan }) => {
    let d = `M${anchors[0]} ${y}`
    const bulbs: Bulb[] = []
    for (let s = 0; s < anchors.length - 1; s++) {
      const x0 = anchors[s]
      const x1 = anchors[s + 1]
      const cx = (x0 + x1) / 2
      const cy = y + sag * 2
      d += ` Q${cx} ${cy} ${x1} ${y}`
      for (let k = 0; k < perSpan; k++) {
        const t = (k + 0.5) / perSpan
        const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1
        const by = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy + t * t * y
        const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx)
        const dy = 2 * (1 - t) * (cy - y) + 2 * t * (y - cy)
        bulbs.push({
          x: Math.round(bx * 10) / 10,
          y: Math.round(by * 10) / 10,
          angle: Math.round((Math.atan2(dy, dx) * 180) / Math.PI),
          tone: n % 4,
          dur: 2.4 + ((n * 7) % 10) / 5,
          delay: -((n * 13) % 30) / 10,
        })
        n++
      }
    }
    return { d, bulbs }
  })
}
