"use client"

import React, { useEffect, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"
import { affiliateApi, type AdminAffiliate } from "@/lib/affiliate-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "suspended", label: "Suspended" },
]

const ATTRIBUTION_LABELS = {
  tracked_click: "Tracked click",
  lead_form: "Lead form",
  manual: "Manual",
} as const

export default function SuperAdminReferralsPage() {
  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState<number | null>(null)
  const [rewardDrafts, setRewardDrafts] = useState<Record<number, string>>({})
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutMethod, setPayoutMethod] = useState<"mpesa" | "bank">("mpesa")
  const [payoutReference, setPayoutReference] = useState("")
  const [affiliateOtpEnabled, setAffiliateOtpEnabled] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createDraft, setCreateDraft] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "Kenya",
    password: "",
    is_verified: false,
  })
  const [manualReferral, setManualReferral] = useState({
    signup_email: "",
    company_name: "",
    reward_amount: "0",
    admin_notes: "",
  })
  const [passwordDrafts, setPasswordDrafts] = useState<Record<number, { password: string; confirm: string; notify: boolean }>>({})
  const [securityNotice, setSecurityNotice] = useState<Record<number, string>>({})

  const fetchAffiliates = async () => {
    setLoading(true)
    try {
      const data = await affiliateApi.adminGetAffiliates({ search, status: statusFilter })
      setAffiliates(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load affiliates.")
    } finally {
      setLoading(false)
    }
  }

  const updateAffiliateStatus = async (affiliate: AdminAffiliate, status: AdminAffiliate["status"]) => {
    setSavingId(affiliate.id)
    try {
      const updated = await affiliateApi.adminUpdateAffiliate(affiliate.id, { status })
      setAffiliates((current) => current.map((item) => item.id === affiliate.id ? updated : item))
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update affiliate.")
    } finally {
      setSavingId(null)
    }
  }

  const updateAffiliateTier = async (affiliate: AdminAffiliate, tier: AdminAffiliate["tier"]) => {
    setSavingId(affiliate.id)
    try {
      const updated = await affiliateApi.adminUpdateAffiliate(affiliate.id, { tier })
      setAffiliates((current) => current.map((item) => item.id === affiliate.id ? updated : item))
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update affiliate tier.")
    } finally {
      setSavingId(null)
    }
  }

  const updateReferral = async (
    affiliateId: number,
    referralId: number,
    status?: AdminAffiliate["referrals"][number]["status"],
  ) => {
    const affiliate = affiliates.find((item) => item.id === affiliateId)
    const referral = affiliate?.referrals.find((item) => item.id === referralId)
    if (!referral) return
    setSavingId(referralId)
    try {
      const reward = Number(rewardDrafts[referralId] ?? referral.reward_amount)
      if (!Number.isFinite(reward) || reward < 0) throw new Error("Commission must be zero or greater.")
      const updated = await affiliateApi.adminUpdateReferral(referralId, {
        reward_amount: reward,
        status: status || referral.status,
      })
      setAffiliates((current) => current.map((item) => {
        if (item.id !== affiliateId) return item
        const referrals = item.referrals.map((entry) => entry.id === referralId ? updated : entry)
        const totalEarned = referrals
          .filter((entry) => entry.status === "approved" || entry.status === "paid")
          .reduce((sum, entry) => sum + entry.reward_amount, 0)
        return { ...item, referrals, total_earned: totalEarned }
      }))
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update referral.")
    } finally {
      setSavingId(null)
    }
  }

  const createPayout = async (affiliate: AdminAffiliate) => {
    const amount = Number(payoutAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a payout amount greater than zero.")
      return
    }
    setSavingId(affiliate.id)
    try {
      await affiliateApi.adminCreatePayout(affiliate.id, {
        amount,
        currency: affiliate.currency,
        method: payoutMethod,
        status: "completed",
        reference: payoutReference.trim(),
      })
      setPayoutAmount("")
      setPayoutReference("")
      await fetchAffiliates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record payout.")
    } finally {
      setSavingId(null)
    }
  }

  const createAffiliate = async () => {
    setSavingId(-1)
    setError("")
    try {
      await affiliateApi.adminCreateAffiliate(createDraft)
      setCreateDraft({ full_name: "", email: "", phone: "", country: "Kenya", password: "", is_verified: false })
      setShowCreate(false)
      await fetchAffiliates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create affiliate.")
    } finally {
      setSavingId(null)
    }
  }

  const createManualReferral = async (affiliate: AdminAffiliate) => {
    const reward = Number(manualReferral.reward_amount)
    if (!manualReferral.signup_email.trim() || !Number.isFinite(reward) || reward < 0) {
      setError("Enter a valid signup email and commission amount.")
      return
    }
    setSavingId(affiliate.id)
    try {
      await affiliateApi.adminCreateReferral(affiliate.id, {
        signup_email: manualReferral.signup_email.trim(),
        company_name: manualReferral.company_name.trim(),
        reward_amount: reward,
        currency: affiliate.currency,
        status: "pending",
        admin_notes: manualReferral.admin_notes.trim(),
      })
      setManualReferral({ signup_email: "", company_name: "", reward_amount: "0", admin_notes: "" })
      await fetchAffiliates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create manual referral.")
    } finally {
      setSavingId(null)
    }
  }

  const updatePayoutStatus = async (affiliateId: number, payoutId: number, status: "pending" | "completed" | "failed") => {
    const payout = affiliates
      .find((affiliate) => affiliate.id === affiliateId)
      ?.payouts?.find((entry) => entry.id === payoutId)
    let reference = payout?.reference || ""
    if (status === "completed" && !reference) {
      reference = window.prompt("Enter the external transaction reference before marking this payout completed:")?.trim() || ""
      if (!reference) {
        setError("A transaction reference is required for a completed payout.")
        return
      }
    }
    setSavingId(payoutId)
    try {
      const updated = await affiliateApi.adminUpdatePayout(payoutId, { status, ...(reference ? { reference } : {}) })
      setAffiliates((current) => current.map((affiliate) => affiliate.id === affiliateId
        ? { ...affiliate, payouts: (affiliate.payouts || []).map((payout) => payout.id === payoutId ? updated : payout) }
        : affiliate))
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update payout.")
    } finally {
      setSavingId(null)
    }
  }

  const openAffiliateAccount = async (affiliate: AdminAffiliate) => {
    const accessWindow = window.open("", "_blank")
    if (accessWindow) {
      accessWindow.opener = null
      accessWindow.document.title = "Opening affiliate account…"
      accessWindow.document.body.textContent = "Preparing secure affiliate access…"
    }
    setSavingId(affiliate.id)
    try {
      const grant = await affiliateApi.adminRequestAffiliateAccess(affiliate.id)
      if (accessWindow) {
        accessWindow.location.replace(grant.access_url)
      } else {
        window.location.assign(grant.access_url)
      }
      setError("")
    } catch (err) {
      accessWindow?.close()
      setError(err instanceof Error ? err.message : "Unable to open affiliate account.")
    } finally {
      setSavingId(null)
    }
  }

  const deactivateAffiliate = async (affiliate: AdminAffiliate) => {
    if (!window.confirm(`Deactivate ${affiliate.full_name}? Their history and audit records will be retained.`)) return
    setSavingId(affiliate.id)
    try {
      await affiliateApi.adminDeactivateAffiliate(affiliate.id)
      await fetchAffiliates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to deactivate affiliate.")
    } finally {
      setSavingId(null)
    }
  }

  const updatePasswordDraft = (affiliateId: number, patch: Partial<{ password: string; confirm: string; notify: boolean }>) => {
    setPasswordDrafts((current) => ({
      ...current,
      [affiliateId]: {
        password: "",
        confirm: "",
        notify: true,
        ...(current[affiliateId] || {}),
        ...patch,
      },
    }))
  }

  const changeAffiliatePassword = async (affiliate: AdminAffiliate) => {
    const draft = passwordDrafts[affiliate.id] || { password: "", confirm: "", notify: true }
    if (!draft.password || draft.password.length < 8) {
      setError("Enter a password with at least 8 characters.")
      return
    }
    if (draft.password !== draft.confirm) {
      setError("Passwords do not match.")
      return
    }
    setSavingId(affiliate.id)
    try {
      const result = await affiliateApi.adminChangeAffiliatePassword(affiliate.id, {
        new_password: draft.password,
        confirm_password: draft.confirm,
        send_email: draft.notify,
      })
      setPasswordDrafts((current) => ({ ...current, [affiliate.id]: { password: "", confirm: "", notify: true } }))
      setSecurityNotice((current) => ({ ...current, [affiliate.id]: result.detail || "Affiliate password changed." }))
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change affiliate password.")
    } finally {
      setSavingId(null)
    }
  }

  const sendTemporaryPassword = async (affiliate: AdminAffiliate) => {
    if (!window.confirm(`Send a temporary password to ${affiliate.email}? They will be asked to set a new password from affiliate login.`)) return
    setSavingId(affiliate.id)
    try {
      const result = await affiliateApi.adminSendAffiliateTemporaryPassword(affiliate.id)
      setSecurityNotice((current) => ({ ...current, [affiliate.id]: result.detail || "Temporary password sent." }))
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send temporary password.")
    } finally {
      setSavingId(null)
    }
  }

  const toggleAffiliateOtp = async () => {
    const next = !affiliateOtpEnabled
    setSettingsLoading(true)
    try {
      const result = await affiliateApi.adminUpdateSettings(next)
      setAffiliateOtpEnabled(result.affiliate_email_otp_enabled)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update affiliate OTP.")
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchAffiliates, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  useEffect(() => {
    affiliateApi.adminGetSettings()
      .then((settings) => setAffiliateOtpEnabled(settings.affiliate_email_otp_enabled))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load affiliate settings."))
      .finally(() => setSettingsLoading(false))
  }, [])

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
  const completedPayouts = affiliates.reduce(
    (sum, affiliate) => sum + (affiliate.payouts || []).filter((payout) => payout.status === "completed").length,
    0,
  )
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
        <Button onClick={() => setShowCreate((value) => !value)} className="bg-violet-600 text-white hover:bg-violet-500">
          <Plus className="mr-2 h-4 w-4" />
          Add affiliate
        </Button>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-white">
              <ShieldCheck className="h-4 w-4" />
              Affiliate login OTP
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Optional platform-wide email OTP after password login. It is disabled by default.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={affiliateOtpEnabled}
            disabled={settingsLoading}
            onClick={toggleAffiliateOtp}
            className={`relative h-7 w-12 rounded-full border transition ${affiliateOtpEnabled ? "border-violet-500 bg-violet-600" : "border-slate-600 bg-slate-800"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full border border-slate-300 bg-white transition ${affiliateOtpEnabled ? "left-6" : "left-0.5"}`} />
          </button>
        </div>
      </section>

      {showCreate && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-lg font-bold text-white">Create affiliate account</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Input className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500" placeholder="Full name" value={createDraft.full_name} onChange={(event) => setCreateDraft((draft) => ({ ...draft, full_name: event.target.value }))} />
            <Input className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500" type="email" placeholder="Email" value={createDraft.email} onChange={(event) => setCreateDraft((draft) => ({ ...draft, email: event.target.value }))} />
            <Input className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500" placeholder="Phone" value={createDraft.phone} onChange={(event) => setCreateDraft((draft) => ({ ...draft, phone: event.target.value }))} />
            <Input className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500" placeholder="Country" value={createDraft.country} onChange={(event) => setCreateDraft((draft) => ({ ...draft, country: event.target.value }))} />
            <Input className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500" type="password" placeholder="Temporary password" value={createDraft.password} onChange={(event) => setCreateDraft((draft) => ({ ...draft, password: event.target.value }))} />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={createDraft.is_verified} onChange={(event) => setCreateDraft((draft) => ({ ...draft, is_verified: event.target.checked }))} />
              Mark email as verified
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={createAffiliate} disabled={savingId === -1} className="bg-violet-600 text-white hover:bg-violet-500">Create account</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </section>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-700/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} label="Total Affiliates" value={totalAffiliates} />
        <StatCard icon={UserCheck} label="Active" value={activeAffiliates} />
        <StatCard icon={TrendingUp} label="Total Referrals" value={totalReferrals} />
        <StatCard icon={Wallet} label="Completed Payouts" value={completedPayouts} highlight />
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
                        <select
                          value={a.status}
                          disabled={savingId === a.id}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => updateAffiliateStatus(a, event.target.value as AdminAffiliate["status"])}
                          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                          aria-label={`Status for ${a.full_name}`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={a.tier}
                          disabled={savingId === a.id}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => updateAffiliateTier(a, event.target.value as AdminAffiliate["tier"])}
                          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs capitalize text-slate-200"
                          aria-label={`Tier for ${a.full_name}`}
                        >
                          <option value="bronze">Bronze</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                        </select>
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
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                                Referrals by {a.full_name}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => openAffiliateAccount(a)}>
                                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                  Open account
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(a.referral_link)}>
                                  Copy referral link
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deactivateAffiliate(a)} disabled={a.status === "inactive"}>
                                  Deactivate
                                </Button>
                              </div>
                            </div>
                            <div className="mb-5 rounded-xl border border-slate-700/70 bg-slate-950/70 p-4">
                              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                                    <KeyRound className="h-3.5 w-3.5" />
                                    Affiliate security
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Change the affiliate password manually or send a temporary password to their email.
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sendTemporaryPassword(a)}
                                  disabled={savingId === a.id}
                                  className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
                                >
                                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                                  Send temporary password
                                </Button>
                              </div>
                              {securityNotice[a.id] && (
                                <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                                  {securityNotice[a.id]}
                                </div>
                              )}
                              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                                <label className="text-xs text-slate-400">
                                  New password
                                  <Input
                                    type="password"
                                    value={passwordDrafts[a.id]?.password || ""}
                                    onChange={(event) => updatePasswordDraft(a.id, { password: event.target.value })}
                                    className="mt-1 h-9 border-slate-700 bg-slate-900 text-white"
                                  />
                                </label>
                                <label className="text-xs text-slate-400">
                                  Confirm password
                                  <Input
                                    type="password"
                                    value={passwordDrafts[a.id]?.confirm || ""}
                                    onChange={(event) => updatePasswordDraft(a.id, { confirm: event.target.value })}
                                    className="mt-1 h-9 border-slate-700 bg-slate-900 text-white"
                                  />
                                </label>
                                <Button
                                  disabled={savingId === a.id}
                                  onClick={() => changeAffiliatePassword(a)}
                                  className="h-9 bg-violet-600 text-white hover:bg-violet-500"
                                >
                                  {savingId === a.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                                  Change password
                                </Button>
                              </div>
                              <label className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                <input
                                  type="checkbox"
                                  checked={passwordDrafts[a.id]?.notify ?? true}
                                  onChange={(event) => updatePasswordDraft(a.id, { notify: event.target.checked })}
                                  className="h-4 w-4 rounded border-slate-700 bg-slate-900"
                                />
                                Email the affiliate that their password was changed.
                              </label>
                            </div>
                            {a.referrals.length > 0 ? (
                              <div className="grid gap-3 xl:grid-cols-2">
                                {a.referrals.map((r) => (
                                  <div key={r.id} className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="break-words text-sm font-semibold text-white">{r.isp_name}</p>
                                        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-200">
                                          {ATTRIBUTION_LABELS[r.attribution_type || "manual"]}
                                        </span>
                                      </div>
                                      <p className="mt-1 break-words text-xs text-slate-400">{r.signup_email || r.company || "No email captured"}</p>
                                      <p className="mt-1 text-[11px] text-slate-500">
                                        {new Date(r.signup_date).toLocaleDateString()} - {r.source || "Referral"}
                                        {r.lead_id ? ` - Lead #${r.lead_id}` : ""}
                                      </p>
                                    </div>
                                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <select
                                        value={r.status}
                                        onChange={(event) => updateReferral(a.id, r.id, event.target.value as typeof r.status)}
                                        className="h-8 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                                        aria-label={`Referral status for ${r.isp_name}`}
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="paid">Paid</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="churned">Rejected/churned</option>
                                      </select>
                                      <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                                        <span className="text-xs font-semibold text-slate-500">{r.currency}</span>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={rewardDrafts[r.id] ?? String(r.reward_amount)}
                                          onChange={(event) => setRewardDrafts((current) => ({ ...current, [r.id]: event.target.value }))}
                                          className="h-8 border-slate-700 bg-slate-950 text-right text-sm text-white"
                                          aria-label={`Manual commission for ${r.isp_name}`}
                                        />
                                        <Button
                                          size="sm"
                                          disabled={savingId === r.id}
                                          onClick={() => updateReferral(a.id, r.id)}
                                          className="h-8 bg-violet-600 hover:bg-violet-500"
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">No referrals yet.</p>
                            )}
                            <div className="mt-5 border-t border-slate-700/70 pt-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                                Add manual referral
                              </p>
                              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                                <Input className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" type="email" placeholder="Signup email" value={manualReferral.signup_email} onChange={(event) => setManualReferral((draft) => ({ ...draft, signup_email: event.target.value }))} />
                                <Input className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" placeholder="Company name" value={manualReferral.company_name} onChange={(event) => setManualReferral((draft) => ({ ...draft, company_name: event.target.value }))} />
                                <Input className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" type="number" min="0" step="0.01" placeholder="Commission" value={manualReferral.reward_amount} onChange={(event) => setManualReferral((draft) => ({ ...draft, reward_amount: event.target.value }))} />
                                <Input className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" placeholder="Review note" value={manualReferral.admin_notes} onChange={(event) => setManualReferral((draft) => ({ ...draft, admin_notes: event.target.value }))} />
                              </div>
                              <Button size="sm" onClick={() => createManualReferral(a)} className="mt-2 bg-violet-600 text-white hover:bg-violet-500">
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                Add for review
                              </Button>
                              <p className="mt-2 text-xs text-slate-500">Manual entries are audit logged and never generate an automatic commission or payout.</p>
                            </div>
                            <div className="mt-5 border-t border-slate-700/70 pt-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-400">Record manual payout</p>
                              <div className="flex flex-wrap items-end gap-2">
                                <label className="text-xs text-slate-400">
                                  Amount ({a.currency})
                                  <Input type="number" min="0.01" step="0.01" value={payoutAmount} onChange={(event) => setPayoutAmount(event.target.value)} className="mt-1 h-9 w-36 border-slate-700 bg-slate-950 text-white" />
                                </label>
                                <label className="text-xs text-slate-400">
                                  Method
                                  <select value={payoutMethod} onChange={(event) => setPayoutMethod(event.target.value as "mpesa" | "bank")} className="mt-1 block h-9 rounded border border-slate-700 bg-slate-950 px-3 text-sm text-white">
                                    <option value="mpesa">M-Pesa</option>
                                    <option value="bank">Bank</option>
                                  </select>
                                </label>
                                <label className="text-xs text-slate-400">
                                  Reference
                                  <Input value={payoutReference} onChange={(event) => setPayoutReference(event.target.value)} className="mt-1 h-9 w-48 border-slate-700 bg-slate-950 text-white" />
                                </label>
                                <Button disabled={savingId === a.id} onClick={() => createPayout(a)} className="h-9 bg-emerald-700 hover:bg-emerald-600">
                                  Record completed payout
                                </Button>
                              </div>
                              <p className="mt-2 text-xs text-slate-500">This records an externally completed payout; it does not send money automatically.</p>
                            </div>
                            <div className="mt-5 border-t border-slate-700/70 pt-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-400">Payout history</p>
                              {(a.payouts || []).length ? (
                                <div className="space-y-2">
                                  {(a.payouts || []).map((payout) => (
                                    <div key={payout.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                                      <div>
                                        <p className="text-sm font-bold">{payout.currency} {payout.amount.toLocaleString()}</p>
                                        <p className="text-xs">{payout.reference || "No reference"} · {new Date(payout.date).toLocaleDateString()}</p>
                                      </div>
                                      <select
                                        value={payout.status}
                                        disabled={savingId === payout.id}
                                        onChange={(event) => updatePayoutStatus(a.id, payout.id, event.target.value as typeof payout.status)}
                                        className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                        <option value="failed">Failed</option>
                                      </select>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm">No payouts recorded.</p>
                              )}
                            </div>
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
