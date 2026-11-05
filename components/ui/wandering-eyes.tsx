import type { ComponentProps, CSSProperties } from "react"
import { cn } from "@/lib/utils"

type WanderingEyesProps = ComponentProps<"span"> & {
  /** Eye diameter as a share of the container's smaller side (0.28–0.7). */
  eyeScale?: number
  gapScale?: number
  pupilScale?: number
  /** How far the eye closes on a blink (0.15–1). */
  blinkScale?: number
  travelScale?: number
  /** One full look-around cycle, e.g. "4s". */
  duration?: string
  /** Accessible label announced to screen readers. */
  label?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

// Keyframes are global and identical for every instance; React 19 hoists and
// de-duplicates <style> tags that carry `href` + `precedence`.
const KEYFRAMES = `
@keyframes loading-ui-wandering-eyes-move {
  0%, 10% { background-position: 0 0; }
  13%, 40% { background-position: calc(var(--loading-ui-wandering-eyes-eye) * var(--loading-ui-wandering-eyes-travel-scale) * -1) 0; }
  43%, 70% { background-position: calc(var(--loading-ui-wandering-eyes-eye) * var(--loading-ui-wandering-eyes-travel-scale)) 0; }
  73%, 90% { background-position: 0 calc(var(--loading-ui-wandering-eyes-eye) * var(--loading-ui-wandering-eyes-travel-scale)); }
  93%, 100% { background-position: 0 0; }
}
@keyframes loading-ui-wandering-eyes-blink {
  0%, 10%, 12%, 20%, 22%, 40%, 42%, 60%, 62%, 70%, 72%, 90%, 92%, 98%, 100% { height: var(--loading-ui-wandering-eyes-eye); }
  11%, 21%, 41%, 61%, 71%, 91%, 99% { height: calc(var(--loading-ui-wandering-eyes-eye) * var(--loading-ui-wandering-eyes-blink)); }
}
.loading-ui-wandering-eyes-eye {
  animation: loading-ui-wandering-eyes-move var(--duration, 10s) infinite, loading-ui-wandering-eyes-blink var(--duration, 10s) infinite;
}
@media (prefers-reduced-motion: reduce) {
  .loading-ui-wandering-eyes-eye { animation: none; }
}
`

/**
 * Two eyes that look around and blink — a friendly loading indicator.
 * Colour follows `currentColor`, so set a text colour (including `dark:`
 * variants) on the element or a parent to match the theme.
 */
export function WanderingEyes({
  className,
  style,
  eyeScale = 0.62,
  gapScale = 0.09,
  pupilScale = 0.32,
  blinkScale = 0.375,
  travelScale = 0.3125,
  duration,
  label = "Loading",
  ...props
}: WanderingEyesProps) {
  const eyesStyle = {
    containerType: "size",
    ...style,
    "--loading-ui-wandering-eyes-eye": `${(clamp(eyeScale, 0.28, 0.7) * 100).toFixed(2)}cqmin`,
    "--loading-ui-wandering-eyes-gap": `${(clamp(gapScale, 0.04, 0.3) * 100).toFixed(2)}cqmin`,
    "--loading-ui-wandering-eyes-pupil-scale": `${clamp(pupilScale, 0.12, 0.45)}`,
    "--loading-ui-wandering-eyes-blink": `${clamp(blinkScale, 0.15, 1)}`,
    "--loading-ui-wandering-eyes-travel-scale": `${clamp(travelScale, 0.08, 0.5)}`,
    ...(duration ? { "--duration": duration } : {}),
  } as CSSProperties

  return (
    <>
      <style href="loading-ui-wandering-eyes" precedence="default">{KEYFRAMES}</style>
      <span
        role="status"
        className={cn(
          "relative inline-flex aspect-9/4 items-center justify-center align-middle [--eye-color:color-mix(in_srgb,currentColor_16%,transparent)] [--pupil-color:currentColor]",
          className,
        )}
        style={eyesStyle}
        {...props}
      >
        <span aria-hidden="true" className="inline-flex items-center justify-center gap-(--loading-ui-wandering-eyes-gap)">
          {[0, 1].map((index) => (
            <span
              key={index}
              className="loading-ui-wandering-eyes-eye inline-block rounded-full"
              style={{
                width: "var(--loading-ui-wandering-eyes-eye)",
                height: "var(--loading-ui-wandering-eyes-eye)",
                backgroundColor: "var(--eye-color)",
                backgroundImage:
                  "radial-gradient(circle calc(var(--loading-ui-wandering-eyes-eye) * var(--loading-ui-wandering-eyes-pupil-scale)), var(--pupil-color) 100%, transparent 0)",
                backgroundRepeat: "no-repeat",
              }}
            />
          ))}
        </span>
        <span className="sr-only">{label}</span>
      </span>
    </>
  )
}
