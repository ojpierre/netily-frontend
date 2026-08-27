"use client"

import { useEffect, useState } from "react"
import { Award, Crown, Loader2, Medal, Sparkles } from "lucide-react"
import { affiliateApi, type RewardTier } from "@/lib/affiliate-api"

const TIER_CONFIG = {
  bronze: { icon: Medal, style: "border-amber-200 bg-amber-50 text-amber-700" },
  silver: { icon: Award, style: "border-gray-200 bg-gray-50 text-gray-700" },
  gold: { icon: Crown, style: "border-yellow-200 bg-yellow-50 text-yellow-700" },
}

export default function AffiliateTiersPage() {
  const [data, setData] = useState<RewardTier | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    affiliateApi.getRewardTier().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex h-80 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-400" /></div>
  if (!data) return null

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">Partner standing</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">Your Affiliate Tier.</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          Tiers and commission amounts are reviewed and assigned manually by Netily. Referral counts are analytics, not an automatic promise of payment.
        </p>
      </div>
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Tracked signups</p>
        <p className="mt-1 text-3xl font-black text-gray-900">{data.referrals_count}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {data.tiers.map((tier) => {
          const config = TIER_CONFIG[tier.key]
          const Icon = config.icon
          const current = tier.key === data.current_tier
          return (
            <div key={tier.key} className={`relative rounded-3xl border p-6 ${config.style} ${current ? "ring-2 ring-red-500 ring-offset-2" : "opacity-70"}`}>
              {current && <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold text-white"><Sparkles className="h-3 w-3" /> Assigned</span>}
              <Icon className="h-9 w-9" />
              <h2 className="mt-4 text-xl font-black">{tier.name}</h2>
              <p className="mt-2 text-sm opacity-80">Commission and payout terms are set manually after referral review.</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
