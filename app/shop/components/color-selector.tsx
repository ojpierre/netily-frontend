"use client"

import { useState } from "react"
import { Check } from "lucide-react"

interface Color {
  name: string
  hex: string
  available: boolean
}

interface ColorSelectorProps {
  colors: Color[]
  onSelect?: (color: string) => void
}

export function ColorSelector({ colors, onSelect }: ColorSelectorProps) {
  const [selected, setSelected] = useState<string | null>(colors.find((c) => c.available)?.name || null)

  const handleSelect = (name: string, available: boolean) => {
    if (!available) return
    setSelected(name)
    onSelect?.(name)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm tracking-widest uppercase">Color</span>
        {selected && <span className="text-sm text-muted-foreground">— {selected}</span>}
      </div>
      <div className="flex flex-wrap gap-3">
        {colors.map(({ name, hex, available }) => (
          <button
            key={name}
            onClick={() => handleSelect(name, available)}
            disabled={!available}
            className={`relative w-8 h-8 rounded-full transition-all duration-300 ${
              !available ? "opacity-30 cursor-not-allowed" : "hover:scale-110"
            } ${selected === name ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
            style={{ backgroundColor: hex }}
            title={name}
          >
            {selected === name && (
              <Check
                className={`absolute inset-0 m-auto w-4 h-4 ${
                  hex === "#0A0A0A" ||
                  hex === "#000080" ||
                  hex === "#36454F" ||
                  hex === "#722F37" ||
                  hex === "#3E2723" ||
                  hex === "#228B22"
                    ? "text-white"
                    : "text-foreground"
                }`}
              />
            )}
            {!available && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-full h-[1px] bg-foreground rotate-45 absolute" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
