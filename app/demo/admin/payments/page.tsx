"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, CreditCard, Smartphone, Landmark, Clock, CheckCircle2, XCircle } from "lucide-react"

const payments = [
  { id: "PAY-2026-204", customer: "Alice Wanjiru", amount: 1000, method: "M-Pesa", status: "completed", date: "May 24, 2026", ref: "QJK87234", service: "PPPoE" },
  { id: "PAY-2026-203", customer: "James Mwangi", amount: 2000, method: "M-Pesa", status: "completed", date: "May 24, 2026", ref: "PLM34521", service: "PPPoE" },
  { id: "PAY-2026-202", customer: "Peter Kamau", amount: 500, method: "Cash", status: "pending", date: "May 23, 2026", ref: "CSH-2291", service: "Static" },
  { id: "PAY-2026-201", customer: "Orbit Logistics", amount: 5000, method: "Bank", status: "processing", date: "May 23, 2026", ref: "BNK-7781", service: "PPPoE" },
  { id: "PAY-2026-200", customer: "South B Guest", amount: 150, method: "M-Pesa", status: "failed", date: "May 22, 2026", ref: "MPS-9102", service: "Hotspot" },
]

const statusStyles: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  pending: "bg-warning/15 text-warning dark:bg-amber-950/30 dark:text-amber-300",
  processing: "bg-primary/15 text-primary dark:bg-blue-950/30 dark:text-primary/60",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
}

function methodIcon(method: string) {
  if (method === "Bank") return <Landmark className="h-4 w-4" />
  if (method === "Cash") return <CreditCard className="h-4 w-4" />
  return <Smartphone className="h-4 w-4" />
}

export default function DemoAdminPaymentsPage() {
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState("all")

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      const q = query.toLowerCase()
      const matchesQuery = payment.customer.toLowerCase().includes(q) || payment.id.toLowerCase().includes(q) || payment.ref.toLowerCase().includes(q)
      const matchesTab = tab === "all" || payment.status === tab
      return matchesQuery && matchesTab
    })
  }, [query, tab])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
        <p className="mt-1 text-sm text-muted-foreground">Demo collections workspace following the live admin payments layout conventions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Today</CardTitle><CheckCircle2 className="h-4 w-4 text-emerald-600" /></CardHeader><CardContent><div className="text-2xl font-bold">KSh 48,700</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-warning" /></CardHeader><CardContent><div className="text-2xl font-bold">6</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Failed</CardTitle><XCircle className="h-4 w-4 text-rose-600" /></CardHeader><CardContent><div className="text-2xl font-bold">2</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">M-Pesa share</CardTitle><Smartphone className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">83%</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Transaction history</CardTitle>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search payments" className="pl-9" />
            </div>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((payment) => (
            <div key={payment.id} className="flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  {methodIcon(payment.method)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{payment.customer}</p>
                    <Badge className={statusStyles[payment.status]}>{payment.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{payment.id} · {payment.method} · {payment.ref}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{payment.date} · {payment.service}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">KSh {payment.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Demo transaction</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
