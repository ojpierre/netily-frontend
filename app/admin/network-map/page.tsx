"use client"

import dynamic from "next/dynamic"

const NetworkMapClient = dynamic(
  () => import("@/components/network-map/network-map-client").then((m) => m.NetworkMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[70vh] items-center justify-center text-sm text-slate-400">
        Loading map…
      </div>
    ),
  }
)

export default function NetworkMapPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fiber &amp; Network Map</h1>
        <p className="text-sm text-muted-foreground">
          Plot cables, splitters, ODFs, poles and customer drops on a map, and mark faults or cuts.
        </p>
      </div>
      <NetworkMapClient />
    </div>
  )
}