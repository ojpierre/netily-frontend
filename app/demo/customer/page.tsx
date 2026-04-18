"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Wifi,
  Package,
  CreditCard,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Calendar,
  TrendingUp,
  HelpCircle,
  Gift,
  User,
  ChevronLeft,
  Activity,
  Download,
  Upload,
  Clock,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

// ── Mock Data ─────────────────────────────────────────────────────────────────

const usageData = [
  { day: "Mon", download: 4.2, upload: 1.1 },
  { day: "Tue", download: 6.8, upload: 1.8 },
  { day: "Wed", download: 5.1, upload: 1.2 },
  { day: "Thu", download: 7.3, upload: 2.1 },
  { day: "Fri", download: 8.9, upload: 2.4 },
  { day: "Sat", download: 12.4, upload: 3.6 },
  { day: "Sun", download: 9.1, upload: 2.8 },
]

const recentPayments = [
  { ref: "QJK87234", amount: "1,000.00", method: "M-Pesa", status: "Completed", date: "Apr 10, 2026" },
  { ref: "PLM34521", amount: "1,000.00", method: "M-Pesa", status: "Completed", date: "Mar 10, 2026" },
  { ref: "WER09812", amount: "1,000.00", method: "M-Pesa", status: "Completed", date: "Feb 10, 2026" },
]

const invoices = [
  { id: "INV-0024", amount: "1,000.00", status: "Paid", date: "Apr 1, 2026" },
  { id: "INV-0023", amount: "1,000.00", status: "Paid", date: "Mar 1, 2026" },
  { id: "INV-0022", amount: "1,000.00", status: "Paid", date: "Feb 1, 2026" },
]

const navItems = [
  { name: "Dashboard", href: "/demo/customer", icon: LayoutDashboard },
  { name: "My Plan", href: "/demo/customer/plan", icon: Package },
  { name: "Payments", href: "/demo/customer/payments", icon: CreditCard },
  { name: "Invoices", href: "/demo/customer/invoices", icon: FileText },
  { name: "Usage", href: "/demo/customer/usage", icon: Activity },
  { name: "Loyalty", href: "/demo/customer/loyalty", icon: Gift },
  { name: "Support", href: "/demo/customer/support", icon: HelpCircle },
  { name: "Profile", href: "/demo/customer/profile", icon: User },
  { name: "Settings", href: "/demo/customer/settings", icon: Settings },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────

function DemoCustomerSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 flex flex-col transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">Demo ISP</p>
            <p className="text-xs text-muted-foreground">Customer Portal</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo badge */}
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Live Demo Mode</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                  ${active
                    ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                onClick={onClose}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <Link href="/demo" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-3 h-3" />
            Back to Demo Home
          </Link>
        </div>
      </aside>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DemoCustomerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const daysRemaining = 22
  const expiryDate = "May 10, 2026"
  const dataUsedGB = 53.8
  const dataLimitGB = 100
  const usagePct = Math.round((dataUsedGB / dataLimitGB) * 100)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DemoCustomerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content */}
      <div className="lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-14 flex items-center px-4 gap-3">
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-sm">My Account</h1>
          </div>
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-xs">
            Demo Mode
          </Badge>
          <Bell className="w-5 h-5 text-muted-foreground" />
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-green-600 text-white text-xs">JD</AvatarFallback>
          </Avatar>
        </header>

        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* Welcome */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Welcome, John Demo</h2>
              <p className="text-xs text-muted-foreground">CUST-0001 · Active Customer</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 text-[10px]">Paid</Badge>
              </div>
              <p className="text-2xl font-bold">KSh 0</p>
              <p className="text-xs text-muted-foreground">Outstanding Balance</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">{daysRemaining} days</span>
              </div>
              <p className="text-2xl font-bold">{expiryDate}</p>
              <p className="text-xs text-muted-foreground">Plan Expiry</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Download className="w-5 h-5 text-indigo-600" />
                <span className="text-xs text-muted-foreground">{usagePct}% used</span>
              </div>
              <p className="text-2xl font-bold">{dataUsedGB} GB</p>
              <p className="text-xs text-muted-foreground">of {dataLimitGB} GB data</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] border-0">Popular</Badge>
              </div>
              <p className="text-2xl font-bold">Home 10Mbps</p>
              <p className="text-xs text-muted-foreground">Current Plan · KSh 1,000/mo</p>
            </Card>
          </div>

          {/* Plan card + usage */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Current plan */}
            <Card className="p-5 border-2 border-green-200 dark:border-green-800">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 border-0 mb-2">Active Plan</Badge>
                  <h3 className="text-xl font-bold">Home 10Mbps</h3>
                  <p className="text-sm text-muted-foreground">Unlimited data · PPPoE Fiber</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">KSh 1,000</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Download</span>
                  </div>
                  <p className="font-bold">10 Mbps</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Upload className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </div>
                  <p className="font-bold">10 Mbps</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                {["Unlimited Data", "24/7 Support", "Free Router Config"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-sm" size="sm" asChild>
                  <Link href="/demo/customer/payments">
                    Renew Plan
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-sm" asChild>
                  <Link href="/demo/customer/plan">
                    Change Plan
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Data usage */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Data Usage This Month</h3>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium">{dataUsedGB} GB / {dataLimitGB} GB</span>
                </div>
                <Progress value={usagePct} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">{dataLimitGB - dataUsedGB} GB remaining</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Downloaded</span>
                  </div>
                  <p className="font-bold text-blue-700 dark:text-blue-400">48.2 GB</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Upload className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs text-muted-foreground">Uploaded</span>
                  </div>
                  <p className="font-bold text-green-700 dark:text-green-400">5.6 GB</p>
                </div>
              </div>

              {/* Daily usage chart */}
              <p className="text-xs text-muted-foreground mb-2">Daily usage (GB) — this week</p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={usageData} barGap={2}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => [`${v} GB`, ""]} />
                  <Bar dataKey="download" name="Download" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="upload" name="Upload" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Payments + invoices */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Recent payments */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Payments</h3>
                <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
                  <Link href="/demo/customer/payments">View all <ArrowRight className="w-3 h-3" /></Link>
                </Button>
              </div>
              <div className="space-y-3">
                {recentPayments.map((p) => (
                  <div key={p.ref} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.method}</p>
                        <p className="text-xs text-muted-foreground">{p.date} · {p.ref}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">KSh {p.amount}</p>
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30">
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-3 bg-green-600 hover:bg-green-700" size="sm" asChild>
                <Link href="/demo/customer/payments">Make a Payment</Link>
              </Button>
            </Card>

            {/* Recent invoices */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Invoices</h3>
                <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
                  <Link href="/demo/customer/invoices">View all <ArrowRight className="w-3 h-3" /></Link>
                </Button>
              </div>
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/50 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{inv.id}</p>
                        <p className="text-xs text-muted-foreground">{inv.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">KSh {inv.amount}</p>
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30">
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick actions */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Pay Bill", href: "/demo/customer/payments", icon: CreditCard, color: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400" },
                { label: "Change Plan", href: "/demo/customer/plan", icon: Package, color: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" },
                { label: "Raise Ticket", href: "/demo/customer/support", icon: HelpCircle, color: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" },
                { label: "Loyalty Points", href: "/demo/customer/loyalty", icon: Gift, color: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400" },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`flex items-center gap-3 p-3 rounded-xl ${action.color} hover:opacity-80 transition-opacity`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                )
              })}
            </div>
          </Card>

          {/* Demo notice */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Demo environment — read-only</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                All data shown is for demonstration only. No real account or payments.
                <Link href="/demo" className="underline ml-1">← Back to demo home</Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
