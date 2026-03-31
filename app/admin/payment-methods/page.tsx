"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  AlertCircle,
  Loader2,
  Shield,
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
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"
import { useTumaReferences } from "@/hooks/use-tuma-references"
import { useTumaConfig } from "@/hooks/use-tuma-config"
import { adminApi } from "@/lib/admin-api"
import type { PaymentMethod, PaymentMethodType } from "@/lib/types"

// =============================================================================
// CONSTANTS — Tuma-supported Kenyan banks (sourced from tuma.co.ke)
// =============================================================================
const TUMA_BANKS = [
  "KCB Bank",
  "Equity Bank",
  "Co-operative Bank",
  "ABSA Bank",
  "Standard Chartered Bank",
  "Stanbic Bank",
  "Diamond Trust Bank (DTB)",
  "Family Bank",
  "National Bank of Kenya",
  "NCBA Bank",
  "I&M Bank",
  "Sidian Bank",
  "Gulf African Bank",
  "Ecobank",
  "SBM Bank",
  "Middle East Bank",
  "Kingdom Bank",
  "HF Group",
  "Kenya Women Microfinance Bank (KWFT)",
  "Faulu Bank",
  "Prime Bank",
  "Bank of Baroda",
  "Consolidated Bank",
  "Victoria Commercial Bank",
  "Guardian Bank",
  "Credit Bank",
  "Development Bank of Kenya",
  "Mayfair CIB Bank",
  "Access Bank",
  "UBA Kenya",
]

/** Payment types relevant for a digital ISP on Tuma */
const METHOD_TYPES: {
  value: string
  label: string
  icon: typeof CreditCard
  desc: string
}[] = [
  {
    value: "MPESA",
    label: "M-Pesa STK Push",
    icon: Smartphone,
    desc: "Automated Lipa Na M-Pesa prompt sent to customer's phone",
  },
  {
    value: "MPESA_PAYBILL",
    label: "M-Pesa Paybill",
    icon: Smartphone,
    desc: "Customer sends money to your Paybill number",
  },
  {
    value: "MPESA_TILL",
    label: "M-Pesa Till (Buy Goods)",
    icon: Smartphone,
    desc: "Customer pays via Till / Buy Goods number",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    icon: Landmark,
    desc: "Direct EFT or bank deposit",
  },
  {
    value: "PAYMENT_LINK",
    label: "Payment Link",
    icon: Link2,
    desc: "Custom payment URL",
  },
]

// =============================================================================
// HELPERS
// =============================================================================
function iconFor(type: string) {
  const m: Record<string, typeof CreditCard> = {
    MPESA: Smartphone,
    MPESA_STK: Smartphone,
    MPESA_PAYBILL: Smartphone,
    MPESA_TILL: Smartphone,
    AIRTEL_MONEY: Smartphone,
    MOBILE_MONEY: Smartphone,
    BANK: Landmark,
    BANK_TRANSFER: Landmark,
    CARD: CreditCard,
    CREDIT_CARD: CreditCard,
    DEBIT_CARD: CreditCard,
    PAYMENT_LINK: Link2,
  }
  return m[type] || CreditCard
}

function labelFor(type: string): string {
  return (
    METHOD_TYPES.find((m) => m.value === type)?.label ??
    ({ MPESA_STK: "M-Pesa STK Push", MOBILE_MONEY: "Mobile Money", AIRTEL_MONEY: "Airtel Money" }[type] ?? type)
  )
}

// =============================================================================
// PAGE
// =============================================================================
export default function PaymentMethodsPage() {
  /* ── Tuma hooks ── */
  const { references, isLoading: refsLoading, error: refsError, refetch: refetchRefs } = useTumaReferences()
  const {
    config,
    isLoading: configLoading,
    isSaving: gwSaving,
    error: configError,
    isFirstTimeSetup,
    save: saveGateway,
    refetch: refetchConfig,
    clearFieldErrors,
  } = useTumaConfig()

  /* ── Payment methods ── */
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [methodsLoading, setMethodsLoading] = useState(true)
  const [methodsError, setMethodsError] = useState<string | null>(null)

  /* ── Gateway form ── */
  const [gwRefId, setGwRefId] = useState("")
  const [gwAccount, setGwAccount] = useState("")

  /* ── Add / Edit dialog ── */
  const [dlgOpen, setDlgOpen] = useState(false)
  const [dlgStep, setDlgStep] = useState<"pick" | "details">("pick")
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [form, setForm] = useState({ method_type: "", name: "", description: "", is_default: false, cfg: {} as Record<string, string> })
  const [saving, setSaving] = useState(false)

  /* ── Delete ── */
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* ── Fetch methods ── */
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

  useEffect(() => { fetchMethods() }, [fetchMethods])

  // Sync Tuma config → local form
  useEffect(() => {
    if (config) {
      setGwRefId(String(config.collection_reference_id ?? ""))
      setGwAccount(config.collection_account_number ?? "")
    }
  }, [config])

  /* ── Derived ── */
  const loading = refsLoading || configLoading
  const error = refsError || configError
  const is500 = error?.includes("500") || error?.includes("Server error")

  /* ── Gateway save ── */
  const handleGatewaySave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gwRefId) { toast.error("Select a collection channel"); return }
    if (!gwAccount.trim()) { toast.error("Enter your account / till / paybill number"); return }
    const ok = await saveGateway({ collection_reference_id: gwRefId, collection_account_number: gwAccount.trim() })
    if (ok) toast.success("Collection gateway saved", { description: "Your STK Push channel is active." })
    else toast.error("Failed to save. Check the form for errors.")
  }

  /* ── CRUD ── */
  const openAdd = () => {
    setEditing(null)
    setForm({ method_type: "", name: "", description: "", is_default: false, cfg: {} })
    setDlgStep("pick")
    setDlgOpen(true)
  }

  const openEdit = (m: PaymentMethod) => {
    setEditing(m)
    setForm({ method_type: m.method_type, name: m.name, description: m.description || "", is_default: m.is_default, cfg: (m.config || {}) as Record<string, string> })
    setDlgStep("details")
    setDlgOpen(true)
  }

  const pickType = (type: string) => {
    const meta = METHOD_TYPES.find((m) => m.value === type)
    setForm((p) => ({ ...p, method_type: type, name: meta?.label || type, cfg: {} }))
    setDlgStep("details")
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return }
    setSaving(true)
    try {
      const code = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)
      const payload: Partial<PaymentMethod> = {
        name: form.name.trim(),
        code,
        method_type: form.method_type as PaymentMethodType,
        description: form.description.trim(),
        is_default: form.is_default,
        config: form.cfg,
      }
      if (editing) {
        await adminApi.updatePaymentMethod(editing.id, payload)
        toast.success("Payment method updated")
      } else {
        await adminApi.createPaymentMethod(payload)
        toast.success("Payment method created")
      }
      setDlgOpen(false)
      fetchMethods()
    } catch (err: any) {
      toast.error(err?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (m: PaymentMethod) => {
    try {
      await adminApi.togglePaymentMethodActive(m.id)
      toast.success(m.is_active ? "Method deactivated" : "Method activated")
      fetchMethods()
    } catch (err: any) {
      toast.error(err.message || "Toggle failed")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.deletePaymentMethod(deleteTarget.id)
      toast.success("Payment method deleted")
      setDeleteTarget(null)
      fetchMethods()
    } catch (err: any) {
      toast.error(err.message || "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  /* ── Dynamic config fields ── */
  const renderFields = () => {
    const t = form.method_type
    const c = form.cfg
    const set = (k: string, v: string) => setForm((p) => ({ ...p, cfg: { ...p.cfg, [k]: v } }))

    if (t === "MPESA" || t === "MPESA_STK") {
      return (
        <>
          <Field label="Shortcode / Paybill" ph="e.g. 174379" value={c.shortcode} onChange={(v) => set("shortcode", v)} />
          <Field label="Account Reference" ph="e.g. CompanyXLTD" value={c.account_reference} onChange={(v) => set("account_reference", v)} />
        </>
      )
    }
    if (t === "MPESA_PAYBILL") {
      return <Field label="Paybill Number" required ph="e.g. 600100" value={c.paybill_number} onChange={(v) => set("paybill_number", v.replace(/\D/g, ""))} />
    }
    if (t === "MPESA_TILL") {
      return <Field label="Till Number" required ph="e.g. 123456" value={c.till_number} onChange={(v) => set("till_number", v.replace(/\D/g, ""))} />
    }
    if (t === "BANK_TRANSFER" || t === "BANK") {
      return (
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
    }
    if (t === "PAYMENT_LINK") {
      return <Field label="Payment URL" ph="https://pay.example.com/..." value={c.custom_link} onChange={(v) => set("custom_link", v)} type="url" />
    }
    return null
  }

  // ═══════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════
  if (loading && methodsLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-96" />
        <Skeleton className="h-[160px] w-full max-w-2xl rounded-xl" />
        <Skeleton className="h-[320px] w-full max-w-2xl rounded-xl" />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your Tuma collection gateway and the payment options customers see on invoices.
          </p>
        </div>
        <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Method</Button>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-4">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-800 dark:text-red-300 flex-1">{error}</p>
            {is500 && (
              <Button variant="outline" size="sm" onClick={() => { refetchRefs(); refetchConfig() }}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Retry
              </Button>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           SECTION 1 — Collection Gateway (Tuma STK channel)
        ═════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg shrink-0">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Collection Gateway</CardTitle>
                  {config && !isFirstTimeSetup && (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]">Active</Badge>
                  )}
                </div>
                <CardDescription>
                  {isFirstTimeSetup
                    ? "Connect your Tuma channel to start receiving automated M-Pesa STK Push payments."
                    : "Your automated STK Push collection channel."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGatewaySave} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Collection Channel <span className="text-red-500">*</span></Label>
                <Select value={gwRefId} onValueChange={(v) => { setGwRefId(v); clearFieldErrors() }}>
                  <SelectTrigger><SelectValue placeholder="Select channel..." /></SelectTrigger>
                  <SelectContent>
                    {references.length === 0
                      ? <div className="p-3 text-sm text-center text-muted-foreground">No channels available.</div>
                      : references.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          <span className="flex items-center gap-2">
                            {r.name}
                            {r.code && <span className="text-xs text-muted-foreground">({r.code})</span>}
                          </span>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Account Number <span className="text-red-500">*</span></Label>
                <Input
                  type="text" inputMode="numeric" placeholder="e.g. 600123"
                  value={gwAccount}
                  onChange={(e) => { setGwAccount(e.target.value.replace(/\D/g, "")); clearFieldErrors() }}
                  maxLength={20} autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">The Till, Paybill, or bank account number linked to your Tuma channel.</p>
              </div>

              <Button type="submit" disabled={gwSaving} className="w-full">
                {gwSaving
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                  : isFirstTimeSetup ? "Connect Gateway" : "Update Gateway"}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Powered by{" "}
                <a href="https://tuma.co.ke" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">Tuma</a>
                {" "}— supports M-Pesa, Kenyan banks &amp; more
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════
           SECTION 2 — Customer-facing payment methods
        ═════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Customer Payment Options</CardTitle>
            <CardDescription>Methods your customers see on invoices and checkout. Toggle to enable or disable.</CardDescription>
          </CardHeader>
          <CardContent>
            {methodsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : methodsError ? (
              <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300 flex-1">{methodsError}</p>
                <Button variant="outline" size="sm" onClick={() => { setMethodsLoading(true); fetchMethods() }}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />Retry
                </Button>
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No payment methods configured yet.</p>
                <Button variant="outline" size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add your first method</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {methods.map((m) => {
                  const Icon = iconFor(m.method_type)
                  return (
                    <div key={m.id} className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${m.is_active ? "bg-card" : "bg-muted/30 opacity-60"}`}>
                      <div className="p-2 rounded-lg bg-muted/50 shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{m.name}</p>
                          {m.is_default && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Default</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {labelFor(m.method_type)}{m.description ? ` · ${m.description}` : ""}
                        </p>
                      </div>
                      <Switch checked={m.is_active} onCheckedChange={() => handleToggle(m)} className="shrink-0" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(m)}><Pencil className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(m)}><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════
         ADD / EDIT DIALOG
      ═══════════════════════════════════════════ */}
      <Dialog open={dlgOpen} onOpenChange={(o) => { if (!o) setDlgOpen(false) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Payment Method" : dlgStep === "pick" ? "Add Payment Method" : `Set Up ${METHOD_TYPES.find((m) => m.value === form.method_type)?.label || "Method"}`}
            </DialogTitle>
            <DialogDescription>
              {dlgStep === "pick" ? "Choose the type of payment method to add." : "Configure the details for this method."}
            </DialogDescription>
          </DialogHeader>

          {dlgStep === "pick" ? (
            <div className="grid gap-2 py-2">
              {METHOD_TYPES.map((mt) => {
                const Icon = mt.icon
                return (
                  <button key={mt.value} onClick={() => pickType(mt.value)} className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors group">
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
                <button onClick={() => setDlgStep("pick")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3 w-3" />Back to type selection
                </button>
              )}
              <Field label="Display Name" required ph="e.g. M-Pesa Business" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Instructions shown to customers (optional)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
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
              <Button variant="outline" onClick={() => setDlgOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

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
    </div>
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
