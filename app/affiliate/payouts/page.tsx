"use client"

import React, { useEffect, useState } from "react"
import { Check, Copy, Loader2, Wallet } from "lucide-react"
import { affiliateApi, type Payout } from "@/lib/affiliate-api"
import { useAffiliateAuth } from "../affiliate-auth-context"
import { Button } from "@/components/ui/button"

export default function AffiliatePayoutsPage() {
  const { user } = useAffiliateAuth()
  const [payoutData, setPayoutData] = useState<{
    total_earned: number
    pending: number
    paid_out: number
    currency: string
    history: Payout[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    affiliateApi.getPayouts().then(setPayoutData).finally(() => setLoading(false))
  }, [])

  const copyLink = () => {
    if (!user) return
    navigator.clipboard.writeText(user.referral_link)
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

  const cur = payoutData?.currency || "KES"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">Earnings</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
          What you&apos;ve earned.
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Your reward earnings and the rewards we&apos;ve already paid out to your account.
        </p>
      </div>

      {/* Balance cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <BalanceCard
          label="Total Earned"
          value={`${cur} ${(payoutData?.total_earned ?? 0).toLocaleString()}`}
          sublabel="Lifetime"
          accent
        />
        <BalanceCard
          label="Pending Payout"
          value={`${cur} ${(payoutData?.pending ?? 0).toLocaleString()}`}
          sublabel="Next billing cycle"
        />
        <BalanceCard
          label="Paid Out"
          value={`${cur} ${(payoutData?.paid_out ?? 0).toLocaleString()}`}
          sublabel="Successfully transferred"
        />
      </div>

      {/* Payout history */}
      {payoutData && payoutData.history.length > 0 ? (
        <div className="rounded-3xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/60 px-6 py-4">
            <h2 className="text-lg font-black text-gray-900">Payout History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payoutData.history.map((p) => (
                  <tr key={p.id} className="transition hover:bg-red-50/30">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-gray-900">
                      {p.currency} {p.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        {p.method === "mpesa" ? "M-Pesa" : "Bank Transfer"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{p.reference}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                          p.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : p.status === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center">
          <Wallet className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-black text-gray-700">Zero balance.</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            Rewards land here once a referred ISP pays and we award your commission. Refer your first ISP to Netily today and watch this balance grow.
          </p>
          <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-red-200/60 bg-gradient-to-r from-red-50/80 to-orange-50/60 p-4">
            <p className="truncate text-sm font-mono font-semibold text-gray-800">
              {user?.referral_link}
            </p>
            <Button
              onClick={copyLink}
              className={`mt-3 rounded-xl transition-all ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-200"
              }`}
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy referral link"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function BalanceCard({ label, value, sublabel, accent }: { label: string; value: string; sublabel: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        accent ? "border-red-200/60 bg-gradient-to-br from-red-50 to-orange-50" : "border-gray-200/80 bg-white"
      }`}
    >
      <p className={`text-xs font-bold uppercase tracking-wider ${accent ? "text-red-400" : "text-gray-400"}`}>{label}</p>
      <p className="mt-3 text-2xl font-black text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{sublabel}</p>
    </div>
  )
}
