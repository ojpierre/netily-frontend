import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Wifi, CreditCard, Package, Settings, ArrowRight, Activity } from "lucide-react"

const highlights = [
  { label: "Active customers", value: "482", icon: Users, tone: "text-blue-600" },
  { label: "Online routers", value: "14 / 16", icon: Wifi, tone: "text-emerald-600" },
  { label: "Collected today", value: "KSh 48,700", icon: CreditCard, tone: "text-violet-600" },
  { label: "Published plans", value: "8", icon: Package, tone: "text-amber-600" },
]

const sections = [
  {
    title: "Users",
    description: "Production-style customer management with demo balances, plans, and lifecycle statuses.",
    href: "/demo/admin/users",
    icon: Users,
  },
  {
    title: "Routers",
    description: "Fleet summary plus a drill-down router page so prospects can see the network ops workflow.",
    href: "/demo/admin/routers",
    icon: Wifi,
  },
  {
    title: "Payments",
    description: "A realistic collections view with payment states, channels, and recent receipts.",
    href: "/demo/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Plans",
    description: "Catalog cards inspired by the live system, populated with safe sample pricing and features.",
    href: "/demo/admin/plans",
    icon: Package,
  },
  {
    title: "Settings",
    description: "Tabs and controls modeled after the real admin settings surface, kept read-only for demos.",
    href: "/demo/admin/settings",
    icon: Settings,
  },
]

export default function DemoAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
            Admin Product Tour
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">Show the real workflow, minus the real risk.</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            These demo routes follow the same structure as the live admin screens so interested customers can explore the product with confidence.
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/demo/admin/users">
            Start with Users
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <item.icon className={`h-4 w-4 ${item.tone}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">Demo snapshot styled after the production admin dashboard.</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Demo Routes Ready
          </CardTitle>
          <CardDescription>Only routes that exist are linked in the sidebar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link key={section.href} href={section.href} className="rounded-xl border bg-card p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40 dark:hover:border-blue-800 dark:hover:bg-blue-950/20">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <section.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{section.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
