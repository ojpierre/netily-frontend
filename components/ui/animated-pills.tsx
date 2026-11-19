"use client"

import React, { useId } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { spring } from "@/lib/plans-motion"

interface Option<T extends string> {
  value: T
  label: React.ReactNode
  ariaLabel?: string
}

export function AnimatedPills<T extends string>({
  value, onChange, options, className, itemClassName,
}: {
  value: T
  onChange: (v: T) => void
  options: Option<T>[]
  className?: string
  itemClassName?: string
}) {
  const id = useId()
  return (
    <div role="tablist" className={cn("inline-flex items-center rounded-full border border-border bg-card p-1 shadow-sm", className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <motion.button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={o.ariaLabel}
            whileTap={{ scale: 0.94 }}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              itemClassName
            )}
          >
            {active && (
              <motion.span
                layoutId={`pill-${id}`}
                transition={spring}
                className="absolute inset-0 rounded-full bg-primary shadow-sm"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">{o.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}