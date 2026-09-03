"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Banknote,
  Calculator,
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
import {
  superadminApi,
  type PlatformExpenditure,
  type PlatformExpenditureCategory,
  type PlatformExpenditureLedger,
  type PlatformExpenditureSummary,
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

const emptySummary: PlatformExpenditureSummary = {
  currency: "KES",
  ledger: "primary",
  ledger_label: "Original Business Account",
  ledger_description: "Closed ledger ending at the gateway/account cutover.",
  ledger_route: "/superadmin/expenditure",
  cutover_at: null,
  cutover_reference: "",
  cutover_company: "",
  subscription_payments_total: "0.00",
  sms_topups_total: "0.00",
  accrued_total: "0.00",
  manual_expenditure_total: "0.00",
  net_profit: "0.00",
}

function kes(value: string | number) {
  return Number(value || 0).toLocaleString("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ start: "", end: "" })
  const [form, setForm] = useState({
    title: "",
    category: "operations" as PlatformExpenditureCategory,
    amount: "",
    incurred_on: today(),
    notes: "",
  })

  const totalPages = Math.max(Math.ceil(total / 20), 1)
  const rangeCopy = useMemo(() => {
    if (filters.start && filters.end) return `${dateLabel(filters.start)} to ${dateLabel(filters.end)}`
    if (filters.start) return `From ${dateLabel(filters.start)}`
    if (filters.end) return `Until ${dateLabel(filters.end)}`
    return "All time"
  }, [filters.end, filters.start])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), page_size: "20" }
      if (filters.start) params.start = filters.start
      if (filters.end) params.end = filters.end
      const data = await superadminApi.getExpenditure(params, ledger)
      setEntries(data.results)
      setSummary(data.summary)
      setTotal(data.count)
    } catch (err: any) {
      toast.error(err?.message || "Failed to load expenditure")
    } finally {
      setLoading(false)
    }
  }, [filters.end, filters.start, ledger, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
        category: form.category,
        amount: amount.toFixed(2),
        currency: "KES",
        incurred_on: form.incurred_on || today(),
        notes: form.notes.trim(),
      }, ledger)
      toast.success("Expenditure recorded")
      setForm({ title: "", category: "operations", amount: "", incurred_on: today(), notes: "" })
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
        <div className="grid gap-3 lg:grid-cols-[auto_1fr_1fr_auto]">
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
            onClick={fetchData}
            disabled={loading}
            className="self-end border-slate-700 bg-slate-900 text-slate-200"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Accrued Total" value={kes(summary.accrued_total)} subtitle={`${rangeCopy} · ${summary.ledger_label}`} icon={WalletCards} />
        <MetricCard title="Subscriptions" value={kes(summary.subscription_payments_total)} subtitle="Completed tenant subscription payments" icon={Banknote} tone="emerald" />
        <MetricCard title="SMS Top-ups" value={kes(summary.sms_topups_total)} subtitle="Completed inbuilt SMS top-ups" icon={ReceiptText} tone="cyan" />
        <MetricCard title="Manual Expenditure" value={kes(summary.manual_expenditure_total)} subtitle="Costs entered here" icon={ReceiptText} tone="rose" />
        <MetricCard title="Net Profit" value={kes(summary.net_profit)} subtitle="Accrued minus expenditure" icon={TrendingUp} tone={Number(summary.net_profit) >= 0 ? "emerald" : "rose"} />
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Accounting window</p>
            <p className="mt-1 text-sm font-medium text-slate-100">
              {ledger === "new_business" ? "After cutover" : "Up to cutover"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Cutover payment</p>
            <p className="mt-1 text-sm font-medium text-slate-100">{dateTimeLabel(summary.cutover_at)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Boundary reference</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-100">
              {summary.cutover_company || "Bentrex"}{summary.cutover_reference ? ` · ${summary.cutover_reference}` : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Plus className="h-4 w-4 text-violet-400" />
              Add Expenditure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
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
                Record expenditure
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base text-white">Manual Expenditure Log</CardTitle>
              <p className="mt-1 text-xs text-slate-500">{total} records</p>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-800/50">
                        <td className="min-w-56 px-4 py-3">
                          <div className="font-medium text-white">{entry.title}</div>
                          {entry.notes && <div className="mt-1 max-w-md truncate text-xs text-slate-500">{entry.notes}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="border-slate-700 text-slate-300">
                            {categoryLabel(entry.category)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-white">{kes(entry.amount)}</td>
                        <td className="px-4 py-3 text-slate-300">{dateLabel(entry.incurred_on)}</td>
                        <td className="px-4 py-3 text-slate-400">{entry.created_by_email || "Superadmin"}</td>
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
