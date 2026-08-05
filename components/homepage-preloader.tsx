"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

const LOAD_DURATION_MS = 5000

export function HomepagePreloader() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    let animationFrame = 0
    let closeTimer = 0
    const startedAt = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startedAt
      const nextProgress = Math.min(100, Math.round((elapsed / LOAD_DURATION_MS) * 100))
      setProgress(nextProgress)

      if (elapsed < LOAD_DURATION_MS) {
        animationFrame = requestAnimationFrame(tick)
        return
      }

      setProgress(100)
      closeTimer = window.setTimeout(() => {
        document.body.style.overflow = previousOverflow
        setVisible(false)
      }, 180)
    }

    animationFrame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.clearTimeout(closeTimer)
      document.body.style.overflow = previousOverflow
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center bg-white text-slate-950">
      <div className="flex w-full max-w-[360px] flex-col items-center px-8 text-center">
        <Image
          src="/internetily_logo_2k.jpeg"
          alt="Internetily"
          width={220}
          height={220}
          priority
          className="h-auto w-[min(58vw,220px)] object-contain"
        />

        <div className="mt-9 w-full">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span>Loading</span>
            <span className="tabular-nums text-slate-900">{progress}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Loading Internetily homepage"
          >
            <div
              className="h-full rounded-full bg-slate-950 transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
