"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, CreditCard, CheckCircle2, Clock, XCircle } from "lucide-react"

const payments = [
  { id: 1, payment_number: "PAY-2026-204", amount: "1000", payment_method: "M-Pesa", status: "completed", transaction_id: "QJK87234", created_at: "May 24, 2026 08:40" },
  { id: 2, payment_number: "PAY-2026-203", amount: "1000", payment_method: "M-Pesa", status: "completed", transaction_id: "PLM34521", created_at: "May 10, 2026 09:14" },
  { id: 3, payment_number: "PAY-2026-198", amount: "500", payment_method: "Card", status: "processing", transaction_id: "CRD55120", created_at: "Apr 30, 2026 14:02" },
  { id: 4, payment_number: "PAY-2026-190", amount: "1000", payment_method: "M-Pesa", status: "failed", transaction_id: "MPS00812", created_at: "Apr 10, 2026 07:58" },
]

const statusConfig = {
  completed: { icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" },
  processing: { icon: Clock, className: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" },
  pending: { icon: Clock, className: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" },
  failed: { icon: XCircle, className: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300" },
} as const

export default function DemoCustomerPaymentsPage() {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => payments.filter((payment) => payment.payment_number.toLowerCase().includes(query.toLowerCase()) || payment.payment_method.toLowerCase().includes(query.toLowerCase()) || payment.transaction_id.toLowerCase().includes(query.toLowerCase())), [query])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payment History</h2>
        <p className="mt-1 text-sm text-muted-foreground">Demo payment cards modeled after the live customer portal layout.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search payments" className="pl-9" />
      </div>

      <div className="space-y-3">
        {filtered.map((payment) => {
          const config = statusConfig[payment.status as keyof typeof statusConfig]
          const StatusIcon = config.icon
          return (
            <Card key={payment.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.className}`}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">KSh {Number(payment.amount).toLocaleString()}</p>
                    <Badge className={config.className}>{payment.status}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{payment.created_at}</span>
                    <span>{payment.payment_method}</span>
                    <span>Ref: {payment.transaction_id}</span>
                    <span>{payment.payment_number}</span>
                  </div>
                </div>
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
