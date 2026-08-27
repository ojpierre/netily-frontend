"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Trash2,
  MoreVertical,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wifi,
  Package,
  CreditCard,
  Clock,
  Activity,
  TrendingUp,
  Gift,
  Ban,
  CheckCircle,
  XCircle,
  Download,
  Send,
  RefreshCw,
  History,
  Settings,
  Signal,
  HardDrive,
  Loader2,
  Copy,
  Pencil,
  X,
  Eye,
  EyeOff,
  DollarSign,
  Shield,
  Users,
  Router as RouterIcon,
  Globe,
  Zap,
  ArrowDownToLine,
  ArrowUpFromLine,
  MessageSquareText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { adminApi } from "@/lib/admin-api"
import type { Customer, CustomerService, Payment, SupportTicket, RADIUSAccountingSession, CustomerRADIUSCredentials, IPPool, SMSMessage } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

// ============================================================
// ANIMATION VARIANTS — same language as the main Users page
// ============================================================
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

// Local types for the detail view
interface UserDetail {
  id: string
  username: string
  fullName: string
  email: string
  phone: string
  address: string
  location: string
  type: string
  status: string
  balance: number
  loyaltyPoints: number
  package: {
    name: string
    speedDown: number
    speedUp: number
    price: number
  }
  router: string
  expiryDate: string
  createdAt: string
  lastSeen: string
  pppoeUsername: string
  pppoePassword: string
  staticIp: string | null
  macAddress: string
  ipAddress: string
  totalPayments: number
  totalSessions: number
  avgSessionDuration: string
  dataUsedThisMonth: number
  dataLimitThisMonth: number
  connectionStatus: "online" | "offline"
  radiusCredentials: any | null
  billingAccountNumber: string | null
  mpesaAccountNumber: string | null
  serviceId: number | null
  serviceStatus: string
  activationDate: string | null
  joinedDate: string
}

interface SessionEntry {
  id: string
  startTime: string
  endTime: string
  duration: string
  dataUsed: string
  ipAddress: string
}

interface PaymentEntry {
  id: string
  date: string
  amount: number
  method: string
  reference: string
  status: string
}

interface TicketEntry {
  id: string
  subject: string
  status: string
  createdAt: string
}

// Map backend Customer + CustomerService to local UserDetail
function mapCustomerToUser(customer: Customer, services: CustomerService[], radiusCreds?: any): UserDetail {
  const primaryService = services.find(s => s.status?.toUpperCase() === 'ACTIVE') || services[0]
  const plan = primaryService?.plan

  const radiusCredentials = radiusCreds || (customer as any).radius_credentials || null

  const expiryDate = radiusCredentials?.expiration_date || primaryService?.expiry_date || ''

  return {
    id: (customer as any).customer_code || String(customer.id),
    username: customer.email?.split('@')[0] || (customer as any).customer_number || '',
    fullName: customer.full_name || `${customer.first_name} ${customer.last_name}`,
    email: customer.email || '',
    phone: customer.phone || customer.user?.phone_number || (customer as any).phone_number || '',
    address: customer.primary_address?.street_address || '',
    location: (customer as any).location || '',
    type: primaryService?.service_type?.toLowerCase() || 'pppoe',
    status: customer.status,
    balance: Number(customer.balance) || 0,
    loyaltyPoints: 0,
    package: {
      name: plan?.name || 'No plan',
      speedDown: plan?.speed_down || (primaryService as any)?.download_speed || 0,
      speedUp: plan?.speed_up || (primaryService as any)?.upload_speed || 0,
      price: Number(plan?.price || (plan as any)?.base_price) || 0,
    },
    router: (primaryService as any)?.router_name || primaryService?.device?.name || radiusCreds?.router_name || '',
    expiryDate,
    createdAt: customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '',
    lastSeen: primaryService?.last_seen || (primaryService as any)?.last_activity || '',
    pppoeUsername: radiusCredentials?.username || primaryService?.username || '',
    pppoePassword: radiusCredentials?.password || '',
    staticIp: radiusCredentials?.static_ip || primaryService?.ip_address || null,
    ipAddress: (primaryService as any)?.ip_address || '',
    macAddress: primaryService?.mac_address || (primaryService as any)?.mac || '',
    totalPayments: 0,
    totalSessions: 0,
    avgSessionDuration: '—',
    dataUsedThisMonth: primaryService?.data_used ? Math.round(primaryService.data_used / 1024) : 0,
    dataLimitThisMonth: primaryService?.data_limit ? Math.round(primaryService.data_limit / 1024) : 0,
    connectionStatus: 'offline' as 'online' | 'offline',
    radiusCredentials,
    billingAccountNumber: (primaryService as any)?.billing_account_number || (customer as any)?.billing_account_number || null,
    mpesaAccountNumber: (primaryService as any)?.mpesa_account_number || null,
    serviceId: primaryService?.id ?? null,
    serviceStatus: primaryService?.status?.toUpperCase() || '',
    activationDate: (primaryService as any)?.activation_date || (primaryService as any)?.activated_at || null,
    joinedDate: customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '',
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function mapSession(s: RADIUSAccountingSession): SessionEntry {
  return {
    id: String(s.id),
    startTime: s.acctstarttime ? new Date(s.acctstarttime).toLocaleString() : '',
    endTime: s.acctstoptime ? new Date(s.acctstoptime).toLocaleString() : 'Active',
    duration: s.session_duration ? formatDuration(s.session_duration) : '—',
    dataUsed: formatBytes(s.acctinputoctets + s.acctoutputoctets),
    ipAddress: s.framedipaddress || '',
  }
}

function mapPayment(p: Payment): PaymentEntry {
  return {
    id: String(p.id),
    date: p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '',
    amount: Number(p.amount) || 0,
    method: p.payment_method === 'mpesa' ? 'M-Pesa' : p.payment_method?.charAt(0).toUpperCase() + p.payment_method?.slice(1),
    reference: p.reference_number || p.mpesa_receipt || p.transaction_id || '',
    status: p.status,
  }
}

function mapTicket(t: SupportTicket): TicketEntry {
  return {
    id: t.ticket_number,
    subject: t.subject,
    status: t.status,
    createdAt: t.created_at ? new Date(t.created_at).toLocaleDateString() : '',
  }
}

// Premium Live Bandwidth Chart - Vercel style with live readout
function LiveBandwidthChart() {
  const [data, setData] = useState(
    Array.from({ length: 40 }, (_, i) => ({
      time: i,
      download: 0,
      upload: 0,
    }))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1]
        return [
          ...prev.slice(1),
          {
            time: last.time + 1,
            download: Math.max(0, last.download + (Math.random() - 0.45) * 2),
            upload: Math.max(0, last.upload + (Math.random() - 0.45) * 0.8),
          },
        ]
      })
    }, 2200)

    return () => clearInterval(interval)
  }, [])

  const currentDown = data[data.length - 1]?.download.toFixed(1) ?? '0.0'
  const currentUp = data[data.length - 1]?.upload.toFixed(1) ?? '0.0'

  return (
    <div>
      <div className="flex items-center gap-6 px-6 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          <span className="text-xs text-slate-400">Download</span>
          <span className="text-sm font-bold text-emerald-500 tabular-nums font-mono">{currentDown} Mbps</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.7)]" />
          <span className="text-xs text-slate-400">Upload</span>
          <span className="text-sm font-bold text-violet-500 tabular-nums font-mono">{currentUp} Mbps</span>
        </div>
      </div>

      <div className="h-[200px] px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="download" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="upload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 6" />
            <XAxis hide />
            <YAxis
              stroke="currentColor"
              className="text-slate-400 dark:text-slate-500"
              tick={{ fontSize: 10 }}
              width={30}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--card, #fff)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
              labelFormatter={() => ''}
              formatter={(value: number, name: string) => [`${value.toFixed(2)} Mbps`, name === 'download' ? 'Download' : 'Upload']}
            />
            <Area type="monotone" dataKey="download" stroke="#34D399" strokeWidth={2.5} fill="url(#download)" dot={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="upload" stroke="#A78BFA" strokeWidth={2.5} fill="url(#upload)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ============================================================
// Small reusable "field row" for the Identity/Connection cards —
// consistent monospace treatment for technical values
// ============================================================
function FieldRow({
  label,
  value,
  mono = false,
  copyValue,
  size = "sm",
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  copyValue?: string
  size?: "sm" | "md"
}) {
  return (
    <div className="group flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">{label}</p>
        <p
          className={`font-semibold text-slate-800 dark:text-slate-200 truncate ${
            mono ? "font-mono tabular-nums tracking-tight text-[13px]" : size === "md" ? "text-sm" : "text-sm"
          }`}
        >
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

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserDetail | null>(null)
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [tickets, setTickets] = useState<TicketEntry[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [smsHistory, setSmsHistory] = useState<SMSMessage[]>([])
  const [smsHistoryLoading, setSmsHistoryLoading] = useState(true)
  const [radiusCreds, setRadiusCreds] = useState<CustomerRADIUSCredentials | null>(null)
  const [internetCheck, setInternetCheck] = useState<{
    status: 'green' | 'yellow' | 'red' | 'loading' | 'none'
    label: string
    detail: string
    pool?: string
    routerName?: string
  }>({ status: 'loading', label: 'Checking...', detail: '' })
  const [deleting, setDeleting] = useState(false)
  const [editingBilling, setEditingBilling] = useState(false)
  const [billingNumberEdit, setBillingNumberEdit] = useState("")
  const [savingBilling, setSavingBilling] = useState(false)

  const [showPassword, setShowPassword] = useState(false)

  const [showSmsDialog, setShowSmsDialog] = useState(false)
  const [smsMessage, setSmsMessage] = useState("")
  const [sendingSms, setSendingSms] = useState(false)

  // ============================================================
  // NEW: full-message viewer for SMS history
  // ============================================================
  const [viewingSms, setViewingSms] = useState<any | null>(null)
  const [showSmsViewDialog, setShowSmsViewDialog] = useState(false)

  const handleViewSms = (sms: any) => {
    setViewingSms(sms)
    setShowSmsViewDialog(true)
  }

  const userId = Number(params.id)

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)

      const [customer, servicesRes, radiusListRes] = await Promise.all([
        adminApi.getCustomer(userId),
        adminApi.getCustomerServices(userId).catch((err) => {
          console.warn('Failed to load services:', err)
          return [] as CustomerService[]
        }),
        adminApi.getRADIUSCredentials({ customer: String(userId), page_size: '1' }).catch((err) => {
          console.warn('Failed to load RADIUS creds:', err)
          return { results: [] } as any
        }),
      ])

      if (!customer) {
        setLoading(false)
        return
      }

      const services: CustomerService[] = servicesRes || []
      const credSummary = radiusListRes?.results?.[0] || null
      const mappedUser = mapCustomerToUser(customer, services, credSummary)
      const pppoeUser = mappedUser.pppoeUsername || credSummary?.username

      const [paymentsRes, ticketsRes, sessionsRes, credDetail, poolRes, smsRes] = await Promise.all([
        adminApi.getPayments({ customer: String(userId), page_size: '20' })
          .catch((err) => { console.warn('Failed to load payments:', err); return { results: [] } as any }),
        adminApi.getTickets({ customer_id: String(userId), page_size: '20' })
          .catch((err) => { console.warn('Failed to load tickets:', err); return { results: [] } as any }),
        pppoeUser
          ? adminApi.getRADIUSSessions({ username: pppoeUser, page_size: '20' })
              .catch((err) => { console.warn('Failed to load RADIUS sessions:', err); return { results: [] } as any })
          : Promise.resolve({ results: [] } as any),
        credSummary?.id
          ? adminApi.getRADIUSCredential(String(credSummary.id)).catch(() => credSummary)
          : Promise.resolve(null),
        credSummary?.router && credSummary?.ip_pool
          ? adminApi.getIPPools({ router_id: String(credSummary.router), name: credSummary.ip_pool }).catch(() => null)
          : Promise.resolve(null),
        adminApi.getSMSMessages({ customer: String(userId), page_size: '100' })
          .catch((err) => { console.warn('Failed to load SMS history:', err); return { results: [] } as any }),
      ])

      setPaymentsLoading(false)
      setTicketsLoading(false)
      setSessionsLoading(false)
      setSmsHistoryLoading(false)

      setSmsHistory(smsRes.results || [])

      const paymentsList = paymentsRes.results || []
      mappedUser.totalPayments = paymentsList.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
      setPayments(paymentsList.map(mapPayment))

      setTickets((ticketsRes.results || []).map(mapTicket))

      if (sessionsRes?.results?.length) {
        setSessions(sessionsRes.results.map(mapSession))
        mappedUser.totalSessions = sessionsRes.results.length
        const latestSession = sessionsRes.results[0]
        if (!latestSession.acctstoptime) {
          mappedUser.connectionStatus = 'online'
          mappedUser.ipAddress = latestSession.framedipaddress || mappedUser.ipAddress
          mappedUser.macAddress = latestSession.callingstationid || mappedUser.macAddress
          mappedUser.router = (latestSession as any).router_name || latestSession.nasipaddress || mappedUser.router
          mappedUser.lastSeen = 'Now'
        } else {
          mappedUser.connectionStatus = 'offline'
          mappedUser.lastSeen = new Date(latestSession.acctstoptime).toLocaleString()
          mappedUser.macAddress = latestSession.callingstationid || mappedUser.macAddress
          mappedUser.router = (latestSession as any).router_name || latestSession.nasipaddress || mappedUser.router
        }
      } else {
        setSessions([])
      }

      const finalCred = credDetail || credSummary
      mappedUser.radiusCredentials = finalCred
      mappedUser.pppoePassword = finalCred?.password || mappedUser.pppoePassword
      setRadiusCreds(finalCred)

      setUser(mappedUser)

      if (!finalCred) {
        setInternetCheck({ status: 'none', label: 'No RADIUS', detail: 'No RADIUS credentials found for this customer.' })
      } else if (!finalCred.is_enabled) {
        setInternetCheck({
          status: 'red',
          label: 'Disabled',
          detail: `RADIUS account disabled: ${finalCred.disabled_reason || 'No reason given'}`,
          routerName: finalCred.router_name,
        })
      } else if (!finalCred.ip_pool) {
        setInternetCheck({
          status: 'yellow',
          label: 'No Pool',
          detail: 'RADIUS credentials exist but no IP pool (Framed-Pool) is assigned. The router will use its default pool.',
          routerName: finalCred.router_name,
        })
      } else {
        const poolValid = finalCred.router ? (poolRes?.results?.length || 0) > 0 : true
        setInternetCheck(
          poolValid
            ? {
                status: 'green',
                label: 'Connected',
                detail: `Pool "${finalCred.ip_pool}" is configured${finalCred.router_name ? ` on ${finalCred.router_name}` : ''}. RADIUS will assign an IP from this pool.`,
                pool: finalCred.ip_pool,
                routerName: finalCred.router_name,
              }
            : {
                status: 'red',
                label: 'Pool Mismatch',
                detail: `Pool "${finalCred.ip_pool}" does not exist on router ${finalCred.router_name || 'Unknown'}. Customer will NOT get an IP address.`,
                pool: finalCred.ip_pool,
                routerName: finalCred.router_name,
              }
        )
      }
    } catch (err) {
      console.error('Failed to load user data:', err)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchUserData()
  }, [userId, fetchUserData])

  const handleRefresh = async () => {
    await fetchUserData()
    toast.success('Data refreshed')
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await adminApi.deleteCustomer(userId)
      toast.success('User deleted successfully')
      router.push('/admin/users')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleSaveBillingNumber = async () => {
    if (!user || !billingNumberEdit.trim()) return
    try {
      setSavingBilling(true)
      const services = await adminApi.getCustomerServices(userId)
      if (!services || services.length === 0) {
        toast.error('No service found for this customer')
        return
      }
      const primaryService = services[0]
      await adminApi.updateCustomerService(
        userId,
        primaryService.id,
        { billing_account_number: billingNumberEdit.trim().toUpperCase() }
      )
      toast.success('Billing account number updated')
      setEditingBilling(false)
      setUser(prev => prev ? { ...prev, billingAccountNumber: billingNumberEdit.trim().toUpperCase() } : prev)
      await fetchUserData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update billing number')
    } finally {
      setSavingBilling(false)
    }
  }

  const handleSendSms = async () => {
    if (!user || !smsMessage.trim()) return
    try {
      setSendingSms(true)
      await adminApi.sendSMS({ recipient: user.phone, message: smsMessage.trim(), customer: userId })
      toast.success(`SMS sent to ${user.fullName}`)
      setShowSmsDialog(false)
      setSmsMessage("")
      await fetchUserData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to send SMS')
    } finally {
      setSendingSms(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/15 text-success rounded-lg border-0 font-medium">Active</Badge>
      case "expired":
        return <Badge className="bg-destructive/15 text-destructive rounded-lg border-0 font-medium">Expired</Badge>
      case "suspended":
        return <Badge className="bg-warning/15 text-warning rounded-lg border-0 font-medium">Suspended</Badge>
      default:
        return <Badge variant="outline" className="rounded-lg">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "hotspot":
        return <Badge variant="outline" className="border-primary/20 text-primary rounded-lg bg-primary/5 font-medium">Hotspot</Badge>
      case "pppoe":
        return <Badge variant="outline" className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg font-medium">PPPoE</Badge>
      case "static":
        return <Badge variant="outline" className="border-warning/20 text-warning rounded-lg bg-warning/5 font-medium">Static IP</Badge>
      default:
        return <Badge variant="outline" className="rounded-lg">{type}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || ''
    if (s === 'completed' || s === 'paid' || s === 'confirmed') {
      return <Badge className="bg-success/15 text-success rounded-lg border-0">Completed</Badge>
    } else if (s === 'pending' || s === 'processing') {
      return <Badge className="bg-warning/15 text-warning rounded-lg border-0">Pending</Badge>
    } else if (s === 'failed') {
      return <Badge variant="destructive" className="rounded-lg">Failed</Badge>
    }
    return <Badge variant="outline" className="rounded-lg">{status}</Badge>
  }

  if (loading || !user) {
    return (
      <div className="admin-theme-route admin-user-detail-route p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  // ── Simple lifecycle timeline built from data we already have ──
  const lifecycleEvents = [
    {
      icon: User,
      title: "Account created",
      subtitle: `Joined${user.location ? ` from ${user.location}` : ''}`,
      time: user.joinedDate,
      color: "bg-blue-500",
    },
    ...(sessions.length > 0
      ? [{
          icon: Wifi,
          title: "Last session",
          subtitle: "Most recent connection",
          time: sessions[0]?.startTime || '—',
          color: "bg-violet-500",
        }]
      : []),
    {
      icon: user.connectionStatus === 'online' ? Signal : Clock,
      title: user.connectionStatus === 'online' ? "Currently online" : "Currently offline",
      subtitle: user.connectionStatus === 'online' ? "Live session in progress" : `Last seen ${user.lastSeen || '—'}`,
      time: user.connectionStatus === 'online' ? 'Now' : '',
      color: user.connectionStatus === 'online' ? "bg-emerald-500" : "bg-slate-400",
      live: user.connectionStatus === 'online',
    },
  ]

  return (
    <motion.div
      className="admin-theme-route admin-user-detail-route p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ══════════════ Header ══════════════ */}
      <motion.div variants={cardVariants}>
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div className="relative w-16 h-16 shrink-0">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.5 }}
                  transition={{ duration: 0.5 }}
                  className={`absolute inset-0 rounded-2xl blur-lg ${
                    user.connectionStatus === "online" ? "bg-emerald-400" : "bg-slate-400"
                  }`}
                />
                <div className={`relative w-16 h-16 rounded-2xl ring-1 ring-white/20 shadow-lg flex items-center justify-center text-white font-black text-xl ${
                  user.connectionStatus === "online"
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/25"
                    : "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-violet-500/25"
                }`}>
                  {user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                {user.connectionStatus === "online" && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-[220px]">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold">
                  Customers / Subscribers / #{user.id}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mt-0.5">{user.fullName}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs rounded-lg bg-slate-50 dark:bg-slate-800">@{user.pppoeUsername || user.id}</Badge>
                  {user.connectionStatus === 'online' ? (
                    <Badge variant="outline" className="bg-success/15 text-success border-success/30 rounded-lg">
                      <span className="relative flex h-1.5 w-1.5 mr-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-400 rounded-lg">Offline</Badge>
                  )}
                  {getTypeBadge(user.type)}
                  {getStatusBadge(user.status)}
                  {user.router && (
                    <Badge variant="outline" className="rounded-lg gap-1 text-slate-500 dark:text-slate-400">
                      <RouterIcon className="w-3 h-3" />
                      {user.router}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  {user.phone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3" /> {user.phone}
                    </span>
                  )}
                  {user.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {user.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Member since {user.createdAt}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowSmsDialog(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  SMS
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem 
                      className="text-destructive rounded-lg"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ══════════════ Stat cards ══════════════ */}
      <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Balance",
            value: `KES ${user.balance.toLocaleString()}`,
            sub: "Current balance",
            icon: DollarSign,
            grad: "from-emerald-400 to-teal-500",
            glow: "rgba(16,185,129,0.18)",
            bar: "from-emerald-400 via-teal-400 to-cyan-400",
            valueClass: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Total Paid",
            value: `KES ${user.totalPayments.toLocaleString()}`,
            sub: "Lifetime payments",
            icon: TrendingUp,
            grad: "from-blue-400 to-indigo-500",
            glow: "rgba(59,130,246,0.15)",
            bar: "from-blue-400 via-indigo-400 to-violet-400",
            valueClass: "text-foreground",
          },
          {
            label: "Sessions",
            value: String(user.totalSessions),
            sub: "Total connections",
            icon: Activity,
            grad: "from-purple-400 to-violet-500",
            glow: "rgba(139,92,246,0.15)",
            bar: "from-purple-400 via-violet-400 to-fuchsia-400",
            valueClass: "text-foreground",
          },
          {
            label: "Loyalty Points",
            value: String(user.loyaltyPoints),
            sub: "Rewards balance",
            icon: Gift,
            grad: "from-amber-400 to-orange-500",
            glow: "rgba(245,158,11,0.15)",
            bar: "from-amber-400 via-orange-400 to-yellow-400",
            valueClass: "text-foreground",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            whileHover={{ y: -3 }}
            className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-shadow duration-300 hover:shadow-xl"
          >
            <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 80% -20%, ${stat.glow}, transparent 60%)` }} />
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.bar} opacity-80`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                <p className={`text-2xl font-extrabold leading-none font-mono tabular-nums ${stat.valueClass}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-slate-400 mt-1.5">{stat.sub}</p>
              </div>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.grad} shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ══════════════ Tabs ══════════════ */}
      <motion.div variants={cardVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 rounded-xl">
            <TabsTrigger value="overview" className="gap-2 rounded-lg">
              <User className="w-4 h-4" />
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
            <TabsTrigger value="tickets" className="gap-2 rounded-lg">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2 rounded-lg">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">SMS History</span>
              {smsHistory.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 px-1 text-[10px] rounded-full">{smsHistory.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ══════════════ OVERVIEW ══════════════ */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid md:grid-cols-3 gap-4">
              {/* Identity Card */}
              <motion.div variants={cardVariants}>
                <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 h-full">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-80" />
                  <CardHeader className="pb-3 pt-5">
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 pb-5">
                    <FieldRow label="Email" value={user.email} copyValue={user.email || undefined} />
                    <FieldRow label="Phone" value={user.phone} mono copyValue={user.phone || undefined} />
                    <FieldRow label="Address" value={user.location || user.address} copyValue={(user.location || user.address) || undefined} />
                    <FieldRow label="Member Since" value={user.createdAt} mono />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Connection Card */}
              <motion.div variants={cardVariants} className="md:col-span-2">
                <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 h-full">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 opacity-80" />
                  <CardHeader className="pb-3 pt-5">
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Signal className="w-4 h-4" />
                        Device &amp; Network
                      </span>
                      <div className="flex items-center gap-1.5">
                        {user.connectionStatus === 'online' ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 normal-case">Online</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 normal-case">Offline</span>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-5">
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { label: 'Router', value: user.router || radiusCreds?.router_name || '—', icon: RouterIcon },
                        { label: 'IP Address', value: user.ipAddress || user.staticIp || radiusCreds?.static_ip || '—', icon: Globe, mono: true },
                        { label: 'MAC Address', value: user.macAddress || '—', icon: HardDrive, mono: true },
                        { label: 'Type', value: user.type?.toUpperCase() || '—', icon: Wifi },
                      ].map(({ label, value, icon: Icon, mono }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-3">
                          <span className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </span>
                          <span className={`text-sm font-semibold text-slate-800 dark:text-slate-200 ${mono ? 'font-mono tabular-nums tracking-tight text-[13px]' : ''}`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                          <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 tracking-wide">Download</p>
                          <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">{user.package.speedDown ? `${user.package.speedDown} Mbps` : '—'}</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                          <ArrowUpFromLine className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 tracking-wide">Upload</p>
                          <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">{user.package.speedUp ? `${user.package.speedUp} Mbps` : '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Internet Health */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          internetCheck.status === 'green' ? 'bg-success/15' :
                          internetCheck.status === 'yellow' ? 'bg-warning/15' :
                          internetCheck.status === 'red' ? 'bg-destructive/15' : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          {internetCheck.status === 'green' && <CheckCircle className="w-4 h-4 text-success" />}
                          {internetCheck.status === 'yellow' && <Activity className="w-4 h-4 text-warning" />}
                          {internetCheck.status === 'red' && <XCircle className="w-4 h-4 text-destructive" />}
                          {internetCheck.status === 'loading' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                          {internetCheck.status === 'none' && <Signal className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${
                            internetCheck.status === 'green' ? 'text-success' :
                            internetCheck.status === 'yellow' ? 'text-warning' :
                            internetCheck.status === 'red' ? 'text-destructive' : 'text-slate-500'
                          }`}>{internetCheck.label}</p>
                          <p className="text-xs text-muted-foreground">{internetCheck.detail}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Subscription + Credentials + Timeline row */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-4">
              {/* Subscription Card */}
              <motion.div variants={cardVariants}>
                <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 h-full">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 opacity-80" />
                  <CardHeader className="pb-3 pt-5">
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pb-5">
                    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-foreground">{user.package.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">KES {user.package.price.toLocaleString()}/mo</p>
                        </div>
                        {getStatusBadge(user.status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Expires</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {user.expiryDate && user.package.name !== 'No plan'
                            ? new Date(user.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Time left</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {user.expiryDate && user.package.name !== 'No plan' ? (() => {
                            const diff = new Date(user.expiryDate).getTime() - Date.now()
                            if (diff <= 0) return <span className="text-destructive">Expired</span>
                            const d = Math.floor(diff / 86400000)
                            const h = Math.floor((diff % 86400000) / 3600000)
                            return d > 0 ? `${d}d ${h}h` : `${h}h`
                          })() : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">Billing Account (M-Pesa Paybill Ref)</p>
                      {editingBilling ? (
                        <div className="flex items-center gap-2">
                          <Input
                            className="flex-1 font-mono text-sm rounded-xl"
                            value={billingNumberEdit}
                            onChange={(e) => setBillingNumberEdit(e.target.value.toUpperCase())}
                            maxLength={20}
                            autoFocus
                            placeholder="Enter billing account number"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 dark:text-green-400 rounded-xl transition-all duration-200 active:scale-95"
                            onClick={handleSaveBillingNumber}
                            disabled={savingBilling}
                          >
                            {savingBilling ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl transition-all duration-200 active:scale-95"
                            onClick={() => setEditingBilling(false)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {user.billingAccountNumber ? (
                            <>
                              <code className="flex-1 font-mono font-bold text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800">
                                {user.billingAccountNumber}
                              </code>
                              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 transition-all duration-200 active:scale-95" onClick={() => { navigator.clipboard.writeText(user.billingAccountNumber!); toast.success('Copied') }}>
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 transition-all duration-200 active:scale-95" onClick={() => { setBillingNumberEdit(user.billingAccountNumber || ''); setEditingBilling(true) }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-slate-400 italic flex-1">Not assigned</p>
                              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 transition-all duration-200 active:scale-95" onClick={() => { setBillingNumberEdit(''); setEditingBilling(true) }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {user.dataLimitThisMonth > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-500">Data usage</span>
                          <span className="font-medium font-mono">{user.dataUsedThisMonth} / {user.dataLimitThisMonth} GB</span>
                        </div>
                        <Progress value={(user.dataUsedThisMonth / user.dataLimitThisMonth) * 100} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Network Credentials Card */}
              <motion.div variants={cardVariants}>
                <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 h-full">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 opacity-80" />
                  <CardHeader className="pb-3 pt-5">
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                      <Wifi className="w-4 h-4" />
                      PPPoE Credentials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pb-5">
                    {!user.pppoeUsername && user.serviceStatus === 'PENDING' ? (
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 text-sm text-orange-700 dark:text-orange-300">
                        Credentials created after activation.
                      </div>
                    ) : user.pppoeUsername ? (
                      <>
                        <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Username</p>
                            <p className="font-mono text-sm tabular-nums tracking-tight">{user.pppoeUsername}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-8 w-8 transition-all duration-200 active:scale-95"
                            onClick={() => { navigator.clipboard.writeText(user.pppoeUsername); toast.success('Username copied') }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Password</p>
                            <p className={`font-mono text-sm tabular-nums tracking-tight ${!showPassword ? 'blur-sm select-none' : ''}`}>
                              {showPassword 
                                ? (user.pppoePassword || <span className="italic text-slate-400">not loaded</span>)
                                : '••••••••'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-8 w-8 transition-all duration-200 active:scale-95"
                              onClick={() => setShowPassword(v => !v)}
                              title={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            {user.pppoePassword && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl h-8 w-8 transition-all duration-200 active:scale-95"
                                onClick={() => { navigator.clipboard.writeText(user.pppoePassword); toast.success('Password copied') }}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs pt-1">
                          <Badge variant={user.radiusCredentials?.is_enabled !== false ? "default" : "secondary"} className="text-xs rounded-lg">
                            {user.radiusCredentials?.is_enabled !== false ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <span className="text-slate-400 font-mono">{user.radiusCredentials?.connection_type || 'PPPOE'}</span>
                          {user.radiusCredentials?.synced_to_radius && (
                            <span className="text-green-600 dark:text-green-400 font-medium">✓ Synced</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No credentials found</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Lifecycle timeline */}
            <motion.div variants={cardVariants} initial="hidden" animate="show">
              <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-0">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 opacity-60" />
                <CardHeader className="pb-3 pt-5">
                  <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Subscription Lifecycle
                  </CardTitle>
                  <CardDescription>Account events from signup to now</CardDescription>
                </CardHeader>
                <CardContent className="pb-5">
                  <div className="space-y-0">
                    {lifecycleEvents.map((ev, idx) => (
                      <motion.div
                        key={ev.title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div className="relative shrink-0 mt-0.5">
                          {ev.live && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                          )}
                          <div className={`relative w-8 h-8 rounded-full ${ev.color} flex items-center justify-center text-white`}>
                            <ev.icon className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ev.title}</p>
                            <p className="text-xs text-muted-foreground">{ev.subtitle}</p>
                          </div>
                          <p className="text-xs font-mono text-slate-400 dark:text-slate-500 shrink-0">{ev.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Live Bandwidth Graph */}
            {user.connectionStatus === 'online' && user.pppoeUsername && (
              <motion.div variants={cardVariants} initial="hidden" animate="show">
                <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-0">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-80" />
                  <CardHeader className="pb-2 pt-5">
                    <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      Live Bandwidth
                      <span className="relative flex h-2 w-2 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-5">
                    <LiveBandwidthChart />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* ══════════════ SESSIONS ══════════════ */}
          <TabsContent value="sessions" className="mt-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-0">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 opacity-80" />
                <CardHeader className="pt-5">
                  <CardTitle className="flex items-center gap-2">
                    Session History
                    {user.connectionStatus === 'online' && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Recent connection sessions</CardDescription>
                </CardHeader>
                <CardContent className="pb-5">
                  {sessionsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No sessions recorded</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Data Used</TableHead>
                            <TableHead>IP Address</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell className="font-mono text-xs">{session.startTime}</TableCell>
                              <TableCell className="font-mono text-xs">{session.endTime}</TableCell>
                              <TableCell className="font-mono text-xs">{session.duration}</TableCell>
                              <TableCell className="font-mono text-xs font-semibold">{session.dataUsed}</TableCell>
                              <TableCell className="font-mono text-xs">{session.ipAddress}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ══════════════ PAYMENTS ══════════════ */}
          <TabsContent value="payments" className="mt-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-0">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-80" />
                <CardHeader className="pt-5">
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All transactions for this user</CardDescription>
                </CardHeader>
                <CardContent className="pb-5">
                  {paymentsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No payments recorded</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-mono text-xs">{payment.date}</TableCell>
                              <TableCell className="font-medium font-mono text-foreground">KSh {payment.amount.toLocaleString()}</TableCell>
                              <TableCell>{payment.method}</TableCell>
                              <TableCell className="font-mono text-xs">{payment.reference || '—'}</TableCell>
                              <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ══════════════ TICKETS ══════════════ */}
          <TabsContent value="tickets" className="mt-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-0">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 opacity-80" />
                <CardHeader className="pt-5">
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Tickets raised by this user</CardDescription>
                </CardHeader>
                <CardContent className="pb-5">
                  {ticketsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No tickets found</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ticket ID</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-mono text-xs">{ticket.id}</TableCell>
                              <TableCell>{ticket.subject}</TableCell>
                              <TableCell>
                                <Badge className={ticket.status === "open" ? "bg-primary/15 text-primary rounded-lg border-0" : "bg-success/15 text-success rounded-lg border-0"}>
                                  {ticket.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{ticket.createdAt}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ══════════════ SMS HISTORY (with full-view eye button) ══════════════ */}
          <TabsContent value="sms" className="mt-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-0">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 opacity-80" />
                <CardHeader className="pt-5">
                  <CardTitle>SMS History</CardTitle>
                  <CardDescription>All messages sent to this user — automated and manually sent</CardDescription>
                </CardHeader>
                <CardContent className="pb-5">
                  {smsHistoryLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                    </div>
                  ) : smsHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Send className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No SMS sent to this user yet</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {smsHistory.map((sms: any) => (
                            <TableRow key={sms.id} className="group">
                              <TableCell className="font-mono text-xs whitespace-nowrap">
                                {sms.sent_at ? new Date(sms.sent_at).toLocaleString() : new Date(sms.created_at).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize rounded-lg">
                                  {sms.type || sms.message_type || 'single'}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-md truncate text-sm text-slate-600 dark:text-slate-300" title={sms.message}>
                                {sms.message}
                              </TableCell>
                              <TableCell>
                                {sms.status === 'sent' || sms.status === 'delivered' ? (
                                  <Badge className="bg-success/15 text-success rounded-lg capitalize border-0">{sms.status}</Badge>
                                ) : sms.status === 'pending' ? (
                                  <Badge className="bg-warning/15 text-warning rounded-lg capitalize border-0">{sms.status}</Badge>
                                ) : (
                                  <Badge variant="destructive" className="rounded-lg capitalize">{sms.status}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleViewSms(sms)}
                                  title="View full message"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="admin-theme-dialog rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{user.fullName}</strong>? 
              This will permanently remove the customer account, all service connections, 
              RADIUS credentials, and the associated login user. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl transition-all duration-200 active:scale-95" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl transition-all duration-200 active:scale-95" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send SMS Dialog */}
      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent className="admin-theme-dialog rounded-2xl">
          <DialogHeader>
            <DialogTitle>Send SMS</DialogTitle>
            <DialogDescription>
              Send a message to {user.fullName} ({user.phone})
            </DialogDescription>
          </DialogHeader>
          <Textarea
            className="rounded-xl"
            placeholder="Type your message..."
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-xl transition-all duration-200 active:scale-95" onClick={() => setShowSmsDialog(false)} disabled={sendingSms}>
              Cancel
            </Button>
            <Button className="rounded-xl transition-all duration-200 active:scale-95" onClick={handleSendSms} disabled={sendingSms || !smsMessage.trim()}>
              {sendingSms ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />Send SMS</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════ NEW: View Full SMS Dialog ══════════════ */}
      <Dialog open={showSmsViewDialog} onOpenChange={setShowSmsViewDialog}>
        <DialogContent className="admin-theme-dialog rounded-2xl max-w-lg p-0 border-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-blue-500" />
                Full Message
              </DialogTitle>
              <DialogDescription>
                {viewingSms?.sent_at
                  ? new Date(viewingSms.sent_at).toLocaleString()
                  : viewingSms?.created_at
                  ? new Date(viewingSms.created_at).toLocaleString()
                  : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2 mt-1 mb-3 flex-wrap">
              {viewingSms?.status && (
                viewingSms.status === 'sent' || viewingSms.status === 'delivered' ? (
                  <Badge className="bg-success/15 text-success rounded-lg capitalize border-0">{viewingSms.status}</Badge>
                ) : viewingSms.status === 'pending' ? (
                  <Badge className="bg-warning/15 text-warning rounded-lg capitalize border-0">{viewingSms.status}</Badge>
                ) : (
                  <Badge variant="destructive" className="rounded-lg capitalize">{viewingSms.status}</Badge>
                )
              )}
              {(viewingSms?.type || viewingSms?.message_type) && (
                <Badge variant="outline" className="capitalize rounded-lg">{viewingSms.type || viewingSms.message_type}</Badge>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 max-h-72 overflow-y-auto">
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                {viewingSms?.message}
              </p>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  if (viewingSms?.message) {
                    navigator.clipboard.writeText(viewingSms.message)
                    toast.success('Message copied')
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button className="rounded-xl" onClick={() => setShowSmsViewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
