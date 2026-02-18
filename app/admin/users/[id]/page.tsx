"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
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

// Local types for the detail view
interface UserDetail {
  id: string
  username: string
  fullName: string
  email: string
  phone: string
  address: string
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
  staticIp: string | null
  macAddress: string
  totalPayments: number
  totalSessions: number
  avgSessionDuration: string
  dataUsedThisMonth: number
  dataLimitThisMonth: number
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
function mapCustomerToUser(customer: Customer, services: CustomerService[]): UserDetail {
  const primaryService = services.find(s => s.status === 'active') || services[0]
  const plan = primaryService?.plan

  return {
    id: String(customer.id),
    username: customer.email?.split('@')[0] || customer.customer_number,
    fullName: customer.full_name || `${customer.first_name} ${customer.last_name}`,
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.primary_address?.street_address || '',
    type: primaryService?.service_type || 'pppoe',
    status: customer.status,
    balance: Number(customer.balance) || 0,
    loyaltyPoints: 0,
    package: {
      name: plan?.name || 'No plan',
      speedDown: plan?.speed_down || 0,
      speedUp: plan?.speed_up || 0,
      price: Number(plan?.price) || 0,
    },
    router: primaryService?.device?.name || '',
    expiryDate: primaryService?.expiry_date || '',
    createdAt: customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '',
    lastSeen: primaryService?.last_seen || '',
    pppoeUsername: primaryService?.username || '',
    staticIp: primaryService?.ip_address || null,
    macAddress: primaryService?.mac_address || '',
    totalPayments: 0,
    totalSessions: 0,
    avgSessionDuration: '—',
    dataUsedThisMonth: primaryService?.data_used ? Math.round(primaryService.data_used / 1024) : 0,
    dataLimitThisMonth: primaryService?.data_limit ? Math.round(primaryService.data_limit / 1024) : 0,
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

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserDetail | null>(null)
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [tickets, setTickets] = useState<TicketEntry[]>([])
  const [radiusCreds, setRadiusCreds] = useState<CustomerRADIUSCredentials | null>(null)
  const [internetCheck, setInternetCheck] = useState<{
    status: 'green' | 'yellow' | 'red' | 'loading' | 'none'
    label: string
    detail: string
    pool?: string
    routerName?: string
  }>({ status: 'loading', label: 'Checking...', detail: '' })
  const userId = Number(params.id)

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)
      const [customerRes, servicesRes, paymentsRes, ticketsRes] = await Promise.allSettled([
        adminApi.getCustomer(userId),
        adminApi.getCustomerServices(userId),
        adminApi.getPayments({ customer: String(userId), page_size: '20' }),
        adminApi.getTickets({ customer_id: String(userId), page_size: '20' }),
      ])

      const customer = customerRes.status === 'fulfilled' ? customerRes.value : null
      const services = servicesRes.status === 'fulfilled' ? servicesRes.value : []

      if (customer) {
        const mappedUser = mapCustomerToUser(customer, services)

        // Get payment total
        const paymentsList = paymentsRes.status === 'fulfilled' ? paymentsRes.value.results || [] : []
        const totalPayments = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        mappedUser.totalPayments = totalPayments

        setUser(mappedUser)
        setPayments(paymentsList.map(mapPayment))

        // Map tickets
        const ticketsList = ticketsRes.status === 'fulfilled' ? ticketsRes.value.results || [] : []
        setTickets(ticketsList.map(mapTicket))

        // Fetch RADIUS sessions if we have a username
        const pppoeUser = services.find(s => s.username)?.username
        if (pppoeUser) {
          try {
            const sessionsRes = await adminApi.getRADIUSSessions({ username: pppoeUser, page_size: '20' })
            if (sessionsRes?.results) {
              setSessions(sessionsRes.results.map(mapSession))
              mappedUser.totalSessions = sessionsRes.results.length
              setUser({ ...mappedUser })
            }
          } catch {
            // RADIUS sessions optional
          }
        }

        // Internet Check: Fetch RADIUS credentials and validate pool linkage
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
        } catch {
          setInternetCheck({
            status: 'none',
            label: 'Unknown',
            detail: 'Could not check RADIUS status.',
          })
        }
      }
    } catch (err) {
      console.error('Failed to load user data:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchUserData()
  }, [userId, fetchUserData])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-700">Expired</Badge>
      case "suspended":
        return <Badge className="bg-yellow-100 text-yellow-700">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "hotspot":
        return <Badge variant="outline" className="border-blue-200 text-blue-700">Hotspot</Badge>
      case "pppoe":
        return <Badge variant="outline" className="border-purple-200 text-purple-700">PPPoE</Badge>
      case "static":
        return <Badge variant="outline" className="border-orange-200 text-orange-700">Static IP</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{user.fullName}</h1>
            {getTypeBadge(user.type)}
            {getStatusBadge(user.status)}
          </div>
          <p className="text-slate-600 mt-1">User ID: {params.id} • Joined {user.createdAt}</p>
        </div>
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
                className="text-red-600"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Balance</p>
                <p className="text-xl font-bold">KSh {user.balance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Loyalty Points</p>
                <p className="text-xl font-bold">{user.loyaltyPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Data Used</p>
                <p className="text-xl font-bold">{user.dataUsedThisMonth} GB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Expires</p>
                <p className="text-xl font-bold">{user.expiryDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
                      {user.fullName.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{user.fullName}</p>
                    <p className="text-slate-500">@{user.username}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{user.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Info */}
            <Card>
              <CardHeader>
                <CardTitle>Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Connection Type</p>
                    <p className="font-medium capitalize">{user.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Router</p>
                    <p className="font-medium">{user.router}</p>
                  </div>
                  {user.pppoeUsername && (
                    <div>
                      <p className="text-sm text-slate-500">PPPoE Username</p>
                      <p className="font-medium font-mono">{user.pppoeUsername}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">MAC Address</p>
                    <p className="font-medium font-mono">{user.macAddress}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-slate-500 mb-2">Last Seen</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-medium">Online Now</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Internet Check Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Signal className="w-5 h-5" />
                  Internet Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {/* Status Indicator */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    internetCheck.status === 'green' ? 'bg-green-100' :
                    internetCheck.status === 'yellow' ? 'bg-yellow-100' :
                    internetCheck.status === 'red' ? 'bg-red-100' :
                    internetCheck.status === 'loading' ? 'bg-slate-100' :
                    'bg-slate-100'
                  }`}>
                    {internetCheck.status === 'green' && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                    {internetCheck.status === 'yellow' && (
                      <Activity className="w-6 h-6 text-yellow-600" />
                    )}
                    {internetCheck.status === 'red' && (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    {internetCheck.status === 'loading' && (
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    )}
                    {internetCheck.status === 'none' && (
                      <Signal className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold ${
                        internetCheck.status === 'green' ? 'text-green-700' :
                        internetCheck.status === 'yellow' ? 'text-yellow-700' :
                        internetCheck.status === 'red' ? 'text-red-700' :
                        'text-slate-600'
                      }`}>
                        {internetCheck.label}
                      </span>
                      {internetCheck.status === 'green' && <Badge className="bg-green-100 text-green-700 text-xs">OK</Badge>}
                      {internetCheck.status === 'yellow' && <Badge className="bg-yellow-100 text-yellow-700 text-xs">Warning</Badge>}
                      {internetCheck.status === 'red' && <Badge className="bg-red-100 text-red-700 text-xs">Error</Badge>}
                    </div>
                    <p className="text-sm text-slate-600">{internetCheck.detail}</p>
                    {internetCheck.pool && (
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        Framed-Pool: {internetCheck.pool}
                      </p>
                    )}
                    {internetCheck.routerName && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Router: {internetCheck.routerName}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Package Info */}
            <Card>
              <CardHeader>
                <CardTitle>Current Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{user.package.name}</h3>
                      <p className="text-slate-500">KSh {user.package.price}/month</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Download</p>
                      <p className="font-bold text-lg">{user.package.speedDown} Mbps</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Upload</p>
                      <p className="font-bold text-lg">{user.package.speedUp} Mbps</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-500">Data Usage This Month</span>
                    <span className="font-medium">{user.dataUsedThisMonth} / {user.dataLimitThisMonth} GB</span>
                  </div>
                  <Progress value={(user.dataUsedThisMonth / user.dataLimitThisMonth) * 100} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Total Sessions</p>
                    <p className="font-bold text-lg">{user.totalSessions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Avg Session Duration</p>
                    <p className="font-bold text-lg">{user.avgSessionDuration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Payments</p>
                    <p className="font-bold text-lg">KSh {user.totalPayments.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Member Since</p>
                    <p className="font-bold text-lg">{user.createdAt}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>Recent connection sessions</CardDescription>
            </CardHeader>
            <CardContent>
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
                      <TableCell className="font-medium">KSh {payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell className="font-mono">{payment.reference}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">Completed</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                        <Badge className={ticket.status === "open" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {user.fullName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive">Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Dialog */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect User</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect {user.fullName} from the network?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisconnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive">
              <Ban className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
