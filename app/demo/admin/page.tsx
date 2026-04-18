"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Users,
  Wifi,
  Package,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Server,
  Activity,
  DollarSign,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Network,
  Key,
  Receipt,
  Banknote,
  MessageSquare,
  QrCode,
  Gift,
  ChevronLeft,
  Radio,
  Box,
  ExternalLink,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// ── Mock Data ─────────────────────────────────────────────────────────────────

const revenueData = [
  { month: "Oct", revenue: 185000, expenses: 62000 },
  { month: "Nov", revenue: 198000, expenses: 68000 },
  { month: "Dec", revenue: 224000, expenses: 71000 },
  { month: "Jan", revenue: 247000, expenses: 74000 },
  { month: "Feb", revenue: 261000, expenses: 78000 },
  { month: "Mar", revenue: 289000, expenses: 81000 },
  { month: "Apr", revenue: 312000, expenses: 85000 },
]

const customerGrowthData = [
  { month: "Oct", active: 310, churned: 18 },
  { month: "Nov", active: 335, churned: 14 },
  { month: "Dec", active: 362, churned: 21 },
  { month: "Jan", active: 389, churned: 16 },
  { month: "Feb", active: 418, churned: 12 },
  { month: "Mar", active: 451, churned: 19 },
  { month: "Apr", active: 483, churned: 10 },
]

const planDistribution = [
  { name: "Home 10Mbps", value: 187, color: "#3b82f6" },
  { name: "Family 25Mbps", value: 142, color: "#10b981" },
  { name: "Business 50Mbps", value: 98, color: "#f59e0b" },
  { name: "Starter 5Mbps", value: 56, color: "#8b5cf6" },
]

const recentCustomers = [
  { name: "Alice Wanjiru", code: "CUST-0483", plan: "Home 10Mbps", status: "ACTIVE", joined: "Apr 17, 2026", balance: "0.00" },
  { name: "James Mwangi", code: "CUST-0482", plan: "Family 25Mbps", status: "ACTIVE", joined: "Apr 16, 2026", balance: "2000.00" },
  { name: "Grace Akinyi", code: "CUST-0481", plan: "Business 50Mbps", status: "ACTIVE", joined: "Apr 15, 2026", balance: "0.00" },
  { name: "Peter Kamau", code: "CUST-0480", plan: "Starter 5Mbps", status: "SUSPENDED", joined: "Apr 14, 2026", balance: "500.00" },
  { name: "Faith Njeri", code: "CUST-0479", plan: "Home 10Mbps", status: "ACTIVE", joined: "Apr 13, 2026", balance: "0.00" },
  { name: "David Ochieng", code: "CUST-0478", plan: "Family 25Mbps", status: "ACTIVE", joined: "Apr 12, 2026", balance: "1500.00" },
]

const recentPayments = [
  { customer: "Alice Wanjiru", amount: 1000, method: "M-Pesa", time: "2 hours ago", ref: "QJK87234" },
  { customer: "James Mwangi", amount: 2000, method: "M-Pesa", time: "4 hours ago", ref: "PLM34521" },
  { customer: "Grace Akinyi", amount: 5000, method: "M-Pesa", time: "6 hours ago", ref: "WER09812" },
  { customer: "David Ochieng", amount: 2000, method: "M-Pesa", time: "Yesterday", ref: "NMK55671" },
  { customer: "Faith Njeri", amount: 1000, method: "M-Pesa", time: "Yesterday", ref: "ZXC12904" },
]

const networkAlerts = [
  { type: "warning", message: "Router Westlands-01 CPU at 87%", time: "5 min ago" },
  { type: "success", message: "Router Karen-03 came back online", time: "12 min ago" },
  { type: "error", message: "3 customers suspended — expired plans", time: "1 hour ago" },
  { type: "info", message: "FUP policy triggered for 7 users", time: "2 hours ago" },
]

const navSections = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/demo/admin", icon: LayoutDashboard },
      { name: "Customers", href: "/demo/admin/users", icon: Users },
      { name: "Plans", href: "/demo/admin/plans", icon: Package },
    ],
  },
  {
    title: "Network",
    items: [
      { name: "Routers", href: "/demo/admin/routers", icon: Wifi },
      { name: "Networks", href: "/demo/admin/networks", icon: Network },
      { name: "RADIUS", href: "/demo/admin/radius", icon: Key },
      { name: "OLT", href: "/demo/admin/olt", icon: Server },
      { name: "ONU Devices", href: "/demo/admin/onu", icon: Box },
    ],
  },
  {
    title: "Finance",
    items: [
      { name: "Invoices", href: "/demo/admin/invoices", icon: Receipt },
      { name: "Payments", href: "/demo/admin/payments", icon: CreditCard },
      { name: "Vouchers", href: "/demo/admin/vouchers", icon: QrCode },
      { name: "Reports", href: "/demo/admin/analytics", icon: TrendingUp },
    ],
  },
  {
    title: "More",
    items: [
      { name: "Hotspot", href: "/demo/admin/hotspot", icon: Radio },
      { name: "SMS", href: "/demo/admin/sms", icon: MessageSquare },
      { name: "Loyalty", href: "/demo/admin/loyalty", icon: Gift },
      { name: "Settings", href: "/demo/admin/settings", icon: Settings },
    ],
  },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────

function DemoSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
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
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">Demo ISP</p>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
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
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                        ${active
                          ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-medium"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      onClick={onClose}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
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

export default function DemoAdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const statCards = [
    {
      title: "Total Customers",
      value: "483",
      change: "+12 this week",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Monthly Revenue",
      value: "KSh 312,000",
      change: "+8.0% vs last month",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/40",
    },
    {
      title: "Active Services",
      value: "461",
      change: "95.4% of total",
      trend: "up",
      icon: UserCheck,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      title: "Online Routers",
      value: "14 / 16",
      change: "2 need attention",
      trend: "warn",
      icon: Server,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DemoSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
            <h1 className="font-semibold text-sm">Dashboard</h1>
          </div>
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-xs">
            Demo Mode — No real data
          </Badge>
          <div className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span>
          </div>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-600 text-white text-xs">DA</AvatarFallback>
          </Avatar>
        </header>

        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* Page heading */}
          <div>
            <h2 className="text-2xl font-bold">Good morning, Demo Admin 👋</h2>
            <p className="text-muted-foreground text-sm">Here's what's happening with your ISP today — April 18, 2026</p>
          </div>

          {/* Stat cards */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.title} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    {card.trend === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {card.trend === "warn" && <AlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.title}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">{card.change}</p>
                </Card>
              )
            })}
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Revenue chart */}
            <Card className="lg:col-span-2 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Revenue vs Expenses</h3>
                  <p className="text-xs text-muted-foreground">Last 7 months</p>
                </div>
                <Badge variant="outline" className="text-green-600 text-xs">+8.0% MoM</Badge>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => `KSh ${Number(v).toLocaleString()}`} />
                  <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Plan distribution */}
            <Card className="p-5">
              <div className="mb-4">
                <h3 className="font-semibold">Plan Distribution</h3>
                <p className="text-xs text-muted-foreground">483 active customers</p>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {planDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} customers`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {planDistribution.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-muted-foreground">{p.name}</span>
                    </div>
                    <span className="font-medium">{p.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Customer growth */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Customer Growth</h3>
                <p className="text-xs text-muted-foreground">Active customers vs churned per month</p>
              </div>
              <Badge variant="outline" className="text-blue-600 text-xs">+32 net this month</Badge>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="active" name="Active" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="churned" name="Churned" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Bottom grid */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Recent customers */}
            <Card className="lg:col-span-2 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Customers</h3>
                <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
                  <Link href="/demo/admin/users">View all <ArrowRight className="w-3 h-3" /></Link>
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left pb-2 font-medium">Customer</th>
                      <th className="text-left pb-2 font-medium">Plan</th>
                      <th className="text-left pb-2 font-medium">Status</th>
                      <th className="text-right pb-2 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {recentCustomers.map((c) => (
                      <tr key={c.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-slate-700">
                                {c.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-xs">{c.name}</p>
                              <p className="text-[10px] text-muted-foreground">{c.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">{c.plan}</td>
                        <td className="py-2.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${c.status === "ACTIVE" ? "text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30" : "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30"}`}
                          >
                            {c.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right text-xs font-medium">
                          {c.balance === "0.00" ? (
                            <span className="text-green-600">Paid</span>
                          ) : (
                            <span className="text-red-500">KSh {c.balance}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Side column */}
            <div className="space-y-4">
              {/* Recent payments */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Recent Payments</h3>
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  {recentPayments.map((p) => (
                    <div key={p.ref} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">{p.customer}</p>
                        <p className="text-[10px] text-muted-foreground">{p.time} · {p.method}</p>
                      </div>
                      <span className="text-xs font-bold text-green-600">+{p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Network alerts */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Network Alerts</h3>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-2.5">
                  {networkAlerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {a.type === "error" && <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />}
                      {a.type === "warning" && <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                      {a.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />}
                      {a.type === "info" && <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-[11px] leading-tight">{a.message}</p>
                        <p className="text-[10px] text-muted-foreground">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Demo notice */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Demo environment — read-only</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                All data shown is for demonstration only. No real customers or transactions. 
                <Link href="/demo" className="underline ml-1">← Back to demo home</Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
