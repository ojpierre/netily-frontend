"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Receipt,
  CreditCard,
  AlertCircle,
  Info,
  FileText,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { adminApi } from "@/lib/admin-api"
import { formatDistanceToNow } from "date-fns"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemNotification {
  id: number
  title: string
  message: string
  notification_type: string
  read: boolean
  created_at: string
}

interface InvoiceNotif {
  id: number
  invoice_number: string
  customer_name: string
  amount: number
  due_date: string
  status: string
  created_at: string
}

interface PaymentNotif {
  id: number
  reference: string
  customer_name: string
  amount: number
  payment_method: string
  status: string
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

function notifIcon(type: string) {
  switch (type) {
    case "invoice":
    case "invoice_generated":
      return <FileText className="w-4 h-4 text-primary" />
    case "payment":
    case "payment_received":
      return <CreditCard className="w-4 h-4 text-emerald-500" />
    case "receipt":
      return <Receipt className="w-4 h-4 text-violet-500" />
    case "alert":
    case "warning":
      return <AlertCircle className="w-4 h-4 text-warning" />
    default:
      return <Info className="w-4 h-4 text-slate-400" />
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
      <Bell className="w-10 h-10 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [systemNotifs, setSystemNotifs] = useState<SystemNotification[]>([])
  const [invoiceNotifs, setInvoiceNotifs] = useState<InvoiceNotif[]>([])
  const [paymentNotifs, setPaymentNotifs] = useState<PaymentNotif[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sysData, invoicesData, paymentsData] = await Promise.allSettled([
        adminApi.getSystemNotifications({ ordering: "-created_at", limit: "50" }),
        adminApi.getInvoices({ ordering: "-created_at", page_size: 20 } as any),
        adminApi.getPayments({ ordering: "-created_at", page_size: 20 }),
      ])

      if (sysData.status === "fulfilled") {
        setSystemNotifs(sysData.value?.results ?? [])
      }
      if (invoicesData.status === "fulfilled") {
        const results: any[] = invoicesData.value?.results ?? []
        setInvoiceNotifs(
          results.map((inv) => ({
            id: inv.id,
            invoice_number: inv.invoice_number ?? `INV-${inv.id}`,
            customer_name: inv.customer_name ?? inv.customer?.full_name ?? "Customer",
            amount: parseFloat(inv.total_amount ?? inv.amount ?? 0),
            due_date: inv.due_date ?? inv.created_at,
            status: inv.status ?? "pending",
            created_at: inv.created_at,
          }))
        )
      }
      if (paymentsData.status === "fulfilled") {
        const results: any[] = paymentsData.value?.results ?? []
        setPaymentNotifs(
          results.map((p) => ({
            id: p.id,
            reference: p.reference ?? p.transaction_id ?? `PAY-${p.id}`,
            customer_name: p.customer_name ?? p.customer?.full_name ?? "Customer",
            amount: parseFloat(p.amount ?? 0),
            payment_method: p.payment_method ?? "M-Pesa",
            status: p.status ?? "completed",
            created_at: p.created_at,
          }))
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await adminApi.markAllNotificationsRead()
      setSystemNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // ignore
    } finally {
      setMarkingAll(false)
    }
  }

  const handleMarkRead = async (id: number) => {
    try {
      await adminApi.markNotificationRead(id)
      setSystemNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch {
      // ignore
    }
  }

  const unreadCount = systemNotifs.filter((n) => !n.read).length

  // ── "All" combines system notifs + recent invoice + payment events ──
  const allItems: {
    id: string
    icon: React.ReactNode
    title: string
    description: string
    time: string
    read: boolean
    onRead?: () => void
  }[] = [
    ...systemNotifs.map((n) => ({
      id: `sys-${n.id}`,
      icon: notifIcon(n.notification_type),
      title: n.title,
      description: n.message,
      time: timeAgo(n.created_at),
      read: n.read,
      onRead: !n.read ? () => handleMarkRead(n.id) : undefined,
    })),
    ...invoiceNotifs.slice(0, 10).map((inv) => ({
      id: `inv-${inv.id}`,
      icon: <FileText className="w-4 h-4 text-primary" />,
      title: `Invoice ${inv.invoice_number} — ${inv.customer_name}`,
      description: `KES ${inv.amount.toLocaleString()} · Due ${inv.due_date} · ${inv.status}`,
      time: timeAgo(inv.created_at),
      read: true,
    })),
    ...paymentNotifs.slice(0, 10).map((pay) => ({
      id: `pay-${pay.id}`,
      icon: <CreditCard className="w-4 h-4 text-emerald-500" />,
      title: `Payment received — ${pay.customer_name}`,
      description: `KES ${pay.amount.toLocaleString()} via ${pay.payment_method} · ${pay.reference}`,
      time: timeAgo(pay.created_at),
      read: true,
    })),
  ].sort(() => 0) // keep insertion order (newest first from API)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-white text-xs">{unreadCount} unread</Badge>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Invoices, payments, and system alerts for your ISP
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markingAll}>
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All
            {allItems.filter((i) => !i.read).length > 0 && (
              <Badge className="ml-1 bg-destructive text-white text-xs h-4 w-4 p-0 flex items-center justify-center rounded-full">
                {allItems.filter((i) => !i.read).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* ALL */}
        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : allItems.length === 0 ? (
            <EmptyState label="No notifications yet" />
          ) : (
            <div className="space-y-2">
              {allItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                    item.read
                      ? "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                      : "border-primary/15 dark:border-blue-900 bg-primary/10 dark:bg-blue-950/30"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${item.read ? "" : "text-primary dark:text-primary/40"}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
                    {item.onRead && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={item.onRead}>
                        <CheckCheck className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* INVOICES */}
        <TabsContent value="invoices" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : invoiceNotifs.length === 0 ? (
            <EmptyState label="No invoice activity yet" />
          ) : (
            <div className="space-y-2">
              {invoiceNotifs.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.invoice_number} — {inv.customer_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Due {inv.due_date}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">KES {inv.amount.toLocaleString()}</p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        inv.status === "paid"
                          ? "border-emerald-500 text-emerald-600"
                          : inv.status === "overdue"
                          ? "border-destructive text-destructive"
                          : "border-warning text-warning"
                      }`}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* PAYMENTS */}
        <TabsContent value="payments" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : paymentNotifs.length === 0 ? (
            <EmptyState label="No payment activity yet" />
          ) : (
            <div className="space-y-2">
              {paymentNotifs.map((pay) => (
                <div
                  key={pay.id}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pay.customer_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{pay.reference} · {pay.payment_method}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-emerald-600">+ KES {pay.amount.toLocaleString()}</p>
                    <span className="text-xs text-slate-400">{timeAgo(pay.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SYSTEM */}
        <TabsContent value="system" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : systemNotifs.length === 0 ? (
            <EmptyState label="No system notifications" />
          ) : (
            <div className="space-y-2">
              {systemNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                    n.read
                      ? "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                      : "border-primary/15 dark:border-blue-900 bg-primary/10 dark:bg-blue-950/30"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{notifIcon(n.notification_type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMarkRead(n.id)}>
                        <CheckCheck className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
