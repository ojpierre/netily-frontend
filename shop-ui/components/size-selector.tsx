"use client"

import { useState } from "react"

interface Size {
  size: string
  available: boolean
}

interface SizeSelectorProps {
  sizes: Size[]
  onSelect?: (size: string) => void
}

export function SizeSelector({ sizes, onSelect }: SizeSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (size: string, available: boolean) => {
    if (!available) return
    setSelected(size)
    onSelect?.(size)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm tracking-widest uppercase">Size</span>
        <button className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">
          Size Guide
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map(({ size, available }) => (
          <button
            key={size}
            onClick={() => handleSelect(size, available)}
            disabled={!available}
            className={`min-w-[3rem] px-4 py-3 text-sm border transition-all duration-300 ${
              selected === size
                ? "border-foreground bg-foreground text-background"
                : available
                  ? "border-muted hover:border-foreground"
                  : "border-muted text-muted-foreground/40 cursor-not-allowed line-through"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}
