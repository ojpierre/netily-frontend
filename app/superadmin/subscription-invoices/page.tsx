"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Calculator, Mail, MessageSquare, RefreshCw, Search, Send, Smartphone, WalletCards } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { superadminApi, type SubscriptionInvoice, type SubscriptionInvoiceSummary } from "@/lib/superadmin-api"

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

const statusClass = (status: string) => {
  if (status === "paid") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
  if (status === "invoiced") return "bg-blue-500/15 text-blue-300 border-blue-500/30"
  return "bg-amber-500/15 text-amber-300 border-amber-500/30"
}

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

  const cards = useMemo(() => [
    { label: "Invoices Tracked", value: summary?.count ?? rows.length, icon: WalletCards },
    { label: "Estimated Total", value: money(summary?.calculated_total), icon: Calculator },
    { label: "Hotspot Revenue", value: money(summary?.hotspot_revenue), icon: Smartphone },
    { label: "Invoiced Cycles", value: summary?.invoiced ?? 0, icon: Send },
  ], [summary, rows.length])

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
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Review tenant usage invoices, add approved custom charges, apply referral discounts, and send invoice notices by email, SMS, or in-app notification.
          </p>
        </div>
        <Button onClick={fetchInvoices} disabled={loading} className="bg-violet-600 hover:bg-violet-500">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="border-slate-800 bg-slate-900/80">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-violet-500/15 p-3 text-violet-300">
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{card.label}</p>
                <p className="text-xl font-semibold text-white">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                <SelectTrigger className="border-slate-700 bg-slate-950 text-white sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchInvoices} className="border-slate-700 text-slate-200">
                Apply
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="min-w-[1180px] w-full text-sm">
              <thead className="bg-slate-950 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Hotspot</th>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Loading invoices...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">No subscription invoices found.</td>
                  </tr>
                ) : rows.map((row) => (
                  <tr key={row.id} className="text-slate-300 hover:bg-slate-800/40">
                    <td className="px-4 py-4">
                      <p className="font-medium text-white">{row.tenant_name}</p>
                      <p className="text-xs text-slate-500">{row.tenant_subdomain}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={statusClass(row.status)}>{row.status}</Badge>
                      <p className="mt-2 text-xs text-slate-500">{dateLabel(row.start_date)} - {dateLabel(row.end_date)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p>{row.pppoe_count} PPPoE x {money(row.pppoe_unit_price)}</p>
                      <p className="text-xs text-slate-500">PPPoE: {money(row.pppoe_charge)}</p>
                      <p className="text-xs text-slate-500">Minimum top-up: {money(row.minimum_adjustment)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p>{money(row.hotspot_revenue)}</p>
                      <p className="text-xs text-slate-500">Share {row.hotspot_share_pct}%: {money(row.hotspot_share)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">{money(row.invoice?.total_amount || row.calculated_total)}</p>
                      <p className="text-xs text-slate-500">{row.invoice?.invoice_number || "Invoice not generated"}</p>
                      {Number(row.invoice?.discount_amount || 0) > 0 && (
                        <p className="text-xs text-emerald-300">Discount: {money(row.invoice?.discount_amount)}</p>
                      )}
                      {Number(row.invoice?.manual_adjustment_amount || 0) > 0 && (
                        <p className="text-xs text-amber-300">Custom charge: {money(row.invoice?.manual_adjustment_amount)}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="border-slate-700" onClick={() => openAdjustment(row)}>
                          Adjust
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-700" onClick={() => sendInvoice(row, "email")}>
                          <Mail className="mr-1 h-3.5 w-3.5" /> Email
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-700" onClick={() => sendInvoice(row, "sms")}>
                          <MessageSquare className="mr-1 h-3.5 w-3.5" /> SMS
                        </Button>
                        <Button size="sm" className="bg-violet-600 hover:bg-violet-500" onClick={() => sendInvoice(row, "all")}>
                          Send All
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              Add agreed custom charges or subtract approved discounts. The tenant usage estimate follows the adjusted invoice total.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm">
                <p className="font-medium text-white">{selected.tenant_name}</p>
                <p className="text-slate-400">Current total: {money(selected.invoice?.total_amount || selected.calculated_total)}</p>
                <p className="text-slate-400">Invoice: {selected.invoice?.invoice_number || "Will be generated when saved"}</p>
              </div>
              <div className="space-y-2">
                <Label>Custom Charge Amount</Label>
                <Input
                  type="number"
                  min="0"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  className="border-slate-700 bg-slate-900 text-white"
                />
                <p className="text-xs text-slate-500">Adds to the invoice for custom integrations, support work, or agreed extras.</p>
              </div>
              <div className="space-y-2">
                <Label>Custom Charge Description</Label>
                <Textarea
                  value={adjustmentDescription}
                  onChange={(e) => setAdjustmentDescription(e.target.value)}
                  placeholder="Example: Custom MikroTik integration setup"
                  className="border-slate-700 bg-slate-900 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Amount</Label>
                <Input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="border-slate-700 bg-slate-900 text-white"
                />
                <p className="text-xs text-slate-500">Subtracts from the invoice for approved referrals or goodwill credits.</p>
              </div>
              <div className="space-y-2">
                <Label>Discount Reason</Label>
                <Textarea
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Example: Manual referral discount approved by superadmin"
                  className="border-slate-700 bg-slate-900 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-slate-700" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button onClick={saveAdjustment} disabled={saving} className="bg-violet-600 hover:bg-violet-500">
                  {saving ? "Saving..." : "Save Adjustment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
