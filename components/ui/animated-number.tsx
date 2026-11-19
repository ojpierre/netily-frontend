"use client"

import { useEffect } from "react"
import { animate, motion, useMotionValue, useTransform } from "framer-motion"

export function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString())
  useEffect(() => {
    const controls = animate(mv, Number(value) || 0, { duration: 0.6, ease: "easeOut" })
    return () => controls.stop()
  }, [value, mv])
  return <motion.span>{text}</motion.span>
}