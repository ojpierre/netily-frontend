import type { Transition, Variants } from "framer-motion"

export const spring: Transition = { type: "spring", stiffness: 380, damping: 30, mass: 0.8 }
export const springSoft: Transition = { type: "spring", stiffness: 260, damping: 26 }

export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: springSoft },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
}