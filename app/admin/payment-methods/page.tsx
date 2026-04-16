"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  AlertCircle,
  Loader2,
  CreditCard,
  RefreshCw,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  Smartphone,
  Landmark,
  Link2,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  CircleDollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ArrowRight,
  Sparkles,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InactivityGuard } from "@/components/inactivity-guard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { PaymentMethod, PaymentMethodType, PaymentDashboardStats, MpesaConfiguration } from "@/lib/types"

// =============================================================================
// CONSTANTS
// =============================================================================
const TUMA_BANKS = [
  "KCB Bank", "Equity Bank", "Co-operative Bank", "ABSA Bank",
  "Standard Chartered Bank", "Stanbic Bank", "Diamond Trust Bank (DTB)",
  "Family Bank", "National Bank of Kenya", "NCBA Bank", "I&M Bank",
  "Sidian Bank", "Gulf African Bank", "Ecobank", "SBM Bank",
  "Middle East Bank", "Kingdom Bank", "HF Group",
  "Kenya Women Microfinance Bank (KWFT)", "Faulu Bank", "Prime Bank",
  "Bank of Baroda", "Consolidated Bank", "Victoria Commercial Bank",
  "Guardian Bank", "Credit Bank", "Development Bank of Kenya",
  "Mayfair CIB Bank", "Access Bank", "UBA Kenya",
]

const METHOD_TYPES: { value: string; label: string; icon: typeof CreditCard; desc: string; color: string }[] = [
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone, desc: "M-Pesa, Airtel Money, or Telkom T-Kash — receive payments directly to your mobile wallet", color: "emerald" },
  { value: "MPESA_PAYBILL", label: "M-Pesa Paybill", icon: Smartphone, desc: "Customer sends money to your Paybill number", color: "emerald" },
  { value: "MPESA_TILL", label: "M-Pesa Till (Buy Goods)", icon: Smartphone, desc: "Customer pays via Till / Buy Goods number", color: "emerald" },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark, desc: "Direct EFT or bank deposit via supported banks", color: "blue" },
  { value: "PAYMENT_LINK", label: "Payment Link", icon: Link2, desc: "Custom payment URL for online payments", color: "violet" },
]

const MOBILE_PROVIDERS = [
  { value: "SAFARICOM", label: "Safaricom M-Pesa", placeholder: "e.g. 254712345678" },
  { value: "AIRTEL", label: "Airtel Money", placeholder: "e.g. 254733123456" },
  { value: "TELKOM", label: "Telkom T-Kash", placeholder: "e.g. 254770123456" },
]

const MAX_METHODS = 3

// =============================================================================
// HELPERS
// =============================================================================
function iconFor(type: string) {
  const m: Record<string, typeof CreditCard> = {
    MOBILE_MONEY: Smartphone, MPESA_NUMBER: Smartphone, MPESA: Smartphone, MPESA_STK: Smartphone,
    MPESA_PAYBILL: Smartphone, MPESA_TILL: Smartphone, AIRTEL_MONEY: Smartphone,
    BANK: Landmark, BANK_TRANSFER: Landmark, CARD: CreditCard,
    CREDIT_CARD: CreditCard, DEBIT_CARD: CreditCard, PAYMENT_LINK: Link2,
  }
  return m[type] || CreditCard
}

function colorFor(type: string): string {
  if (type.startsWith("MPESA") || type === "MOBILE_MONEY" || type === "AIRTEL_MONEY") return "emerald"
  if (type === "BANK" || type === "BANK_TRANSFER") return "blue"
  if (type === "PAYMENT_LINK") return "violet"
  return "slate"
}

function labelFor(type: string): string {
  return METHOD_TYPES.find((m) => m.value === type)?.label ??
    ({ MPESA_STK: "M-Pesa STK Push", MOBILE_MONEY: "Mobile Money", AIRTEL_MONEY: "Airtel Money" }[type] ?? type)
}

function configSummary(m: PaymentMethod): string {
  const c = (m.config || {}) as Record<string, string>
  const provider = MOBILE_PROVIDERS.find((p) => p.value === c.mobile_provider)
  if (c.phone_number && provider) return `${provider.label}: ${c.phone_number}`
  if (c.phone_number) return `Mobile: ${c.phone_number}`
  if (c.paybill_number) return `Paybill: ${c.paybill_number}`
  if (c.till_number) return `Till: ${c.till_number}`
  if (c.shortcode) return `Shortcode: ${c.shortcode}`
  if (c.bank_name) return `${c.bank_name}${c.account_number ? ` · ${c.account_number}` : ""}`
  if (c.custom_link) return c.custom_link.replace(/^https?:\/\//, "").slice(0, 30)
  return m.description || ""
}

const colorMap: Record<string, { bg: string; text: string; icon: string; ring: string }> = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", icon: "text-emerald-600", ring: "ring-emerald-200 dark:ring-emerald-800" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", icon: "text-blue-600", ring: "ring-blue-200 dark:ring-blue-800" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-400", icon: "text-violet-600", ring: "ring-violet-200 dark:ring-violet-800" },
  slate:   { bg: "bg-slate-50 dark:bg-slate-900/30", text: "text-slate-700 dark:text-slate-400", icon: "text-slate-600", ring: "ring-slate-200 dark:ring-slate-800" },
}

// =============================================================================
// DARAJA SECTION COMPONENT
// =============================================================================
function DarajaSection({
  value,
  onChange,
  isEditing,
}: {
  value: {
    enabled: boolean
    business_shortcode: string
    shortcode_type: string
    consumer_key: string
    consumer_secret: string
    passkey: string
    is_sandbox: boolean
    existing_id: number | null
  }
  onChange: (k: string, v: any) => void
  isEditing: boolean
}) {
  return (
    <div className="rounded-lg border border-dashed p-4 space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Use your own Daraja credentials</p>
          <p className="text-xs text-muted-foreground">Route payments directly via Safaricom Daraja API using your own credentials</p>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(v) => onChange("enabled", v)} />
      </div>

      {value.enabled && (
        <div className="space-y-3 pt-2 border-t">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Shortcode Type</Label>
              <Select value={value.shortcode_type} onValueChange={(v) => onChange("shortcode_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAYBILL">Paybill</SelectItem>
                  <SelectItem value="TILL">Till (Buy Goods)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shortcode / Paybill <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. 174379" value={value.business_shortcode} onChange={(e) => onChange("business_shortcode", e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
          <Field
            label={isEditing ? "Consumer Key (leave blank to keep existing)" : "Consumer Key"}
            required={!isEditing}
            ph="From Daraja portal"
            value={value.consumer_key}
            onChange={(v) => onChange("consumer_key", v)}
          />
          <Field
            label={isEditing ? "Consumer Secret (leave blank to keep existing)" : "Consumer Secret"}
            required={!isEditing}
            ph="From Daraja portal"
            value={value.consumer_secret}
            onChange={(v) => onChange("consumer_secret", v)}
          />
          <Field
            label="Passkey (for STK Push)"
            ph="From Daraja sandbox/production"
            value={value.passkey}
            onChange={(v) => onChange("passkey", v)}
          />
          <div className="flex items-center justify-between py-1">
            <div>
              <Label className="text-sm">Sandbox / Test mode</Label>
              <p className="text-xs text-muted-foreground">Use Daraja sandbox environment</p>
            </div>
            <Switch checked={value.is_sandbox} onCheckedChange={(v) => onChange("is_sandbox", v)} />
          </div>
          {value.existing_id && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Daraja config linked (ID {value.existing_id})
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// PAGE
// =============================================================================
export default function PaymentMethodsPage() {
  /* ── Payment methods ── */
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [methodsLoading, setMethodsLoading] = useState(true)
  const [methodsError, setMethodsError] = useState<string | null>(null)

  /* ── Dashboard stats ── */
  const [stats, setStats] = useState<PaymentDashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  /* ── Add / Edit dialog ── */
  const [dlgOpen, setDlgOpen] = useState(false)
  const [dlgStep, setDlgStep] = useState<"pick" | "details">("pick")
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [form, setForm] = useState({
    method_type: "",
    name: "",
    description: "",
    is_default: false,
    cfg: {} as Record<string, string>,
    daraja: {
      enabled: false,
      business_shortcode: "",
      shortcode_type: "PAYBILL" as "PAYBILL" | "TILL",
      consumer_key: "",
      consumer_secret: "",
      passkey: "",
      is_sandbox: false,
      existing_id: null as number | null,
    },
  })
  const [saving, setSaving] = useState(false)

  /* ── Delete ── */
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [forceDeleteInfo, setForceDeleteInfo] = useState<{ method: PaymentMethod; paymentCount: number } | null>(null)

  /* ── Activate / Deactivate ── */
  const [toggleTarget, setToggleTarget] = useState<{ method: PaymentMethod; action: 'activate' | 'deactivate' } | null>(null)
  const [toggling, setToggling] = useState(false)

  /* ── Fetch ── */
  const fetchMethods = useCallback(async () => {
    try {
      setMethodsError(null)
      const res = await adminApi.getPaymentMethods()
      setMethods(res.results || [])
    } catch (err: any) {
      setMethodsError(err.message || "Failed to load payment methods")
    } finally {
      setMethodsLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi.getPaymentDashboardStats()
      setStats(data)
    } catch {
      // Stats are supplementary — fail silently
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => { fetchMethods(); fetchStats() }, [fetchMethods, fetchStats])

  /* ── Derived ── */
  const activeMethods = methods.filter((m) => m.is_active)
  const isFirstTime = !methodsLoading && methods.length === 0

  /* ── CRUD ── */
  const openAdd = () => {
    if (methods.length >= MAX_METHODS) {
      toast.error(`Maximum ${MAX_METHODS} payment methods allowed`, { description: "Delete an existing method to add a new one." })
      return
    }
    setEditing(null)
    setForm({
      method_type: "",
      name: "",
      description: "",
      is_default: false,
      cfg: {},
      daraja: {
        enabled: false,
        business_shortcode: "",
        shortcode_type: "PAYBILL",
        consumer_key: "",
        consumer_secret: "",
        passkey: "",
        is_sandbox: false,
        existing_id: null,
      },
    })
    setDlgStep("pick")
    setDlgOpen(true)
  }

  const openEdit = (m: PaymentMethod) => {
    setEditing(m)
    const details = m.mpesa_configuration_details
    setForm({
      method_type: m.method_type,
      name: m.name,
      description: m.description || "",
      is_default: m.is_default,
      cfg: (m.config || {}) as Record<string, string>,
      daraja: {
        enabled: !!details?.business_shortcode,
        business_shortcode: details?.business_shortcode || "",
        shortcode_type: details?.shortcode_type || "PAYBILL",
        consumer_key: "",   // write-only — never prefilled
        consumer_secret: "",
        passkey: "",
        is_sandbox: details?.is_sandbox ?? false,
        existing_id: typeof m.mpesa_configuration === 'number' ? m.mpesa_configuration : null,
      },
    })
    setDlgStep("details")
    setDlgOpen(true)
  }

  const pickType = (type: string) => {
    const meta = METHOD_TYPES.find((m) => m.value === type)
    const shortcodeType = type === 'MPESA_TILL' ? 'TILL' : 'PAYBILL'
    setForm((p) => ({
      ...p,
      method_type: type,
      name: meta?.label || type,
      cfg: {},
      daraja: {
        enabled: false,
        business_shortcode: "",
        shortcode_type: shortcodeType,
        consumer_key: "",
        consumer_secret: "",
        passkey: "",
        is_sandbox: false,
        existing_id: null,
      },
    }))
    setDlgStep("details")
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return }
    if (form.method_type === "MOBILE_MONEY" && !form.cfg.mobile_provider) {
      toast.error("Please select a mobile provider"); return
    }
    if (form.method_type === "MOBILE_MONEY" && !form.cfg.phone_number) {
      toast.error("Phone number is required"); return
    }

    // Daraja validation
    if (form.daraja.enabled) {
      if (!form.daraja.business_shortcode) { toast.error("Shortcode/Paybill is required for direct M-Pesa"); return }
      if (!editing || form.daraja.consumer_key) {
        // On create always required; on edit only required if changing
        if (!form.daraja.consumer_key || !form.daraja.consumer_secret) {
          toast.error("Consumer Key and Consumer Secret are required"); return
        }
      }
    }

    setSaving(true)
    try {
      let mpesaConfigId: number | null = null

      // Step 1: Create or update Daraja config if enabled
      if (form.daraja.enabled) {
        const darajaPayload: Partial<MpesaConfiguration> = {
          business_shortcode: form.daraja.business_shortcode,
          shortcode_type: form.daraja.shortcode_type,
          is_sandbox: form.daraja.is_sandbox,
          is_active: true,
          ...(form.daraja.consumer_key && { consumer_key: form.daraja.consumer_key }),
          ...(form.daraja.consumer_secret && { consumer_secret: form.daraja.consumer_secret }),
          ...(form.daraja.passkey && { passkey: form.daraja.passkey }),
        }
        let cfg
        if (form.daraja.existing_id) {
          cfg = await adminApi.updateMpesaConfiguration(form.daraja.existing_id, darajaPayload)
        } else {
          cfg = await adminApi.createMpesaConfiguration(darajaPayload)
        }
        mpesaConfigId = cfg.id
      }

      // Step 2: Save payment method
      const code = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)
      const payload: Partial<PaymentMethod> & { mpesa_configuration?: number | null } = {
        name: form.name.trim(),
        code,
        method_type: form.method_type as PaymentMethodType,
        description: form.description.trim(),
        is_default: form.is_default,
        config: form.cfg,
        mpesa_configuration: form.daraja.enabled ? mpesaConfigId : null,
      }

      if (editing) {
        const result = await adminApi.updatePaymentMethod(editing.id, payload) as any
        const synced = result?.tuma_synced
        const provider = form.daraja.enabled ? "Direct M-Pesa (Daraja)" : "payment gateway"
        toast.success("Payment method updated", {
          description: `Settlement via ${provider}.${editing.is_active && synced ? " Synced." : ""}`,
        })
      } else {
        const isFirst = methods.length === 0
        const provider = form.daraja.enabled ? "Direct M-Pesa (Daraja)" : "payment gateway"
        await adminApi.createPaymentMethod(payload)
        toast.success("Payment method created", {
          description: isFirst
            ? `Active via ${provider}.`
            : "Added as inactive — activate to switch.",
        })
      }
      setDlgOpen(false)
      fetchMethods()
      fetchStats()
    } catch (err: any) {
      toast.error(err?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const confirmToggle = (m: PaymentMethod, action: 'activate' | 'deactivate') => {
    setToggleTarget({ method: m, action })
  }

  const handleActivateDeactivate = async () => {
    if (!toggleTarget) return
    setToggling(true)
    const { method, action } = toggleTarget
    try {
      // Backend toggle handles: deactivate others + Tuma settlement sync
      const result = await adminApi.togglePaymentMethodActive(method.id)

      if (action === 'activate') {
        const channel = result.settlement_channel || method.name
        const ref = result.tuma_reference ? ` (ref: ${result.tuma_reference})` : ''
        const synced = result.tuma_synced !== false

        toast.success(`${method.name} activated`, {
          description: synced
            ? `Settlement channel: ${channel}${ref}. All customer payments now route here.`
            : `Activated locally. Sync pending${result.tuma_error ? `: ${result.tuma_error}` : '.'}`,
          duration: synced ? 4000 : 6000,
        })
        if (result.note) {
          toast.info(result.note, { duration: 5000 })
        }
      } else {
        toast.success(`${method.name} deactivated`, {
          description: result.tuma_synced !== false
            ? 'Settlement paused. No active payment channel — activate another to resume collections.'
            : 'Deactivated locally. Customers will no longer see this option.',
        })
      }
      setToggleTarget(null)
      fetchMethods()
      fetchStats()
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${action}`)
    } finally {
      setToggling(false)
    }
  }

  const handleDelete = async () => {
    const target = forceDeleteInfo?.method || deleteTarget
    if (!target) return
    setDeleting(true)
    try {
      const isForce = !!forceDeleteInfo
      const result = await adminApi.deletePaymentMethod(target.id, isForce)

      // Build descriptive toast based on what happened
      let description: string | undefined
      if (result?.tuma_action === 'business_deleted') {
        description = 'Payment profile removed — no payment methods remain.'
      } else if (result?.tuma_action === 'deactivated') {
        description = 'Settlement paused — activate another method to resume collections.'
      } else if (isForce) {
        description = `${forceDeleteInfo!.paymentCount} payment(s) were unlinked from this method.`
      }

      toast.success(`${target.name} deleted`, { description })
      setDeleteTarget(null)
      setForceDeleteInfo(null)
      fetchMethods()
      fetchStats()
    } catch (err: any) {
      if (err?.status === 409 && !forceDeleteInfo) {
        // First attempt returned 409 — show the force-delete dialog
        setDeleteTarget(null)
        setForceDeleteInfo({
          method: target,
          paymentCount: err.data?.payment_count || 0,
        })
      } else {
        toast.error(err?.message || "Delete failed")
      }
    } finally {
      setDeleting(false)
    }
  }

  /* ── Dynamic config fields for dialog ── */
  const renderFields = () => {
    const t = form.method_type
    const c = form.cfg
    const set = (k: string, v: string) => setForm((p) => ({ ...p, cfg: { ...p.cfg, [k]: v } }))
    const setDaraja = (k: string, v: any) => setForm((p) => ({ ...p, daraja: { ...p.daraja, [k]: v } }))
    const showDaraja = ['MPESA_PAYBILL', 'MPESA_TILL', 'MPESA_STK', 'MOBILE_MONEY'].includes(t)

    let fields: React.ReactNode = null

    if (t === "MOBILE_MONEY" || t === "MPESA_NUMBER") {
      const selectedProvider = MOBILE_PROVIDERS.find((p) => p.value === c.mobile_provider)
      fields = (
        <>
          <div className="space-y-2">
            <Label>Mobile Provider <span className="text-red-500">*</span></Label>
            <Select value={c.mobile_provider || ""} onValueChange={(v) => set("mobile_provider", v)}>
              <SelectTrigger><SelectValue placeholder="Select provider..." /></SelectTrigger>
              <SelectContent>
                {MOBILE_PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Field
            label="Phone Number"
            required
            ph={selectedProvider?.placeholder || "e.g. 254712345678"}
            value={c.phone_number}
            onChange={(v) => set("phone_number", v.replace(/[^0-9]/g, ""))}
          />
          <p className="text-xs text-muted-foreground -mt-1">
            {c.mobile_provider === "AIRTEL" ? "The Airtel Money registered number." :
             c.mobile_provider === "TELKOM" ? "The T-Kash registered number." :
             "The M-Pesa registered number for STK Push payments."}
          </p>
        </>
      )
    } else if (t === "MPESA" || t === "MPESA_STK") {
      fields = (
        <>
          <Field label="Shortcode / Paybill" ph="e.g. 174379" value={c.shortcode} onChange={(v) => set("shortcode", v)} />
          <Field label="Account Reference" ph="e.g. CompanyXLTD" value={c.account_reference} onChange={(v) => set("account_reference", v)} />
        </>
      )
    } else if (t === "MPESA_PAYBILL") {
      fields = <Field label="Paybill Number" required ph="e.g. 600100" value={c.paybill_number} onChange={(v) => set("paybill_number", v.replace(/\D/g, ""))} />
    } else if (t === "MPESA_TILL") {
      fields = <Field label="Till Number" required ph="e.g. 123456" value={c.till_number} onChange={(v) => set("till_number", v.replace(/\D/g, ""))} />
    } else if (t === "BANK_TRANSFER" || t === "BANK") {
      fields = (
        <>
          <div className="space-y-2">
            <Label>Bank <span className="text-red-500">*</span></Label>
            <Select value={c.bank_name || ""} onValueChange={(v) => set("bank_name", v)}>
              <SelectTrigger><SelectValue placeholder="Select bank..." /></SelectTrigger>
              <SelectContent className="max-h-60">
                {TUMA_BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Banks supported by Tuma payment gateway</p>
          </div>
          <Field label="Account Number" required ph="e.g. 0112345678" value={c.account_number} onChange={(v) => set("account_number", v)} />
        </>
      )
    } else if (t === "PAYMENT_LINK") {
      fields = <Field label="Payment URL" ph="https://pay.example.com/..." value={c.custom_link} onChange={(v) => set("custom_link", v)} type="url" />
    }

    return (
      <>
        {fields}
        {showDaraja && (
          <DarajaSection
            value={form.daraja}
            onChange={setDaraja}
            isEditing={!!editing}
          />
        )}
      </>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════
  if (methodsLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // FIRST-TIME ONBOARDING
  // ═══════════════════════════════════════════════════════════════════
  if (isFirstTime) {
    return (
      <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up how your customers pay you.</p>
        </div>

        <div className="max-w-2xl">
          {/* Welcome card */}
          <Card className="border-dashed border-2 mb-6">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Welcome! Let&apos;s set up your first payment method</h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Add a collection channel so your customers can start paying. Each method you add becomes
                    available on invoices and the customer portal.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step-by-step guide */}
          <div className="space-y-3 mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">How it works</h3>
            {[
              { step: 1, title: "Add a payment method", desc: "Choose M-Pesa, Bank Transfer, or a payment link — whatever your customers prefer." },
              { step: 2, title: "Configure the details", desc: "Enter your Paybill, Till number, or bank account. We'll handle the rest via Tuma." },
              { step: 3, title: "Start collecting", desc: "The method appears on invoices immediately. Payments reconcile automatically." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 p-4 rounded-xl border bg-card">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{s.step}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <Button onClick={openAdd} size="lg" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Payment Method
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Powered by <a href="https://tuma.co.ke" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">Tuma</a> — M-Pesa, Kenyan banks &amp; more
          </p>
        </div>

        {/* Dialog still needs to be available */}
        <AddEditDialog
          open={dlgOpen}
          onOpenChange={setDlgOpen}
          dlgStep={dlgStep}
          setDlgStep={setDlgStep}
          editing={editing}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={handleSave}
          onPickType={pickType}
          renderFields={renderFields}
        />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // MAIN VIEW — analytics + card grid
  // ═══════════════════════════════════════════════════════════════════
  const totalCollected = stats ? parseFloat(stats.amount_this_month || stats.total_amount || "0") : 0
  const todayAmount = stats ? parseFloat(stats.amount_today || "0") : 0
  const successRate = stats ? Math.round((stats.completed_payments / Math.max(stats.total_payments, 1)) * 100) : 0

  return (
    <InactivityGuard timeoutMinutes={5}>
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your collection channels. Each method is available to customers on invoices.
          </p>
        </div>
        <Button onClick={openAdd} disabled={methods.length >= MAX_METHODS}>
          <Plus className="h-4 w-4 mr-1.5" />{methods.length >= MAX_METHODS ? `Limit (${MAX_METHODS})` : "Add Method"}
        </Button>
      </div>

      {/* Integration Tabs */}
      <Tabs value={integrationTab} onValueChange={setIntegrationTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="netily" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Netily</span>
          </TabsTrigger>
          <TabsTrigger value="daraja" className="gap-1.5">
            <Smartphone className="h-3.5 w-3.5" />
            M-Pesa Daraja
          </TabsTrigger>
          <TabsTrigger value="kopokopo" className="gap-1.5">
            <Landmark className="h-3.5 w-3.5" />
            KopoKopo
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Netily ─── */}
        <TabsContent value="netily" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <div />
            <Button onClick={openAdd} disabled={methods.length >= MAX_METHODS}>
              <Plus className="h-4 w-4 mr-1.5" />{methods.length >= MAX_METHODS ? `Limit (${MAX_METHODS})` : "Add Method"}
            </Button>
          </div>

      {/* Error banner */}
      {methodsError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-800 dark:text-red-300 flex-1">{methodsError}</p>
          <Button variant="outline" size="sm" onClick={() => { setMethodsLoading(true); fetchMethods() }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Retry
          </Button>
        </div>
      )}

      {/* ─── Analytics Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Collected This Month"
          value={statsLoading ? "—" : `KES ${totalCollected.toLocaleString()}`}
          icon={CircleDollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          sub={stats?.payments_this_month ? `${stats.payments_this_month} transactions` : undefined}
        />
        <StatCard
          title="Today"
          value={statsLoading ? "—" : `KES ${todayAmount.toLocaleString()}`}
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950/30"
          sub={stats?.payments_today ? `${stats.payments_today} payments` : undefined}
        />
        <StatCard
          title="Success Rate"
          value={statsLoading ? "—" : `${successRate}%`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          sub={stats ? `${stats.completed_payments} completed · ${stats.failed_payments} failed` : undefined}
          progress={statsLoading ? undefined : successRate}
        />
        <StatCard
          title="Active Channels"
          value={`${activeMethods.length} / ${methods.length}`}
          icon={Zap}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          sub={`${methods.length} total configured`}
        />
      </div>

      {/* ─── Payment Method Cards Grid ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Collection Channels</h2>
          <p className="text-xs text-muted-foreground">{activeMethods.length} active</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {methods.map((m) => {
            const Icon = iconFor(m.method_type)
            const c = colorFor(m.method_type)
            const colors = colorMap[c]
            const summary = configSummary(m)

            return (
              <Card
                key={m.id}
                className={`relative overflow-hidden transition-all duration-200 ${
                  m.is_active
                    ? "hover:shadow-md"
                    : "opacity-50 grayscale"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${colors.bg} ring-1 ${colors.ring}`}>
                        <Icon className={`h-5 w-5 ${colors.icon}`} />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">{m.name}</CardTitle>
                        <CardDescription className="text-xs">{labelFor(m.method_type)}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2 -mt-1">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(m)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {m.is_active ? (
                          <DropdownMenuItem onClick={() => confirmToggle(m, 'deactivate')}>
                            <XCircle className="h-3.5 w-3.5 mr-2" />Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => confirmToggle(m, 'activate')}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" />Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(m)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pb-4 space-y-3">
                  {/* Config summary */}
                  {summary && (
                    <div className={`text-xs font-mono px-3 py-2 rounded-lg ${colors.bg} ${colors.text} truncate`}>
                      {summary}
                    </div>
                  )}

                  {/* Provider badge */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {(m as any).mpesa_configuration_details?.business_shortcode ? (
                      <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400">
                        Direct M-Pesa · {(m as any).mpesa_configuration_details.business_shortcode}
                      </Badge>
                    ) : (m.method_type?.startsWith('MPESA') || m.method_type === 'MOBILE_MONEY') ? (
                      <Badge variant="outline" className="text-[10px]">Netily</Badge>
                    ) : null}
                  </div>

                  {/* Method breakdown from stats */}
                  {stats?.payment_methods_breakdown && (() => {
                    const breakdown = stats.payment_methods_breakdown?.find(
                      (b) => b.method === m.method_type || b.method === m.code
                    )
                    if (!breakdown) return null
                    return (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{breakdown.count} transactions</span>
                        <span className="font-medium text-foreground">KES {parseFloat(breakdown.amount).toLocaleString()}</span>
                      </div>
                    )
                  })()}

                  {/* Footer: status + toggle */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1.5">
                      {m.is_active ? (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-0 text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3" />Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <XCircle className="h-3 w-3" />Inactive
                        </Badge>
                      )}
                      {m.is_default && (
                        <Badge variant="outline" className="text-[10px]">Default</Badge>
                      )}
                    </div>
                    <Switch
                      checked={m.is_active}
                      onCheckedChange={() => confirmToggle(m, m.is_active ? 'deactivate' : 'activate')}
                      className="scale-90"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Add new card */}
          {methods.length < MAX_METHODS && (
            <button
              onClick={openAdd}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/20 p-8 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200 min-h-[200px] cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Add Collection Channel</p>
                <p className="text-xs mt-0.5">M-Pesa, Bank, or Link</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
         ADD / EDIT DIALOG (unchanged UX)
      ═══════════════════════════════════════════ */}
      <AddEditDialog
        open={dlgOpen}
        onOpenChange={setDlgOpen}
        dlgStep={dlgStep}
        setDlgStep={setDlgStep}
        editing={editing}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
        onPickType={pickType}
        renderFields={renderFields}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Payment Method?</DialogTitle>
            <DialogDescription>
              This will permanently remove <span className="font-medium">{deleteTarget?.name}</span>. Customers will no longer see this option.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Delete confirm (shown after 409 — has linked payments) */}
      <Dialog open={!!forceDeleteInfo} onOpenChange={(o) => { if (!o) setForceDeleteInfo(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete With Linked Payments?</DialogTitle>
            <DialogDescription>
              <span className="font-medium">{forceDeleteInfo?.method.name}</span> has{' '}
              <span className="font-semibold">{forceDeleteInfo?.paymentCount}</span> payment(s) linked to it.
              Deleting will unlink those payments (they won&apos;t be lost, just no longer associated with this method).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setForceDeleteInfo(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate / Deactivate confirm */}
      <Dialog open={!!toggleTarget} onOpenChange={(o) => { if (!o) setToggleTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {toggleTarget?.action === 'activate' ? 'Activate Payment Method?' : 'Deactivate Payment Method?'}
            </DialogTitle>
            <DialogDescription>
              {toggleTarget?.action === 'activate' ? (
                <>
                  <span className="font-medium">{toggleTarget.method.name}</span> will become the active payment method.
                  {activeMethods.filter((m) => m.id !== toggleTarget.method.id).length > 0 && (
                    <> <span className="font-medium">{activeMethods.filter((m) => m.id !== toggleTarget.method.id).map((m) => m.name).join(', ')}</span> will be deactivated. Only one method can be active at a time.</>
                  )}
                </>
              ) : (
                <>Deactivating <span className="font-medium">{toggleTarget?.method.name}</span> means customers will no longer see this payment option. You can reactivate it anytime.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setToggleTarget(null)}>Cancel</Button>
            <Button
              variant={toggleTarget?.action === 'deactivate' ? 'destructive' : 'default'}
              onClick={handleActivateDeactivate}
              disabled={toggling}
            >
              {toggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {toggleTarget?.action === 'activate' ? 'Activate' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </InactivityGuard>
  )
}

// =============================================================================
// STAT CARD
// =============================================================================
function StatCard({ title, value, icon: Icon, iconColor, iconBg, sub, progress: progressVal }: {
  title: string; value: string; icon: typeof CreditCard; iconColor: string; iconBg: string; sub?: string; progress?: number
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className={`p-1.5 rounded-lg ${iconBg}`}><Icon className={`h-4 w-4 ${iconColor}`} /></div>
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {progressVal !== undefined && (
          <Progress value={progressVal} className="h-1.5 mt-2" />
        )}
        {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// ADD / EDIT DIALOG (extracted, same UX)
// =============================================================================
function AddEditDialog({ open, onOpenChange, dlgStep, setDlgStep, editing, form, setForm, saving, onSave, onPickType, renderFields }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  dlgStep: "pick" | "details"
  setDlgStep: (s: "pick" | "details") => void
  editing: PaymentMethod | null
  form: { method_type: string; name: string; description: string; is_default: boolean; cfg: Record<string, string>; daraja: any }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  saving: boolean
  onSave: () => void
  onPickType: (type: string) => void
  renderFields: () => React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Payment Method" : dlgStep === "pick" ? "Add Payment Method" : `Set Up ${METHOD_TYPES.find((m) => m.value === form.method_type)?.label || "Method"}`}
          </DialogTitle>
          <DialogDescription>
            {dlgStep === "pick"
              ? "Choose the type of collection channel to add."
              : "Configure the details. This will be visible to your customers on invoices."}
          </DialogDescription>
        </DialogHeader>

        {dlgStep === "pick" ? (
          <div className="grid gap-2 py-2">
            {METHOD_TYPES.map((mt) => {
              const Icon = mt.icon
              return (
                <button
                  key={mt.value}
                  onClick={() => onPickType(mt.value)}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-muted/50 shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{mt.label}</p>
                    <p className="text-xs text-muted-foreground">{mt.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {!editing && (
              <button
                onClick={() => setDlgStep("pick")}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />Back to type selection
              </button>
            )}
            <Field label="Display Name" required ph="e.g. M-Pesa Business" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Instructions shown to customers (optional)"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            {renderFields()}
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="method-default" className="text-sm">Set as default</Label>
              <Switch id="method-default" checked={form.is_default} onCheckedChange={(v) => setForm((p) => ({ ...p, is_default: v }))} />
            </div>
          </div>
        )}

        {dlgStep === "details" && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// REUSABLE INPUT FIELD
// =============================================================================
function Field({ label, ph, value, onChange, required, type }: {
  label: string; ph?: string; value?: string; onChange: (v: string) => void; required?: boolean; type?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-red-500"> *</span>}</Label>
      <Input type={type || "text"} placeholder={ph} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}