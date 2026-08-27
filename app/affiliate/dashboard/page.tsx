"use client"

import React, { useEffect, useState } from "react"
import {
  ArrowUpRight,
  Check,
  Copy,
  Eye,
  Flame,
  Loader2,
  MousePointerClick,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react"
import { affiliateApi, type DashboardData } from "@/lib/affiliate-api"
import { useAffiliateAuth } from "../affiliate-auth-context"
import { Button } from "@/components/ui/button"

export default function AffiliateDashboardPage() {
  const { user } = useAffiliateAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    affiliateApi.getDashboard().then(setData).finally(() => setLoading(false))
  }, [])

  const copyLink = () => {
    if (!data) return
    navigator.clipboard.writeText(data.referral_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
    )
  }

  const now = new Date()
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const timeStr = `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}`
  const hour = now.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const stats = data?.stats
  const funnel = data?.funnel

  return (
    <div className="space-y-8">
      {/* Hero card */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
          <span>Netily Affiliates</span>
          <span className="h-1 w-1 rounded-full bg-red-200" />
          <span>{timeStr}</span>
          <span className="h-1 w-1 rounded-full bg-red-200" />
          <span className="text-red-600">Code {data?.referral_code}</span>
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
          {greeting}, {data?.greeting_name || user?.full_name?.split(" ")[0]}.
        </h1>

        {/* Referral link */}
        <div className="mt-5 rounded-2xl border border-red-200/60 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-mono font-semibold text-gray-800">
                {data?.referral_link}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Tracked link — clicks and signups are recorded for manual review. Rewards are approved and paid by Netily.
              </p>
            </div>
            <Button
              onClick={copyLink}
              className={`shrink-0 rounded-xl transition-all ${
                copied
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-red-600 text-white shadow-md shadow-red-200 hover:bg-red-700"
              }`}
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Eye} label="Link Views" value={stats?.link_views ?? 0} />
        <StatCard icon={UserCheck} label="Signed Up" value={stats?.signed_up ?? 0} />
        <StatCard icon={MousePointerClick} label="Paid" value={stats?.paid ?? 0} accent />
        <StatCard icon={TrendingUp} label="Conv. Rate" value={`${stats?.conversion_rate ?? 0}%`} />
        <StatCard
          icon={Wallet}
          label="Earnings"
          value={`${stats?.currency || "KES"} ${(stats?.total_earnings ?? 0).toLocaleString()}`}
          accent
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Conversion Funnel */}
        <section className="xl:col-span-3 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Conversion Funnel</h2>
          <p className="text-sm text-gray-400">Last 30 days</p>
          <div className="mt-6 space-y-4">
            {funnel && (
              <>
                <FunnelBar label="Link Clicks" value={funnel.link_clicks} max={funnel.link_clicks} />
                <FunnelBar label="Page Views" value={funnel.page_views} max={funnel.link_clicks} />
                <FunnelBar label="Signups" value={funnel.signups} max={funnel.link_clicks} />
                <FunnelBar label="Paid" value={funnel.paid} max={funnel.link_clicks} />
              </>
            )}
          </div>
        </section>

        {/* Activity */}
        <section className="xl:col-span-2 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-400">Last 30 days</p>
          <div className="mt-6 space-y-3">
            {data?.recent_activity?.length ? (
              data.recent_activity.map((a, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-white p-3">
                  <p className="text-sm font-semibold text-gray-800">{a.event}</p>
                  <p className="mt-1 text-xs text-gray-400">{a.date}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
                <Flame className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm text-gray-400">No link activity in the last 30 days yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        accent
          ? "border-red-200/60 bg-white"
          : "border-gray-200/80 bg-white"
      }`}
    >
      <Icon className={`h-5 w-5 ${accent ? "text-red-500" : "text-gray-400"}`} />
      <p className="mt-4 text-2xl font-black text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className={`mt-1 text-xs font-semibold ${accent ? "text-red-400" : "text-gray-400"}`}>{label}</p>
    </div>
  )
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="font-black text-gray-900">{value.toLocaleString()}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full border border-gray-100 bg-white">
        <div
          className="h-full rounded-full bg-red-600 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
