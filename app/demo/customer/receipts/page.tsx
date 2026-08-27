import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receipt, CheckCircle2 } from "lucide-react"

const receipts = [
  { id: 1, paymentNumber: "PAY-2026-204", amount: 1000, method: "M-Pesa", reference: "QJK87234", invoice: "INV-0024", date: "May 24, 2026" },
  { id: 2, paymentNumber: "PAY-2026-203", amount: 1000, method: "M-Pesa", reference: "PLM34521", invoice: "INV-0023", date: "May 10, 2026" },
  { id: 3, paymentNumber: "PAY-2026-199", amount: 1000, method: "Card", reference: "CRD77115", invoice: "INV-0022", date: "Apr 10, 2026" },
]

export default function DemoCustomerReceiptsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Receipts</h2>
        <p className="mt-1 text-sm text-muted-foreground">Completed demo payments presented in the same receipt-first style as the live portal.</p>
      </div>

      <div className="space-y-3">
        {receipts.map((receipt) => (
          <Card key={receipt.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold">KSh {receipt.amount.toLocaleString()}</p>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Paid</Badge>
                </div>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><p className="text-xs text-muted-foreground">Payment #</p><p className="font-medium">{receipt.paymentNumber}</p></div>
                  <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{receipt.date}</p></div>
                  <div><p className="text-xs text-muted-foreground">Method</p><p className="font-medium">{receipt.method}</p></div>
                  <div><p className="text-xs text-muted-foreground">Reference</p><p className="font-medium font-mono text-xs">{receipt.reference}</p></div>
                  <div><p className="text-xs text-muted-foreground">Invoice</p><p className="font-medium">{receipt.invoice}</p></div>
                </div>
              </div>
              <Receipt className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
