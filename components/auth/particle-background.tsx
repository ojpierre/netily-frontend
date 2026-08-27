"use client"

import { useEffect, useRef } from "react"

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1
    let animationFrame = 0
    let prefersReducedMotion = false

    try {
      prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    } catch {
      prefersReducedMotion = false
    }

    const pointer = { x: -9999, y: -9999, active: false }

    type Particle = {
      x: number; y: number; vx: number; vy: number
      radius: number; depth: number; hue: "slate" | "blue"
      pulseSpeed: number; pulsePhase: number; spark: boolean
    }

    let particles: Particle[] = []

    const countForSize = (w: number, h: number) => {
      const area = w * h
      const target = Math.round(area / 9000)
      return Math.max(60, Math.min(220, target))
    }

    const makeParticle = (w: number, h: number): Particle => {
      const depth = 0.4 + Math.random() * 0.6
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12 * depth,
        vy: (Math.random() - 0.5) * 0.12 * depth,
        radius: (1.4 + Math.random() * 2.6) * depth,
        depth,
        hue: Math.random() < 0.7 ? "slate" : "blue",
        pulseSpeed: 0.4 + Math.random() * 0.6,
        pulsePhase: Math.random() * Math.PI * 2,
        spark: Math.random() < 0.06,
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const desired = countForSize(width, height)
      if (particles.length === 0) {
        particles = Array.from({ length: desired }, () => makeParticle(width, height))
      } else if (particles.length < desired) {
        particles = particles.concat(
          Array.from({ length: desired - particles.length }, () => makeParticle(width, height))
        )
      } else if (particles.length > desired) {
        particles = particles.slice(0, desired)
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
    }
    const handlePointerLeave = () => { pointer.active = false }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerleave", handlePointerLeave)

    let t = 0
    const connectDist = 120

    const render = () => {
      t += 0.016
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (pointer.active) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const distSq = dx * dx + dy * dy
          const radius = 90
          if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq) || 1
            const force = ((radius - dist) / radius) * 0.6 * p.depth
            p.vx += (dx / dist) * force * 0.05
            p.vy += (dy / dist) * force * 0.05
          }
        }

        p.vx *= 0.985
        p.vy *= 0.985
        const maxSpeed = 0.35
        const speed = Math.hypot(p.vx, p.vy)
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed
          p.vy = (p.vy / speed) * maxSpeed
        }

        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20
      }

      if (!prefersReducedMotion) {
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i]
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j]
            const dx = a.x - b.x
            const dy = a.y - b.y
            const dist = Math.hypot(dx, dy)
            if (dist < connectDist) {
              const alpha = (1 - dist / connectDist) * 0.18 * Math.min(a.depth, b.depth)
              ctx.strokeStyle = `rgba(30, 64, 175, ${alpha})`
              ctx.lineWidth = 0.7
              ctx.beginPath()
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
              ctx.stroke()
            }
          }
        }
      }

      for (const p of particles) {
        const pulse = 0.5 + 0.5 * Math.sin(t * p.pulseSpeed + p.pulsePhase)
        const baseAlpha = (p.spark ? 0.75 : 0.5) * p.depth
        const alpha = baseAlpha + pulse * 0.25 * p.depth
        const color = p.hue === "blue" ? "37, 99, 235" : "51, 65, 85"

        ctx.beginPath()
        ctx.fillStyle = `rgba(${color}, ${Math.min(alpha, 1)})`
        ctx.shadowColor = `rgba(${color}, ${Math.min(alpha * 0.6, 1)})`
        ctx.shadowBlur = p.spark ? 6 : 2
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      animationFrame = requestAnimationFrame(render)
    }

    animationFrame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
}