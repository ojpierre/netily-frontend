"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  Bell,
  Calculator,
  CheckCircle2,
  FilePenLine,
  LockKeyhole,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Smartphone,
  WalletCards,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  superadminApi,
  type SubscriptionInvoice,
  type SubscriptionInvoiceReminderSettings,
  type SubscriptionInvoiceSummary,
} from "@/lib/superadmin-api"

const money = (value?: string | number | null) =>
  `Ksh ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`

const dateLabel = (value?: string | null) => {
  if (!value) return "Not set"
  return new Date(value).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const dateInput = (value?: string | null) => {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toISOString().slice(0, 10)
}

const invoiceStatusClass = (status?: string) => {
  const normalized = (status || "").toUpperCase()
  if (normalized === "PAID") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
  if (normalized === "PARTIAL") return "border-amber-500/30 bg-amber-500/15 text-amber-300"
  if (normalized === "OVERDUE") return "border-red-500/30 bg-red-500/15 text-red-300"
  if (normalized === "SENT" || normalized === "ISSUED") return "border-blue-500/30 bg-blue-500/15 text-blue-300"
  return "border-slate-600 bg-slate-800 text-slate-300"
}

const cycleStatusClass = (status: string) => {
  if (status === "paid") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
  if (status === "invoiced") return "border-blue-500/30 bg-blue-500/15 text-blue-300"
  return "border-amber-500/30 bg-amber-500/15 text-amber-300"
}

const accountStatusClass = (status?: string) => {
  if (status === "active") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
  if (status === "past_due" || status === "expired") return "border-red-500/30 bg-red-500/15 text-red-300"
  return "border-slate-600 bg-slate-800 text-slate-300"
}

const invoiceStatuses = ["DRAFT", "ISSUED", "SENT", "PARTIAL", "PAID", "OVERDUE", "VOIDED", "WRITTEN_OFF"]
const cycleStatuses = ["active", "invoiced", "paid"]
const subscriptionStatuses = ["active", "past_due", "cancelled", "expired", "trialing"]

export default function SuperadminSubscriptionInvoicesPage() {
  const [rows, setRows] = useState<SubscriptionInvoice[]>([])
  const [summary, setSummary] = useState<SubscriptionInvoiceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")

  const [selected, setSelected] = useState<SubscriptionInvoice | null>(null)
  const [discountAmount, setDiscountAmount] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const [adjustmentAmount, setAdjustmentAmount] = useState("")
  const [adjustmentDescription, setAdjustmentDescription] = useState("")

  const [holdTarget, setHoldTarget] = useState<SubscriptionInvoice | null>(null)
  const [holdAmountPaid, setHoldAmountPaid] = useState("")
  const [holdReason, setHoldReason] = useState("")

  const [reconcileTarget, setReconcileTarget] = useState<SubscriptionInvoice | null>(null)
  const [invoiceStatus, setInvoiceStatus] = useState("leave")
  const [cycleStatus, setCycleStatus] = useState("leave")
  const [subscriptionStatus, setSubscriptionStatus] = useState("leave")
  const [reconcileAmountPaid, setReconcileAmountPaid] = useState("")
  const [reconcileBalance, setReconcileBalance] = useState("")
  const [billingDate, setBillingDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [cycleStart, setCycleStart] = useState("")
  const [cycleEnd, setCycleEnd] = useState("")
  const [syncTenantAccess, setSyncTenantAccess] = useState(false)
  const [reconcileReason, setReconcileReason] = useState("")

  const [reminderSettings, setReminderSettings] = useState<SubscriptionInvoiceReminderSettings>({
    enabled: true,
    days_before: [3, 1],
    channels: ["email", "in_app"],
  })
  const [savingReminders, setSavingReminders] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page_size: "50" }
      if (search.trim()) params.search = search.trim()
      if (status !== "all") params.status = status
      const data = await superadminApi.getSubscriptionInvoices(params)
      setRows(data.results || [])
      setSummary(data.summary)
    } catch (error: any) {
      toast.error(error?.message || "Failed to load subscription invoices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [status])

  useEffect(() => {
    superadminApi.getSubscriptionInvoiceReminderSettings()
      .then(setReminderSettings)
      .catch(() => {})
  }, [])

  const cards = useMemo(() => [
    { label: "Invoices Tracked", value: summary?.count ?? rows.length, icon: WalletCards },
    { label: "Outstanding Balance", value: money(summary?.outstanding_total), icon: AlertTriangle },
    { label: "Estimated Total", value: money(summary?.calculated_total), icon: Calculator },
    { label: "Partial / Past Due", value: `${summary?.partial ?? 0} / ${summary?.past_due ?? 0}`, icon: LockKeyhole },
    { label: "Hotspot Revenue", value: money(summary?.hotspot_revenue), icon: Smartphone },
    { label: "Duplicates Hidden", value: summary?.duplicates_hidden ?? 0, icon: Bell },
  ], [summary, rows.length])

  const saveReminderSettings = async () => {
    setSavingReminders(true)
    try {
      const updated = await superadminApi.updateSubscriptionInvoiceReminderSettings(reminderSettings)
      setReminderSettings(updated)
      toast.success("Reminder automation updated")
    } catch (error: any) {
      toast.error(error?.message || "Failed to update reminder automation")
    } finally {
      setSavingReminders(false)
    }
  }

  const toggleReminderChannel = (channel: "email" | "sms" | "in_app") => {
    setReminderSettings((current) => {
      const exists = current.channels.includes(channel)
      return {
        ...current,
        channels: exists ? current.channels.filter((item) => item !== channel) : [...current.channels, channel],
      }
    })
  }

  const openAdjustment = async (row: SubscriptionInvoice) => {
    try {
      const detail = await superadminApi.getSubscriptionInvoice(row.id)
      setSelected(detail)
      setDiscountAmount(detail.invoice?.discount_amount || "0")
      setAdjustmentAmount(detail.invoice?.manual_adjustment_amount || "0")
      setAdjustmentDescription(detail.invoice?.manual_adjustment_description || "")
      setDiscountReason("")
    } catch (error: any) {
      toast.error(error?.message || "Failed to open invoice")
    }
  }

  const openHold = async (row: SubscriptionInvoice) => {
    try {
      const detail = await superadminApi.getSubscriptionInvoice(row.id)
      setHoldTarget(detail)
      setHoldAmountPaid(detail.invoice?.amount_paid || "0")
      setHoldReason("")
    } catch (error: any) {
      toast.error(error?.message || "Failed to open hold action")
    }
  }

  const openReconcile = async (row: SubscriptionInvoice) => {
    try {
      const detail = await superadminApi.getSubscriptionInvoice(row.id)
      setReconcileTarget(detail)
      setInvoiceStatus(detail.invoice?.status || "leave")
      setCycleStatus(detail.status || "leave")
      setSubscriptionStatus(detail.subscription_status || "leave")
      setReconcileAmountPaid(detail.invoice?.amount_paid || "")
      setReconcileBalance(detail.invoice?.balance || "")
      setBillingDate(dateInput(detail.invoice?.billing_date))
      setDueDate(dateInput(detail.invoice?.due_date))
      setCycleStart(dateInput(detail.start_date))
      setCycleEnd(dateInput(detail.end_date))
      setSyncTenantAccess(true)
      setReconcileReason("")
    } catch (error: any) {
      toast.error(error?.message || "Failed to open reconciliation")
    }
  }

  const saveAdjustment = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await superadminApi.updateSubscriptionInvoiceDiscount(selected.id, {
        discount_amount: discountAmount || "0",
        discount_reason: discountReason,
        manual_adjustment_amount: adjustmentAmount || "0",
        manual_adjustment_description: adjustmentDescription,
      })
      setSelected(updated)
      toast.success("Invoice adjustment updated")
      fetchInvoices()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update invoice")
    } finally {
      setSaving(false)
    }
  }

  const saveHold = async () => {
    if (!holdTarget) return
    if (!holdReason.trim()) {
      toast.error("A reason is required for account hold")
      return
    }
    setSaving(true)
    try {
      const updated = await superadminApi.holdSubscriptionInvoice(holdTarget.id, {
        amount_paid: holdAmountPaid || "0",
        reason: holdReason,
      })
      setHoldTarget(updated)
      toast.success("Invoice marked partial and tenant placed on hold")
      fetchInvoices()
    } catch (error: any) {
      toast.error(error?.message || "Failed to place account on hold")
    } finally {
      setSaving(false)
    }
  }

  const saveReconciliation = async () => {
    if (!reconcileTarget) return
    if (!reconcileReason.trim()) {
      toast.error("A reason is required for manual reconciliation")
      return
    }
    setSaving(true)
    try {
      const payload: Parameters<typeof superadminApi.reconcileSubscriptionInvoice>[1] = {
        reason: reconcileReason,
        sync_tenant_access: syncTenantAccess,
      }
      if (invoiceStatus !== "leave") payload.invoice_status = invoiceStatus
      if (cycleStatus !== "leave") payload.cycle_status = cycleStatus
      if (subscriptionStatus !== "leave") payload.subscription_status = subscriptionStatus
      if (reconcileAmountPaid.trim()) payload.amount_paid = reconcileAmountPaid
      if (reconcileBalance.trim()) payload.balance = reconcileBalance
      if (billingDate) payload.billing_date = billingDate
      if (dueDate) payload.due_date = dueDate
      if (cycleStart) payload.start_date = cycleStart
      if (cycleEnd) payload.end_date = cycleEnd

      const updated = await superadminApi.reconcileSubscriptionInvoice(reconcileTarget.id, payload)
      setReconcileTarget(updated)
      toast.success("Invoice reconciliation applied")
      fetchInvoices()
    } catch (error: any) {
      toast.error(error?.message || "Failed to reconcile invoice")
    } finally {
      setSaving(false)
    }
  }

  const sendInvoice = async (row: SubscriptionInvoice, channel: "email" | "sms" | "in_app" | "all") => {
    try {
      const result = await superadminApi.sendSubscriptionInvoice(row.id, channel)
      toast.success(`${result.detail} Email: ${result.email_count}, SMS: ${result.sms_count}, In-app: ${result.notification_count}`)
      fetchInvoices()
    } catch (error: any) {
      toast.error(error?.message || "Failed to send invoice")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-violet-300">Platform Billing</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Subscription Invoices</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Review tenant usage invoices, reconcile payment states, place partial balances on hold, and send invoice notices.
          </p>
        </div>
        <Button onClick={fetchInvoices} disabled={loading} className="bg-violet-600 hover:bg-violet-500">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.label} className="border-slate-800 bg-slate-900/80">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-violet-500/15 p-3 text-violet-300">
                <card.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">{card.label}</p>
                <p className="truncate text-lg font-semibold text-white">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-800 bg-slate-900/80">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-violet-500/15 p-3 text-violet-300">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Automatic invoice reminders</p>
              <p className="text-sm text-slate-400">
                Sends reminders {reminderSettings.days_before.join(" and ")} day(s) before due date using selected channels.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[auto_160px_auto] sm:items-center">
            <div className="flex items-center gap-2">
              <Switch
                checked={reminderSettings.enabled}
                onCheckedChange={(enabled) => setReminderSettings((current) => ({ ...current, enabled }))}
              />
              <span className="text-sm text-slate-300">{reminderSettings.enabled ? "Enabled" : "Paused"}</span>
            </div>
            <Input
              value={reminderSettings.days_before.join(",")}
              onChange={(event) => {
                const days = event.target.value
                  .split(",")
                  .map((part) => Number(part.trim()))
                  .filter((day) => Number.isFinite(day) && day > 0)
                setReminderSettings((current) => ({ ...current, days_before: days }))
              }}
              className="border-slate-700 bg-slate-950 text-white"
            />
            <div className="flex flex-wrap gap-2">
              {(["email", "sms", "in_app"] as const).map((channel) => (
                <Button
                  key={channel}
                  size="sm"
                  variant={reminderSettings.channels.includes(channel) ? "default" : "outline"}
                  className={reminderSettings.channels.includes(channel) ? "bg-violet-600 hover:bg-violet-500" : "border-slate-700"}
                  onClick={() => toggleReminderChannel(channel)}
                >
                  {channel === "in_app" ? "In-app" : channel.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={saveReminderSettings} disabled={savingReminders} className="bg-violet-600 hover:bg-violet-500">
            {savingReminders ? "Saving..." : "Save reminders"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-white">All Tenant Subscription Invoices</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchInvoices()
                  }}
                  placeholder="Search tenant or invoice"
                  className="w-full border-slate-700 bg-slate-950 pl-9 text-white sm:w-72"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="border-slate-700 bg-slate-950 text-white sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Cycle Active</SelectItem>
                  <SelectItem value="invoiced">Cycle Invoiced</SelectItem>
                  <SelectItem value="paid">Cycle Paid</SelectItem>
                  <SelectItem value="partial">Invoice Partial</SelectItem>
                  <SelectItem value="overdue">Invoice Overdue</SelectItem>
                  <SelectItem value="outstanding">Outstanding</SelectItem>
                  <SelectItem value="past_due">Account Past Due</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchInvoices} className="border-slate-700 text-slate-200">
                Apply
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-[1480px] w-full text-sm">
              <thead className="bg-slate-950 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3">Invoice State</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Paid / Balance</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">Loading invoices...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">No subscription invoices found.</td>
                  </tr>
                ) : rows.map((row) => {
                  const invoice = row.invoice
                  const invoiceStatusText = invoice?.status || "NOT GENERATED"
                  const balance = Number(invoice?.balance || row.effective_total || row.calculated_total || 0)
                  const accountLocked = row.subscription_status === "past_due" || row.subscription_status === "expired"
                  return (
                    <tr key={row.id} className="text-slate-300 hover:bg-slate-800/40">
                      <td className="px-4 py-4 align-top">
                        <p className="font-medium text-white">{row.tenant_name}</p>
                        <p className="text-xs text-slate-500">{row.tenant_subdomain} - {row.tenant_schema}</p>
                        <p className="mt-1 text-xs text-slate-500">{row.plan_name || "Plan not set"} - {row.billing_period || "monthly"}</p>
                        <Badge className={`mt-2 ${accountStatusClass(row.subscription_status)}`}>
                          {accountLocked ? <LockKeyhole className="mr-1 h-3 w-3" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {row.subscription_status || "unknown"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Badge className={cycleStatusClass(row.status)}>cycle {row.status}</Badge>
                        <p className="mt-2 text-xs text-slate-500">{dateLabel(row.start_date)} - {dateLabel(row.end_date)}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Badge className={invoiceStatusClass(invoiceStatusText)}>{invoiceStatusText}</Badge>
                        <p className="mt-2 text-xs text-slate-500">{invoice?.invoice_number || "No tenant invoice yet"}</p>
                        {invoice?.is_overdue && (
                          <p className="mt-1 text-xs text-red-300">{invoice.overdue_days || 0} day(s) overdue</p>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top text-xs">
                        <p><span className="text-slate-500">Billing:</span> {dateLabel(invoice?.billing_date)}</p>
                        <p><span className="text-slate-500">Due:</span> {dateLabel(invoice?.due_date)}</p>
                        <p><span className="text-slate-500">Paid:</span> {dateLabel(invoice?.paid_at)}</p>
                        <p><span className="text-slate-500">Updated:</span> {dateLabel(invoice?.updated_at)}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p>{row.pppoe_count} PPPoE x {money(row.pppoe_unit_price)}</p>
                        <p className="text-xs text-slate-500">PPPoE: {money(row.pppoe_charge)}</p>
                        <p className="text-xs text-slate-500">Hotspot share: {money(row.hotspot_share)}</p>
                        <p className="text-xs text-slate-500">Minimum top-up: {money(row.minimum_adjustment)}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-semibold text-white">{money(invoice?.total_amount || row.effective_total || row.calculated_total)}</p>
                        {Number(invoice?.discount_amount || 0) > 0 && (
                          <p className="text-xs text-emerald-300">Discount: {money(invoice?.discount_amount)}</p>
                        )}
                        {Number(invoice?.manual_adjustment_amount || 0) > 0 && (
                          <p className="text-xs text-amber-300">Custom charge: {money(invoice?.manual_adjustment_amount)}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="text-emerald-300">Paid: {money(invoice?.amount_paid || 0)}</p>
                        <p className={balance > 0 ? "font-semibold text-amber-300" : "font-semibold text-emerald-300"}>
                          Balance: {money(invoice?.balance || 0)}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="outline" className="border-slate-700" onClick={() => openAdjustment(row)}>
                            Adjust
                          </Button>
                          <Button size="sm" variant="outline" className="border-amber-700 text-amber-200" onClick={() => openHold(row)}>
                            <LockKeyhole className="mr-1 h-3.5 w-3.5" /> Hold
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-700" onClick={() => openReconcile(row)}>
                            <FilePenLine className="mr-1 h-3.5 w-3.5" /> Reconcile
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-700" onClick={() => sendInvoice(row, "email")}>
                            <Mail className="mr-1 h-3.5 w-3.5" /> Email
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-700" onClick={() => sendInvoice(row, "sms")}>
                            <MessageSquare className="mr-1 h-3.5 w-3.5" /> SMS
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="border-slate-800 bg-slate-950 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust Subscription Invoice</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add agreed custom charges or subtract approved discounts. This recalculates the invoice total.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm">
                <p className="font-medium text-white">{selected.tenant_name}</p>
                <p className="text-slate-400">Current total: {money(selected.invoice?.total_amount || selected.calculated_total)}</p>
                <p className="text-slate-400">Invoice: {selected.invoice?.invoice_number || "Will be generated when saved"}</p>
              </div>
              <div className="space-y-2">
                <Label>Custom Charge Amount</Label>
                <Input type="number" min="0" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} className="border-slate-700 bg-slate-900 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Custom Charge Description</Label>
                <Textarea value={adjustmentDescription} onChange={(e) => setAdjustmentDescription(e.target.value)} className="border-slate-700 bg-slate-900 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Discount Amount</Label>
                <Input type="number" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} className="border-slate-700 bg-slate-900 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Discount Reason</Label>
                <Textarea value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} className="border-slate-700 bg-slate-900 text-white" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-slate-700" onClick={() => setSelected(null)}>Cancel</Button>
                <Button onClick={saveAdjustment} disabled={saving} className="bg-violet-600 hover:bg-violet-500">
                  {saving ? "Saving..." : "Save Adjustment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!holdTarget} onOpenChange={(open) => !open && setHoldTarget(null)}>
        <DialogContent className="border-slate-800 bg-slate-950 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Set Partial + Hold Account</DialogTitle>
            <DialogDescription className="text-slate-400">
              Records the amount already paid, leaves the invoice balance collectible, and moves the tenant to past due.
            </DialogDescription>
          </DialogHeader>
          {holdTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                <p className="font-medium text-amber-100">{holdTarget.tenant_name}</p>
                <p className="text-amber-200/80">Invoice total: {money(holdTarget.invoice?.total_amount || holdTarget.calculated_total)}</p>
                <p className="text-amber-200/80">Current balance: {money(holdTarget.invoice?.balance || 0)}</p>
              </div>
              <div className="space-y-2">
                <Label>Amount Already Paid</Label>
                <Input type="number" min="0" value={holdAmountPaid} onChange={(e) => setHoldAmountPaid(e.target.value)} className="border-slate-700 bg-slate-900 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={holdReason} onChange={(e) => setHoldReason(e.target.value)} placeholder="Example: Client paid KES 500 against a higher usage invoice." className="border-slate-700 bg-slate-900 text-white" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-slate-700" onClick={() => setHoldTarget(null)}>Cancel</Button>
                <Button onClick={saveHold} disabled={saving} className="bg-amber-600 hover:bg-amber-500">
                  {saving ? "Applying..." : "Set Partial + Hold"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reconcileTarget} onOpenChange={(open) => !open && setReconcileTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-950 text-white sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manual Invoice Reconciliation</DialogTitle>
            <DialogDescription className="text-slate-400">
              Declare invoice, cycle, and account state after confirming the real payment/accounting truth.
            </DialogDescription>
          </DialogHeader>
          {reconcileTarget && (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-slate-500">Tenant</p>
                  <p className="font-medium text-white">{reconcileTarget.tenant_name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Invoice</p>
                  <p className="font-medium text-white">{reconcileTarget.invoice?.invoice_number || "Not generated"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Balance</p>
                  <p className="font-medium text-white">{money(reconcileTarget.invoice?.balance || 0)}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Invoice Status</Label>
                  <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
                    <SelectTrigger className="border-slate-700 bg-slate-900 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leave">Leave unchanged</SelectItem>
                      {invoiceStatuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Select value={cycleStatus} onValueChange={setCycleStatus}>
                    <SelectTrigger className="border-slate-700 bg-slate-900 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leave">Leave unchanged</SelectItem>
                      {cycleStatuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tenant Account</Label>
                  <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                    <SelectTrigger className="border-slate-700 bg-slate-900 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leave">Leave unchanged</SelectItem>
                      {subscriptionStatuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Amount Paid</Label>
                  <Input type="number" min="0" value={reconcileAmountPaid} onChange={(e) => setReconcileAmountPaid(e.target.value)} className="border-slate-700 bg-slate-900 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Balance</Label>
                  <Input type="number" min="0" value={reconcileBalance} onChange={(e) => setReconcileBalance(e.target.value)} className="border-slate-700 bg-slate-900 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Billing Date</Label>
                  <Input type="date" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} className="border-slate-700 bg-slate-900 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="border-slate-700 bg-slate-900 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Cycle Start</Label>
                  <Input type="date" value={cycleStart} onChange={(e) => setCycleStart(e.target.value)} className="border-slate-700 bg-slate-900 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Cycle End</Label>
                  <Input type="date" value={cycleEnd} onChange={(e) => setCycleEnd(e.target.value)} className="border-slate-700 bg-slate-900 text-white" />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
                <Checkbox checked={syncTenantAccess} onCheckedChange={(checked) => setSyncTenantAccess(checked === true)} />
                <div>
                  <p className="text-sm font-medium text-white">Sync tenant access from invoice status</p>
                  <p className="text-xs text-slate-500">When enabled, PAID with zero balance activates the tenant; unpaid or partial balance moves the tenant to past due.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={reconcileReason} onChange={(e) => setReconcileReason(e.target.value)} placeholder="Example: Payment was received but webhook did not reconcile the tenant invoice." className="border-slate-700 bg-slate-900 text-white" />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-slate-700" onClick={() => setReconcileTarget(null)}>Cancel</Button>
                <Button onClick={saveReconciliation} disabled={saving} className="bg-violet-600 hover:bg-violet-500">
                  {saving ? "Saving..." : "Apply Reconciliation"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
