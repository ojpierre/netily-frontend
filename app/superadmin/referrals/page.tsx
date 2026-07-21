"use client"

import React, { useEffect, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Search,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"
import { affiliateApi, type AdminAffiliate } from "@/lib/affiliate-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "suspended", label: "Suspended" },
]

export default function SuperAdminReferralsPage() {
  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchAffiliates = async () => {
    setLoading(true)
    try {
      const data = await affiliateApi.adminGetAffiliates({ search, status: statusFilter })
      setAffiliates(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchAffiliates, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  const exportCsv = async () => {
    const blob = await affiliateApi.adminExportCsv()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "netily-affiliates.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalAffiliates = affiliates.length
  const activeAffiliates = affiliates.filter((a) => a.status === "active").length
  const totalReferrals = affiliates.reduce((sum, a) => sum + a.referrals_count, 0)
  const totalEarned = affiliates.reduce((sum, a) => sum + a.total_earned, 0)
  const avgConversion = totalAffiliates > 0 ? Math.round((totalReferrals / Math.max(totalAffiliates, 1)) * 10) / 10 : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Affiliate Referrals</h1>
          <p className="mt-1 text-slate-400">
            Manage all affiliates, their referrals, and payouts across the platform.
          </p>
        </div>
        <Button
          onClick={exportCsv}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} label="Total Affiliates" value={totalAffiliates} />
        <StatCard icon={UserCheck} label="Active" value={activeAffiliates} />
        <StatCard icon={TrendingUp} label="Total Referrals" value={totalReferrals} />
        <StatCard icon={Wallet} label="Total Payouts" value={`KES ${totalEarned.toLocaleString()}`} highlight />
        <StatCard icon={TrendingUp} label="Avg Referrals/Affiliate" value={avgConversion} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or code..."
            className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex rounded-lg border border-slate-700 bg-slate-800/50 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === f.key
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Affiliate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Code</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Referrals</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Earned</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Tier</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {affiliates.map((a) => (
                  <React.Fragment key={a.id}>
                    <tr
                      className={`transition cursor-pointer hover:bg-slate-800/50 ${expandedId === a.id ? "bg-slate-800/40" : ""}`}
                      onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-white">{a.full_name}</p>
                          <p className="text-xs text-slate-500">{a.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-slate-800 px-2 py-0.5 text-xs text-violet-300">{a.referral_code}</code>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-white">{a.referrals_count}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {a.currency} {a.total_earned.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            a.status === "active"
                              ? "border-emerald-600/50 text-emerald-400"
                              : a.status === "suspended"
                              ? "border-red-600/50 text-red-400"
                              : "border-slate-600 text-slate-400"
                          }`}
                        >
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            a.tier === "gold"
                              ? "border-yellow-600/50 text-yellow-400"
                              : a.tier === "silver"
                              ? "border-gray-400/50 text-gray-300"
                              : "border-amber-600/50 text-amber-400"
                          }`}
                        >
                          {a.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-400">{a.payment_method}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        {expandedId === a.id ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </td>
                    </tr>

                    {/* Expanded referrals */}
                    {expandedId === a.id && (
                      <tr>
                        <td colSpan={9} className="bg-slate-800/30 px-4 py-4">
                          <div className="ml-6 border-l-2 border-violet-600/30 pl-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-violet-400">
                              Referrals by {a.full_name}
                            </p>
                            {a.referrals.length > 0 ? (
                              <div className="space-y-2">
                                {a.referrals.map((r) => (
                                  <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-900/60 p-3">
                                    <div>
                                      <p className="text-sm font-medium text-white">{r.isp_name}</p>
                                      <p className="text-xs text-slate-500">{r.company} · {new Date(r.signup_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] ${
                                          r.status === "paid"
                                            ? "border-emerald-600/50 text-emerald-400"
                                            : "border-amber-600/50 text-amber-400"
                                        }`}
                                      >
                                        {r.status}
                                      </Badge>
                                      <span className="text-sm font-bold text-white">
                                        {r.currency} {r.reward_amount.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">No referrals yet.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {affiliates.length === 0 && (
            <div className="p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">No affiliates found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-violet-600/30 bg-violet-950/30" : "border-slate-800 bg-slate-900/50"
      }`}
    >
      <Icon className={`h-5 w-5 ${highlight ? "text-violet-400" : "text-slate-500"}`} />
      <p className="mt-3 text-2xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  )
}
