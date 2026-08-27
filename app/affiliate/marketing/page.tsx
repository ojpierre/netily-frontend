"use client"

import React, { useEffect, useState } from "react"
import { Check, Copy, Download, Loader2 } from "lucide-react"
import { affiliateApi, type MarketingAsset } from "@/lib/affiliate-api"
import { useAffiliateAuth } from "../affiliate-auth-context"
import { Button } from "@/components/ui/button"

const TABS = [
  { key: "whatsapp", label: "WhatsApp Scripts" },
  { key: "social", label: "Social Media" },
  { key: "brand", label: "Brand Assets" },
] as const

export default function AffiliateMarketingPage() {
  const { user } = useAffiliateAuth()
  const [assets, setAssets] = useState<MarketingAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"whatsapp" | "social" | "brand">("whatsapp")
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    affiliateApi.getMarketingAssets().then(setAssets).finally(() => setLoading(false))
  }, [])

  const filtered = assets.filter((a) => a.category === tab)

  const injectLink = (content: string) => {
    return content.replace(/\{\{REFERRAL_LINK\}\}/g, user?.referral_link || "https://netily.co.ke/affiliate/YOUR_CODE")
  }

  const copyContent = (asset: MarketingAsset) => {
    navigator.clipboard.writeText(injectLink(asset.content))
    setCopiedId(asset.id)
    setTimeout(() => setCopiedId(null), 2000)
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
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">Swipe file</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
          Marketing Assets.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          Everything you need to promote Netily. Just copy, paste, and post.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-5 py-2 text-sm font-bold transition-all ${
              tab === t.key
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {filtered.map((asset) => (
          <div
            key={asset.id}
            className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900">{asset.title}</h3>
                <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {injectLink(asset.content)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                {asset.category !== "brand" ? (
                  <Button
                    onClick={() => copyContent(asset)}
                    className={`rounded-xl transition-all ${
                      copiedId === asset.id
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-200 hover:from-red-700 hover:to-red-800"
                    }`}
                  >
                    {copiedId === asset.id ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copiedId === asset.id ? "Copied!" : "Copy to Clipboard"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="rounded-xl border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                    onClick={() => {
                      // TODO: Download actual file
                      alert("Download will be available when brand assets are uploaded.")
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center">
            <p className="text-sm text-gray-400">No assets in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
