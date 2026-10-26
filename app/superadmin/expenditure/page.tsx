"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  Calculator,
  Download,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  TrendingUp,
  WalletCards,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { FinancialCsvActions } from "@/components/superadmin/financial-csv-actions"
import {
  superadminApi,
  type PlatformExpenditure,
  type PlatformExpenditureCategory,
  type PlatformExpenditureEntryType,
  type PlatformExpenditureLedger,
  type PlatformExpenditureSummary,
  type FinancialCashPosition,
} from "@/lib/superadmin-api"

const categories: Array<{ value: PlatformExpenditureCategory; label: string }> = [
  { value: "infrastructure", label: "Infrastructure" },
  { value: "sms", label: "SMS Costs" },
  { value: "payroll", label: "Payroll" },
  { value: "marketing", label: "Marketing" },
  { value: "software", label: "Software" },
  { value: "operations", label: "Operations" },
  { value: "tax", label: "Tax" },
  { value: "other", label: "Other" },
]

const today = () => new Date().toISOString().slice(0, 10)
const EVENT_PAGE_SIZE = 100

const emptySummary: PlatformExpenditureSummary = {
  currency: "KES",
  ledger: "primary",
  ledger_label: "Original Business Account",
  ledger_description: "Receipts mapped to this account and its recorded costs.",
  ledger_route: "/superadmin/expenditure",
  cutover_at: null,
  cutover_verified: false,
  cutover_reference: "",
  cutover_company: "",
  subscription_payments_total: "0.00",
  sms_topups_total: "0.00",
  accrued_total: "0.00",
  manual_expenditure_total: "0.00",
  owner_draw_total: "0.00",
  cash_adjustment_total: "0.00",
  net_profit: "0.00",
  transfer_in_total: "0.00",
  transfer_out_total: "0.00",
  calculated_position: "0.00",
}

function kes(value: string | number) {
  return Number(value || 0).toLocaleString("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function dateLabel(value?: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })
}

function dateTimeLabel(value?: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function categoryLabel(value: PlatformExpenditureCategory) {
  return categories.find((category) => category.value === value)?.label || value
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "violet",
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  tone?: "violet" | "emerald" | "amber" | "rose" | "cyan"
}) {
  const tones = {
    violet: "bg-violet-500/10 text-violet-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    rose: "bg-rose-500/10 text-rose-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg p-2 ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">{title}</p>
            <p className="mt-1 text-2xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SuperadminExpenditurePage({ ledger = "primary" }: { ledger?: PlatformExpenditureLedger }) {
  const [entries, setEntries] = useState<PlatformExpenditure[]>([])
  const [summary, setSummary] = useState<PlatformExpenditureSummary>({ ...emptySummary, ledger })
  const [cashPosition, setCashPosition] = useState<FinancialCashPosition | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ start: "", end: "" })
  const [form, setForm] = useState({
    title: "",
    entry_type: "operating_expense" as PlatformExpenditureEntryType,
    category: "operations" as PlatformExpenditureCategory,
    reference: "",
    amount: "",
    direction: "expense" as "expense" | "credit",
    incurred_on: today(),
    notes: "",
  })

  const totalPages = Math.max(Math.ceil(total / EVENT_PAGE_SIZE), 1)
  const rangeCopy = useMemo(() => {
    if (filters.start && filters.end) return `${dateLabel(filters.start)} to ${dateLabel(filters.end)}`
    if (filters.start) return `From ${dateLabel(filters.start)}`
    if (filters.end) return `Until ${dateLabel(filters.end)}`
    return "All time"
  }, [filters.end, filters.start])

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), page_size: String(EVENT_PAGE_SIZE) }
      if (filters.start) params.start = filters.start
      if (filters.end) params.end = filters.end
      const [data, report] = await Promise.all([
        superadminApi.getExpenditure(params, ledger),
        superadminApi.getFinancialReport(),
      ])
      setEntries(data.results)
      setSummary(data.summary)
      setCashPosition(report.cash_positions[ledger])
      setTotal(data.count)
      setLastUpdated(new Date())
    } catch (err: any) {
      toast.error(err?.message || "Failed to load expenditure")
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [filters.end, filters.start, ledger, page])

  useEffect(() => {
    fetchData()
    const timer = window.setInterval(() => fetchData(true), 60_000)
    return () => window.clearInterval(timer)
  }, [fetchData])

  const downloadBackup = async () => {
    try {
      await superadminApi.downloadFinancialRecoveryBackup()
      toast.success("Financial recovery backup downloaded")
    } catch (err: any) {
      toast.error(err?.message || "Could not download the recovery backup")
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!form.title.trim()) {
      toast.error("Enter an expenditure title")
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount")
      return
    }

    setSaving(true)
    try {
      await superadminApi.createExpenditure({
        title: form.title.trim(),
        entry_type: form.entry_type,
        category: form.category,
        reference: form.reference.trim(),
        amount: (form.direction === "credit" ? -amount : amount).toFixed(2),
        currency: "KES",
        incurred_on: form.incurred_on || today(),
        notes: form.notes.trim(),
      }, ledger)
      toast.success(form.direction === "credit" ? "Credit recorded" : "Expenditure recorded")
      setForm({ title: "", entry_type: "operating_expense", category: "operations", reference: "", amount: "", direction: "expense", incurred_on: today(), notes: "" })
      setPage(1)
      await fetchData()
    } catch (err: any) {
      toast.error(err?.message || "Failed to save expenditure")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Calculator className="h-6 w-6 text-violet-400" />
            {summary.ledger_label || "Company Expenditure"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {summary.ledger_description || "Private profit view pegged to subscription payments, SMS top-ups, and manually recorded costs."}
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[auto_auto_1fr_1fr_auto]">
          <Button asChild variant="outline" className="self-end border-slate-700 bg-slate-900 text-slate-100">
            <Link href="/superadmin/financial-reports"><BarChart3 className="mr-2 h-4 w-4" />Reports</Link>
          </Button>
          <div className="grid grid-cols-2 gap-2 self-end rounded-xl border border-slate-800 bg-slate-950 p-1">
            <Button asChild variant={ledger === "primary" ? "secondary" : "ghost"} className="text-slate-100">
              <Link href="/superadmin/expenditure">Account 1</Link>
            </Button>
            <Button asChild variant={ledger === "new_business" ? "secondary" : "ghost"} className="text-slate-100">
              <Link href="/superadmin/expenditure-2">Account 2</Link>
            </Button>
          </div>
          <div>
            <Label className="text-xs text-slate-400">Start date</Label>
            <Input
              type="date"
              value={filters.start}
              onChange={(event) => { setFilters((current) => ({ ...current, start: event.target.value })); setPage(1) }}
              className="mt-1 border-slate-700 bg-slate-900 text-white"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400">End date</Label>
            <Input
              type="date"
              value={filters.end}
              onChange={(event) => { setFilters((current) => ({ ...current, end: event.target.value })); setPage(1) }}
              className="mt-1 border-slate-700 bg-slate-900 text-white"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => fetchData()}
            disabled={loading}
            className="self-end border-slate-700 bg-slate-900 text-slate-200"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <FinancialCsvActions
        kind={ledger === "primary" ? "expenditure" : "expenditure-2"}
        params={{ ...(filters.start ? { start: filters.start } : {}), ...(filters.end ? { end: filters.end } : {}) }}
        onImported={() => fetchData()}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
        <p className="text-xs text-slate-500">Live figures refresh every minute{lastUpdated ? ` | Updated ${lastUpdated.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}` : ""}.</p>
        <Button onClick={downloadBackup} size="sm" variant="outline" className="border-slate-700 bg-slate-950 text-slate-200"><Download className="mr-2 h-4 w-4" />Recovery backup</Button>
      </div>

      {!loading && !summary.cutover_verified && (
        <p role="alert" className="border-l-4 border-amber-400 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Cutover receipt {summary.cutover_reference} was not found. Totals use the recorded 29 Sep 2026, 16:39 boundary until the payment can be verified.
        </p>
      )}

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium uppercase text-slate-400">Live system balance</p>
              <Badge variant="outline" className={cashPosition?.snapshot ? "border-emerald-500/30 text-emerald-300" : "border-amber-500/30 text-amber-300"}>
                {cashPosition?.snapshot ? "Tracking active" : "Balance needed"}
              </Badge>
            </div>
            <p className="mt-2 text-3xl font-bold text-white">{cashPosition?.snapshot?.kind === "estimate" ? "Approx. " : ""}{cashPosition?.estimated_balance === null || cashPosition?.estimated_balance === undefined ? "Unavailable" : kes(cashPosition.estimated_balance)}</p>
            {cashPosition?.snapshot ? <p className="mt-2 text-xs text-slate-500">Includes the latest recorded receipts, costs and transfers.</p> : <p className="mt-2 text-xs text-amber-200/80">Update the account balance from Financial Reports to begin live tracking.</p>}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
            <div><p className="text-xs text-slate-500">Owner draws</p><p className="mt-1 text-slate-100">{kes(summary.owner_draw_total)}</p></div>
            <div><p className="text-xs text-slate-500">Adjustments</p><p className="mt-1 text-slate-100">{kes(summary.cash_adjustment_total)}</p></div>
            <div><p className="text-xs text-slate-500">Transfers in</p><p className="mt-1 text-emerald-300">{kes(summary.transfer_in_total)}</p></div>
            <div><p className="text-xs text-slate-500">Transfers out</p><p className="mt-1 text-slate-100">{kes(summary.transfer_out_total)}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Receipts" value={kes(summary.accrued_total)} subtitle={`${kes(summary.subscription_payments_total)} subscriptions · ${kes(summary.sms_topups_total)} SMS`} icon={WalletCards} />
        <MetricCard title="Operating Costs" value={kes(summary.manual_expenditure_total)} subtitle="Expenses and fees, less credits" icon={ReceiptText} tone="rose" />
        <MetricCard title="Operating Profit" value={kes(summary.net_profit)} subtitle="Receipts less operating costs" icon={TrendingUp} tone={Number(summary.net_profit) >= 0 ? "emerald" : "rose"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Plus className="h-4 w-4 text-violet-400" />
              Record Cash Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label className="text-slate-300">Cash event</Label>
                <Select value={form.entry_type} onValueChange={(value) => setForm((current) => ({ ...current, entry_type: value as PlatformExpenditureEntryType }))}>
                  <SelectTrigger className="mt-1 border-slate-700 bg-slate-950 text-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operating_expense">Operating expense</SelectItem>
                    <SelectItem value="bank_fee">Bank or transaction fee</SelectItem>
                    <SelectItem value="owner_draw">Owner or team distribution</SelectItem>
                    <SelectItem value="cash_adjustment">Balance adjustment</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-slate-500">Distributions reduce cash but do not reduce operating profit.</p>
              </div>
              <div>
                <Label className="text-slate-300">Entry type</Label>
                <Select value={form.direction} onValueChange={(value) => setForm((current) => ({ ...current, direction: value as "expense" | "credit" }))}>
                  <SelectTrigger className="mt-1 border-slate-700 bg-slate-950 text-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Cash out (+)</SelectItem>
                    <SelectItem value="credit">Credit or refund (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Title</Label>
                <Input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Example: Cloud hosting"
                  className="mt-1 border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div>
                  <Label className="text-slate-300">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm((current) => ({ ...current, category: value as PlatformExpenditureCategory }))}
                  >
                    <SelectTrigger className="mt-1 border-slate-700 bg-slate-950 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="0.00"
                    className="mt-1 border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Incurred on</Label>
                <Input
                  type="date"
                  value={form.incurred_on}
                  onChange={(event) => setForm((current) => ({ ...current, incurred_on: event.target.value }))}
                  className="mt-1 border-slate-700 bg-slate-950 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Bank or supplier reference</Label>
                <Input
                  value={form.reference}
                  onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                  placeholder="Optional but recommended"
                  className="mt-1 border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label className="text-slate-300">Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Optional context for audit review"
                  className="mt-1 min-h-24 border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full bg-violet-600 hover:bg-violet-500">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {form.direction === "credit" ? "Record credit" : "Record cash event"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base text-white">{ledger === "primary" ? "Account 1" : "Account 2"} Event Log</CardTitle>
              <p className="mt-1 text-xs text-slate-500">All {total} recorded expenditure events for this account</p>
            </div>
            <Badge variant="outline" className="border-slate-700 text-slate-300">{rangeCopy}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              </div>
            ) : entries.length === 0 ? (
              <p className="py-20 text-center text-sm text-slate-500">No expenditure recorded for this range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-slate-400">
                      <th className="px-4 py-3">Expense</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Recorded by</th>
                      <th className="px-4 py-3 text-right">Correction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-800/50">
                        <td className="min-w-56 px-4 py-3">
                          <div className="font-medium text-white">{entry.title}</div>
                          <div className="mt-1 text-xs capitalize text-slate-500">{entry.entry_type.replaceAll("_", " ")}{entry.reference ? ` · ${entry.reference}` : ""}</div>
                          {entry.notes && <div className="mt-1 max-w-md truncate text-xs text-slate-500">{entry.notes}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="border-slate-700 text-slate-300">
                            {categoryLabel(entry.category)}
                          </Badge>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono ${Number(entry.amount) < 0 ? "text-emerald-400" : "text-white"}`}>{Number(entry.amount) > 0 ? "+" : ""}{kes(entry.amount)}</td>
                        <td className="px-4 py-3 text-slate-300">{dateLabel(entry.incurred_on)}</td>
                        <td className="px-4 py-3 text-slate-400">{entry.created_by_email || "Superadmin"}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-slate-400">{entry.reverses ? "Reversal" : entry.is_reversed ? "Reversed" : "-"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
              <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  className="border-slate-700 bg-slate-900 text-slate-200"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="border-slate-700 bg-slate-900 text-slate-200"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SuperadminExpenditurePage
