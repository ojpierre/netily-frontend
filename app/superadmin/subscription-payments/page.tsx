"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react"

import {
  superadminApi,
  type ManualSubscriptionPaymentPayload,
  type NetilyPlan,
  type Tenant,
} from "@/lib/superadmin-api"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface SubscriptionPaymentRow {
  id: string
  company_name: string
  plan_name: string
  amount: string
  currency: string
  payment_method: string
  status: string
  reference?: string
  mpesa_receipt?: string
  bank_reference?: string
  phone_number: string
  created_at: string | null
  completed_at: string | null
  period_start: string | null
  period_end: string | null
}

type ManualPaymentForm = {
  tenant_id: string
  plan_id: string
  billing_period: "monthly" | "yearly"
  amount: string
  payment_method: "mpesa_paybill" | "bank_transfer" | "card"
  reference: string
  phone_number: string
  completed_at: string
  notes: string
  apply_to_subscription: boolean
  notify_tenant: boolean
}

const emptyManualPaymentForm = (): ManualPaymentForm => ({
  tenant_id: "",
  plan_id: "current",
  billing_period: "monthly",
  amount: "",
  payment_method: "mpesa_paybill",
  reference: "",
  phone_number: "",
  completed_at: "",
  notes: "",
  apply_to_subscription: true,
  notify_tenant: true,
})

const STATUS_STYLES: Record<string, { cls: string; Icon: React.ElementType }> = {
  completed: { cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", Icon: CheckCircle2 },
  pending: { cls: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30", Icon: Clock },
  processing: { cls: "bg-blue-500/15 text-blue-400 border border-blue-500/30", Icon: AlertCircle },
  failed: { cls: "bg-red-500/15 text-red-400 border border-red-500/30", Icon: XCircle },
  cancelled: { cls: "bg-slate-700/60 text-slate-400 border border-slate-600", Icon: Ban },
  refunded: { cls: "bg-purple-500/15 text-purple-400 border border-purple-500/30", Icon: RotateCcw },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { cls: "bg-slate-700 text-slate-400 border border-slate-600", Icon: AlertCircle }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${s.cls}`}>
      <s.Icon className="h-3 w-3" />
      {status}
    </span>
  )
}

function fmt(dateStr: string | null) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function planAmount(plan: NetilyPlan | undefined, billingPeriod: "monthly" | "yearly") {
  if (!plan) return ""
  const raw = plan.is_metered
    ? plan.base_license_fee
    : billingPeriod === "yearly"
      ? plan.price_yearly
      : plan.price_monthly
  const value = Number(raw || 0)
  return value > 0 ? String(value) : ""
}

function tenantLabel(tenant: Tenant) {
  return `${tenant.company_name || tenant.subdomain} (${tenant.subdomain})`
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function SubscriptionPaymentsPage() {
  const [payments, setPayments] = useState<SubscriptionPaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [manualOpen, setManualOpen] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingPayment, setEditingPayment] = useState<SubscriptionPaymentRow | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [plans, setPlans] = useState<NetilyPlan[]>([])
  const [form, setForm] = useState<ManualPaymentForm>(() => emptyManualPaymentForm())

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan.id) === form.plan_id),
    [form.plan_id, plans],
  )

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (search) params.search = search
      if (statusFilter && statusFilter !== "all") params.status = statusFilter

      const data = await superadminApi.getSubscriptionPayments(params)
      setPayments((data as any).results || [])
      setTotalPages((data as any).total_pages || 1)
      setTotal((data as any).count || 0)
    } catch (err: any) {
      setPayments([])
      toast.error(err?.message || "Failed to load subscription payments")
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  const loadLookups = useCallback(async () => {
    setLookupLoading(true)
    try {
      const [tenantRows, planRows] = await Promise.all([
        superadminApi.getTenants({ ordering: "company__name" }),
        superadminApi.getPlans(),
      ])
      setTenants(tenantRows || [])
      setPlans((planRows || []).filter((plan) => plan.is_active !== false))
    } catch (err: any) {
      toast.error(err?.message || "Failed to load tenants and plans")
    } finally {
      setLookupLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchPayments, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchPayments, search])

  useEffect(() => {
    if (manualOpen && !editingPayment && (tenants.length === 0 || plans.length === 0)) {
      loadLookups()
    }
  }, [editingPayment, loadLookups, manualOpen, plans.length, tenants.length])

  const handleSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const handleStatus = (v: string) => {
    setStatusFilter(v)
    setPage(1)
  }

  const updateForm = <K extends keyof ManualPaymentForm>(key: K, value: ManualPaymentForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find((item) => item.id === tenantId)
    const tenantPlan = tenant?.subscription_plan
      ? plans.find((plan) => plan.name.toLowerCase() === tenant.subscription_plan.toLowerCase())
      : undefined
    const nextPlanId = tenantPlan ? String(tenantPlan.id) : "current"
    const amount = tenantPlan
      ? planAmount(tenantPlan, form.billing_period)
      : Number(tenant?.monthly_rate || 0) > 0
        ? String(Number(tenant?.monthly_rate || 0))
        : form.amount

    setForm((current) => ({
      ...current,
      tenant_id: tenantId,
      plan_id: nextPlanId,
      amount,
    }))
  }

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((item) => String(item.id) === planId)
    setForm((current) => ({
      ...current,
      plan_id: planId,
      amount: plan ? planAmount(plan, current.billing_period) : current.amount,
    }))
  }

  const handleBillingPeriodChange = (billingPeriod: "monthly" | "yearly") => {
    setForm((current) => ({
      ...current,
      billing_period: billingPeriod,
      amount: selectedPlan ? planAmount(selectedPlan, billingPeriod) : current.amount,
    }))
  }

  const openManualPayment = () => {
    setEditingPayment(null)
    setForm(emptyManualPaymentForm())
    setManualOpen(true)
  }

  const openEditPayment = (payment: SubscriptionPaymentRow) => {
    setEditingPayment(payment)
    setForm({
      ...emptyManualPaymentForm(),
      amount: String(Number(payment.amount || 0) || ""),
      payment_method: (payment.payment_method as ManualPaymentForm["payment_method"]) || "mpesa_paybill",
      reference: payment.reference || payment.mpesa_receipt || payment.bank_reference || "",
      phone_number: payment.phone_number || "",
      completed_at: toDatetimeLocal(payment.completed_at || payment.created_at),
      apply_to_subscription: false,
      notify_tenant: false,
    })
    setManualOpen(true)
  }

  const submitManualPayment = async () => {
    if (!editingPayment && !form.tenant_id) {
      toast.error("Choose a tenant first")
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (!form.reference.trim()) {
      toast.error("Enter the payment reference")
      return
    }

    setSubmitting(true)
    try {
      const payload: ManualSubscriptionPaymentPayload = {
        tenant_id: form.tenant_id,
        amount: form.amount,
        payment_method: form.payment_method,
        reference: form.reference.trim(),
        billing_period: form.billing_period,
        phone_number: form.phone_number.trim() || undefined,
        completed_at: form.completed_at || undefined,
        notes: form.notes.trim() || undefined,
        apply_to_subscription: form.apply_to_subscription,
        notify_tenant: form.notify_tenant,
      }
      if (form.plan_id !== "current") payload.plan_id = form.plan_id

      const result = editingPayment
        ? await superadminApi.updateSubscriptionPayment(editingPayment.id, {
            amount: payload.amount,
            payment_method: payload.payment_method,
            reference: payload.reference,
            billing_period: payload.billing_period,
            phone_number: payload.phone_number,
            completed_at: payload.completed_at,
            notes: payload.notes,
          })
        : await superadminApi.createSubscriptionPayment(payload)
      toast.success(result.detail || (editingPayment ? "Payment updated" : "Manual payment recorded"))
      setManualOpen(false)
      setEditingPayment(null)
      setForm(emptyManualPaymentForm())
      setPage(1)
      await fetchPayments()
    } catch (err: any) {
      toast.error(err?.message || "Failed to record manual payment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/20">
            <CreditCard className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Subscription Payments</h1>
            <p className="text-sm text-slate-400">
              Platform billing payments from ISP tenants - {total} total
            </p>
          </div>
        </div>
        <Button
          onClick={openManualPayment}
          className="bg-violet-600 text-white hover:bg-violet-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Manual Payment
        </Button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="border-slate-700 bg-slate-800 pl-9 text-white placeholder:text-slate-500 focus:border-violet-500"
              placeholder="Search company or reference..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={handleStatus}>
            <SelectTrigger className="w-44 border-slate-700 bg-slate-800 text-slate-300">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-800">
              <SelectItem value="all" className="text-slate-300">All statuses</SelectItem>
              <SelectItem value="completed" className="text-slate-300">Completed</SelectItem>
              <SelectItem value="pending" className="text-slate-300">Pending</SelectItem>
              <SelectItem value="processing" className="text-slate-300">Processing</SelectItem>
              <SelectItem value="failed" className="text-slate-300">Failed</SelectItem>
              <SelectItem value="cancelled" className="text-slate-300">Cancelled</SelectItem>
              <SelectItem value="refunded" className="text-slate-300">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="outline"
            className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={() => fetchPayments()}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-medium text-slate-400">Company</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Amount</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-400 md:table-cell">Method</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-400 lg:table-cell">Reference</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-400 lg:table-cell">Phone</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-400 xl:table-cell">Cycle Period</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-400" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-white">{p.company_name}</td>
                    <td className="px-4 py-3 text-slate-300">{p.plan_name || "-"}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      KES {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="hidden px-4 py-3 capitalize text-slate-400 md:table-cell">
                      {p.payment_method?.replace("_", " ") || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-slate-400 lg:table-cell">
                      {p.reference || p.mpesa_receipt || p.bank_reference || "-"}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-400 lg:table-cell">
                      {p.phone_number || "-"}
                    </td>
                    <td className="hidden min-w-[220px] px-4 py-3 text-xs text-slate-400 xl:table-cell">
                      {p.period_start || p.period_end ? `${fmt(p.period_start)} - ${fmt(p.period_end)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {fmt(p.completed_at || p.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditPayment(p)}
                        className="h-8 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={manualOpen}
        onOpenChange={(open) => {
          setManualOpen(open)
          if (!open) setEditingPayment(null)
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto border-slate-800 bg-slate-950 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-violet-400" />
              {editingPayment ? "Edit Subscription Payment" : "Record Manual Subscription Payment"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingPayment
                ? "Correct this payment record. This does not re-apply money to invoices or extend the subscription again."
                : "Add a confirmed offline payment. If the reference already exists, that transaction record is replaced."}
            </DialogDescription>
          </DialogHeader>

          {lookupLoading && !editingPayment ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
            </div>
          ) : (
            <div className="grid gap-4 py-2">
              {!editingPayment && (
              <div className="grid gap-2">
                <Label className="text-slate-200">Tenant</Label>
                <Select value={form.tenant_id} onValueChange={handleTenantChange}>
                  <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                    <SelectValue placeholder="Choose tenant" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 border-slate-700 bg-slate-900">
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id} className="text-slate-200">
                        {tenantLabel(tenant)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}

              {!editingPayment && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-slate-200">Plan</Label>
                  <Select value={form.plan_id} onValueChange={handlePlanChange}>
                    <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                      <SelectValue placeholder="Use current plan" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-900">
                      <SelectItem value="current" className="text-slate-200">Use current plan</SelectItem>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={String(plan.id)} className="text-slate-200">
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-slate-200">Billing period</Label>
                  <Select value={form.billing_period} onValueChange={(value) => handleBillingPeriodChange(value as "monthly" | "yearly")}>
                    <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-900">
                      <SelectItem value="monthly" className="text-slate-200">Monthly</SelectItem>
                      <SelectItem value="yearly" className="text-slate-200">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="manual-amount" className="text-slate-200">Amount</Label>
                  <Input
                    id="manual-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => updateForm("amount", e.target.value)}
                    className="border-slate-700 bg-slate-900 text-white"
                    placeholder="5000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-slate-200">Payment method</Label>
                  <Select value={form.payment_method} onValueChange={(value) => updateForm("payment_method", value as ManualPaymentForm["payment_method"])}>
                    <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-900">
                      <SelectItem value="mpesa_paybill" className="text-slate-200">M-Pesa Paybill</SelectItem>
                      <SelectItem value="bank_transfer" className="text-slate-200">Bank Transfer</SelectItem>
                      <SelectItem value="card" className="text-slate-200">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="manual-reference" className="text-slate-200">Reference</Label>
                  <Input
                    id="manual-reference"
                    value={form.reference}
                    onChange={(e) => updateForm("reference", e.target.value)}
                    className="border-slate-700 bg-slate-900 text-white"
                    placeholder="Receipt or bank reference"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="manual-phone" className="text-slate-200">Phone</Label>
                  <Input
                    id="manual-phone"
                    value={form.phone_number}
                    onChange={(e) => updateForm("phone_number", e.target.value)}
                    className="border-slate-700 bg-slate-900 text-white"
                    placeholder="+254..."
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="manual-date" className="text-slate-200">Payment date</Label>
                <Input
                  id="manual-date"
                  type="datetime-local"
                  value={form.completed_at}
                  onChange={(e) => updateForm("completed_at", e.target.value)}
                  className="border-slate-700 bg-slate-900 text-white"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="manual-notes" className="text-slate-200">Internal note</Label>
                <Textarea
                  id="manual-notes"
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  className="min-h-20 border-slate-700 bg-slate-900 text-white"
                  placeholder="Optional context for audit trail"
                />
              </div>

              {!editingPayment && (
              <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={form.apply_to_subscription}
                    onCheckedChange={(checked) => updateForm("apply_to_subscription", checked === true)}
                    className="mt-0.5 border-slate-600"
                  />
                  <span>
                    <span className="block font-medium text-slate-100">Update subscription after recording</span>
                    <span className="text-slate-400">Extends or activates the tenant once the linked invoice is fully paid.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={form.notify_tenant}
                    onCheckedChange={(checked) => updateForm("notify_tenant", checked === true)}
                    className="mt-0.5 border-slate-600"
                  />
                  <span>
                    <span className="block font-medium text-slate-100">Notify tenant admins</span>
                    <span className="text-slate-400">Sends the normal receipt notification after the payment is reconciled.</span>
                  </span>
                </label>
              </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setManualOpen(false)}
              className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitManualPayment}
              disabled={submitting || lookupLoading}
              className="bg-violet-600 text-white hover:bg-violet-500"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {editingPayment ? "Save Changes" : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
