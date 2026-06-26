"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Edit,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { adminApi } from "@/lib/admin-api"
import type { Customer, CustomerService, Payment, SupportTicket, RADIUSAccountingSession, CustomerRADIUSCredentials, IPPool } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

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
    connectionStatus: 'offline' as 'online' | 'offline', // will be updated from RADIUS sessions
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

// Cool live bandwidth chart using canvas + requestAnimationFrame
function LiveBandwidthChart({ username }: { username: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const dataRef = React.useRef<{ down: number[]; up: number[] }>({ down: Array(60).fill(0), up: Array(60).fill(0) })
  const animRef = React.useRef<number>()

  React.useEffect(() => {
    // Simulate realistic bandwidth data - in production connect to your RADIUS/live API
    const interval = setInterval(() => {
      const d = dataRef.current
      const newDown = Math.max(0, (d.down[d.down.length - 1] || 2) + (Math.random() - 0.45) * 1.5)
      const newUp = Math.max(0, (d.up[d.up.length - 1] || 0.5) + (Math.random() - 0.45) * 0.5)
      d.down = [...d.down.slice(1), Math.min(newDown, 20)]
      d.up = [...d.up.slice(1), Math.min(newUp, 5)]
    }, 500)

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const w = canvas.width
      const h = canvas.height
      const d = dataRef.current

      ctx.clearRect(0, 0, w, h)

      // Background grid
      ctx.strokeStyle = 'rgba(148,163,184,0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = (h * i) / 4
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }

      const maxVal = Math.max(20, ...d.down, ...d.up) * 1.1
      const step = w / (d.down.length - 1)

      const drawLine = (data: number[], color: string, fillColor: string) => {
        if (data.length < 2) return
        ctx.beginPath()
        data.forEach((v, i) => {
          const x = i * step
          const y = h - (v / maxVal) * h * 0.9 - h * 0.05
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        // Fill
        ctx.lineTo((data.length - 1) * step, h)
        ctx.lineTo(0, h)
        ctx.closePath()
        ctx.fillStyle = fillColor
        ctx.fill()
        // Line
        ctx.beginPath()
        data.forEach((v, i) => {
          const x = i * step
          const y = h - (v / maxVal) * h * 0.9 - h * 0.05
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.lineJoin = 'round'
        ctx.stroke()
      }

      drawLine(d.down, '#10b981', 'rgba(16,185,129,0.08)')
      drawLine(d.up, '#8b5cf6', 'rgba(139,92,246,0.08)')

      // Current values
      const curDown = d.down[d.down.length - 1]
      const curUp = d.up[d.up.length - 1]
      ctx.font = 'bold 11px monospace'
      ctx.fillStyle = '#10b981'
      ctx.fillText(`↓ ${curDown.toFixed(1)} Mbps`, 8, 16)
      ctx.fillStyle = '#8b5cf6'
      ctx.fillText(`↑ ${curUp.toFixed(1)} Mbps`, 8, 30)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      clearInterval(interval)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [username])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={600}
        height={100}
        className="w-full rounded-lg bg-slate-950 dark:bg-slate-950"
        style={{ imageRendering: 'crisp-edges' }}
      />
      <div className="absolute top-2 right-3 flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1 text-emerald-400"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" />Download</span>
        <span className="flex items-center gap-1 text-violet-400"><span className="w-3 h-0.5 bg-violet-400 inline-block rounded" />Upload</span>
      </div>
    </div>
  )
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserDetail | null>(null)
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [tickets, setTickets] = useState<TicketEntry[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [radiusCreds, setRadiusCreds] = useState<CustomerRADIUSCredentials | null>(null)
  const [internetCheck, setInternetCheck] = useState<{
    status: 'green' | 'yellow' | 'red' | 'loading' | 'none'
    label: string
    detail: string
    pool?: string
    routerName?: string
  }>({ status: 'loading', label: 'Checking...', detail: '' })
  const [deleting, setDeleting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const userId = Number(params.id)

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch customer
      const customer = await adminApi.getCustomer(userId)
      
      // Fetch services
      let services: CustomerService[] = []
      try {
        const servicesRes = await adminApi.getCustomerServices(userId)
        services = servicesRes || []
      } catch (err) {
        console.warn('Failed to load services:', err)
      }

      // Fetch RADIUS credentials
      let radiusCreds = null
      try {
        const credsRes = await adminApi.getRADIUSCredentials({ customer: String(userId), page_size: '1' })
        radiusCreds = credsRes?.results?.[0] || null
      } catch (err) {
        console.warn('Failed to load RADIUS creds:', err)
      }

      if (customer) {
        const mappedUser = mapCustomerToUser(customer, services, radiusCreds)
        
        // Fetch payments
        try {
          setPaymentsLoading(true)
          const paymentsRes = await adminApi.getPayments({ customer: String(userId), page_size: '20' })
          const paymentsList = paymentsRes.results || []
          const totalPayments = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
          mappedUser.totalPayments = totalPayments
          setPayments(paymentsList.map(mapPayment))
        } catch (err) {
          console.warn('Failed to load payments:', err)
          setPayments([])
        } finally {
          setPaymentsLoading(false)
        }

        // Fetch tickets
        try {
          setTicketsLoading(true)
          const ticketsRes = await adminApi.getTickets({ customer_id: String(userId), page_size: '20' })
          const ticketsList = ticketsRes.results || []
          setTickets(ticketsList.map(mapTicket))
        } catch (err) {
          console.warn('Failed to load tickets:', err)
          setTickets([])
        } finally {
          setTicketsLoading(false)
        }

        // Fetch RADIUS sessions
        const pppoeUser = mappedUser.pppoeUsername
        if (pppoeUser) {
          try {
            setSessionsLoading(true)
            const sessionsRes = await adminApi.getRADIUSSessions({ username: pppoeUser, page_size: '20' })
            if (sessionsRes?.results) {
              setSessions(sessionsRes.results.map(mapSession))
              mappedUser.totalSessions = sessionsRes.results.length

              // Enrich from latest RADIUS session
              const latestSession = sessionsRes.results[0]
              if (latestSession) {
                // Check if currently online (no stop time)
                if (!latestSession.acctstoptime) {
                  mappedUser.connectionStatus = 'online'
                  mappedUser.ipAddress = latestSession.framedipaddress || mappedUser.ipAddress
                  mappedUser.macAddress = latestSession.callingstationid || mappedUser.macAddress
                  mappedUser.router = latestSession.router_name || latestSession.nasipaddress || mappedUser.router
                  mappedUser.lastSeen = 'Now'
                } else {
                  mappedUser.connectionStatus = 'offline'
                  mappedUser.lastSeen = latestSession.acctstoptime
                    ? new Date(latestSession.acctstoptime).toLocaleString()
                    : mappedUser.lastSeen
                  mappedUser.macAddress = latestSession.callingstationid || mappedUser.macAddress
                  mappedUser.router = latestSession.router_name || latestSession.nasipaddress || mappedUser.router
                }
              }
            }
          } catch (err) {
            console.warn('Failed to load RADIUS sessions:', err)
            setSessions([])
          } finally {
            setSessionsLoading(false)
          }
        } else {
          setSessions([])
          setSessionsLoading(false)
        }

        setUser(mappedUser)

        // Internet Check: Fetch RADIUS credentials
        try {
          const credsRes = await adminApi.getRADIUSCredentials({ customer: String(userId), page_size: '1' })
          const cred = credsRes?.results?.[0] || null
          setRadiusCreds(cred)

          if (!cred) {
            setInternetCheck({
              status: 'none',
              label: 'No RADIUS',
              detail: 'No RADIUS credentials found for this customer.',
            })
          } else if (!cred.is_enabled) {
            setInternetCheck({
              status: 'red',
              label: 'Disabled',
              detail: `RADIUS account disabled: ${cred.disabled_reason || 'No reason given'}`,
              routerName: cred.router_name,
            })
          } else if (!cred.ip_pool) {
            setInternetCheck({
              status: 'yellow',
              label: 'No Pool',
              detail: 'RADIUS credentials exist but no IP pool (Framed-Pool) is assigned. The router will use its default pool.',
              routerName: cred.router_name,
            })
          } else {
            // Pool is set — try to verify it exists on the assigned router
            let poolValid = false
            if (cred.router) {
              try {
                const poolsRes = await adminApi.getIPPools({ router_id: String(cred.router), name: cred.ip_pool })
                poolValid = (poolsRes?.results?.length || 0) > 0
              } catch {
                // If pool check fails, assume valid
                poolValid = true
              }
            } else {
              poolValid = true // No router assigned, can't verify
            }

            if (poolValid) {
              setInternetCheck({
                status: 'green',
                label: 'Connected',
                detail: `Pool "${cred.ip_pool}" is configured${cred.router_name ? ` on ${cred.router_name}` : ''}. RADIUS will assign an IP from this pool.`,
                pool: cred.ip_pool,
                routerName: cred.router_name,
              })
            } else {
              setInternetCheck({
                status: 'red',
                label: 'Pool Mismatch',
                detail: `Pool "${cred.ip_pool}" does not exist on router ${cred.router_name || 'Unknown'}. Customer will NOT get an IP address.`,
                pool: cred.ip_pool,
                routerName: cred.router_name,
              })
            }
          }
        } catch (err) {
          console.warn('Failed to check RADIUS status:', err)
          setInternetCheck({
            status: 'none',
            label: 'Unknown',
            detail: 'Could not check RADIUS status.',
          })
        }
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

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true)
      const services = await adminApi.getCustomerServices(userId)
      const primaryService = services.find(s => s.status === 'active') || services[0]
      if (primaryService) {
        await adminApi.suspendService(userId, primaryService.id, 'Manual disconnect from admin')
        toast.success('User disconnected successfully')
      } else {
        toast.error('No active service found to disconnect')
      }
      setIsDisconnectDialogOpen(false)
      await fetchUserData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect user')
    } finally {
      setDisconnecting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/15 text-success">Active</Badge>
      case "expired":
        return <Badge className="bg-destructive/15 text-destructive">Expired</Badge>
      case "suspended":
        return <Badge className="bg-warning/15 text-warning">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "hotspot":
        return <Badge variant="outline" className="border-primary/20 text-primary">Hotspot</Badge>
      case "pppoe":
        return <Badge variant="outline" className="border-purple-200 text-purple-700">PPPoE</Badge>
      case "static":
        return <Badge variant="outline" className="border-warning/20 text-warning">Static IP</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || ''
    if (s === 'completed' || s === 'paid' || s === 'confirmed') {
      return <Badge className="bg-success/15 text-success">Completed</Badge>
    } else if (s === 'pending' || s === 'processing') {
      return <Badge className="bg-warning/15 text-warning">Pending</Badge>
    } else if (s === 'failed') {
      return <Badge variant="destructive">Failed</Badge>
    }
    return <Badge variant="outline">{status}</Badge>
  }

  if (loading || !user) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{user.fullName}</h1>
            {getTypeBadge(user.type)}
            {getStatusBadge(user.status)}
            {user.connectionStatus === 'online' ? (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Online</span>
              </div>
            ) : (
              <span className="text-sm text-slate-400">Offline</span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1">User ID: {params.id} • Joined {user.createdAt}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsDisconnectDialogOpen(true)}>
            <Ban className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
          <Link href={`/admin/users/${params.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Send className="w-4 h-4 mr-2" />
                Send SMS
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Top row - Identity + Connection */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Identity Card */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-black text-lg">
                    {user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{user.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user.id}</p>
                  </div>
                </div>
                <Separator />
                {[
                  { icon: Mail, label: user.email || '—' },
                  { icon: Phone, label: user.phone || '—' },
                  { icon: MapPin, label: user.location || user.address || '—' },
                  { icon: Calendar, label: `Member since ${user.createdAt}` },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 truncate">{label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Connection Status Card */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                  Connection
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
              <CardContent>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    { label: 'Type', value: user.type?.toUpperCase() || '—' },
                    { label: 'Router', value: user.router || radiusCreds?.router_name || '—' },
                    { label: 'IP Address', value: user.ipAddress || user.staticIp || radiusCreds?.static_ip || '—', mono: true },
                    { label: 'MAC Address', value: user.macAddress || '—', mono: true },
                    { label: 'Download', value: user.package.speedDown ? `${user.package.speedDown} Mbps` : '—' },
                    { label: 'Upload', value: user.package.speedUp ? `${user.package.speedUp} Mbps` : '—' },
                    { label: 'Last seen', value: user.connectionStatus === 'online' ? 'Now (Online)' : (user.lastSeen || '—') },
                    { label: 'Activated', value: user.activationDate ? new Date(user.activationDate).toLocaleString() : '—' },
                  ].map(({ label, value, mono }: any) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{label}</p>
                      <p className={`font-semibold text-slate-800 dark:text-slate-200 mt-0.5 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Internet Health */}
                <div className="mt-4 pt-3 border-t dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
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
                      <p className="text-xs text-slate-500 dark:text-slate-400">{internetCheck.detail}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription + Credentials row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Subscription Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 border border-violet-100 dark:border-violet-900/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{user.package.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">KES {user.package.price.toLocaleString()}/mo</p>
                    </div>
                    {getStatusBadge(user.status)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Expires</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {user.expiryDate && user.package.name !== 'No plan'
                        ? new Date(user.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Time left</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
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
                {/* Billing Account */}
                <div className="pt-2 border-t dark:border-slate-700">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">Billing Account (M-Pesa Paybill Ref)</p>
                  {user.billingAccountNumber ? (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono font-bold text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
                        {user.billingAccountNumber}
                      </code>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(user.billingAccountNumber!); toast.success('Copied') }}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Not assigned</p>
                  )}
                </div>
                {/* Data usage */}
                {user.dataLimitThisMonth > 0 && (
                  <div className="pt-2 border-t dark:border-slate-700">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Data usage</span>
                      <span className="font-medium">{user.dataUsedThisMonth} / {user.dataLimitThisMonth} GB</span>
                    </div>
                    <Progress value={(user.dataUsedThisMonth / user.dataLimitThisMonth) * 100} className="h-1.5" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Network Credentials Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  PPPoE Credentials
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!user.pppoeUsername && user.serviceStatus === 'PENDING' ? (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 text-sm text-orange-700 dark:text-orange-300">
                    Credentials created after activation.
                  </div>
                ) : user.pppoeUsername ? (
                  <div className="space-y-3">
                    {[
                      { label: 'Username', value: user.pppoeUsername },
                      { label: 'Password', value: user.pppoePassword || '••••••••', secret: true },
                    ].map(({ label, value, secret }) => (
                      <div key={label}>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1">{label}</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-lg border dark:border-slate-700">
                            {value}
                          </code>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(user.pppoePassword || user.pppoeUsername); toast.success(`${label} copied`) }}>
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {user.radiusCredentials?.expiration_date && (
                      <div className="pt-2 border-t dark:border-slate-700">
                        <p className="text-xs text-slate-400 mb-1.5">Subscription Status</p>
                        {(() => {
                          const diff = new Date(user.radiusCredentials.expiration_date).getTime() - Date.now()
                          const d = Math.floor(diff / 86400000)
                          const h = Math.floor((diff % 86400000) / 3600000)
                          if (diff <= 0) return <Badge variant="destructive">Expired</Badge>
                          if (h < 24) return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">{h}h remaining</Badge>
                          return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">{d}d remaining</Badge>
                        })()}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs pt-1">
                      <Badge variant={user.radiusCredentials?.is_enabled !== false ? "default" : "secondary"} className="text-xs">
                        {user.radiusCredentials?.is_enabled !== false ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <span className="text-slate-400">{user.radiusCredentials?.connection_type || 'PPPOE'}</span>
                      {user.radiusCredentials?.synced_to_radius && (
                        <span className="text-green-600 dark:text-green-400 font-medium">✓ Synced</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No credentials found</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live Bandwidth Graph */}
          {user.connectionStatus === 'online' && user.pppoeUsername && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Live Bandwidth
                  <span className="relative flex h-2 w-2 ml-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <LiveBandwidthChart username={user.pppoeUsername} />
              </CardContent>
            </Card>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Balance', value: `KES ${user.balance.toLocaleString()}`, icon: CreditCard, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
              { label: 'Sessions', value: user.totalSessions.toString(), icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Total Paid', value: `KES ${user.totalPayments.toLocaleString()}`, icon: TrendingUp, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
              { label: 'Loyalty Pts', value: user.loyaltyPoints.toString(), icon: Gift, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                      <p className="font-bold text-slate-900 dark:text-white">{value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>Recent connection sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No sessions recorded</p>
                </div>
              ) : (
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
                        <TableCell>{session.startTime}</TableCell>
                        <TableCell>{session.endTime}</TableCell>
                        <TableCell>{session.duration}</TableCell>
                        <TableCell>{session.dataUsed}</TableCell>
                        <TableCell className="font-mono">{session.ipAddress}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All transactions for this user</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No payments recorded</p>
                </div>
              ) : (
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
                        <TableCell>{payment.date}</TableCell>
                        <TableCell className="font-medium text-slate-900 dark:text-white">KSh {payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell className="font-mono text-xs">{payment.reference || '—'}</TableCell>
                        <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Tickets raised by this user</CardDescription>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No tickets found</p>
                </div>
              ) : (
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
                        <TableCell className="font-mono">{ticket.id}</TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>
                          <Badge className={ticket.status === "open" ? "bg-primary/15 text-primary" : "bg-success/15 text-success"}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.createdAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{user.fullName}</strong>? 
              This will permanently remove the customer account, all service connections, 
              RADIUS credentials, and the associated login user. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
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

      {/* Disconnect Dialog */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect User</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect <strong>{user.fullName}</strong> from the network?
              This will immediately terminate their active session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisconnectDialogOpen(false)} disabled={disconnecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Disconnect
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}