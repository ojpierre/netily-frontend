"use client"

import React, { useEffect, useState } from "react"
import { Check, Copy, Loader2, Users } from "lucide-react"
import { affiliateApi, type Referral } from "@/lib/affiliate-api"
import { useAffiliateAuth } from "../affiliate-auth-context"
import { Button } from "@/components/ui/button"

const REFERRAL_STATUS_LABELS = {
  pending: "Pending review",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
  churned: "Rejected / churned",
} as const

const ATTRIBUTION_LABELS = {
  tracked_click: "Tracked link",
  lead_form: "Lead form",
  manual: "Manual review",
} as const

export default function AffiliateReferralsPage() {
  const { user } = useAffiliateAuth()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    affiliateApi.getReferrals().then(setReferrals).finally(() => setLoading(false))
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">Referral network</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
          Referred ISPs.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          Every operator who signed up through your link, and where their reward stands.
        </p>
      </div>

      {referrals.length > 0 ? (
        <div className="rounded-3xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">ISP / Company</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Signup Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Attribution</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {referrals.map((r) => (
                  <tr key={r.id} className="transition hover:bg-red-50/30">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{r.isp_name}</p>
                      <p className="text-xs text-gray-400">{r.signup_email || r.company || "Lead submitted"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(r.signup_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-flex rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                          {ATTRIBUTION_LABELS[r.attribution_type || "manual"]}
                        </span>
                        {r.source && <p className="text-[11px] text-gray-400">{r.source}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                          r.status === "paid" || r.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : r.status === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {REFERRAL_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">
                      {r.currency} {r.reward_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-black text-gray-700">Your network is quiet.</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            Share your link in ISP WhatsApp groups, WISP forums, or with other operators to land your first referral.
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
