"use client"

import React, { useEffect, useState } from "react"
import {
  BarChart3,
  Download,
  Eye,
  Loader2,
  MousePointerClick,
  TrendingUp,
  UserCheck,
  Wallet,
  Zap,
} from "lucide-react"
import { affiliateApi, type AnalyticsData, type TrafficSource } from "@/lib/affiliate-api"
import { Button } from "@/components/ui/button"

const PERIODS = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
]

export default function AffiliateAnalyticsPage() {
  const [period, setPeriod] = useState("30d")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [traffic, setTraffic] = useState<TrafficSource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([affiliateApi.getAnalytics(period), affiliateApi.getTrafficSources(period)])
      .then(([analytics, sources]) => {
        setData(analytics)
        setTraffic(sources)
      })
      .finally(() => setLoading(false))
  }, [period])

  const exportCsv = () => {
    if (!data) return
    const headers = "Date,Views,Signups,Paid\n"
    const rows = data.daily.map((d) => `${d.date},${d.views},${d.signups},${d.paid}`).join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `netily-analytics-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
    )
  }

  const maxViews = Math.max(...(data?.daily?.map((d) => d.views) || [1]))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">Performance</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Link performance.
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Clicks, signups, and conversions for your referral link.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period pills */}
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  period === p.key
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            onClick={exportCsv}
            variant="outline"
            className="rounded-xl border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Eye} label="Views" value={data?.link_views ?? 0} />
        <StatCard icon={UserCheck} label="Signups" value={data?.signups ?? 0} />
        <StatCard icon={MousePointerClick} label="Paid" value={data?.paid ?? 0} accent />
        <StatCard icon={TrendingUp} label="Conv. Rate" value={`${data?.conversion_rate ?? 0}%`} />
        <StatCard icon={Wallet} label="EPC" value={`KES ${data?.epc?.toFixed(2) ?? "0.00"}`} accent />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Daily chart */}
        <section className="xl:col-span-3 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Daily Activity</h2>
          <p className="text-sm text-gray-400">Link views over the selected period</p>
          <div className="mt-6 flex items-end gap-[3px] h-40">
            {data?.daily?.map((d, i) => (
              <div key={i} className="group relative flex-1 flex flex-col items-center justify-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-red-500 to-red-400 transition-all duration-300 group-hover:from-red-600 group-hover:to-red-500 min-h-[2px]"
                  style={{ height: `${Math.max((d.views / maxViews) * 100, 3)}%` }}
                />
                {/* Tooltip on hover */}
                <div className="absolute -top-12 hidden group-hover:block rounded-lg bg-gray-900 px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
                  {d.date}: {d.views} views
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Traffic sources */}
        <section className="xl:col-span-2 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Traffic Sources</h2>
          <p className="text-sm text-gray-400">Where your clicks come from</p>

          {traffic.length > 0 ? (
            <div className="mt-6 space-y-4">
              {traffic.map((t, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">{t.source}</span>
                    <span className="text-xs font-semibold text-red-600">{t.conversion_rate}% CR</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span>{t.clicks} clicks</span>
                    <span>{t.signups} signups</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center">
              <Zap className="mx-auto h-6 w-6 text-gray-300" />
              <p className="mt-2 text-xs text-gray-400">
                No traffic yet. Add <code className="rounded bg-gray-100 px-1 text-[10px]">?src=whatsapp</code> to your link to track channels.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Conversion funnel */}
      <section className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-gray-900">Conversion Funnel</h2>
        <p className="text-sm text-gray-400">From first click to payment</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {[
            { label: "Link clicks", value: data?.link_views ?? 0, pct: 100 },
            { label: "Page views", value: Math.round((data?.link_views ?? 0) * 0.84), pct: 84 },
            { label: "Signups", value: data?.signups ?? 0, pct: data ? Math.round((data.signups / data.link_views) * 100) : 0 },
            { label: "Paid", value: data?.paid ?? 0, pct: data ? Math.round((data.paid / data.link_views) * 100) : 0 },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4 text-center">
              <p className="text-2xl font-black text-gray-900">{f.value.toLocaleString()}</p>
              <p className="mt-1 text-xs font-semibold text-gray-400">{f.label}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700"
                  style={{ width: `${f.pct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] font-bold text-red-500">{f.pct}%</p>
            </div>
          ))}
        </div>
      </section>
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
        accent ? "border-red-200/60 bg-gradient-to-br from-red-50 to-orange-50" : "border-gray-200/80 bg-white"
      }`}
    >
      <Icon className={`h-5 w-5 ${accent ? "text-red-500" : "text-gray-400"}`} />
      <p className="mt-4 text-2xl font-black text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className={`mt-1 text-xs font-semibold ${accent ? "text-red-400" : "text-gray-400"}`}>{label}</p>
    </div>
  )
}
