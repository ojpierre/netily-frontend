"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  CalendarRange,
  Landmark,
  Loader2,
  PencilLine,
  RefreshCw,
  Scale,
  TrendingUp,
  WalletCards,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  superadminApi,
  type FinancialCashPosition,
  type FinancialSummary,
  type PlatformExpenditureLedger,
  type PlatformFinancialReport,
} from "@/lib/superadmin-api"

type ViewKey = "combined" | PlatformExpenditureLedger

const accountNames: Record<PlatformExpenditureLedger, string> = {
  primary: "Account 1",
  new_business: "Account 2",
}

function ymd(value: Date) {
  return value.toISOString().slice(0, 10)
}

function kes(value?: string | number | null) {
  if (value === null || value === undefined) return "Not reconciled"
  return Number(value).toLocaleString("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function when(value: string) {
  return new Date(value).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function metricTone(value: string) {
  return Number(value) < 0 ? "text-rose-300" : "text-white"
}

function Metric({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: typeof Banknote }) {
  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardContent className="flex min-h-36 items-start gap-3 p-5">
        <div className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
          <p className={`mt-2 text-2xl font-bold ${metricTone(value)}`}>{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FinancialReportsPage() {
  const now = new Date()
  const [range, setRange] = useState({ start: `${now.getFullYear()}-01-01`, end: ymd(now) })
  const [view, setView] = useState<ViewKey>("combined")
  const [report, setReport] = useState<PlatformFinancialReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mappingOpen, setMappingOpen] = useState(false)
  const [mappingEvent, setMappingEvent] = useState<PlatformFinancialReport["recent_events"][number] | null>(null)
  const [mappingAccount, setMappingAccount] = useState<PlatformExpenditureLedger>("primary")
  const [mappingNotes, setMappingNotes] = useState("")
  const [snapshot, setSnapshot] = useState({
    ledger: "primary" as PlatformExpenditureLedger,
    balance: "",
    balance_at: "",
    reference: "",
    notes: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setReport(await superadminApi.getFinancialReport(range))
    } catch (error: any) {
      toast.error(error?.message || "Could not load financial reports")
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { load() }, [load])

  const summary: FinancialSummary | null = report
    ? view === "combined" ? report.combined : report.accounts[view]
    : null
  const chartRows = useMemo(() => {
    if (!report) return []
    const rows = view === "combined" ? report.monthly : report.monthly_by_account[view]
    return rows.map((row) => ({
      ...row,
      receipts: Number(row.receipts),
      expenses: Number(row.expenses),
      profit: Number(row.profit),
    }))
  }, [report, view])

  const openSnapshot = (ledger: PlatformExpenditureLedger) => {
    const current = report?.cash_positions[ledger].snapshot
    const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setSnapshot({
      ledger,
      balance: current?.balance || "",
      balance_at: localNow,
      reference: "",
      notes: "",
    })
    setDialogOpen(true)
  }

  const saveSnapshot = async () => {
    if (!snapshot.balance || !snapshot.balance_at) {
      toast.error("Enter the confirmed balance and statement time")
      return
    }
    setSaving(true)
    try {
      await superadminApi.saveAccountBalanceSnapshot({
        ...snapshot,
        balance: Number(snapshot.balance).toFixed(2),
        balance_at: new Date(snapshot.balance_at).toISOString(),
      })
      toast.success(`${accountNames[snapshot.ledger]} balance reconciled`)
      setDialogOpen(false)
      await load()
    } catch (error: any) {
      toast.error(error?.message || "Could not save the balance")
    } finally {
      setSaving(false)
    }
  }

  const openMapping = (event: PlatformFinancialReport["recent_events"][number]) => {
    setMappingEvent(event)
    setMappingAccount(event.account)
    setMappingNotes("")
    setMappingOpen(true)
  }

  const saveMapping = async () => {
    if (!mappingEvent?.source_type || !mappingEvent.source_id) return
    setSaving(true)
    try {
      await superadminApi.saveFinancialReceiptAllocation({
        source_type: mappingEvent.source_type,
        source_id: mappingEvent.source_id,
        reference: mappingEvent.reference,
        ledger: mappingAccount,
        occurred_at: mappingEvent.occurred_at,
        notes: mappingNotes.trim(),
      })
      toast.success(`Receipt mapped to ${accountNames[mappingAccount]}`)
      setMappingOpen(false)
      await load()
    } catch (error: any) {
      toast.error(error?.message || "Could not update the receipt account")
    } finally {
      setSaving(false)
    }
  }

  if (loading && !report) {
    return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><Landmark className="h-6 w-6 text-violet-400" />Financial Reports</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">Track business performance separately from the real cash held in each account.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div><Label className="text-xs text-slate-400">From</Label><Input type="date" value={range.start} onChange={(e) => setRange((x) => ({ ...x, start: e.target.value }))} className="mt-1 border-slate-700 bg-slate-900 text-white" /></div>
          <div><Label className="text-xs text-slate-400">To</Label><Input type="date" value={range.end} onChange={(e) => setRange((x) => ({ ...x, end: e.target.value }))} className="mt-1 border-slate-700 bg-slate-900 text-white" /></div>
          <Button onClick={load} variant="outline" className="h-10 border-slate-700 bg-slate-900 text-slate-100"><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Financial account view">
        {(["combined", "primary", "new_business"] as ViewKey[]).map((key) => (
          <Button key={key} onClick={() => setView(key)} variant={view === key ? "default" : "outline"} className={view === key ? "bg-violet-600 hover:bg-violet-500" : "border-slate-700 bg-slate-900 text-slate-200"}>
            {key === "combined" ? "Combined business" : accountNames[key]}
          </Button>
        ))}
      </div>

      {report?.data_quality.unreconciled_accounts ? (
        <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-100">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cash balance needs a statement anchor</AlertTitle>
          <AlertDescription className="text-amber-200/80">Reconcile both accounts using confirmed bank or wallet balances. Transaction totals alone cannot prove how much cash is currently available.</AlertDescription>
        </Alert>
      ) : null}

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Operating receipts" value={kes(summary.receipts)} hint={`${kes(summary.subscriptions)} subscriptions + ${kes(summary.sms)} SMS`} icon={ArrowDownRight} />
          <Metric label="Operating costs" value={kes(summary.operating_expenses)} hint="Business expenses and transaction fees" icon={ArrowUpRight} />
          <Metric label="Operating profit" value={kes(summary.operating_profit)} hint={`${Number(summary.profit_margin).toFixed(1)}% margin before owner distributions`} icon={TrendingUp} />
          <Metric label="Owner distributions" value={kes(summary.owner_draws)} hint="Tracked separately from operating expenses" icon={WalletCards} />
          <Metric label="Reconciled cash" value={view === "combined" ? kes(report?.known_combined_cash) : kes(report?.cash_positions[view].estimated_balance)} hint="Latest confirmed balances plus recorded movements" icon={Scale} />
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {(["primary", "new_business"] as PlatformExpenditureLedger[]).map((ledger) => (
          <CashAccount key={ledger} ledger={ledger} position={report?.cash_positions[ledger]} onReconcile={() => openSnapshot(ledger)} />
        ))}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-white">Monthly performance</CardTitle><p className="mt-1 text-xs text-slate-500">Internal transfers are excluded from profit.</p></div><CalendarRange className="h-5 w-5 text-slate-500" /></CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows} margin={{ left: 4, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(value) => kes(Number(value))} />
                  <Legend />
                  <Bar dataKey="receipts" name="Receipts" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Costs" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader><CardTitle className="text-white">Forward view</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div><p className="text-xs text-slate-500">Expected monthly receipts</p><p className="mt-1 text-xl font-semibold text-white">{kes(report?.forecast.monthly_receipts)}</p></div>
            <div><p className="text-xs text-slate-500">Expected monthly costs</p><p className="mt-1 text-xl font-semibold text-white">{kes(report?.forecast.monthly_expenses)}</p></div>
            <div className="border-t border-slate-800 pt-5"><p className="text-xs text-slate-500">Projected profit, next 3 months</p><p className="mt-1 text-2xl font-bold text-emerald-300">{kes(report?.forecast.next_three_months_profit)}</p><p className="mt-2 text-xs text-slate-500">Simple run-rate based on {report?.forecast.basis_months || 0} completed month(s).</p></div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,2fr)]">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader><CardTitle className="text-white">Cost mix</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {report?.expense_categories.length ? report.expense_categories.map((item) => (
              <div key={item.category} className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 text-sm"><span className="capitalize text-slate-300">{item.category}</span><strong className="text-white">{kes(item.total)}</strong></div>
            )) : <p className="text-sm text-slate-500">No operating costs in this period.</p>}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader><CardTitle className="text-white">Recent money movement</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-800 text-xs uppercase text-slate-500"><tr><th className="pb-3">Date</th><th className="pb-3">Account</th><th className="pb-3">Event</th><th className="pb-3">Reference</th><th className="pb-3 text-right">Amount</th><th className="pb-3 text-right">Map</th></tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {report?.recent_events.map((event, index) => (
                    <tr key={`${event.reference}-${event.occurred_at}-${index}`}><td className="py-3 text-slate-400">{when(event.occurred_at)}</td><td className="py-3"><span className="text-slate-300">{accountNames[event.account]}</span><p className="text-xs capitalize text-slate-500">{event.allocation.replaceAll("_", " ")}</p></td><td className="py-3"><p className="font-medium text-white">{event.title}</p><p className="text-xs capitalize text-slate-500">{event.type.replaceAll("_", " ")}</p></td><td className="py-3 text-slate-400">{event.reference || "-"}</td><td className={`py-3 text-right font-semibold ${event.direction === "in" ? "text-emerald-300" : "text-slate-100"}`}>{event.direction === "in" ? "+" : event.direction === "out" ? "-" : ""}{kes(event.amount)}</td><td className="py-3 text-right">{event.source_id ? <Button size="icon" variant="ghost" onClick={() => openMapping(event)} title="Change account mapping" aria-label={`Map ${event.title} to an account`} className="text-slate-400 hover:text-white"><PencilLine className="h-4 w-4" /></Button> : "-"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <Alert className="border-slate-800 bg-slate-900 text-slate-200">
        <AlertTriangle className="h-4 w-4" /><AlertTitle>Reconciliation notes</AlertTitle>
        <AlertDescription className="text-slate-400">{report?.data_quality.message} {report?.data_quality.inferred_subscription_allocations || 0} subscription and {report?.data_quality.inferred_sms_allocations || 0} SMS allocations are date-inferred in this period.</AlertDescription>
      </Alert>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-slate-800 bg-slate-950 text-white">
          <DialogHeader><DialogTitle>Check {accountNames[snapshot.ledger]}</DialogTitle><DialogDescription className="text-slate-400">Enter the live bank or wallet balance. It is compared with the system estimate, records any difference, then becomes the next checkpoint. You can check it again whenever needed.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Account</Label><Select value={snapshot.ledger} onValueChange={(value) => setSnapshot((x) => ({ ...x, ledger: value as PlatformExpenditureLedger }))}><SelectTrigger className="mt-1 border-slate-700 bg-slate-900"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="primary">Account 1</SelectItem><SelectItem value="new_business">Account 2</SelectItem></SelectContent></Select></div>
            <div><Label>Confirmed balance (KES)</Label><Input type="number" step="0.01" value={snapshot.balance} onChange={(e) => setSnapshot((x) => ({ ...x, balance: e.target.value }))} className="mt-1 border-slate-700 bg-slate-900" /></div>
            <div><Label>Balance confirmed at</Label><Input type="datetime-local" value={snapshot.balance_at} onChange={(e) => setSnapshot((x) => ({ ...x, balance_at: e.target.value }))} className="mt-1 border-slate-700 bg-slate-900" /></div>
            <div><Label>Statement reference</Label><Input value={snapshot.reference} onChange={(e) => setSnapshot((x) => ({ ...x, reference: e.target.value }))} placeholder="e.g. statement closing balance" className="mt-1 border-slate-700 bg-slate-900" /></div>
            <div><Label>Notes</Label><Textarea value={snapshot.notes} onChange={(e) => setSnapshot((x) => ({ ...x, notes: e.target.value }))} placeholder="What was checked and any known missing fees" className="mt-1 border-slate-700 bg-slate-900" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 bg-slate-900">Cancel</Button><Button onClick={saveSnapshot} disabled={saving} className="bg-violet-600 hover:bg-violet-500">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save balance</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
        <DialogContent className="border-slate-800 bg-slate-950 text-white">
          <DialogHeader><DialogTitle>Map receipt to account</DialogTitle><DialogDescription className="text-slate-400">The payment remains unchanged. Only its reporting account is corrected.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><p className="font-medium">{mappingEvent?.title}</p><p className="mt-1 text-sm text-slate-400">{mappingEvent?.reference || "No external reference"} · {kes(mappingEvent?.amount)}</p></div>
            <div><Label>Money received in</Label><Select value={mappingAccount} onValueChange={(value) => setMappingAccount(value as PlatformExpenditureLedger)}><SelectTrigger className="mt-1 border-slate-700 bg-slate-900"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="primary">Account 1</SelectItem><SelectItem value="new_business">Account 2</SelectItem></SelectContent></Select></div>
            <div><Label>Review note</Label><Textarea value={mappingNotes} onChange={(event) => setMappingNotes(event.target.value)} placeholder="Example: confirmed against the October statement" className="mt-1 border-slate-700 bg-slate-900" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMappingOpen(false)} className="border-slate-700 bg-slate-900">Cancel</Button><Button onClick={saveMapping} disabled={saving} className="bg-violet-600 hover:bg-violet-500">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save mapping</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CashAccount({ ledger, position, onReconcile }: { ledger: PlatformExpenditureLedger; position?: FinancialCashPosition; onReconcile: () => void }) {
  const expenditureRoute = ledger === "primary" ? "/superadmin/expenditure" : "/superadmin/expenditure-2"
  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader className="flex-row items-start justify-between gap-3"><div><CardTitle className="text-white">{accountNames[ledger]}</CardTitle><p className="mt-1 text-xs text-slate-500">{ledger === "primary" ? "Original business account" : "New business account"}</p></div><Badge variant="outline" className={position?.snapshot ? "border-emerald-500/30 text-emerald-300" : "border-amber-500/30 text-amber-300"}>{position?.snapshot ? "Reconciled" : "Needs balance"}</Badge></CardHeader>
      <CardContent className="space-y-5">
        <div><p className="text-xs text-slate-500">Estimated available cash</p><p className="mt-1 text-3xl font-bold text-white">{kes(position?.estimated_balance)}</p>{position?.snapshot ? <p className="mt-2 text-xs text-slate-500">Last checked at {kes(position.snapshot.balance)} on {when(position.snapshot.balance_at)}</p> : null}</div>
        {position?.snapshot?.reconciliation_difference !== null && position?.snapshot?.reconciliation_difference !== undefined ? <div className={`rounded-lg border p-3 text-sm ${Math.abs(Number(position.snapshot.reconciliation_difference)) <= 50 ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200" : "border-amber-500/20 bg-amber-500/5 text-amber-100"}`}><p className="font-medium">Last check difference: {kes(position.snapshot.reconciliation_difference)}</p><p className="mt-1 text-xs opacity-75">System expected {kes(position.snapshot.system_balance_before)} before the live balance was entered.</p></div> : null}
        {position?.movements_after_snapshot ? <div className="grid grid-cols-2 gap-3 border-y border-slate-800 py-4 text-sm"><div><p className="text-xs text-slate-500">Receipts since</p><p className="mt-1 text-emerald-300">+{kes(position.movements_after_snapshot.receipts)}</p></div><div><p className="text-xs text-slate-500">Outflows since</p><p className="mt-1 text-slate-200">-{kes(position.movements_after_snapshot.outflows)}</p></div><div><p className="text-xs text-slate-500">Transfers in</p><p className="mt-1 text-slate-200">+{kes(position.movements_after_snapshot.transfer_in)}</p></div><div><p className="text-xs text-slate-500">Transfers out</p><p className="mt-1 text-slate-200">-{kes(position.movements_after_snapshot.transfer_out)}</p></div></div> : <p className="text-sm leading-6 text-slate-400">Add one confirmed balance. Earlier receipts and costs remain in performance reports, while cash starts from the balance you verified.</p>}
        <div className="flex flex-wrap gap-2"><Button onClick={onReconcile} className="bg-violet-600 hover:bg-violet-500"><Scale className="mr-2 h-4 w-4" />Check live balance</Button><Button asChild variant="outline" className="border-slate-700 bg-slate-950 text-slate-200"><Link href={expenditureRoute}><ArrowLeftRight className="mr-2 h-4 w-4" />Open ledger</Link></Button></div>
      </CardContent>
    </Card>
  )
}
