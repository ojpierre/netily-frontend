"use client"

// Live Preview for the portal themes with their own layouts (18 Bubbles, 19 Aurora
// Spotlight, 20 Boarding Pass). It renders the same plan components the real portal
// uses, with sample plans, so what the admin sees here is what customers get.

import { useState } from "react"
import { Key, Megaphone, ReceiptText, Ticket, Wifi } from "lucide-react"
import type { HotspotPlan } from "@/app/hotspot/[router_id]/HotspotClientView"
import BubblePlans, { BUBBLE_GRID_CLASS } from "@/app/hotspot/[router_id]/BubblePlans"
import SpotlightPlans from "@/app/hotspot/[router_id]/SpotlightPlans"
import BoardingPassPlans from "@/app/hotspot/[router_id]/BoardingPassPlans"
import { bubblesSans } from "@/app/hotspot/[router_id]/bubbles-fonts"

export const SIGNATURE_TEMPLATE_IDS = [18, 19, 20]

function samplePlan(id: string, name: string, duration: string, price: number, speed: number, data: string | null, popular = false): HotspotPlan {
  return {
    id,
    name,
    price,
    currency: "KES",
    validity_type: "hours",
    validity_value: 1,
    duration_display: duration,
    download_speed: speed,
    upload_speed: speed,
    speed_unit: "Mbps",
    speed_display: `${speed} Mbps`,
    limitation_type: data ? "DATA" : "UNLIMITED",
    data_limit_value: data ? 1 : null,
    data_limit_unit: "GB",
    data_limit_display: data || "Unlimited",
    simultaneous_devices: popular ? 2 : 1,
    is_popular: popular,
  }
}

const SAMPLE_PLANS: HotspotPlan[] = [
  samplePlan("p1", "1 hour", "1 Hour", 10, 5, "500 MB"),
  samplePlan("p2", "8 hours", "8 Hours", 20, 5, null),
  samplePlan("p3", "1 day", "24 Hours", 50, 10, null, true),
  samplePlan("p4", "1 week", "7 Days", 250, 10, null),
  samplePlan("p5", "2 weeks", "14 Days", 450, 15, null),
  samplePlan("p6", "1 month", "30 Days", 900, 20, null),
]

const formatPrice = (p: HotspotPlan) => `Ksh ${p.price.toLocaleString("en-KE")}`

export function SignaturePortalPreview({
  templateId,
  displayName,
  supportPhone,
  announcementText,
  logoSrc,
  hidePlanSpeed,
}: {
  templateId: number
  displayName: string
  supportPhone: string
  announcementText: string
  logoSrc: string | null
  hidePlanSpeed: boolean
}) {
  // Clicking a plan in the preview just highlights it (no payment sheet here)
  const [picked, setPicked] = useState<string | null>("p2")
  const pick = (p: HotspotPlan) => setPicked(p.id)

  const logo = logoSrc ? <img src={logoSrc} alt="" className="mx-auto h-10 max-w-[120px] object-contain" /> : null

  return (
    <div className="flex justify-center rounded-xl border bg-muted/40 p-4">
      {/* Phone frame: real portal width, scrolls like the phone would */}
      <div className="relative w-full max-w-[340px] overflow-hidden rounded-[2rem] border-[6px] border-zinc-900 shadow-2xl">
        <div className="h-[560px] overflow-y-auto overscroll-contain">
          {templateId === 18 && (
            <div className={`min-h-full bg-[#fdeef1] bg-[radial-gradient(ellipse_75%_40%_at_100%_0%,#fbd5de_0%,transparent_70%),radial-gradient(ellipse_55%_35%_at_0%_45%,#f4dcf6_0%,transparent_70%)] px-[14px] pb-8 ${bubblesSans.className}`}>
              <div className="flex flex-wrap items-center justify-center gap-x-3 pt-1">
                {[{ l: "Have a voucher?", I: Ticket }, { l: "Have a receipt?", I: ReceiptText }, { l: "Login", I: Key }].map(({ l, I }) => (
                  <span key={l} className="inline-flex min-h-[40px] items-center gap-1.5 text-[11px] text-[#725a67]">
                    <I className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                    {l}
                  </span>
                ))}
              </div>
              {announcementText && (
                <p className="mt-2 rounded-xl border border-[#EBC9D6] bg-white/70 px-3 py-2 text-xs text-[#4A1235]">
                  <Megaphone className="mr-1 inline h-3 w-3 text-[#7B1E57]" />
                  {announcementText}
                </p>
              )}
              <div className={`mt-4 ${BUBBLE_GRID_CLASS}`}>
                <BubblePlans plans={SAMPLE_PLANS} selectedId={picked} formatPrice={formatPrice} onPick={pick} />
              </div>
              <div className="mt-4 flex flex-col items-center gap-1 text-center">
                {logo}
                <p className="text-[13px] font-semibold text-[#4a1538]">{displayName}</p>
                {supportPhone && <p className="text-xs text-[#8a5a76]">Need help? Call {supportPhone}</p>}
              </div>
            </div>
          )}

          {templateId === 19 && (
            <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-[#050816] via-[#071426] to-[#0b1020] px-4 pb-8 pt-6">
              <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.45),transparent_62%)]" />
              <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.4),transparent_62%)]" />
              <div className="relative">
                <div className="mb-5 text-center">
                  {logo || <Wifi className="mx-auto mb-2 h-10 w-10 text-white" />}
                  <p className="text-xl font-bold text-white">{displayName}</p>
                  {supportPhone && <p className="mt-1 text-xs text-teal-100/80">{supportPhone}</p>}
                </div>
                {announcementText && (
                  <p className="mb-4 rounded-lg border border-teal-300/30 bg-white/[0.06] px-3 py-2 text-xs text-teal-50">
                    <Megaphone className="mr-1 inline h-3 w-3 text-teal-300" />
                    {announcementText}
                  </p>
                )}
                <SpotlightPlans plans={SAMPLE_PLANS} formatPrice={formatPrice} hideSpeed={hidePlanSpeed} onPay={pick} />
              </div>
            </div>
          )}

          {templateId === 20 && (
            <div className="min-h-full bg-[#e7edf5] bg-[radial-gradient(#c9d5e4_1px,transparent_1px)] px-3 pb-8 pt-3 [background-size:18px_18px]">
              <div className="mb-4 rounded-2xl bg-[#0b1b33] p-4 shadow-[0_12px_30px_-12px_rgba(11,27,51,0.6)]">
                {logoSrc && <img src={logoSrc} alt="" className="mb-2 h-8 max-w-[110px] object-contain" />}
                <p className="mb-1 flex items-center gap-2 font-[ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300 motion-reduce:animate-none" aria-hidden="true" />
                  Departures · Wi-Fi
                </p>
                <p className="font-[ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation_Mono',monospace] text-xl font-bold uppercase tracking-[0.12em] text-amber-300">{displayName}</p>
                {supportPhone && <p className="mt-1 font-[ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation_Mono',monospace] text-xs text-slate-300">{supportPhone}</p>}
              </div>
              {announcementText && (
                <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-[#13294b]">
                  <Megaphone className="mr-1 inline h-3 w-3 text-amber-600" />
                  {announcementText}
                </p>
              )}
              <BoardingPassPlans plans={SAMPLE_PLANS} formatPrice={formatPrice} hideSpeed={hidePlanSpeed} carrier={displayName} onPay={pick} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
