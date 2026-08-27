"use client"

import React, { useEffect, useState } from "react"
import { Check, CreditCard, Loader2, Phone, Smartphone } from "lucide-react"
import { affiliateApi, type PaymentMethod } from "@/lib/affiliate-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AffiliatePaymentSettingsPage() {
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state
  const [type, setType] = useState<"mpesa" | "bank">("mpesa")
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [mpesaName, setMpesaName] = useState("")
  const [mpesaVerified, setMpesaVerified] = useState(false)
  const [bankName, setBankName] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [bankBranch, setBankBranch] = useState("")

  useEffect(() => {
    affiliateApi
      .getPaymentMethod()
      .then((pm) => {
        setMethod(pm)
        setType(pm.type)
        setMpesaPhone(pm.mpesa_phone || "")
        setMpesaName(pm.mpesa_name || "")
        setMpesaVerified(pm.is_verified)
        setBankName(pm.bank_name || "")
        setBankAccount(pm.bank_account || "")
        setBankBranch(pm.bank_branch || "")
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Partial<PaymentMethod> = {
        type,
        ...(type === "mpesa"
          ? { mpesa_phone: mpesaPhone, mpesa_name: mpesaName, is_verified: mpesaVerified }
          : { bank_name: bankName, bank_account: bankAccount, bank_branch: bankBranch }),
      }
      await affiliateApi.updatePaymentMethod(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
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
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">Payout setup</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
          Payment Methods.
        </h1>
        <p className="mt-2 text-sm text-gray-500">Where should we send your earnings?</p>
      </div>

      <div className="max-w-xl">
        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm md:p-8">
          {/* Method selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setType("mpesa")}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                type === "mpesa"
                  ? "border-red-500 bg-red-50 shadow-md shadow-red-100"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <Smartphone className={`h-5 w-5 ${type === "mpesa" ? "text-red-600" : "text-gray-400"}`} />
              <div className="text-left">
                <p className={`text-sm font-bold ${type === "mpesa" ? "text-red-700" : "text-gray-700"}`}>M-Pesa</p>
                <p className="text-xs text-gray-400">Mobile money</p>
              </div>
              {type === "mpesa" && (
                <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>

            <button
              onClick={() => setType("bank")}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                type === "bank"
                  ? "border-red-500 bg-red-50 shadow-md shadow-red-100"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <CreditCard className={`h-5 w-5 ${type === "bank" ? "text-red-600" : "text-gray-400"}`} />
              <div className="text-left">
                <p className={`text-sm font-bold ${type === "bank" ? "text-red-700" : "text-gray-700"}`}>Bank Transfer</p>
                <p className="text-xs text-gray-400">Direct deposit</p>
              </div>
              {type === "bank" && (
                <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          </div>

          {/* M-Pesa fields */}
          {type === "mpesa" && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">M-Pesa Phone Number</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={mpesaPhone}
                      onChange={(e) => {
                        setMpesaPhone(e.target.value)
                        setMpesaVerified(false)
                        setMpesaName("")
                      }}
                      placeholder="+254 700 000 000"
                      className="border-gray-200 bg-gray-50/50 pl-10 focus:border-red-300 focus:ring-red-200"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">Netily will review and verify these payout details manually.</p>
              </div>

              {mpesaVerified && mpesaName && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-600">Verified</p>
                    <p className="text-sm font-black text-emerald-800">{mpesaName}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bank fields */}
          {type === "bank" && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Bank Name</Label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., KCB Bank"
                  className="border-gray-200 bg-gray-50/50 focus:border-red-300 focus:ring-red-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Account Number</Label>
                <Input
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g., 123456789"
                  className="border-gray-200 bg-gray-50/50 focus:border-red-300 focus:ring-red-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Branch</Label>
                <Input
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  placeholder="e.g., Nairobi CBD"
                  className="border-gray-200 bg-gray-50/50 focus:border-red-300 focus:ring-red-200"
                />
              </div>
            </div>
          )}

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className={`mt-6 h-12 w-full rounded-2xl font-bold transition-all ${
              saved
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-200 hover:from-red-700 hover:to-red-800"
            }`}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : null}
            {saved ? "Saved!" : "Save payment method"}
          </Button>
        </div>
      </div>
    </div>
  )
}
