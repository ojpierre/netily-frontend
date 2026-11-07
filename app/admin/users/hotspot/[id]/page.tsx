"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  History,
  KeyRound,
  Loader2,
  MoreVertical,
  Phone,
  Receipt,
  RefreshCw,
  Router as RouterIcon,
  Send,
  Signal,
  Smartphone,
  Trash2,
  Wifi,
  Zap,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { ActiveSubscription } from "@/lib/types"

// ============================================================
// ANIMATION VARIANTS — same language as the user detail page
// ============================================================
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.02 } },
}

const itemVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
}

const cardVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
}

const tabPanelMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
}

// Helper function for time remaining formatting
function formatTimeRemaining(expiryDate: string | Date): { label: string; isCritical: boolean; isExpired: boolean } {
  const target = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate
  const diffMs = target.getTime() - Date.now()

  if (diffMs <= 0) {
    const pastMs = Math.abs(diffMs)
    const days = Math.floor(pastMs / 86400000)
    if (days > 0) return { label: `${days}d ago`, isCritical: true, isExpired: true }
    const hours = Math.floor(pastMs / 3600000)
    if (hours > 0) return { label: `${hours}h ago`, isCritical: true, isExpired: true }
    const minutes = Math.floor(pastMs / 60000)
    return { label: `${minutes}m ago`, isCritical: true, isExpired: true }
  }

  const days = Math.floor(diffMs / 86400000)
  const hours = Math.floor((diffMs % 86400000) / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)

  if (days >= 1) {
    return { label: hours > 0 ? `${days}d ${hours}h left` : `${days}d left`, isCritical: false, isExpired: false }
  }
  if (hours >= 1) {
    return { label: `${hours}h ${minutes}m left`, isCritical: true, isExpired: false }
  }
  return { label: `${minutes}m left`, isCritical: true, isExpired: false }
}

// Small reusable field row (same treatment as the user detail page)
function FieldRow({
  label,
  value,
  mono = false,
  copyValue,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  copyValue?: string
}) {
  return (
    <div className="group flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className={`font-semibold text-foreground truncate text-sm ${mono ? "font-mono tabular-nums tracking-tight text-[13px]" : ""}`}>
          {value ?? "—"}
        </p>
      </div>
      {copyValue && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            navigator.clipboard.writeText(copyValue)
            toast.success("Copied")
          }}
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  )
}

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
      <Icon className="w-4 h-4" />
      {children}
    </CardTitle>
  )
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center py-10 text-muted-foreground">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-50" />
      <p>{text}</p>
    </div>
  )
}

function Pager({
  page,
  total,
  onChange,
  disabled,
}: {
  page: number
  total: number
  onChange: (p: number) => void
  disabled?: boolean
}) {
  if (total <= 1) return null
  return (
    <div className="flex justify-between items-center pt-3">
      <Button variant="outline" size="sm" disabled={page === 1 || disabled} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-muted-foreground font-mono">
        {page} / {total}
      </span>
      <Button variant="outline" size="sm" disabled={page >= total || disabled} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  )
}

const nativeInputClass =
  "w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:[color-scheme:dark]"

export default function HotspotClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsTotal, setSessionsTotal] = useState(0)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsTotalPages, setSessionsTotalPages] = useState(1)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [extending, setExtending] = useState(false)
  const [extendMode, setExtendMode] = useState<"duration" | "date">("duration")
  const [extendForm, setExtendForm] = useState({ duration_amount: 1, duration_unit: "HOURS" as "MINUTES" | "HOURS" | "DAYS" })
  const [extendManualDate, setExtendManualDate] = useState("")
  const [extendManualTime, setExtendManualTime] = useState("23:59")
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsSummary, setPaymentsSummary] = useState({ total_payments: 0, completed_count: 0, completed_total: 0 })
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1)
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsLoaded, setPaymentsLoaded] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const loadClient = useCallback(async () => {
    try {
      setLoading(true)
      const res = await adminApi.getHotspotClientSessions(clientId, { page: 1, page_size: 15 })
      setClient(res.client)
      setSessions(res.sessions)
      setSessionsTotal(res.count)
      setSessionsTotalPages(res.total_pages)
    } catch (err) {
      toast.error("Failed to load client details")
    } finally {
      setLoading(false)
    }
  }, [clientId])

  const loadSessions = async (page: number) => {
    try {
      setSessionsLoading(true)
      const res = await adminApi.getHotspotClientSessions(clientId, { page, page_size: 15 })
      setSessions(res.sessions)
      setSessionsPage(page)
    } catch (err) {
      toast.error("Failed to load sessions")
    } finally {
      setSessionsLoading(false)
    }
  }

  const loadPayments = async (page: number) => {
    try {
      setPaymentsLoading(true)
      const res = await adminApi.getHotspotClientPayments(clientId, { page, page_size: 15 })
      setPayments(res.results)
      setPaymentsSummary(res.summary)
      setPaymentsPage(page)
      setPaymentsTotalPages(res.total_pages || 1)
      setPaymentsLoaded(true)
    } catch (err) {
      toast.error("Failed to load payments")
    } finally {
      setPaymentsLoading(false)
    }
  }

  const loadActiveSubscription = useCallback(async () => {
    try {
      const res = await adminApi.getActiveSubscriptions?.()
      if (res?.hotspot) {
        const found = res.hotspot.find((h: any) => h.client_id === clientId)
        if (found) setActiveSubscription(found)
      }
    } catch {}
  }, [clientId])

  useEffect(() => {
    loadClient()
    loadActiveSubscription()
  }, [loadClient, loadActiveSubscription])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === "sessions" && sessions.length === 0) loadSessions(1)
    if (tab === "payments" && !paymentsLoaded) loadPayments(1)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await adminApi.deleteHotspotClient(clientId)
      toast.success("Client deleted")
      router.push("/admin/users?tab=hotspot")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  const handleExtend = async () => {
    if (!activeSubscription?.session_id) {
      toast.error("No active session to extend")
      return
    }
    try {
      setExtending(true)
      let payload: any = {}
      if (extendMode === "date" && extendManualDate) {
        const iso = `${extendManualDate}T${extendManualTime}:00`
        if (new Date(iso) <= new Date()) { toast.error("Date must be in the future"); return }
        payload.expiry_date = new Date(iso).toISOString()
      } else {
        payload.duration_amount = extendForm.duration_amount
        payload.duration_unit = extendForm.duration_unit
      }
      const result = await adminApi.extendHotspotSession(activeSubscription.session_id, payload)
      toast.success(result.message || "Session extended")
      setShowExtendDialog(false)
      loadActiveSubscription()
    } catch (err: any) {
      toast.error(err.message || "Failed to extend")
    } finally {
      setExtending(false)
    }
  }

  const handleSendSms = async () => {
    if (!activeSubscription?.phone && !client?.canonical_phone) return
    const phone = activeSubscription?.phone || client?.canonical_phone
    const username = client?.canonical_username || ""
    try {
      await adminApi.sendSMS({ recipient: phone, message: `Your hotspot access code: ${username}` })
      toast.success("SMS sent")
    } catch (err: any) {
      toast.error(err.message || "Failed to send SMS")
    }
  }

  if (loading) {
    return (
      <div className="admin-theme-route p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-14 w-14 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="admin-theme-route p-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <p className="mt-4 text-muted-foreground">Client not found.</p>
      </div>
    )
  }

  const isActive = activeSubscription?.is_active_sub ?? false
  const username = client.canonical_username || ""
  const expiryDate = activeSubscription?.expiry_date ? new Date(activeSubscription.expiry_date) : null
  const timeRemaining = expiryDate ? formatTimeRemaining(expiryDate) : null
  const phone = activeSubscription?.phone || client.canonical_phone || ""
  const canExtend = isActive && !!activeSubscription?.session_id

  const stats = [
    { label: "Sessions", value: String(client.total_sessions ?? 0), sub: "Total connections", valueClass: "text-foreground" },
    { label: "Lifetime Spend", value: `KES ${Number(client.total_spend || 0).toLocaleString()}`, sub: "All payments", valueClass: "text-emerald-600 dark:text-emerald-400" },
    {
      label: "Time Left",
      value: timeRemaining ? (timeRemaining.isExpired ? "Expired" : timeRemaining.label.replace(" left", "")) : "—",
      sub: expiryDate ? expiryDate.toLocaleDateString() : "No subscription",
      valueClass: timeRemaining?.isExpired ? "text-destructive" : timeRemaining?.isCritical ? "text-warning" : "text-foreground",
    },
    { label: "Last Seen", value: client.last_seen_at ? new Date(client.last_seen_at).toLocaleDateString() : "—", sub: "Last activity", valueClass: "text-foreground" },
  ]

  const actions = [
    ...(canExtend
      ? [{
          key: "extend",
          icon: Calendar,
          tone: "bg-primary/10 text-primary",
          title: "Extend Session",
          desc: "Add more time to current subscription",
          onClick: () => setShowExtendDialog(true),
        }]
      : []),
    {
      key: "sms",
      icon: Send,
      tone: "bg-success/15 text-success",
      title: "Send Access Code via SMS",
      desc: phone || "No phone on file",
      onClick: handleSendSms,
    },
    {
      key: "copy",
      icon: Copy,
      tone: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
      title: "Copy Credentials",
      desc: username,
      mono: true,
      onClick: () => copyToClipboard(username, "Credentials"),
    },
  ]

  return (
    <motion.div
      className="admin-theme-route space-y-6 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ══════════════ Header ══════════════ */}
      <motion.div variants={cardVariants}>
        <Card className="rounded-lg border-border bg-card shadow-none">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div className="relative h-14 w-14 shrink-0">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Smartphone className="w-6 h-6" />
                </div>
                {isActive && (
                  <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-success" aria-label="Active" />
                )}
              </div>

              <div className="flex-1 min-w-[220px]">
                <p className="text-xs font-medium text-muted-foreground">Hotspot Client #{clientId}</p>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mt-0.5 font-mono">{username}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {isActive ? (
                    <Badge variant="outline" className="bg-success/15 text-success border-success/30 rounded-lg">
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 rounded-lg">Expired</Badge>
                  )}
                  <Badge variant="outline" className="rounded-lg border-pink-300 dark:border-pink-800 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20">
                    Hotspot
                  </Badge>
                  {activeSubscription?.router && (
                    <Badge variant="outline" className="rounded-lg gap-1 text-muted-foreground">
                      <RouterIcon className="w-3 h-3" />
                      {activeSubscription.router}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3" /> {client.canonical_phone || "No phone"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Signal className="w-3 h-3" /> {client.total_sessions} sessions
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={loadClient}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                {canExtend && (
                  <Button variant="outline" size="sm" onClick={() => setShowExtendDialog(true)}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Extend
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" aria-label="More client actions">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem className="rounded-lg" onClick={handleSendSms}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Access Code
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive rounded-lg"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Client
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ══════════════ Stat strip ══════════════ */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-2 divide-x divide-y divide-border rounded-lg border border-border bg-card md:grid-cols-4 md:divide-y-0"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants} className="min-w-0 p-4 sm:p-5">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className={`font-mono text-xl font-bold leading-none tabular-nums sm:text-2xl truncate ${stat.valueClass}`}>
              {stat.value}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{stat.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ══════════════ Tabs ══════════════ */}
      <motion.div variants={cardVariants}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg p-1 sm:w-auto">
            <TabsTrigger value="overview" className="gap-2 rounded-lg">
              <Wifi className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2 rounded-lg">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2 rounded-lg">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-2 rounded-lg">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
          </TabsList>

          {/* ══════════════ OVERVIEW ══════════════ */}
          <TabsContent value="overview" className="mt-6">
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-4">
              {/* Subscription */}
              <motion.div variants={cardVariants}>
                <Card className="h-full rounded-lg border-border bg-card shadow-none">
                  <CardHeader className="pb-3 pt-5">
                    <SectionTitle icon={Clock}>Subscription</SectionTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-5">
                    <div className="rounded-lg border border-primary/15 bg-primary/5 p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-foreground">{activeSubscription?.plan_name || "No active plan"}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {expiryDate ? `Until ${expiryDate.toLocaleDateString()}` : "—"}
                          </p>
                        </div>
                        {isActive ? (
                          <Badge className="bg-success/15 text-success rounded-lg border-0">Active</Badge>
                        ) : (
                          <Badge className="bg-destructive/15 text-destructive rounded-lg border-0">Expired</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <FieldRow label="Expires" value={expiryDate ? expiryDate.toLocaleString() : "—"} mono />
                      {timeRemaining && (
                        <div className="flex items-center justify-between py-2.5 border-b border-border">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Time Left</p>
                          <Badge
                            className={`rounded-lg border-0 ${
                              timeRemaining.isExpired
                                ? "bg-destructive/15 text-destructive"
                                : timeRemaining.isCritical
                                ? "bg-warning/15 text-warning"
                                : "bg-success/15 text-success"
                            }`}
                          >
                            {timeRemaining.isExpired ? "Expired" : timeRemaining.label}
                          </Badge>
                        </div>
                      )}
                      <FieldRow label="Router" value={activeSubscription?.router || "—"} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Credentials */}
              <motion.div variants={cardVariants}>
                <Card className="h-full rounded-lg border-border bg-card shadow-none">
                  <CardHeader className="pb-3 pt-5">
                    <SectionTitle icon={KeyRound}>Network Credentials</SectionTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-5">
                    <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Username / Access Code</p>
                        <p className="font-mono text-sm tabular-nums tracking-tight text-foreground truncate">{username}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl h-8 w-8 transition-all duration-200 active:scale-95"
                        onClick={() => copyToClipboard(username, "Username")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Password</p>
                        <p className={`font-mono text-sm tabular-nums tracking-tight text-foreground truncate ${!showPassword ? "blur-sm select-none" : ""}`}>
                          {showPassword ? username : "••••••••"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-8 w-8 transition-all duration-200 active:scale-95"
                          onClick={() => setShowPassword((v) => !v)}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-8 w-8 transition-all duration-200 active:scale-95"
                          onClick={() => copyToClipboard(username, "Password")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground pt-1">
                      Hotspot clients log in with their access code as both username and password.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Identity */}
              <motion.div variants={cardVariants}>
                <Card className="h-full rounded-lg border-border bg-card shadow-none">
                  <CardHeader className="pb-3 pt-5">
                    <SectionTitle icon={Phone}>Identity</SectionTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 pb-5">
                    <FieldRow label="Phone" value={client.canonical_phone || "—"} mono copyValue={client.canonical_phone || undefined} />
                    <FieldRow label="Access Code" value={username} mono copyValue={username || undefined} />
                    <FieldRow label="Last Seen" value={client.last_seen_at ? new Date(client.last_seen_at).toLocaleString() : "—"} mono />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Analytics */}
              <motion.div variants={cardVariants}>
                <Card className="h-full rounded-lg border-border bg-card shadow-none">
                  <CardHeader className="pb-3 pt-5">
                    <SectionTitle icon={Signal}>Analytics</SectionTitle>
                  </CardHeader>
                  <CardContent className="pb-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border px-4 py-3">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Total Sessions</p>
                        <p className="text-2xl font-bold font-mono tabular-nums text-foreground mt-1">{client.total_sessions}</p>
                      </div>
                      <div className="rounded-xl border border-border px-4 py-3">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Lifetime Spend</p>
                        <p className="text-2xl font-bold font-mono tabular-nums text-foreground mt-1">
                          {Number(client.total_spend || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">KES</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* ══════════════ SESSIONS ══════════════ */}
          <TabsContent value="sessions" className="mt-6">
            <motion.div {...tabPanelMotion}>
              <Card className="rounded-lg border-border bg-card shadow-none">
                <CardHeader className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Session History</CardTitle>
                      <CardDescription>{sessionsTotal} RADIUS sessions</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => loadSessions(sessionsPage)} disabled={sessionsLoading}>
                      <RefreshCw className={`w-4 h-4 ${sessionsLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-5">
                  {sessionsLoading && sessions.length === 0 ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                    </div>
                  ) : sessions.length === 0 ? (
                    <EmptyState icon={Signal} text="No sessions recorded" />
                  ) : (
                    <>
                      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                        {sessions.map((s: any) => (
                          <motion.div
                            key={s.id}
                            variants={itemVariants}
                            className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-foreground">
                                  {s.mac_address || s.ip_address || "—"}
                                </span>
                                {s.is_active && (
                                  <Badge className="bg-success/15 text-success text-xs rounded-lg border-0 gap-1">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                    </span>
                                    LIVE
                                  </Badge>
                                )}
                              </div>
                              <span className="font-bold font-mono text-foreground">{s.data_total}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                              <div>
                                <p className="font-semibold uppercase tracking-wide text-[9px]">Started</p>
                                <p>{s.start_time ? new Date(s.start_time).toLocaleString() : "—"}</p>
                              </div>
                              <div>
                                <p className="font-semibold uppercase tracking-wide text-[9px]">Duration</p>
                                <p className="font-mono">{s.duration}</p>
                              </div>
                              <div>
                                <p className="font-semibold uppercase tracking-wide text-[9px]">Router</p>
                                <p>{s.router || "—"}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                      <Pager page={sessionsPage} total={sessionsTotalPages} onChange={loadSessions} disabled={sessionsLoading} />
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ══════════════ PAYMENTS ══════════════ */}
          <TabsContent value="payments" className="mt-6">
            <motion.div {...tabPanelMotion} className="space-y-4">
              <div className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-card">
                {[
                  { label: "Total Attempts", value: paymentsSummary.total_payments },
                  { label: "Completed", value: paymentsSummary.completed_count },
                  { label: "Total Paid", value: `KES ${paymentsSummary.completed_total.toLocaleString()}` },
                ].map((s) => (
                  <div key={s.label} className="p-4 text-center">
                    <p className="text-xl font-bold font-mono tabular-nums text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <Card className="rounded-lg border-border bg-card shadow-none">
                <CardHeader className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>All transactions for this client</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => loadPayments(paymentsPage)} disabled={paymentsLoading}>
                      <RefreshCw className={`w-4 h-4 ${paymentsLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-5">
                  {paymentsLoading && payments.length === 0 ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                    </div>
                  ) : payments.length === 0 ? (
                    <EmptyState icon={Receipt} text="No payments recorded" />
                  ) : (
                    <>
                      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                        {payments.map((p: any) => {
                          const st = String(p.status || "").toUpperCase()
                          const badge =
                            st === "COMPLETED" ? "bg-success/15 text-success"
                            : st === "FAILED" || st === "CANCELLED" ? "bg-destructive/15 text-destructive"
                            : "bg-warning/15 text-warning"
                          return (
                            <motion.div
                              key={p.id}
                              variants={itemVariants}
                              className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold font-mono text-foreground">
                                    {p.currency} {Number(p.amount).toLocaleString()}
                                  </span>
                                  <Badge className={`${badge} text-xs rounded-lg border-0`}>
                                    {st.charAt(0) + st.slice(1).toLowerCase()}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {p.payment_date ? new Date(p.payment_date).toLocaleString() : "—"}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                <div>
                                  <p className="font-semibold uppercase tracking-wide text-[9px]">Receipt</p>
                                  <p className="font-mono text-foreground">{p.mpesa_receipt || "—"}</p>
                                </div>
                                <div>
                                  <p className="font-semibold uppercase tracking-wide text-[9px]">Plan</p>
                                  <p>{p.plan_name || "—"}</p>
                                </div>
                                <div>
                                  <p className="font-semibold uppercase tracking-wide text-[9px]">Phone</p>
                                  <p className="font-mono">{p.payer_phone || "—"}</p>
                                </div>
                              </div>
                              {p.failure_reason && st !== "COMPLETED" && (
                                <p className="text-xs text-destructive mt-2">{p.failure_reason}</p>
                              )}
                            </motion.div>
                          )
                        })}
                      </motion.div>
                      <Pager page={paymentsPage} total={paymentsTotalPages} onChange={loadPayments} disabled={paymentsLoading} />
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ══════════════ ACTIONS ══════════════ */}
          <TabsContent value="actions" className="mt-6">
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2 max-w-2xl">
              {actions.map(({ key, icon: Icon, tone, title, desc, mono, onClick }: any) => (
                <motion.button
                  key={key}
                  variants={itemVariants}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onClick}
                  className="w-full flex items-center gap-4 px-4 py-4 bg-card text-foreground rounded-xl border border-border hover:border-primary/30 hover:bg-muted/40 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className={`text-xs text-muted-foreground truncate ${mono ? "font-mono" : ""}`}>{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </motion.button>
              ))}

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowDeleteDialog(true)}
                className="w-full flex items-center gap-4 px-4 py-4 bg-card rounded-xl border border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5 transition-colors group mt-4"
              >
                <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-destructive">Delete Client</p>
                  <p className="text-xs text-muted-foreground">Permanently removes RADIUS credentials</p>
                </div>
                <ChevronRight className="w-4 h-4 text-destructive/50 transition-transform group-hover:translate-x-0.5" />
              </motion.button>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="admin-theme-dialog rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Hotspot Client</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong className="font-mono text-foreground">{username}</strong> and their RADIUS credentials. Cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl transition-all duration-200 active:scale-95" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl transition-all duration-200 active:scale-95" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : <><Trash2 className="w-4 h-4 mr-2" />Delete Permanently</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="admin-theme-dialog rounded-2xl">
          <DialogHeader>
            <DialogTitle>Extend Session</DialogTitle>
            <DialogDescription>
              <span className="font-mono">{username}</span> — {activeSubscription?.plan_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["duration", "date"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setExtendMode(mode)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    extendMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {mode === "duration" ? "Add Duration" : "Set Expiry"}
                </button>
              ))}
            </div>

            {extendMode === "duration" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <Input
                    type="number"
                    min={1}
                    value={extendForm.duration_amount}
                    onChange={(e) => setExtendForm((f) => ({ ...f, duration_amount: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Unit</Label>
                  <Select
                    value={extendForm.duration_unit}
                    onValueChange={(v: "MINUTES" | "HOURS" | "DAYS") => setExtendForm((f) => ({ ...f, duration_unit: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINUTES">Minutes</SelectItem>
                      <SelectItem value="HOURS">Hours</SelectItem>
                      <SelectItem value="DAYS">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <input
                    type="date"
                    value={extendManualDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setExtendManualDate(e.target.value)}
                    className={nativeInputClass}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Time</Label>
                  <input
                    type="time"
                    value={extendManualTime}
                    onChange={(e) => setExtendManualTime(e.target.value)}
                    className={nativeInputClass}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl transition-all duration-200 active:scale-95" onClick={() => setShowExtendDialog(false)} disabled={extending}>
              Cancel
            </Button>
            <Button className="rounded-xl transition-all duration-200 active:scale-95" onClick={handleExtend} disabled={extending}>
              {extending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extending...</> : <><Calendar className="w-4 h-4 mr-2" />Extend</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
