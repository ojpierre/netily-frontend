"use client"

import dynamic from "next/dynamic"
import { Wifi } from "lucide-react"

// ogl touches the DOM canvas directly — load client-only, no SSR
const Strands = dynamic(() => import("@/components/effects/strands"), { ssr: false })

/** `themed` paints the badge with the theme colour (--primary) instead of the fixed brand gradient. */
export function LogoStrandBadge({ themed = false }: { themed?: boolean } = {}) {
  return (
    <div className="relative w-20 h-20 mx-auto mb-4">
      {/* Strands contained in a small circular viewport behind the icon */}
      <div className="absolute inset-[-40px] rounded-full overflow-hidden opacity-70 pointer-events-none">
        <Strands
          colors={["#2563eb", "#7c3aed", "#06b6d4"]}
          count={3}
          speed={0.4}
          amplitude={0.8}
          thickness={0.6}
          glow={2.2}
          taper={4}
          scale={0.9}
          intensity={0.5}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Logo badge sits on top */}
      <div className={`relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl border border-white/20 ${themed ? "bg-primary text-primary-foreground shadow-primary/30" : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"}`}>
        <Wifi className="w-10 h-10 drop-shadow-lg" />
      </div>
    </div>
  )
}