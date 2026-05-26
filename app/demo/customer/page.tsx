import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, Package, Receipt, Calendar, ArrowRight } from "lucide-react"

const metrics = [
  { label: "Current plan", value: "Home 10Mbps", icon: Package },
  { label: "Outstanding balance", value: "KSh 0", icon: CreditCard },
  { label: "Latest receipt", value: "RCP-2026-014", icon: Receipt },
  { label: "Renewal date", value: "Jun 10, 2026", icon: Calendar },
]

export default function DemoCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
            Customer Product Tour
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">A cleaner taste of the real customer portal.</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">These demo screens reuse the structure of the live customer experience, but all records are safe sample data.</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/demo/customer/payments">
            Open Payments
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <metric.icon className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{metric.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available demo routes</CardTitle>
          <CardDescription>Only the customer routes that exist are linked in the sidebar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Link href="/demo/customer/payments" className="rounded-xl border p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20">
            <CreditCard className="mb-3 h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold">Payments</h3>
            <p className="mt-1 text-sm text-muted-foreground">See real-style payment history cards with demo records.</p>
          </Link>
          <Link href="/demo/customer/plans" className="rounded-xl border p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20">
            <Package className="mb-3 h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold">Plans</h3>
            <p className="mt-1 text-sm text-muted-foreground">Browse plan cards styled like the production portal.</p>
          </Link>
          <Link href="/demo/customer/receipts" className="rounded-xl border p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20">
            <Receipt className="mb-3 h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold">Receipts</h3>
            <p className="mt-1 text-sm text-muted-foreground">Show completed transactions in receipt format with safe demo refs.</p>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
