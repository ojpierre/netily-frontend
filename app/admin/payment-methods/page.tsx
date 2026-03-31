"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  AlertCircle,
  Loader2,
  Shield,
  CreditCard,
  RefreshCw,
  Building2,
  Hash,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  Landmark,
  Banknote,
  Link2,
  Ticket,
  CheckCircle,
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
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useTumaReferences } from "@/hooks/use-tuma-references"
import { useTumaConfig } from "@/hooks/use-tuma-config"
import { adminApi } from "@/lib/admin-api"
import type { PaymentMethod, PaymentMethodType } from "@/lib/types"

// =============================================================================
// CONSTANTS
// =============================================================================

/** Methods that make sense for digital ISP payments. No CASH/CHEQUE. */
const ALLOWED_METHOD_TYPES: { value: string; label: string; icon: typeof CreditCard; description: string }[] = [
  { value: "MPESA", label: "M-Pesa STK Push", icon: Smartphone, description: "Automated Lipa Na M-Pesa STK push" },
  { value: "MPESA_PAYBILL", label: "M-Pesa Paybill", icon: Smartphone, description: "Manual paybill payment" },
  { value: "MPESA_TILL", label: "M-Pesa Till", icon: Smartphone, description: "Buy Goods (Till Number)" },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark, description: "Direct bank deposit or EFT" },
  { value: "AIRTEL_MONEY", label: "Airtel Money", icon: Smartphone, description: "Airtel Money mobile payments" },
  { value: "PAYMENT_LINK", label: "Payment Link", icon: Link2, description: "Custom payment URL" },
]

// =============================================================================
// HELPERS
// =============================================================================

function getCollectionLabel(code: string): string {
  if (code === "BUYGOODS") return "Till Number"
  if (code === "PAYBILL") return "Paybill Number"
  return "Account Number"
}

function getCollectionPlaceholder(code: string): string {
  if (code === "BUYGOODS") return "e.g. 123456"
  if (code === "PAYBILL") return "e.g. 600100"
  return "e.g. 1234567890"
}

function getDigitRange(code: string): [number, number] {
  if (code === "BUYGOODS" || code === "PAYBILL") return [5, 12]
  return [6, 20]
}

function maskAccount(value: string): string {
  if (!value || value.length <= 4) return value
  return "\u2022".repeat(value.length - 4) + value.slice(-4)
}

function getMethodIcon(type: string) {
  const map: Record<string, typeof CreditCard> = {
    MPESA: Smartphone, MPESA_STK: Smartphone, MPESA_PAYBILL: Smartphone, MPESA_TILL: Smartphone,
    AIRTEL_MONEY: Smartphone, MOBILE_MONEY: Smartphone,
    BANK: Landmark, BANK_TRANSFER: Landmark,
    CARD: CreditCard, CREDIT_CARD: CreditCard, DEBIT_CARD: CreditCard,
    PAYMENT_LINK: Link2, VOUCHER: Ticket,
  }
  return map[type] || CreditCard
}

function getMethodLabel(type: string): string {
  const found = ALLOWED_METHOD_TYPES.find((m) => m.value === type)
  if (found) return found.label
  const fallback: Record<string, string> = {
    MPESA_STK: "M-Pesa STK Push", MOBILE_MONEY: "Mobile Money",
    CREDIT_CARD: "Credit Card", DEBIT_CARD: "Debit Card",
    VOUCHER: "Voucher", CASH: "Cash", CHEQUE: "Cheque", OTHER: "Other",
  }
  return fallback[type] || type
}

type CollectionFieldErrors = {
  collection_reference_id?: string
  collection_account_number?: string
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function PaymentMethodsPage() {
  // ── Collection Gateway hooks ──
  const { references, isLoading: refsLoading, error: refsError, refetch: refetchRefs } = useTumaReferences()
  const {
    config, isLoading: configLoading, isSaving: collectionSaving,
    error: configError, fieldErrors: serverFieldErrors, isFirstTimeSetup,
    save: saveCollection, refetch: refetchConfig, clearFieldErrors,
  } = useTumaConfig()

  // ── Payment methods state ──
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [methodsLoading, setMethodsLoading] = useState(true)
  const [methodsError, setMethodsError] = useState<string | null>(null)

  // ── Collection gateway form ──
  const [selectedRefId, setSelectedRefId] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [collectionErrors, setCollectionErrors] = useState<CollectionFieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // ── Add/Edit method dialog ──
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogStep, setDialogStep] = useState<"pick" | "details">("pick")
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [methodForm, setMethodForm] = useState({
    method_type: "" as string,
    name: "",
    code: "",
    description: "",
    is_default: false,
    config: {} as Record<string, string>,
  })
  const [methodSaving, setMethodSaving] = useState(false)

  // ── Delete confirm ──
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Fetch payment methods ──
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

  // ── Sync collection config into form ──
  useEffect(() => {
    if (config) {
      setSelectedRefId(String(config.collection_reference_id ?? ""))
      setAccountNumber(config.collection_account_number ?? "")
    }
  }, [config])

  // ── Derived ──
  const isLoading = refsLoading || configLoading
  const serverError = refsError || configError
  const is500 = serverError?.includes("500") || serverError?.includes("Server error")
  const isAuth = serverError?.includes("Session expired") || serverError?.includes("permission")

  const selectedRef = useMemo(
    () => references.find((r) => r.id === selectedRefId),
    [references, selectedRefId],
  )
  const selectedCode = selectedRef?.code ?? ""

  // ── Collection gateway validation ──
  const validateCollection = useCallback(
    (refId: string, account: string, code: string): CollectionFieldErrors => {
      const errs: CollectionFieldErrors = {}
      if (!refId) errs.collection_reference_id = "Please select a collection channel."
      if (!account.trim()) {
        errs.collection_account_number = getCollectionLabel(code) + " is required."
      } else if (!/^\d+$/.test(account.trim())) {
        errs.collection_account_number = "Must contain digits only."
      } else {
        const [min, max] = getDigitRange(code)
        if (account.trim().length < min || account.trim().length > max)
          errs.collection_account_number = `Must be between ${min} and ${max} digits.`
      }
      return errs
    }, [],
  )

  const handleCollectionBlur = (field: keyof CollectionFieldErrors) => {
    setTouched((p) => ({ ...p, [field]: true }))
    const errs = validateCollection(selectedRefId, accountNumber, selectedCode)
    setCollectionErrors((p) => ({ ...p, [field]: errs[field] }))
    clearFieldErrors()
  }

  const handleRefChange = (value: string) => {
    setSelectedRefId(value)
    setCollectionErrors((p) => ({ ...p, collection_reference_id: undefined }))
    clearFieldErrors()
    const newRef = references.find((r) => r.id === value)
    if (newRef?.code !== selectedCode) {
      setAccountNumber("")
      setCollectionErrors((p) => ({ ...p, collection_account_number: undefined }))
      setTouched((p) => ({ ...p, collection_account_number: false }))
    }
  }

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "")
    setAccountNumber(cleaned)
    if (touched.collection_account_number) {
      const errs = validateCollection(selectedRefId, cleaned, selectedCode)
      setCollectionErrors((p) => ({ ...p, collection_account_number: errs.collection_account_number }))
    }
    clearFieldErrors()
  }

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateCollection(selectedRefId, accountNumber, selectedCode)
    setCollectionErrors(errs)
    setTouched({ collection_reference_id: true, collection_account_number: true })
    if (Object.keys(errs).length > 0) return
    if (config && (String(config.collection_reference_id) !== selectedRefId || config.collection_account_number !== accountNumber.trim())) {
      setShowConfirmDialog(true)
      return
    }
    await doSaveCollection()
  }

  const doSaveCollection = async () => {
    setShowConfirmDialog(false)
    const success = await saveCollection({
      collection_reference_id: selectedRefId,
      collection_account_number: accountNumber.trim(),
    })
    if (success) toast.success("Collection gateway saved", { description: "Your payment channel is now active." })
    else toast.error("Failed to save", { description: "Please check the form for errors." })
  }

  // ── Payment method CRUD ──
  const openAddDialog = () => {
    setEditingMethod(null)
    setMethodForm({ method_type: "", name: "", code: "", description: "", is_default: false, config: {} })
    setDialogStep("pick")
    setDialogOpen(true)
  }

  const openEditDialog = (m: PaymentMethod) => {
    setEditingMethod(m)
    setMethodForm({
      method_type: m.method_type,
      name: m.name,
      code: m.code,
      description: m.description || "",
      is_default: m.is_default,
      config: (m.config || {}) as Record<string, string>,
    })
    setDialogStep("details")
    setDialogOpen(true)
  }

  const pickMethodType = (type: string) => {
    const meta = ALLOWED_METHOD_TYPES.find((m) => m.value === type)
    setMethodForm((p) => ({
      ...p,
      method_type: type,
      name: meta?.label || type,
      code: type.toLowerCase().replace(/_/g, "-"),
      config: {},
    }))
    setDialogStep("details")
  }

  const handleMethodSave = async () => {
    if (!methodForm.name.trim()) { toast.error("Name is required"); return }
    if (!methodForm.code.trim()) { toast.error("Code is required"); return }

    setMethodSaving(true)
    try {
      const payload: Partial<PaymentMethod> = {
        name: methodForm.name.trim(),
        code: methodForm.code.trim(),
        method_type: methodForm.method_type as PaymentMethodType,
        description: methodForm.description.trim(),
        is_default: methodForm.is_default,
        config: methodForm.config,
      }

      if (editingMethod) {
        await adminApi.updatePaymentMethod(editingMethod.id, payload)
        toast.success("Payment method updated")
      } else {
        await adminApi.createPaymentMethod(payload)
        toast.success("Payment method created")
      }
      setDialogOpen(false)
      fetchMethods()
    } catch (err: any) {
      const msg = err?.message || "Failed to save"
      toast.error(msg)
    } finally {
      setMethodSaving(false)
    }
  }

  const handleToggleActive = async (m: PaymentMethod) => {
    try {
      await adminApi.togglePaymentMethodActive(m.id)
      toast.success(m.is_active ? "Method deactivated" : "Method activated")
      fetchMethods()
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle")
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
      toast.error(err.message || "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  const handleRetry = () => { refetchRefs(); refetchConfig() }

  const refError = collectionErrors.collection_reference_id || serverFieldErrors.collection_reference_id
  const accountError = collectionErrors.collection_account_number || serverFieldErrors.collection_account_number

  // ── Dynamic fields for method types ──
  const renderMethodFields = () => {
    const t = methodForm.method_type
    const cfg = methodForm.config
    const setC = (key: string, val: string) =>
      setMethodForm((p) => ({ ...p, config: { ...p.config, [key]: val } }))

    if (t === "MPESA" || t === "MPESA_STK") {
      return (
        <>
          <div className="space-y-2">
            <Label>Shortcode / Paybill</Label>
            <Input placeholder="e.g. 174379" value={cfg.shortcode || ""} onChange={(e) => setC("shortcode", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Account Reference</Label>
            <Input placeholder="e.g. CompanyXLTD" value={cfg.account_reference || ""} onChange={(e) => setC("account_reference", e.target.value)} />
          </div>
        </>
      )
    }
    if (t === "MPESA_PAYBILL") {
      return (
        <>
          <div className="space-y-2">
            <Label>Paybill Number <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g. 600100" value={cfg.paybill_number || ""} onChange={(e) => setC("paybill_number", e.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="space-y-2">
            <Label>Account Number</Label>
            <Input placeholder="e.g. 0112345678" value={cfg.account_number || ""} onChange={(e) => setC("account_number", e.target.value)} />
          </div>
        </>
      )
    }
    if (t === "MPESA_TILL") {
      return (
        <div className="space-y-2">
          <Label>Till Number <span className="text-red-500">*</span></Label>
          <Input placeholder="e.g. 123456" value={cfg.till_number || ""} onChange={(e) => setC("till_number", e.target.value.replace(/\D/g, ""))} />
        </div>
      )
    }
    if (t === "BANK_TRANSFER" || t === "BANK") {
      return (
        <>
          <div className="space-y-2">
            <Label>Bank Name <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g. Equity Bank" value={cfg.bank_name || ""} onChange={(e) => setC("bank_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Account Number <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g. 0112345678" value={cfg.account_number || ""} onChange={(e) => setC("account_number", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Account Name</Label>
            <Input placeholder="e.g. Company Ltd" value={cfg.account_name || ""} onChange={(e) => setC("account_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Branch</Label>
            <Input placeholder="e.g. Nairobi Branch" value={cfg.branch || ""} onChange={(e) => setC("branch", e.target.value)} />
          </div>
        </>
      )
    }
    if (t === "AIRTEL_MONEY") {
      return (
        <>
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input placeholder="e.g. MyISP" value={cfg.airtel_business_name || ""} onChange={(e) => setC("airtel_business_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Merchant Code</Label>
            <Input placeholder="Airtel merchant code" value={cfg.airtel_merchant_code || ""} onChange={(e) => setC("airtel_merchant_code", e.target.value)} />
          </div>
        </>
      )
    }
    if (t === "PAYMENT_LINK") {
      return (
        <div className="space-y-2">
          <Label>Payment URL</Label>
          <Input type="url" placeholder="https://pay.example.com/..." value={cfg.custom_link || ""} onChange={(e) => setC("custom_link", e.target.value)} />
        </div>
      )
    }
    return null
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═════════════════════════════════════════════════════════════════════════════
  if (isLoading && methodsLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[140px] w-full max-w-2xl rounded-xl" />
        <Skeleton className="h-[280px] w-full max-w-2xl rounded-xl" />
        <Skeleton className="h-[200px] w-full max-w-2xl rounded-xl" />
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how you collect money and what options customers see at checkout.
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Method
        </Button>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* ── Error banner ── */}
        {serverError && (
          <div className={`flex items-start gap-3 rounded-lg border p-4 animate-in fade-in slide-in-from-top-2 duration-300 ${
            isAuth ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
                   : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
          }`}>
            <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${isAuth ? "text-amber-600" : "text-red-600"}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${isAuth ? "text-amber-800 dark:text-amber-300" : "text-red-800 dark:text-red-300"}`}>
                {serverError}
              </p>
              {is500 && <p className="text-xs text-muted-foreground mt-1">If this persists, contact support.</p>}
            </div>
            {is500 && (
              <Button variant="outline" size="sm" onClick={handleRetry} className="shrink-0">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Retry
              </Button>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1 — Collection Gateway (STK Push channel)                */}
        {/* ══════════════════════════════════════════════════════════════════ */}

        {/* Status card when connected */}
        {config && (
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-green-50/40 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-green-950/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl shrink-0">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">Collection Gateway Active</p>
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]">Connected</Badge>
                  </div>
                  <Separator className="my-3 bg-emerald-200/60 dark:bg-emerald-800/40" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {config.business_id && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Business ID</p>
                          <p className="font-medium text-emerald-900 dark:text-emerald-100 break-all">{config.business_id}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Channel</p>
                        <p className="font-medium text-emerald-900 dark:text-emerald-100">
                          {references.find((r) => r.id === String(config.collection_reference_id))?.name || config.reference_name || "\u2014"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Hash className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Account</p>
                        <p className="font-medium font-mono tracking-wider text-emerald-900 dark:text-emerald-100">
                          {maskAccount(config.collection_account_number || "")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Collection gateway form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Collection Gateway</CardTitle>
            <CardDescription>
              {isFirstTimeSetup
                ? "Select a collection channel and enter your account details to start receiving automated STK push payments."
                : "Update your automated payment collection channel."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCollectionSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="collection-channel" className="text-sm font-medium">
                  Collection Channel <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedRefId} onValueChange={handleRefChange}>
                  <SelectTrigger
                    id="collection-channel"
                    className={`w-full ${refError ? "border-red-400 focus-visible:ring-red-400/30" : ""}`}
                    onBlur={() => handleCollectionBlur("collection_reference_id")}
                  >
                    <SelectValue placeholder="Select a channel\u2026" />
                  </SelectTrigger>
                  <SelectContent>
                    {references.length === 0 ? (
                      <div className="p-3 text-sm text-center text-muted-foreground">No channels available.</div>
                    ) : (
                      references.map((ref) => (
                        <SelectItem key={ref.id} value={ref.id}>
                          <span className="flex items-center gap-2">
                            {ref.name}
                            {ref.code && <span className="text-xs text-muted-foreground">({ref.code})</span>}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {refError && <p className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1 duration-200" role="alert">{refError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-number" className="text-sm font-medium">
                  {getCollectionLabel(selectedCode)} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="account-number"
                  type="text"
                  inputMode="numeric"
                  placeholder={getCollectionPlaceholder(selectedCode)}
                  value={accountNumber}
                  onChange={handleAccountChange}
                  onBlur={() => handleCollectionBlur("collection_account_number")}
                  className={accountError ? "border-red-400 focus-visible:ring-red-400/30" : ""}
                  maxLength={20}
                  autoComplete="off"
                />
                {accountError ? (
                  <p className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1 duration-200" role="alert">{accountError}</p>
                ) : selectedCode ? (
                  <p className="text-xs text-muted-foreground">{(() => { const [min, max] = getDigitRange(selectedCode); return `${min}\u2013${max} digits required` })()}</p>
                ) : null}
              </div>

              <Button type="submit" disabled={collectionSaving} className="w-full">
                {collectionSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : "Save Gateway"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2 — Customer-facing payment methods                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Customer Payment Options</CardTitle>
            <CardDescription>
              Payment methods visible to customers on invoices and checkout. Toggle to enable or disable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {methodsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
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
                <Button variant="outline" size="sm" onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-1" />Add your first method
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {methods.map((m) => {
                  const Icon = getMethodIcon(m.method_type)
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        m.is_active ? "bg-card" : "bg-muted/30 opacity-60"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{m.name}</p>
                          {m.is_default && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Default</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {getMethodLabel(m.method_type)}
                          {m.description ? ` \u2022 ${m.description}` : ""}
                        </p>
                      </div>
                      <Switch
                        checked={m.is_active}
                        onCheckedChange={() => handleToggleActive(m)}
                        className="shrink-0"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(m)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(m)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                          </DropdownMenuItem>
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

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {/* Collection gateway confirm */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Collection Gateway?</DialogTitle>
            <DialogDescription>This will update how automated customer payments are routed.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">New channel:</span> <span className="font-medium">{selectedRef?.name ?? "\u2014"}</span></p>
            <p><span className="text-muted-foreground">{getCollectionLabel(selectedCode)}:</span> <span className="font-medium font-mono">{accountNumber}</span></p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onClick={doSaveCollection} disabled={collectionSaving}>
              {collectionSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit payment method */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Edit Payment Method" : dialogStep === "pick" ? "Add Payment Method" : `Set Up ${ALLOWED_METHOD_TYPES.find((m) => m.value === methodForm.method_type)?.label || "Method"}`}
            </DialogTitle>
            <DialogDescription>
              {dialogStep === "pick"
                ? "Choose the type of payment method to add."
                : "Enter the details for this payment method."}
            </DialogDescription>
          </DialogHeader>

          {dialogStep === "pick" ? (
            <div className="grid gap-2 py-2">
              {ALLOWED_METHOD_TYPES.map((mt) => {
                const Icon = mt.icon
                return (
                  <button
                    key={mt.value}
                    onClick={() => pickMethodType(mt.value)}
                    className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-muted/50 shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{mt.label}</p>
                      <p className="text-xs text-muted-foreground">{mt.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {!editingMethod && (
                <button
                  onClick={() => setDialogStep("pick")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />Back to type selection
                </button>
              )}
              <div className="space-y-2">
                <Label>Display Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. M-Pesa Business"
                  value={methodForm.name}
                  onChange={(e) => setMethodForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Code <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. mpesa-stk"
                  value={methodForm.code}
                  onChange={(e) => setMethodForm((p) => ({ ...p, code: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") }))}
                />
                <p className="text-xs text-muted-foreground">Unique identifier. Lowercase, dashes allowed.</p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Instructions shown to customers (optional)"
                  value={methodForm.description}
                  onChange={(e) => setMethodForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Dynamic fields based on type */}
              {renderMethodFields()}

              <div className="flex items-center justify-between py-1">
                <Label htmlFor="is-default" className="text-sm">Set as default</Label>
                <Switch
                  id="is-default"
                  checked={methodForm.is_default}
                  onCheckedChange={(checked) => setMethodForm((p) => ({ ...p, is_default: checked }))}
                />
              </div>
            </div>
          )}

          {dialogStep === "details" && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleMethodSave} disabled={methodSaving}>
                {methodSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingMethod ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
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