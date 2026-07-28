// components/ui/page-loading.tsx
"use client"

import { NetilyLoader } from "@/components/ui/netily-loader"

export function PageLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center bg-background text-foreground">
      <NetilyLoader size={56} text={label} />
    </div>
  )
}