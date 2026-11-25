import Image from "next/image"
import { cn } from "@/lib/utils"

/*
 * Internetily brand marks, cut from the master artwork (public/brand/*):
 *   lockup = bolt-and-i mark beside the "internetily" wordmark (551x120)
 *   mark   = bolt-and-i mark on its own (77x256)
 * `tone`:
 *   "auto"   ink logo in light mode, white logo in dark mode (tenant app, follows .dark)
 *   "onDark" always the white logo (superadmin, dark surfaces)
 *   "onLight" always the ink logo
 */

type Tone = "auto" | "onDark" | "onLight"

const ASSETS = {
  lockup: { ink: "/brand/internetily-lockup.png", white: "/brand/internetily-lockup-white.png", width: 551, height: 120 },
  mark: { ink: "/brand/internetily-mark.png", white: "/brand/internetily-mark-white.png", width: 77, height: 256 },
} as const

export function InternetilyLogo({
  variant = "lockup",
  tone = "auto",
  className,
  priority,
}: {
  variant?: "lockup" | "mark"
  tone?: Tone
  /** Size with a height utility, e.g. "h-6"; width follows the artwork. */
  className?: string
  priority?: boolean
}) {
  const asset = ASSETS[variant]
  const base = cn("w-auto select-none", className)
  const common = { alt: "Internetily", width: asset.width, height: asset.height, priority, draggable: false }

  if (tone === "onDark") return <Image src={asset.white} className={base} {...common} />
  if (tone === "onLight") return <Image src={asset.ink} className={base} {...common} />

  return (
    <>
      <Image src={asset.ink} className={cn(base, "dark:hidden")} {...common} />
      <Image src={asset.white} className={cn(base, "hidden dark:block")} {...common} alt="" aria-hidden="true" />
    </>
  )
}
