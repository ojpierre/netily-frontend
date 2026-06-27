"use client"

import { Zap } from "lucide-react"

interface LightningLoaderProps {
  label?: string
  className?: string
}

export function LightningLoader({ label = "Loading Netily", className = "" }: LightningLoaderProps) {
  return (
    <div className={`flex min-h-[280px] flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-xl animate-pulse" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 shadow-2xl ring-1 ring-white/10">
          <Zap className="h-8 w-8 fill-yellow-300 text-yellow-300 drop-shadow-[0_0_14px_rgba(250,204,21,0.75)]" />
        </div>
        <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-yellow-300 animate-ping" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
        <p className="mt-1 text-xs text-slate-500">Powering up your workspace...</p>
      </div>
    </div>
  )
}

export default LightningLoader
