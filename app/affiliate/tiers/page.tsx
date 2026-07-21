"use client"

import React, { useEffect, useState } from "react"
import { Award, Crown, Loader2, Lock, Medal, Sparkles, Trophy, Zap } from "lucide-react"
import { affiliateApi, type RewardTier } from "@/lib/affiliate-api"

const TIER_CONFIG = {
  bronze: { icon: Medal, gradient: "from-amber-600 to-amber-700", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", shadow: "shadow-amber-200" },
  silver: { icon: Award, gradient: "from-gray-400 to-gray-500", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600", shadow: "shadow-gray-200" },
  gold: { icon: Crown, gradient: "from-yellow-500 to-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", shadow: "shadow-yellow-200" },
}

export default function AffiliateTiersPage() {
  const [data, setData] = useState<RewardTier | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    affiliateApi.getRewardTier().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
    )
  }

  if (!data) return null

  const totalMax = 20
  const progress = Math.min((data.referrals_count / totalMax) * 100, 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">Gamification</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
          Your Reward Tier.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          Unlock higher payouts by referring more ISPs to the network.
        </p>
      </div>

      {/* Progress bar */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-900">
            <span className="text-2xl font-black">{data.referrals_count}</span>{" "}
            <span className="text-gray-400">referrals</span>
          </p>
          {data.next_tier_remaining !== null && (
            <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5">
              <Zap className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-bold text-red-700">
                {data.next_tier_remaining} away from {data.current_tier === "bronze" ? "Silver" : "Gold"}!
              </span>
            </div>
          )}
        </div>

        {/* Visual progress */}
        <div className="relative">
          <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 transition-all duration-1000 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>

          {/* Tier markers */}
          <div className="relative mt-2 flex justify-between text-[10px] font-bold text-gray-400">
            <span className="text-amber-600">Bronze (0)</span>
            <span style={{ position: "absolute", left: "25%" }} className="text-gray-500">Silver (6)</span>
            <span style={{ position: "absolute", left: "75%" }} className="text-yellow-600">Gold (16)</span>
            <span>∞</span>
          </div>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {data.tiers.map((tier) => {
          const config = TIER_CONFIG[tier.key]
          const Icon = config.icon
          const isCurrent = tier.key === data.current_tier
          const isLocked = !tier.unlocked && !isCurrent

          return (
            <div
              key={tier.key}
              className={`relative rounded-3xl border p-6 transition-all duration-300 ${
                isCurrent
                  ? `${config.border} ${config.bg} shadow-lg ${config.shadow} scale-[1.02]`
                  : isLocked
                  ? "border-gray-200/60 bg-gray-50/50 opacity-70"
                  : `${config.border} ${config.bg}`
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 to-red-700 px-3 py-1 text-[10px] font-bold text-white shadow-md">
                    <Sparkles className="h-3 w-3" />
                    Current
                  </span>
                </div>
              )}

              {isLocked && (
                <div className="absolute top-4 right-4">
                  <Lock className="h-4 w-4 text-gray-300" />
                </div>
              )}

              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradient} text-white shadow-lg ${config.shadow}`}>
                <Icon className="h-7 w-7" />
              </div>

              <h3 className={`mt-4 text-xl font-black ${config.text}`}>{tier.name}</h3>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Referrals</span>
                  <span className="font-bold text-gray-900">
                    {tier.min_referrals}–{tier.max_referrals ?? "∞"} ISPs
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Reward</span>
                  <span className="font-black text-gray-900">
                    {tier.currency} {tier.reward_per_referral.toLocaleString()}
                    <span className="font-normal text-gray-400"> / referral</span>
                  </span>
                </div>
              </div>

              {isLocked && (
                <div className="mt-4 rounded-xl bg-gray-100 p-3 text-center">
                  <p className="text-xs font-semibold text-gray-400">
                    Refer {tier.min_referrals - data.referrals_count > 0 ? tier.min_referrals - data.referrals_count : 0} more ISPs to unlock
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
