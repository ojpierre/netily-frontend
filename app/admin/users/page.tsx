"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Loader2,
  X,
  Wifi,
  Globe,
  Server,
  Activity,
  Users,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Signal,
  Upload,
  FileUp,
  Send,
  UserCheck,
  Power,
  Copy,
  Smartphone,
  CreditCard,
  ArrowRightLeft,
  MapPin,
  History,
  ChevronRight,
  Settings,
  Wallet,
  WifiOff,
  Router as RouterIcon,
} from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { usePagePermissions } from "@/hooks/use-page-permissions"
import type { 
  Customer, 
  CustomerService, 
  CustomerStatus, 
  Plan, 
  Router, 
  IPPool, 
  AvailableIP, 
  OnlineSession, 
  ActiveSubscriptionsResponse, 
  CustomerAvailablePlanOption, 
  CustomerAvailablePlansResponse,
  CustomerRADIUSCredentials,
  ActiveSubscription,
  IPBinding,
  KnownHost,
  HotspotPlan,
} from "@/lib/types"

// PaymentEntry type - not exported from types.ts
interface PaymentEntry {
  id: number
  amount: string | number
  status: string
  method?: string
  payment_method?: string
  reference?: string
  mpesa_receipt?: string
  date?: string
  created_at?: string
}

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { BandwidthGraph } from "@/components/ui/bandwidth-graph"

type UserType = "pppoe" | "static" | "fiber" | "wireless"
type UserStatus = "active" | "inactive" | "expired" | "suspended" | "pending" | "online" | "offline"

interface RADIUSCredentials {
  id?: string
  username: string
  password: string
  is_enabled: boolean
  connection_type: string
  expiration_date: string | null 
  synced_to_radius?: boolean
}

interface User {
  id: string
  customerId: number
  serviceId: number | null
  billingAccountNumber?: string
  name: string
  email: string
  phone: string
  location?: string
  status: UserStatus
  serviceStatus: string | null
  connectionStatus: "online" | "offline"
  type: UserType
  plan: string
  planPrice: number
  joinedDate: string
  expiryDate: string
  lastOnline: string
  dataUsed: number
  dataLimit: number | null
  macAddress?: string
  ipAddress?: string
  router: string
  downloadSpeed: number
  uploadSpeed: number
  loyaltyPoints: number
  balance: number
  radiusCredentials?: RADIUSCredentials
  liveUsageString?: string
}

interface HotspotClientData {
  id: number;
  canonical_phone: string;
  email: string | null;
  external_client_id: string | null;
  total_spend: string;
  total_sessions: number;
  first_seen_at: string;
  last_seen_at: string;
  current_session: {
    status: string;
    plan_name: string;
    expires_at: string;
    created_at: string;
    router_id: number;
    access_code: string;
    mpesa_receipt: string | null;
    data_used_mb: number;
  } | null;
}

interface UserStats {
  total: number
  active: number
  pending: number
  suspended: number
  expired: number
  online: number
  pppoe: number
  static: number
  hotspot: number
  totalActiveSubs: number
}

interface ServerStatsState {
  expired: number
  pppoe: number
  static: number
  hotspot: number
}

// Animation variants - kept for other animations
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
}

// FIX: PageWrapper defined OUTSIDE the component for stable reference
function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="admin-theme-route admin-users-route space-y-6">{children}</div>
}

// Helper: Map backend Customer to frontend User display type
const mapCustomerToUser = (customer: Customer): User => {
  const primaryService = customer.services?.[0]
  const isOnline = primaryService?.is_online ?? false
  const serviceStatus = (primaryService?.status || '').toUpperCase()
  
  const mapStatus = (status: CustomerStatus): UserStatus => {
    if (serviceStatus === 'PENDING') return 'pending'
    if (serviceStatus === 'SUSPENDED') return 'suspended'
    if (serviceStatus === 'TERMINATED') return 'inactive'
    
    const radiusCreds = (customer as any).radius_credentials
    if (radiusCreds?.expiration_date) {
      const expiry = new Date(radiusCreds.expiration_date)
      if (expiry <= new Date()) return 'expired'
    }
    
    switch (status) {
      case 'active': return 'active'
      case 'inactive': return 'expired'
      case 'suspended': return 'suspended'
      case 'pending': return 'pending'
      default: return 'active'
    }
  }
  
  const safeDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return new Date().toISOString()
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? new Date().toISOString() : dateStr
  }
  
  const serviceType = primaryService?.service_type?.toLowerCase() || 'pppoe'
  const mappedType = ['pppoe', 'static', 'fiber', 'wireless'].includes(serviceType) 
    ? serviceType as UserType 
    : 'pppoe'
  
  const radiusCreds = (customer as any).radius_credentials
  const radiusCredentials: RADIUSCredentials | undefined = radiusCreds ? {
    id: radiusCreds.id || '',
    username: radiusCreds.username || '',
    password: radiusCreds.password || '',
    is_enabled: radiusCreds.is_enabled ?? true,
    connection_type: radiusCreds.connection_type || 'PPPOE',
    expiration_date: radiusCreds.expiration_date || null,
    synced_to_radius: radiusCreds.synced_to_radius ?? false,
  } : undefined

  const actualExpiryDate = radiusCredentials?.expiration_date || primaryService?.expiry_date;

  return {
    id: customer.customer_number || `USR-${customer.id}`,
    customerId: customer.id,
    serviceId: primaryService?.id ?? null,
    billingAccountNumber: (() => {
      const serviceWithBilling = customer.services?.find(s => s.billing_account_number)
      return serviceWithBilling?.billing_account_number 
        || primaryService?.billing_account_number
        || (customer as any).billing_account_number
        || (customer as any).services?.[0]?.billing_account_number
        || null
    })(),
    name: customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
    email: customer.email || '',
    phone: customer.phone || 'No phone',
    location: (customer as any).location || '',
    status: mapStatus(customer.status),
    serviceStatus: serviceStatus || null,
    connectionStatus: isOnline ? "online" : "offline",
    type: mappedType,
    plan: primaryService?.plan?.name || "No Plan",
    planPrice: primaryService?.plan?.price ? parseFloat(String(primaryService.plan.price)) : 0,
    joinedDate: safeDate(customer.created_at),
    expiryDate: safeDate(actualExpiryDate),
    lastOnline: isOnline ? "Now" : (primaryService?.last_seen ? new Date(primaryService.last_seen).toLocaleString() : "Never"),
    dataUsed: primaryService?.data_used || 0,
    dataLimit: primaryService?.data_limit || null,
    macAddress: primaryService?.mac_address,
    ipAddress: primaryService?.ip_address,
    router: primaryService?.device?.name || "Not assigned",
    downloadSpeed: primaryService?.download_speed || 0,
    uploadSpeed: primaryService?.upload_speed || 0,
    loyaltyPoints: 0,
    balance: (() => {
      const credit = parseFloat((customer as any).prepaid_credit || '0')
      const debt = parseFloat(customer.balance || '0')
      return credit - debt
    })(),
    radiusCredentials,
  }
}

const generateSimplePassword = (length: number = 8): string => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Snippet A: Helper function for time remaining formatting
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

export default function UsersPage() {
  const perms = usePagePermissions("/admin/users")
  const router = useRouter()
  const ipSearchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const editIPSearchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const hasFetched = useRef(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [serverPage, setServerPage] = useState(1)
  
  // ============================================================
  // FIX 1: Infinite scroll state
  // ============================================================
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerTarget = useRef<HTMLDivElement | null>(null)
  
  // Online tab infinite scroll
  const [onlineLoadingMore, setOnlineLoadingMore] = useState(false)
  const [onlineHasMore, setOnlineHasMore] = useState(true)
  const onlineObserverTarget = useRef<HTMLDivElement | null>(null)

  // Hotspot tab infinite scroll (client-side reveal)
  const hotspotObserverTarget = useRef<HTMLDivElement | null>(null)
  
  const [hotspotClients, setHotspotClients] = useState<HotspotClientData[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<ActiveSubscriptionsResponse>({ pppoe: [], hotspot: [], total: 0 })
  const [hotspotLoading, setHotspotLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      return params.get("status") || "all"
    }
    return "all"
  })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState("all")
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showSmsDialog, setShowSmsDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false)
  const [userToChangePlan, setUserToChangePlan] = useState<User | null>(null)
  const [changePlanOptions, setChangePlanOptions] = useState<CustomerAvailablePlanOption[]>([])
  const [changePlanServiceId, setChangePlanServiceId] = useState<number | null>(null)
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null)
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null)
  const [selectedChangePlanId, setSelectedChangePlanId] = useState<string>("")
  const [changePlanLoading, setChangePlanLoading] = useState(false)
  const [changePlanSaving, setChangePlanSaving] = useState(false)
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [userToExtend, setUserToExtend] = useState<User | null>(null)
  const [extending, setExtending] = useState(false)
  const [extendForm, setExtendForm] = useState({ duration_amount: 1, duration_unit: 'DAYS' as 'MINUTES' | 'HOURS' | 'DAYS', plan_id: '' })
  const [extendManualDate, setExtendManualDate] = useState<string>("")
  const [extendManualTime, setExtendManualTime] = useState<string>("23:59")
  const [extendMode, setExtendMode] = useState<"duration" | "date">("duration")
  
  const [showExtendHotspotDialog, setShowExtendHotspotDialog] = useState(false)
  const [hotspotSessionToExtend, setHotspotSessionToExtend] = useState<ActiveSubscription | null>(null)
  const [hotspotExtendForm, setHotspotExtendForm] = useState({ duration_amount: 1, duration_unit: 'HOURS' as 'MINUTES' | 'HOURS' | 'DAYS' })
  const [hotspotExtendManualDate, setHotspotExtendManualDate] = useState("")
  const [hotspotExtendManualTime, setHotspotExtendManualTime] = useState("23:59")
  const [hotspotExtendMode, setHotspotExtendMode] = useState<"duration" | "date">("duration")
  const [extendingHotspot, setExtendingHotspot] = useState(false)
  
  const [activating, setActivating] = useState(false)
  const [togglingRadius, setTogglingRadius] = useState(false)
  const [smsMessage, setSmsMessage] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [routersList, setRoutersList] = useState<Router[]>([])
  const [routersLoading, setRoutersLoading] = useState(false)
  const [poolsList, setPoolsList] = useState<IPPool[]>([])
  const [poolsLoading, setPoolsLoading] = useState(false)
  const [availableIPs, setAvailableIPs] = useState<AvailableIP[] & { total_available?: number }>([])
  const [availableIPsLoading, setAvailableIPsLoading] = useState(false)
  const [ipSearchQuery, setIpSearchQuery] = useState("")
  const [onlineSessions, setOnlineSessions] = useState<OnlineSession[]>([])
  const [onlineSessionsLoading, setOnlineSessionsLoading] = useState(false)
  const [onlineTotal, setOnlineTotal] = useState(0)
  const [onlineSearchQuery, setOnlineSearchQuery] = useState("")
  const [onlineServiceFilter, setOnlineServiceFilter] = useState("all")
  const [onlinePage, setOnlinePage] = useState(1)
  const onlinePageSize = 50
  const [activeSearchQuery, setActiveSearchQuery] = useState("")
  const itemsPerPage = 10

  const [showEditIPDialog, setShowEditIPDialog] = useState(false)
  const [userToEditIP, setUserToEditIP] = useState<User | null>(null)
  const [editIPAvailableIPs, setEditIPAvailableIPs] = useState<AvailableIP[]>([])
  const [editIPLoading, setEditIPLoading] = useState(false)
  const [selectedNewIPId, setSelectedNewIPId] = useState<string>("")
  const [editIPSearchQuery, setEditIPSearchQuery] = useState("")
  const [savingIP, setSavingIP] = useState(false)
  const [editIPPoolId, setEditIPPoolId] = useState<number | null>(null)

  const [hotspotPage, setHotspotPage] = useState(1)
  const hotspotPageSize = 20

  const [showHotspotDeleteDialog, setShowHotspotDeleteDialog] = useState(false)
  const [hotspotDeleteTarget, setHotspotDeleteTarget] = useState<{ clientId: number; username: string } | null>(null)
  const [deletingHotspot, setDeletingHotspot] = useState(false)

  const [showUserSmsDialog, setShowUserSmsDialog] = useState(false)
  const [userSmsTarget, setUserSmsTarget] = useState<User | null>(null)
  const [userSmsMessage, setUserSmsMessage] = useState("")
  const [sendingUserSms, setSendingUserSms] = useState(false)

  const [smsTarget, setSmsTarget] = useState<User | null>(null)
  const [sendingSms, setSendingSms] = useState(false)

  const [mpesaConfig, setMpesaConfig] = useState<{ business_shortcode?: string } | null>(null)
  const [tenantSubdomain, setTenantSubdomain] = useState<string>("")

  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    radius_username: "",
    radius_password: "",
    location: "",
  })

  // ============================================================
  // IP BINDING STATE
  // ============================================================
  const [ipBindings, setIpBindings] = useState<IPBinding[]>([])
  const [ipBindingLoading, setIpBindingLoading] = useState(false)
  const [showAddIPBindingDialog, setShowAddIPBindingDialog] = useState(false)
  const [ipBindingForm, setIpBindingForm] = useState({
    router_id: "", plan_id: "", name: "", mac_address: "", ip_address: "", notes: "",
  })
  const [knownHosts, setKnownHosts] = useState<KnownHost[]>([])
  const [knownHostsLoading, setKnownHostsLoading] = useState(false)
  const [hotspotPlansForBinding, setHotspotPlansForBinding] = useState<HotspotPlan[]>([])

  // ============================================================
  // IP BINDING LOADING GUARD STATE
  // ============================================================
  const [creatingBinding, setCreatingBinding] = useState(false)
  const [deletingBindingId, setDeletingBindingId] = useState<string | null>(null)
  const [extendingBindingId, setExtendingBindingId] = useState<string | null>(null)

  // ============================================================
  // FIX: Remove password from newCustomerForm state
  // ============================================================
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    location: "",
    radius_username: "",
    radius_password: "",
    connection_type: "pppoe" as "pppoe" | "static",
    plan_id: "",
    assigned_ip: "" as string,
    activate_now: true,
    activation_delay_minutes: 0,
    record_initial_payment: false,
    initial_payment_amount: '' as string | number,
    initial_payment_reference: '',
  })

  const [serverStats, setServerStats] = useState<ServerStatsState>({
    expired: 0,
    pppoe: 0,
    static: 0,
    hotspot: 0,
  })

  const [serverStatusCounts, setServerStatusCounts] = useState({
    active: 0,
    pending: 0,
    suspended: 0,
  })

  const [allActiveSubUsers, setAllActiveSubUsers] = useState<User[]>([])
  const [activeSubsPageLoading, setActiveSubsPageLoading] = useState(false)

  const [expiredUsers, setExpiredUsers] = useState<User[]>([])
  const [expiredUsersLoading, setExpiredUsersLoading] = useState(false)

  const [onlineMap, setOnlineMap] = useState<Record<string, { usage: string; ip: string; mac: string; router_ip: string }>>({})
  const [onlineMapLoading, setOnlineMapLoading] = useState(false)

  const [activeStatFilter, setActiveStatFilter] = useState<string>("all")
  const [hotspotSubFilter, setHotspotSubFilter] = useState<"active" | "expired">("active")

  // ============================================================
  // NEW: Export state
  // ============================================================
  const [exporting, setExporting] = useState(false)

  // ============================================================
  // CLAUDE CHANGE #1: SUSPEND STATE
  // ============================================================
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null)
  const [suspending, setSuspending] = useState(false)

  // ============================================================
  // IP BINDING FUNCTIONS
  // ============================================================
  const loadIPBindings = async () => {
    try {
      setIpBindingLoading(true)
      const res = await adminApi.getIPBindings({ page_size: "100" })
      setIpBindings(res.results || [])
    } catch (err) {
      toast.error("Failed to load IP bindings")
    } finally {
      setIpBindingLoading(false)
    }
  }

  const loadKnownHosts = async (routerId: string) => {
    if (!routerId) { setKnownHosts([]); return }
    try {
      setKnownHostsLoading(true)
      const res = await adminApi.getRouterKnownHosts(parseInt(routerId))
      setKnownHosts(res.hosts || [])
    } catch {
      setKnownHosts([])
    } finally {
      setKnownHostsLoading(false)
    }
  }

  const loadHotspotPlansForRouter = async (routerId: string) => {
    if (!routerId) { setHotspotPlansForBinding([]); return }
    try {
      const plans = await adminApi.getHotspotPlans(parseInt(routerId))
      setHotspotPlansForBinding(plans.filter(p => p.is_active))
    } catch {
      setHotspotPlansForBinding([])
    }
  }

  const handleCreateIPBinding = async () => {
    if (creatingBinding) return // guard against double-click
    if (!ipBindingForm.router_id || !ipBindingForm.plan_id || !ipBindingForm.mac_address) {
      toast.error("Router, plan, and MAC address are required")
      return
    }
    try {
      setCreatingBinding(true)
      await adminApi.createIPBinding({
        router: parseInt(ipBindingForm.router_id),
        plan: ipBindingForm.plan_id,
        name: ipBindingForm.name || ipBindingForm.mac_address,
        mac_address: ipBindingForm.mac_address,
        ip_address: ipBindingForm.ip_address || undefined,
        notes: ipBindingForm.notes || undefined,
      })
      toast.success("IP binding created")
      setShowAddIPBindingDialog(false)
      setIpBindingForm({ router_id: "", plan_id: "", name: "", mac_address: "", ip_address: "", notes: "" })
      await loadIPBindings()
    } catch (err: any) {
      toast.error(err.message || "Failed to create IP binding")
    } finally {
      setCreatingBinding(false)
    }
  }

  const handleExtendIPBinding = async (id: string) => {
    if (extendingBindingId === id) return
    try {
      setExtendingBindingId(id)
      await adminApi.extendIPBinding(id, 60)
      toast.success("IP binding extended by 1 hour")
      await loadIPBindings()
    } catch (err: any) {
      toast.error(err.message || "Failed to extend IP binding")
    } finally {
      setExtendingBindingId(null)
    }
  }

  const handleDeleteIPBinding = async (id: string) => {
    if (deletingBindingId === id) return
    try {
      setDeletingBindingId(id)
      await adminApi.deleteIPBinding(id)
      toast.success("IP binding deleted")
      await loadIPBindings()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete IP binding")
    } finally {
      setDeletingBindingId(null)
    }
  }

  const handleDisableIPBinding = async (id: string) => {
    try {
      await adminApi.disableIPBinding(id)
      toast.success("IP binding disabled")
      await loadIPBindings()
    } catch (err: any) {
      toast.error(err.message || "Failed to disable IP binding")
    }
  }

  const loadServerStats = async () => {
    try {
      const expiredCount = await adminApi.getExpiredRADIUSCount()
      setServerStats(prev => ({
        ...prev,
        expired: expiredCount,
      }))
    } catch (err) {
      console.error("Failed to load server stats:", err)
    }
  }

  const loadStatusCounts = async () => {
    try {
      const [activeRes, pendingRes, suspendedRes] = await Promise.all([
        adminApi.getCustomers({ page_size: '1', status: 'ACTIVE' }),
        adminApi.getCustomers({ page_size: '1', status: 'PENDING' }),
        adminApi.getCustomers({ page_size: '1', status: 'SUSPENDED' }),
      ])
      setServerStatusCounts({
        active: activeRes.count,
        pending: pendingRes.count,
        suspended: suspendedRes.count,
      })
    } catch (err) {
      console.error('Failed to load status counts:', err)
    }
  }

  const loadAllActiveUsers = async () => {
    try {
      setActiveSubsPageLoading(true)
      const response = await adminApi.getCustomers({ 
        page_size: '500',
        status: 'ACTIVE' 
      })
      const mapped = response.results.map(mapCustomerToUser)
      const now = new Date()
      const active = mapped.filter(u => {
        const expiry = u.expiryDate ? new Date(u.expiryDate) : null
        return expiry === null || expiry > now
      })
      setAllActiveSubUsers(active)
    } catch (err) {
      console.error('Failed to load all active users:', err)
    } finally {
      setActiveSubsPageLoading(false)
    }
  }

  // ============================================================
  // FIX: loadExpiredUsersFromRADIUS - uses customer_phone from backend
  // ============================================================
  const loadExpiredUsersFromRADIUS = async () => {
    if (expiredUsersLoading) return
    try {
      setExpiredUsersLoading(true)
      console.log('🔄 Loading expired users...')
      
      const firstPage = await adminApi.getRADIUSCredentials({
        page_size: "100",
        page: "1",
        expired_only: "true",
      })
      
      let allResults = [...(firstPage.results || [])]
      const totalCount = firstPage.count || 0
      const totalPages = Math.ceil(totalCount / 100)
      
      console.log(`📊 Total expired: ${totalCount}, pages: ${totalPages}`)
      
      if (totalPages > 1) {
        const pagePromises = []
        for (let page = 2; page <= totalPages; page++) {
          pagePromises.push(
            adminApi.getRADIUSCredentials({
              page_size: "100",
              page: String(page),
              expired_only: "true",
            })
          )
        }
        const remainingPages = await Promise.all(pagePromises)
        for (const pageData of remainingPages) {
          allResults = [...allResults, ...(pageData.results || [])]
        }
      }
      
      console.log(`📊 Total results fetched: ${allResults.length}`)
      
      if (allResults.length === 0) {
        console.warn('⚠️ No expired credentials found')
        setExpiredUsers([])
        return
      }
      
      // FIX: Use customer_phone from backend (was hardcoded "")
      const mapped = allResults.map((cred: any) => ({
        id: cred.customer_code || `CRED-${cred.id}`,
        customerId: parseInt(String(cred.customer)),
        serviceId: null,
        billingAccountNumber: undefined,
        name: cred.customer_name || "Unknown",
        email: "",
        phone: cred.customer_phone || "",   // FIX: was hardcoded ""
        location: "",
        status: "expired" as UserStatus,
        serviceStatus: "ACTIVE",
        connectionStatus: "offline" as const,
        type: "pppoe" as UserType,
        plan: cred.profile_name || "No Plan",
        planPrice: 0,
        joinedDate: cred.created_at || new Date().toISOString(),
        expiryDate: cred.expiration_date || "",
        lastOnline: "N/A",
        dataUsed: 0,
        dataLimit: null,
        macAddress: undefined,
        ipAddress: undefined,
        router: cred.router_name || "",
        downloadSpeed: 0,
        uploadSpeed: 0,
        loyaltyPoints: 0,
        balance: 0,
        radiusCredentials: {
          id: String(cred.id),
          username: cred.username,
          password: "",
          is_enabled: cred.is_enabled,
          connection_type: cred.connection_type,
          expiration_date: cred.expiration_date,
          synced_to_radius: cred.synced_to_radius,
        },
      }))
      
      console.log(`✅ Mapped ${mapped.length} expired users`)
      setExpiredUsers(mapped)
      
    } catch (err) {
      console.error('❌ Failed to load expired users from RADIUS:', err)
      setExpiredUsers([])
    } finally {
      setExpiredUsersLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname
      const parts = host.split(".")
      setTenantSubdomain(parts.length >= 3 ? parts[0] : host.replace(".localhost", ""))
    }
    adminApi.getActiveMpesaSummary().then(summary => {
      if (summary.is_active && summary.business_shortcode) setMpesaConfig(summary)
    }).catch(() => {})
  }, [])

  // Initial load
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    
    Promise.all([
      loadUsers(1),
      loadOnlineMap(),
      loadServerStats(),
      loadStatusCounts(),
    ])
    
    const timer = setTimeout(() => {
      loadActiveSubscriptions()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (statusFilter === "expired") {
      console.log('🔄 Status filter changed to expired, loading expired users...')
      loadExpiredUsersFromRADIUS()
    }
  }, [statusFilter])

  useEffect(() => {
    setHotspotPage(1)
  }, [hotspotSubFilter])

  const loadPlans = async () => {
    try {
      setPlansLoading(true)
      const response = await adminApi.getPlans({ is_active: "true" })
      setPlans(response.results || [])
    } catch (err) {
      console.error('Failed to load plans:', err)
    } finally {
      setPlansLoading(false)
    }
  }

  const loadOnlineMap = async () => {
    try {
      setOnlineMapLoading(true)
      const map = await adminApi.getOnlineUsernameMap()
      setOnlineMap(map)
      setOnlineTotal(Object.keys(map).length)
    } catch (err) {
      console.error('Failed to load online map:', err)
    } finally {
      setOnlineMapLoading(false)
    }
  }

  // ============================================================
  // STEP 2: Replace loadOnlineSessions with append-aware version
  // ============================================================
  const loadOnlineSessions = async (page = 1, append = false) => {
    try {
      append ? setOnlineLoadingMore(true) : setOnlineSessionsLoading(true)
      const response = await adminApi.getOnlineSessions(page, onlinePageSize)
      const newSessions = response.sessions || []
      setOnlineSessions(prev => append ? [...prev, ...newSessions] : newSessions)
      setOnlineTotal(response.total || newSessions.length)
      setOnlinePage(page)
      setOnlineHasMore(page * onlinePageSize < (response.total || 0))
    } catch (err) {
      console.error('Failed to load online sessions:', err)
      if (!append) setOnlineSessions([])
    } finally {
      setOnlineSessionsLoading(false)
      setOnlineLoadingMore(false)
    }
  }

  const loadMoreOnlineSessions = () => {
    if (onlineLoadingMore || onlineSessionsLoading || !onlineHasMore) return
    loadOnlineSessions(onlinePage + 1, true)
  }

  const loadHotspotClients = async () => {
    try {
      setHotspotLoading(true)
      const response = adminApi.getHotspotClients ? await adminApi.getHotspotClients() : { results: [] }
      setHotspotClients(response.results || response || [])
    } catch (err) {
      console.error('Failed to load hotspot clients:', err)
    } finally {
      setHotspotLoading(false)
    }
  }

  const loadActiveSubscriptions = async () => {
    try {
      setHotspotLoading(true)
      const response = await adminApi.getActiveSubscriptions?.() || { pppoe: [], hotspot: [], total: 0 }
      setActiveSubscriptions(response)
      setServerStats(prev => ({
        ...prev,
        pppoe: response.pppoe?.length || 0,
        hotspot: response.hotspot?.length || 0,
      }))
    } catch (err) {
      console.error('Failed to load active subscriptions:', err)
    } finally {
      setHotspotLoading(false)
    }
  }

  const loadRouters = async () => {
    if (routersList.length > 0) return
    try {
      setRoutersLoading(true)
      const response = await adminApi.getRouters({ page_size: "100" })
      setRoutersList(response.results || [])
    } catch (err) {
      console.error('Failed to load routers:', err)
    } finally {
      setRoutersLoading(false)
    }
  }

  const loadPoolsForRouter = async (routerId: string) => {
    if (!routerId) {
      setPoolsList([])
      return
    }
    try {
      setPoolsLoading(true)
      const response = await adminApi.getIPPools({ router_id: routerId, is_active: "true", page_size: "100" })
      setPoolsList(response.results || [])
    } catch (err) {
      console.error('Failed to load IP pools:', err)
      setPoolsList([])
    } finally {
      setPoolsLoading(false)
    }
  }

  const loadAvailableIPs = async (poolId: number, search?: string) => {
    try {
      setAvailableIPsLoading(true)
      const response = await adminApi.getIPPoolAvailableIPs(poolId, search)
      const ips = response.results || []
      ;(ips as any).total_available = response.total_available
      setAvailableIPs(ips)
    } catch (err) {
      console.error('Failed to load available IPs:', err)
      setAvailableIPs([])
    } finally {
      setAvailableIPsLoading(false)
    }
  }

  const selectedPlanPool = React.useMemo(() => {
    if (!newCustomerForm.plan_id) return null
    const plan = plans.find(p => p.id === parseInt(newCustomerForm.plan_id))
    if (!plan || !plan.ip_pool) return null
    return typeof plan.ip_pool === 'number' ? plan.ip_pool : null
  }, [newCustomerForm.plan_id, plans])

  useEffect(() => {
    if (selectedPlanPool) {
      loadAvailableIPs(selectedPlanPool)
    } else {
      setAvailableIPs([])
    }
    setNewCustomerForm(prev => ({ ...prev, assigned_ip: "" }))
    setIpSearchQuery("")
  }, [selectedPlanPool])

  // ============================================================
  // FIX 2: loadUsers with retry, Invalid page detection, and non-destructive error handling
  // ============================================================
  const loadUsers = async (
    page = 1,
    search?: string,
    status?: string,
    append = false,
    retryCount = 0
  ) => {
    try {
      append ? setLoadingMore(true) : setLoading(true)
      setError(null)
      const params: Record<string, string> = {
        page_size: "50",
        page: String(page),
      }
      const effectiveSearch = search !== undefined ? search : searchQuery
      if (effectiveSearch && effectiveSearch.trim()) {
        params.search = effectiveSearch.trim()
      }
      const effectiveStatus = status !== undefined ? status : statusFilter

      const statusMap: Record<string, string> = {
        active: 'ACTIVE',
        pending: 'PENDING',
        suspended: 'SUSPENDED',
        inactive: 'INACTIVE',
        terminated: 'TERMINATED',
      }

      if (effectiveStatus === "expired") {
        setLoading(false)
        setLoadingMore(false)
        return
      }

      if (effectiveStatus !== "all") {
        params.status = statusMap[effectiveStatus] || effectiveStatus.toUpperCase()
      }

      const response = await adminApi.getCustomers(params)
      const mappedUsers = response.results.map(mapCustomerToUser)
      setUsers(prev => append ? [...prev, ...mappedUsers] : mappedUsers)
      setTotalCount(response.count)
      setHasMore(page * 50 < response.count)
    } catch (err: any) {
      // "Invalid page" (404) means the page number is stale/out of range —
      // e.g. the result set shrank after a search/filter change while the
      // user had already scrolled deep. Retrying it can never succeed, so
      // stop pagination immediately instead of looping forever.
      const isInvalidPage = err?.message?.toLowerCase?.().includes('invalid page')

      if (!isInvalidPage && retryCount < 1) {
        // Tenants with many customers occasionally hit a slow/transient response
        // right after a create (RADIUS/billing signals still settling). Retry
        // once before treating it as a real failure.
        console.warn('loadUsers failed, retrying once...', err)
        await new Promise((resolve) => setTimeout(resolve, 800))
        return loadUsers(page, search, status, append, retryCount + 1)
      }

      console.error('Failed to load users:', err)

      if (append) {
        // This was a "load more" request — disable further pagination so the
        // infinite-scroll observer doesn't keep re-firing on the same broken page.
        setHasMore(false)
        if (!isInvalidPage) {
          toast.error("Couldn't load more users.")
        }
      } else if (users.length === 0) {
        // Don't blow away an already-populated list on a transient failure —
        // only show the full error state if we truly have nothing to show.
        setError("Failed to load users. Please try again.")
      } else {
        toast.error("Couldn't refresh the users list — showing existing data.")
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // ============================================================
  // FIX 3: loadMoreUsers - triggers next page load
  // ============================================================
  const loadMoreUsers = () => {
    if (loadingMore || loading || !hasMore) return
    const nextPage = serverPage + 1
    setServerPage(nextPage)
    loadUsers(nextPage, searchQuery, statusFilter, true)
  }

  // ============================================================
  // FIX 4: Infinite scroll observer effect for PPPoE/Static
  // ============================================================
  useEffect(() => {
    const target = observerTarget.current
    if (!target) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreUsers()
      },
      { threshold: 0.1 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [loadingMore, loading, hasMore, serverPage, searchQuery, statusFilter])

  // ============================================================
  // STEP 3: Add observer effects for Online and Hotspot
  // ============================================================
  useEffect(() => {
    const target = onlineObserverTarget.current
    if (!target || activeTab !== "online-sessions") return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreOnlineSessions() },
      { threshold: 0.1 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [onlineLoadingMore, onlineSessionsLoading, onlineHasMore, onlinePage, activeTab])

  useEffect(() => {
    const target = hotspotObserverTarget.current
    if (!target || activeTab !== "hotspot") return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        setHotspotPage(p => {
          const filtered = activeSubscriptions.hotspot.filter(item => {
            const isActive = item.is_active_sub ?? (item.subscription_status === 'active' && item.expiry_date && new Date(item.expiry_date) > new Date())
            return hotspotSubFilter === "active" ? isActive : !isActive
          })
          return p * hotspotPageSize >= filtered.length ? p : p + 1
        })
      },
      { threshold: 0.1 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [activeTab, activeSubscriptions.hotspot, hotspotSubFilter])

  // ============================================================
  // FIX 5: Ensure online session data is available for Hotspot tab
  // This fixes the root cause: hotspotOnlineSet derived from onlineSessions,
  // but onlineSessions is only fetched when you click the "Online Now" tab.
  // Landing directly on the Hotspot tab never triggers that fetch.
  // ============================================================
  useEffect(() => {
    if (activeTab === "hotspot" && onlineSessions.length === 0 && !onlineSessionsLoading) {
      loadOnlineSessions(1, false)
    }
  }, [activeTab])

  // ============================================================
  // FIX 6: handleRefresh - resets pagination state
  // ============================================================
  const handleRefresh = async () => {
    setRefreshing(true)
    setServerPage(1)
    setHasMore(true)
    await Promise.all([
      loadUsers(1, searchQuery, statusFilter, false),
      loadOnlineMap(),
      loadServerStats(),
      loadStatusCounts(),
    ])
    setRefreshing(false)
  }

  // ============================================================
  // NEW: handleExportUsers - fetch-all export
  // ============================================================
  const handleExportUsers = async () => {
    try {
      setExporting(true)

      const statusMap: Record<string, string> = {
        active: 'ACTIVE',
        pending: 'PENDING',
        suspended: 'SUSPENDED',
        inactive: 'INACTIVE',
        terminated: 'TERMINATED',
      }

      const rows: { name: string; phone: string; pppoe_username: string; pppoe_password: string }[] = []

      // Special case: "expired" status is sourced from RADIUS credentials, not /customers/
      if (statusFilter === "expired") {
        let page = 1
        const pageSize = 200
        let total = Infinity

        while (rows.length < total) {
          const res = await adminApi.getRADIUSCredentials({
            page_size: String(pageSize),
            page: String(page),
            expired_only: "true",
          })
          total = res.count ?? 0
          for (const cred of res.results || []) {
            rows.push({
              name: (cred as any).customer_name || "",
              phone: (cred as any).customer_phone || "",
              pppoe_username: cred.username || "",
              pppoe_password: cred.password || "",
            })
          }
          if (!res.results || res.results.length === 0) break
          page += 1
        }
      } else {
        // Normal customers list — page through everything matching current filters
        let page = 1
        const pageSize = 200
        let total = Infinity

        while ((page - 1) * pageSize < total) {
          const params: Record<string, string> = {
            page_size: String(pageSize),
            page: String(page),
          }
          if (searchQuery.trim()) params.search = searchQuery.trim()
          if (statusFilter !== "all") {
            params.status = statusMap[statusFilter] || statusFilter.toUpperCase()
          }

          const res = await adminApi.getCustomers(params)
          total = res.count ?? 0

          for (const customer of res.results || []) {
            const u = mapCustomerToUser(customer)
            rows.push({
              name: u.name,
              phone: u.phone,
              pppoe_username: u.radiusCredentials?.username || "",
              pppoe_password: u.radiusCredentials?.password || "",
            })
          }

          if (!res.results || res.results.length === 0) break
          page += 1
        }
      }

      if (rows.length === 0) {
        toast.error("No users to export")
        return
      }

      const headers = ["Name", "Phone", "PPPoE Username", "PPPoE Password"]
      const escapeCsv = (val: string) => `"${String(val ?? "").replace(/"/g, '""')}"`

      const csvContent = [
        headers.join(","),
        ...rows.map((r) =>
          [r.name, r.phone, r.pppoe_username, r.pppoe_password].map(escapeCsv).join(",")
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(`Exported ${rows.length} user(s)`)
    } catch (err: any) {
      console.error("Export failed:", err)
      toast.error(err.message || "Failed to export users")
    } finally {
      setExporting(false)
    }
  }

  // ============================================================
  // FIX: handleCreateCustomer - add plan validation, remove password check,
  // auto-derive password from phone number
  // ============================================================
  const handleCreateCustomer = async () => {
    // Validate required fields
    if (!newCustomerForm.first_name || !newCustomerForm.last_name) {
      toast.error("First name and last name are required")
      return
    }
    if (!newCustomerForm.phone) {
      toast.error("Phone number is required")
      return
    }

    // NEW: block creation if there are no plans to choose from, or none selected
    if (plans.length === 0) {
      toast.error("No plans exist for this ISP yet. Create a plan before adding users.")
      return
    }
    if (!newCustomerForm.plan_id) {
      toast.error("Please select a plan. Users cannot be created without a plan.")
      return
    }

    try {
      setCreating(true)
      // REMOVED: password check - auto-derive from phone number
      const customerData = {
        first_name: newCustomerForm.first_name,
        last_name: newCustomerForm.last_name,
        email: newCustomerForm.email || undefined,
        phone: newCustomerForm.phone,
        password: newCustomerForm.phone,   // auto-derive; matches phone-based portal login
        location: newCustomerForm.location || undefined,
        status: 'active' as const,
      }

      const newCustomer = await adminApi.createCustomer(customerData)
      
      let newService = null
      if (newCustomerForm.connection_type) {
        try {
          const serviceData: Record<string, any> = {
            service_type: 'INTERNET',
            auth_connection_type: newCustomerForm.connection_type.toUpperCase(),
            status: newCustomerForm.activate_now ? 'ACTIVE' : 'PENDING',
            activate_now: newCustomerForm.activate_now,
            activation_delay_minutes: newCustomerForm.activation_delay_minutes || 0,
            // FIX: Use phone as RADIUS password fallback (not newCustomerForm.password)
            radius_password: newCustomerForm.radius_password || newCustomerForm.phone,
          }

          if (newCustomerForm.radius_username) {
            serviceData.radius_username = newCustomerForm.radius_username
          }

          if (newCustomerForm.assigned_ip) {
            serviceData.assigned_ip = parseInt(newCustomerForm.assigned_ip, 10)
          } else if (selectedPlanPool) {
            try {
              const autoRes = await adminApi.getIPPoolAvailableIPs(selectedPlanPool)
              if ((autoRes.results?.length ?? 0) > 0) {
                serviceData.assigned_ip = autoRes.results[0].id
                toast.info(`Auto-assigned IP: ${autoRes.results[0].ip_address}`)
              } else {
                toast.warning('IP pool has no available addresses. User will be created without a static IP.')
              }
            } catch {
              // Non-fatal — backend may still assign dynamically
            }
          }
          
          if (newCustomerForm.plan_id) {
            const planId = parseInt(newCustomerForm.plan_id, 10)
            serviceData.plan = planId
            
            const selectedPlan = plans.find(p => p.id === planId)
            if (selectedPlan) {
              serviceData.download_speed = selectedPlan.download_speed
              serviceData.upload_speed = selectedPlan.upload_speed
              serviceData.monthly_price = selectedPlan.price
            }
          }
          
          newService = await adminApi.createCustomerService(newCustomer.id, serviceData)
        } catch (serviceError: any) {
          console.error('Service creation error:', serviceError)
          toast.error(serviceError.message || 'Failed to create service for customer')
        }
      }

      if (newCustomerForm.activate_now && newService?.id) {
        const activatePayload: Record<string, any> = {}
        
        if (newCustomerForm.record_initial_payment && newCustomerForm.initial_payment_amount) {
          activatePayload.record_payment = true
          activatePayload.payment_amount = parseFloat(String(newCustomerForm.initial_payment_amount))
          activatePayload.payment_reference = newCustomerForm.initial_payment_reference || 'MANUAL'
          activatePayload.payment_notes = 'Initial payment on service activation'
        }
        
        try {
          const activateResult = await adminApi.activateService(newCustomer.id, newService.id, activatePayload)
          
          if (activateResult?.billing_account_number) {
            toast.success(
              `✅ Service activated! Paybill Account: ${activateResult.billing_account_number}`,
              { duration: 8000 }
            )
          }
        } catch (e: any) {
          console.warn('Activation failed:', e)
        }
      }

      toast.success(`Customer ${newCustomer.full_name} created successfully!`)
      
      // Reset form (password field removed)
      setNewCustomerForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        location: "",
        radius_username: "",
        radius_password: "",
        connection_type: "pppoe",
        plan_id: "",
        assigned_ip: "",
        activate_now: true,
        activation_delay_minutes: 0,
        record_initial_payment: false,
        initial_payment_amount: '',
        initial_payment_reference: '',
      })
      setPoolsList([])
      setAvailableIPs([])
      setIpSearchQuery("")
      setShowAddUserDialog(false)

      // ============================================================
      // FIX 7: Small delay so the newly created customer/service/RADIUS
      // rows are fully committed before we re-query the list
      // (matters on large tenants).
      // ============================================================
      await new Promise((resolve) => setTimeout(resolve, 400))

      await loadUsers(1, searchQuery, statusFilter, false)
      setServerPage(1)
      setHasMore(true)
      await loadServerStats()
      await loadStatusCounts()
      
    } catch (err: any) {
      console.error('Failed to create customer:', err)
      toast.error(err.message || "Failed to create customer. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const handleOpenHotspotDetail = (item: ActiveSubscription) => {
    const clientId = (item as any).client_id
    if (clientId) {
      router.push(`/admin/users/hotspot/${clientId}`)
    }
  }

  const handleExtendHotspot = (item: ActiveSubscription) => {
    setHotspotSessionToExtend(item)
    setHotspotExtendForm({ duration_amount: 1, duration_unit: 'HOURS' })
    setHotspotExtendManualDate("")
    setHotspotExtendManualTime("23:59")
    setHotspotExtendMode("duration")
    setShowExtendHotspotDialog(true)
  }

  const confirmExtendHotspot = async () => {
    if (!hotspotSessionToExtend?.session_id) return
    try {
      setExtendingHotspot(true)
      let payload: any = {}
      if (hotspotExtendMode === "date" && hotspotExtendManualDate) {
        const iso = `${hotspotExtendManualDate}T${hotspotExtendManualTime || "23:59"}:00`
        if (new Date(iso) <= new Date()) { 
          toast.error("Date must be in the future")
          return 
        }
        payload.expiry_date = new Date(iso).toISOString()
      } else {
        payload.duration_amount = hotspotExtendForm.duration_amount
        payload.duration_unit = hotspotExtendForm.duration_unit
      }
      const result = await adminApi.extendHotspotSession(hotspotSessionToExtend.session_id, payload)
      toast.success(result.message || "Hotspot session extended")
      setShowExtendHotspotDialog(false)
      setHotspotSessionToExtend(null)
      await loadActiveSubscriptions()
    } catch (err: any) {
      toast.error(err.message || "Failed to extend hotspot session")
    } finally {
      setExtendingHotspot(false)
    }
  }

  const handleDeleteHotspotClient = (clientId: number, username: string) => {
    setHotspotDeleteTarget({ clientId, username })
    setShowHotspotDeleteDialog(true)
  }

  const confirmDeleteHotspotClient = async () => {
    if (!hotspotDeleteTarget) return
    try {
      setDeletingHotspot(true)
      await adminApi.deleteHotspotClient(hotspotDeleteTarget.clientId)
      toast.success('Hotspot client deleted')
      setShowHotspotDeleteDialog(false)
      setHotspotDeleteTarget(null)
      await loadActiveSubscriptions()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete client')
    } finally {
      setDeletingHotspot(false)
    }
  }

  const generateUsernameFromPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    let username = digits.startsWith('254') ? digits.slice(3) : 
                   digits.startsWith('0') ? digits.slice(1) : digits
    return username.slice(-9)
  }

  const onlineSessionsByUsername = useMemo(() => {
    const map = new Map<string, OnlineSession>()
    for (const s of onlineSessions) {
      if (s.username) map.set(s.username, s)
    }
    return map
  }, [onlineSessions])

  const enrichedUsers = useMemo(() => {
    return users.map((user) => {
      const username = user.radiusCredentials?.username
      if (!username || !onlineMap[username]) {
        return { ...user, connectionStatus: 'offline' as const }
      }

      const sessionInfo = onlineMap[username]
      return {
        ...user,
        connectionStatus: 'online' as const,
        liveUsageString: sessionInfo.usage,
        ipAddress: sessionInfo.ip || user.ipAddress,
        macAddress: sessionInfo.mac || user.macAddress,
        lastOnline: 'Now',
      }
    })
  }, [users, onlineMap])

  const activeHotspotClients = useMemo(() => {
    return hotspotClients.filter(client => {
      if (!client.current_session) return false;
      return client.current_session.status === 'active' || 
             client.current_session.status === 'paid';
    });
  }, [hotspotClients]);

  const stats: UserStats = useMemo(() => {
    const onlineCount = Object.keys(onlineMap).length
    
    const activeHotspotCount = (activeSubscriptions.hotspot?.filter(h => 
      h.is_active_sub ?? (h.subscription_status === 'active' && h.expiry_date && new Date(h.expiry_date) > new Date())
    ).length || 0)
    
    const activePPPoECount = activeSubscriptions.pppoe?.length || 0
    const totalActiveSubs = activeHotspotCount + activePPPoECount

    return {
      total: totalCount,
      active: serverStatusCounts.active,
      pending: serverStatusCounts.pending,
      suspended: serverStatusCounts.suspended,
      expired: serverStats.expired,
      online: onlineCount,
      pppoe: totalCount,
      static: 0,
      hotspot: activeHotspotCount,
      totalActiveSubs,
    }
  }, [totalCount, serverStatusCounts, serverStats.expired, onlineMap, activeSubscriptions])

  const filteredUsers = useMemo(() => {
    if (statusFilter === "expired") {
      console.log('🔍 Filtering expired users, count:', expiredUsers.length)
      if (!searchQuery.trim()) return expiredUsers
      const q = searchQuery.toLowerCase()
      return expiredUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          (u.radiusCredentials?.username || "").toLowerCase().includes(q)
      )
    }

    return enrichedUsers.filter((user) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "pppoe" && user.type === "pppoe") ||
        (activeTab === "static" && user.type === "static")

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter !== "expired" && user.status === statusFilter)

      return matchesTab && matchesStatus
    })
  }, [enrichedUsers, expiredUsers, activeTab, statusFilter, searchQuery])

  const totalPages = Math.ceil(totalCount / 50)

  const filteredOnlineSessions = useMemo(() => {
    return onlineSessions.filter((session) => {
      const matchesSearch = !onlineSearchQuery || (
        session.username.toLowerCase().includes(onlineSearchQuery.toLowerCase()) ||
        session.full_name.toLowerCase().includes(onlineSearchQuery.toLowerCase()) ||
        session.phone_number.includes(onlineSearchQuery) ||
        session.ip_address.includes(onlineSearchQuery) ||
        session.mac_address.toLowerCase().includes(onlineSearchQuery.toLowerCase())
      )
      const matchesService = onlineServiceFilter === "all" || session.service_type === onlineServiceFilter
      return matchesSearch && matchesService
    })
  }, [onlineSessions, onlineSearchQuery, onlineServiceFilter])

  const onlineTotalPages = Math.ceil(filteredOnlineSessions.length / onlinePageSize)

  const hotspotLiveUsageMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const session of onlineSessions) {
      if ((session as any).canonical_username && session.usage) {
        map.set(session.username, session.usage)
      }
    }
    return map
  }, [onlineSessions])

  const hotspotOnlineSet = useMemo(() => {
    const set = new Set<string>()
    for (const session of onlineSessions) {
      if (session.username) set.add(session.username)
    }
    return set
  }, [onlineSessions])

  // ============================================================
  // FIX 8: Debounced search - resets pagination
  // ============================================================
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setServerPage(1)
      setHasMore(true)
      loadUsers(1, searchQuery, statusFilter, false)
    }, 400)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery, statusFilter])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((u) => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  const getStatusBadge = (status: UserStatus) => {
    const variants: Record<UserStatus, string> = {
      active: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
      inactive: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      expired: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
      suspended: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      pending: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      online: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      offline: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    }
    return (
      <Badge variant="outline" className={variants[status] || variants.active}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getConnectionBadge = (status: "online" | "offline") => {
    if (status === "online") {
      return (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Online</span>
        </div>
      )
    }
    return (
      <span className="text-sm text-slate-400 dark:text-slate-500">Offline</span>
    )
  }

  const getTypeBadge = (type: UserType) => {
    const config: Record<UserType, { icon: typeof Wifi; class: string; label: string }> = {
      pppoe: { icon: Globe, class: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800", label: "PPPoE" },
      static: { icon: Server, class: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800", label: "Static IP" },
      fiber: { icon: Signal, class: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800", label: "Fiber" },
      wireless: { icon: Wifi, class: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800", label: "Wireless" },
    }
    const typeConfig = config[type] || config.pppoe
    const Icon = typeConfig.icon
    return (
      <Badge variant="outline" className={typeConfig.class}>
        <Icon className="w-3 h-3 mr-1" />
        {typeConfig.label}
      </Badge>
    )
  }

  const handleViewUser = (user: User) => {
    router.push(`/admin/users/${user.customerId}`)
  }

  const handleDisconnectUser = async (user: User) => {
    if (!user.serviceId) {
      toast.error("No active service to disconnect")
      return
    }
    try {
      await adminApi.suspendService(user.customerId, user.serviceId, 'Manual disconnect')
      toast.success(`${user.name} disconnected`)
      await Promise.all([loadUsers(serverPage, searchQuery, statusFilter, false), loadOnlineMap()])
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect user')
    }
  }

  // ============================================================
  // NEW: Refresh Internet handler
  // ============================================================
  const handleRefreshInternet = async (user: User) => {
    if (!user.radiusCredentials?.id) {
      toast.error("No RADIUS credentials found for this user")
      return
    }
    try {
      const result = await adminApi.refreshInternet(user.radiusCredentials.id)
      if (result.status === 'success') {
        toast.success(result.message)
      } else if (result.status === 'not_connected') {
        toast.info(result.message)
      } else {
        toast.error(result.message || 'Failed to refresh internet')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh internet')
    }
  }

  const handleEditIP = async (user: User) => {
    setUserToEditIP(user)
    setSelectedNewIPId("")
    setEditIPSearchQuery("")
    setEditIPAvailableIPs([])
    setEditIPPoolId(null)
    setShowEditIPDialog(true)

    if (!user.serviceId) {
      toast.error("No service found for this user")
      return
    }
    try {
      setEditIPLoading(true)

      const rawServices = await adminApi.getCustomerServices(user.customerId)
      const services: CustomerService[] = Array.isArray(rawServices)
        ? rawServices
        : ((rawServices as any)?.results ?? [])

      const svc = services.find((s: CustomerService) => s.id === user.serviceId) || services[0]

      let poolId: number | null = null

      if (svc?.plan?.ip_pool && typeof svc.plan.ip_pool === 'number') {
        poolId = svc.plan.ip_pool
      } else if (svc?.plan?.id) {
        const fullPlan = await adminApi.getPlan(svc.plan.id)
        poolId = typeof fullPlan?.ip_pool === 'number' ? fullPlan.ip_pool : null
      }

      if (poolId) {
        setEditIPPoolId(poolId)
        const resp = await adminApi.getIPPoolAvailableIPs(poolId)
        setEditIPAvailableIPs(resp.results || [])
        if (!resp.results?.length) {
          toast.error("No available IPs in this pool — all IPs may be assigned")
        }
      } else {
        toast.error("No IP pool assigned to this user's plan. Assign an IP pool to the plan first.")
      }
    } catch (err: any) {
      console.error("handleEditIP error:", err)
      toast.error(err.message || 'Could not load available IPs for this plan')
    } finally {
      setEditIPLoading(false)
    }
  }

  const handleOpenChangePlan = async (user: User) => {
    try {
      setUserToChangePlan(user)
      setShowChangePlanDialog(true)
      setChangePlanLoading(true)
      setChangePlanOptions([])
      setSelectedChangePlanId("")

      const payload: CustomerAvailablePlansResponse = await adminApi.getCustomerAvailablePlans(user.customerId, user.serviceId)
      setChangePlanOptions(payload.plans || [])
      setChangePlanServiceId(payload.service_id ?? user.serviceId ?? null)
      setCurrentPlanId(payload.current_plan_id ?? null)
      setCurrentPlanName(payload.current_plan_name ?? user.plan ?? null)
      setSelectedChangePlanId(payload.current_plan_id ? String(payload.current_plan_id) : "")
    } catch (err: any) {
      console.error("Failed to load available plans:", err)
      toast.error(err.message || "Failed to load available plans")
      setShowChangePlanDialog(false)
      setUserToChangePlan(null)
    } finally {
      setChangePlanLoading(false)
    }
  }

  const handleConfirmChangePlan = async () => {
    if (!userToChangePlan || !selectedChangePlanId) {
      toast.error("Select a plan to continue")
      return
    }

    try {
      setChangePlanSaving(true)
      const result = await adminApi.changeCustomerPlan(
        userToChangePlan.customerId,
        parseInt(selectedChangePlanId, 10),
        changePlanServiceId
      )

      toast.success(result?.message || "Plan changed successfully")

      if (selectedUser?.customerId === userToChangePlan.customerId) {
        const selectedPlan = changePlanOptions.find((plan) => plan.id === parseInt(selectedChangePlanId, 10))
        if (selectedPlan) {
          setSelectedUser({
            ...selectedUser,
            plan: selectedPlan.name,
            planPrice: parseFloat(selectedPlan.price || "0"),
            serviceId: result?.service?.id ?? selectedUser.serviceId,
            downloadSpeed: result?.service?.download_speed ?? selectedUser.downloadSpeed,
            uploadSpeed: result?.service?.upload_speed ?? selectedUser.uploadSpeed,
            dataLimit: result?.service?.data_cap ?? selectedUser.dataLimit,
          })
        }
      }

      setShowChangePlanDialog(false)
      setUserToChangePlan(null)
      await loadUsers(serverPage, searchQuery, statusFilter, false)
      await loadServerStats()
    } catch (err: any) {
      console.error("Failed to change plan:", err)
      toast.error(err.message || "Failed to change plan")
    } finally {
      setChangePlanSaving(false)
    }
  }
  
  const confirmEditIP = async () => {
    if (!userToEditIP || !userToEditIP.serviceId || !selectedNewIPId) {
      toast.error('Please select an IP address')
      return
    }
    try {
      setSavingIP(true)
      const result = await adminApi.changeServiceIP(
        userToEditIP.customerId,
        userToEditIP.serviceId,
        parseInt(selectedNewIPId, 10)
      )
      toast.success(result.message || 'IP address updated successfully')
      setShowEditIPDialog(false)
      setUserToEditIP(null)
      setEditIPPoolId(null)
      await loadUsers(serverPage, searchQuery, statusFilter, false)
      await loadOnlineMap()
    } catch (err: any) {
      toast.error(err.message || 'Failed to change IP address')
    } finally {
      setSavingIP(false)
    }
  }

  const handleExtendSubscription = (user: User) => {
    setUserToExtend(user)
    setExtendForm({ duration_amount: 1, duration_unit: 'DAYS', plan_id: '' })
    setExtendManualDate("")
    setExtendManualTime("23:59")
    setExtendMode("duration")
    loadPlans()
    setShowExtendDialog(true)
  }

  const confirmExtendSubscription = async () => {
    if (!userToExtend || !userToExtend.serviceId) {
      toast.error("No active service to extend")
      return
    }
    try {
      setExtending(true)
      
      if (extendMode === "date" && extendManualDate) {
        const timePart = extendManualTime || "23:59"
        const targetDate = new Date(`${extendManualDate}T${timePart}:00`)
        const now = new Date()
        if (targetDate <= now) {
          toast.error("Selected date and time must be in the future")
          return
        }
        
        const offsetMins = targetDate.getTimezoneOffset()
        const sign = offsetMins <= 0 ? '+' : '-'
        const absOffsetHrs = Math.floor(Math.abs(offsetMins) / 60).toString().padStart(2, '0')
        const absOffsetMins = (Math.abs(offsetMins) % 60).toString().padStart(2, '0')
        const localIso = `${extendManualDate}T${timePart}:00${sign}${absOffsetHrs}:${absOffsetMins}`
        
        await adminApi.extendService(
          userToExtend.customerId,
          userToExtend.serviceId,
          1,
          'DAYS',
          extendForm.plan_id ? parseInt(extendForm.plan_id, 10) : undefined,
          localIso
        )
        toast.success(
          `Expiry set to ${new Date(`${extendManualDate}T${timePart}:00`).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}${extendForm.plan_id ? ' · plan changed' : ''}`
        )
      } else {
        await adminApi.extendService(
          userToExtend.customerId,
          userToExtend.serviceId,
          extendForm.duration_amount,
          extendForm.duration_unit,
          extendForm.plan_id ? parseInt(extendForm.plan_id, 10) : undefined
        )
        const planNote = extendForm.plan_id ? ' (plan changed)' : ''
        toast.success(`Subscription extended by ${extendForm.duration_amount} ${extendForm.duration_unit.toLowerCase()}${planNote}`)
      }
      
      setShowExtendDialog(false)
      setUserToExtend(null)
      setExtendManualDate("")
      setExtendManualTime("23:59")
      setExtendMode("duration")
      await loadUsers(serverPage, searchQuery, statusFilter, false)
      await loadServerStats()
    } catch (err: any) {
      toast.error(err.message || 'Failed to extend subscription')
    } finally {
      setExtending(false)
    }
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteConfirmDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    try {
      setDeleting(true)
      await adminApi.deleteCustomer(userToDelete.customerId)
      toast.success(`${userToDelete.name} deleted successfully. RADIUS credentials cleaned up.`)
      setShowDeleteConfirmDialog(false)
      setUserToDelete(null)
      await Promise.all([loadUsers(serverPage, searchQuery, statusFilter, false), loadOnlineMap(), loadServerStats(), loadStatusCounts()])
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return
    const usersToDelete = enrichedUsers.filter(u => selectedUsers.includes(u.id))
    try {
      setDeleting(true)
      for (const user of usersToDelete) {
        await adminApi.deleteCustomer(user.customerId)
      }
      toast.success(`${usersToDelete.length} user(s) deleted successfully`)
      setSelectedUsers([])
      await Promise.all([loadUsers(serverPage, searchQuery, statusFilter, false), loadOnlineMap(), loadServerStats(), loadStatusCounts()])
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete some users')
      await Promise.all([loadUsers(serverPage, searchQuery, statusFilter, false), loadOnlineMap(), loadServerStats(), loadStatusCounts()])
    } finally {
      setDeleting(false)
    }
  }

  const handleActivateUser = async (user: User) => {
    if (!user.serviceId) {
      toast.error("No service to activate")
      return
    }
    try {
      setActivating(true)
      await adminApi.activateService(user.customerId, user.serviceId)
      toast.success(`${user.name} activated! Expiration timer starts now.`)
      await loadUsers(serverPage, searchQuery, statusFilter, false)
      await loadServerStats()
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate user')
    } finally {
      setActivating(false)
    }
  }

  const handleToggleRadius = async (user: User, enable: boolean) => {
    try {
      setTogglingRadius(true)
      await adminApi.toggleRadius(
        user.customerId,
        enable,
        enable ? 'Enabled via admin panel' : 'Disabled via admin panel'
      )
      toast.success(`RADIUS ${enable ? 'enabled' : 'disabled'} for ${user.name}`)
      await loadUsers(serverPage, searchQuery, statusFilter, false)
    } catch (err: any) {
      toast.error(err.message || `Failed to ${enable ? 'enable' : 'disable'} RADIUS`)
    } finally {
      setTogglingRadius(false)
    }
  }

  // ============================================================
  // CLAUDE CHANGE #2: SUSPEND HELPERS & HANDLERS
  // ============================================================
  const isSuspended = (user: User) => user.radiusCredentials?.is_enabled === false

  const handleOpenSuspendDialog = (user: User) => {
    setSuspendTarget(user)
    setShowSuspendDialog(true)
  }

  const confirmToggleSuspend = async () => {
    if (!suspendTarget) return
    const currentlySuspended = isSuspended(suspendTarget)
    try {
      setSuspending(true)
      if (currentlySuspended) {
        // Unsuspend: resume internet — subscription/expiry untouched
        await adminApi.toggleRadius(suspendTarget.customerId, true, 'Unsuspended via admin panel')
        toast.success(`${suspendTarget.name} unsuspended — internet access resumed`)
      } else {
        // Suspend: pause internet immediately, subscription kept intact
        await adminApi.toggleRadius(suspendTarget.customerId, false, 'Suspended via admin panel')
        if (suspendTarget.connectionStatus === 'online' && suspendTarget.radiusCredentials?.username) {
          await adminApi.disconnectRADIUSUser(suspendTarget.radiusCredentials.username).catch(() => {})
        }
        toast.success(`${suspendTarget.name} suspended — internet access paused`)
      }
      setShowSuspendDialog(false)
      setSuspendTarget(null)
      await Promise.all([loadUsers(serverPage, searchQuery, statusFilter, false), loadOnlineMap()])
    } catch (err: any) {
      toast.error(err.message || 'Failed to update suspension status')
    } finally {
      setSuspending(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditForm({
      first_name: user.name.split(' ')[0] || '',
      last_name: user.name.split(' ').slice(1).join(' ') || '',
      email: (user.email === 'No email' || user.email === 'no email') ? '' : (user.email || ''),
      phone: user.phone === 'No phone' ? '' : (user.phone || ''),
      radius_username: user.radiusCredentials?.username || '',
      radius_password: user.radiusCredentials?.password || '',
      location: user.location || '',
    })
    setSelectedUser(user)
    setShowEditUserDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    
    try {
      setUpdating(true)
      
      await adminApi.updateCustomer(selectedUser.customerId, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        ...(editForm.email.trim() ? { email: editForm.email.trim() } : {}),
        phone: editForm.phone,
        location: editForm.location,
      })
      
      const radiusUpdate: { password?: string; username?: string } = {}
      
      if (editForm.radius_username && editForm.radius_username !== selectedUser.radiusCredentials?.username) {
        radiusUpdate.username = editForm.radius_username
      }
      
      if (editForm.radius_password) {
        radiusUpdate.password = editForm.radius_password
      }
      
      if (Object.keys(radiusUpdate).length > 0 && selectedUser.radiusCredentials) {
        try {
          await adminApi.updateRADIUSCredentials(selectedUser.customerId, radiusUpdate)
        } catch (radiusError) {
          console.warn('RADIUS update optional error:', radiusError)
          toast.error('Failed to update RADIUS credentials')
        }
      }
      
      toast.success('User updated successfully!')
      setShowEditUserDialog(false)
      await loadUsers(serverPage, searchQuery, statusFilter, false)
      
    } catch (err: any) {
      console.error('Failed to update user:', err)
      toast.error(err.message || 'Failed to update user')
    } finally {
      setUpdating(false)
    }
  }

  const handleGeneratePassword = () => {
    const newPassword = generateSimplePassword(8)
    setEditForm(prev => ({ ...prev, radius_password: newPassword }))
  }

  const handleRegenerateUsername = async () => {
    if (!selectedUser) return
    
    try {
      setUpdating(true)
      const result = await adminApi.regenerateRADIUSUsername(selectedUser.customerId)
      setEditForm(prev => ({ ...prev, radius_username: result.new_username }))
      toast.success(`Username updated: ${result.new_username}`)
    } catch (err: any) {
      console.error('Failed to regenerate username:', err)
      toast.error(err.message || 'Failed to regenerate username')
    } finally {
      setUpdating(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  // SMS Helpers
  const SMS_VARIABLES = [
    { key: '{firstname}', label: 'First Name' },
    { key: '{package}', label: 'Package' },
    { key: '{expiry}', label: 'Expiry' },
    { key: '{paybill}', label: 'M‑Pesa Paybill' },
    { key: '{account}', label: 'Billing Account' },
    { key: '{amount}', label: 'Amount' },
  ]

  const resolveMessageVariables = (message: string, user: User): string => {
    const expiryDate = new Date(user.expiryDate)
    const expiryFormatted =
      expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' +
      expiryDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    const paybillShortcode = mpesaConfig?.business_shortcode || 'N/A'

    return message
      .replace(/{firstname}/g, user.name.split(' ')[0] || user.name)
      .replace(/{package}/g, user.plan)
      .replace(/{expiry}/g, expiryFormatted)
      .replace(/{paybill}/g, paybillShortcode)
      .replace(/{account}/g, user.billingAccountNumber || '—')
      .replace(/{amount}/g, `KES ${user.planPrice.toLocaleString()}`)
  }

  const handleOpenUserSms = (user: User) => {
    setUserSmsTarget(user)
    setUserSmsMessage("")
    setShowUserSmsDialog(true)
  }

  // ============================================================
  // FIX: handleSendUserSms - belt-and-braces phone guard
  // ============================================================
  const handleSendUserSms = async () => {
    if (!userSmsTarget || !userSmsMessage.trim()) return
    
    // ============================================================
    // FIX: Belt-and-braces guard - prevent 400 from missing phone
    // ============================================================
    if (!userSmsTarget.phone || userSmsTarget.phone === "No phone") {
      toast.error("This user has no phone number on file — cannot send SMS")
      return
    }
    
    try {
      setSendingUserSms(true)
      const resolved = resolveMessageVariables(userSmsMessage, userSmsTarget)
      await adminApi.sendSMS({ recipient: userSmsTarget.phone, message: resolved, customer: userSmsTarget.customerId })
      toast.success(`SMS sent to ${userSmsTarget.name}`)
      setShowUserSmsDialog(false)
      setUserSmsMessage("")
    } catch (err: any) {
      toast.error(err.message || 'Failed to send SMS')
    } finally {
      setSendingUserSms(false)
    }
  }

  // ============================================================
  // FIX: handleSendSingleSms - belt-and-braces phone guard
  // ============================================================
  const handleSendSingleSms = async () => {
    if (!smsTarget || !smsMessage.trim()) return
    
    // ============================================================
    // FIX: Belt-and-braces guard - prevent 400 from missing phone
    // ============================================================
    if (!smsTarget.phone || smsTarget.phone === "No phone") {
      toast.error("This user has no phone number on file — cannot send SMS")
      return
    }
    
    try {
      setSendingSms(true)
      
      const rawPhone = smsTarget.phone || ""
      const normalizedPhone = rawPhone.replace(/^254/, "0").replace(/^\+254/, "0")
      
      let finalMessage = smsMessage.trim()
      if (finalMessage.includes("Username:") && finalMessage.includes("Password:")) {
        const email = smsTarget.email && smsTarget.email !== "No email" ? smsTarget.email : "your email"
        const portalUrl = `${tenantSubdomain}.netily.co.ke/customer/login`
        finalMessage = `Hello ${smsTarget.name}, login to your customer portal at ${portalUrl} using: Username: ${normalizedPhone} | Password: ${normalizedPhone}`
      }
      
      await adminApi.sendSMS({
        recipient: smsTarget.phone,
        message: finalMessage,
      })
      toast.success(`SMS sent to ${smsTarget.name}`)
      setShowSmsDialog(false)
      setSmsMessage("")
      setSmsTarget(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to send SMS")
    } finally {
      setSendingSms(false)
    }
  }

  const handleSendBulkSms = async () => {
    if (selectedUsers.length === 0 || !smsMessage.trim()) return
    try {
      setSendingSms(true)
      const usersToNotify = enrichedUsers.filter(u => selectedUsers.includes(u.id))
      for (const user of usersToNotify) {
        if (user.phone && user.phone !== 'No phone') {
          let finalMessage = smsMessage.trim()
          if (finalMessage.includes("Username:") && finalMessage.includes("Password:")) {
            const rawPhone = user.phone || ""
            const normalizedPhone = rawPhone.replace(/^254/, "0").replace(/^\+254/, "0")
            const email = user.email && user.email !== "No email" ? user.email : "your email"
            const portalUrl = `${tenantSubdomain}.netily.co.ke/customer/login`
            finalMessage = `Hello ${user.name}, login to your customer portal at ${portalUrl} using: Username: ${normalizedPhone} | Password: ${normalizedPhone}`
          }
          await adminApi.sendSMS({
            recipient: user.phone,
            message: finalMessage,
            customer: user.customerId,
          })
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      toast.success(`SMS sent to ${usersToNotify.length} user(s)`)
      setShowSmsDialog(false)
      setSmsMessage("")
      setSmsTarget(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to send bulk SMS")
    } finally {
      setSendingSms(false)
    }
  }

  const totalActiveSubscriptions = (activeSubscriptions.pppoe?.length || 0) + (activeSubscriptions.hotspot?.length || 0)

  if (error) {
    return (
      <PageWrapper>
        <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
          <p className="text-muted-foreground mt-1">Manage Hotspot, PPPoE, and Static IP users</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={refreshing} 
            className="w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/users/import')} 
            className="w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileUp className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          {perms.canAdd && (
            <>
              <Dialog open={showAddUserDialog} onOpenChange={(open) => {
                setShowAddUserDialog(open)
                if (open) {
                  loadPlans()
                  loadRouters()
                }
              }}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    disabled={plansLoading}
                    onClick={() => {
                      if (!plansLoading && plans.length === 0) {
                        toast.error("Create a plan first before adding users.")
                      }
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="admin-theme-dialog max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-0">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="p-6"
                  >
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                      <DialogDescription>
                        Create a new customer. RADIUS credentials are auto-created for PPPoE/Static connections.
                      </DialogDescription>
                    </DialogHeader>

                    {/* Personal Info */}
                    <div className="space-y-4 mt-2">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-b dark:border-slate-700 pb-1">Personal Information</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="dark:text-slate-200">First Name <span className="text-red-500">*</span></Label>
                          <Input
                            placeholder="John"
                            value={newCustomerForm.first_name}
                            onChange={(e) => setNewCustomerForm({...newCustomerForm, first_name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="dark:text-slate-200">Last Name <span className="text-red-500">*</span></Label>
                          <Input
                            placeholder="Doe"
                            value={newCustomerForm.last_name}
                            onChange={(e) => setNewCustomerForm({...newCustomerForm, last_name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="dark:text-slate-200">Phone <span className="text-red-500">*</span></Label>
                          <Input
                            placeholder="07XXXXXXXX"
                            value={newCustomerForm.phone}
                            onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="dark:text-slate-200">Email <span className="text-xs text-slate-400">(optional)</span></Label>
                          <Input
                            placeholder="john@example.com"
                            value={newCustomerForm.email}
                            onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="dark:text-slate-200">Location <span className="text-xs text-slate-400">(optional)</span></Label>
                        <Input
                          placeholder="e.g. Westlands, Nairobi"
                          value={newCustomerForm.location}
                          onChange={(e) => setNewCustomerForm({...newCustomerForm, location: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Connection Details */}
                    <div className="space-y-4 mt-4">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-b dark:border-slate-700 pb-1">Connection Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="dark:text-slate-200">Connection Type</Label>
                          <Select
                            value={newCustomerForm.connection_type}
                            onValueChange={(value: "pppoe" | "static") => setNewCustomerForm({...newCustomerForm, connection_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pppoe">PPPoE</SelectItem>
                              <SelectItem value="static">Static IP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="dark:text-slate-200">Plan <span className="text-red-500 text-xs">*</span></Label>
                          <Select
                            value={newCustomerForm.plan_id || undefined}
                            onValueChange={(value) => setNewCustomerForm({...newCustomerForm, plan_id: value})}
                            disabled={plansLoading || plans.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                plansLoading ? "Loading..." 
                                : plans.length === 0 ? "No plans available — create one first"
                                : "Select plan (required)"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem key={plan.id} value={String(plan.id)}>
                                  {plan.name} - KES {parseFloat(plan.base_price || plan.price || "0").toLocaleString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {plans.length === 0 && (
                            <p className="text-xs text-destructive mt-1">
                              No plans exist yet — go to Plans and create one before adding users.
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedPlanPool && (
                        <div className="space-y-1">
                          <Label className="dark:text-slate-200">Assign Static IP <span className="text-xs text-slate-400">(optional)</span></Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Search IP (e.g. 10.50.3)"
                              value={ipSearchQuery}
                              onChange={(e) => {
                                setIpSearchQuery(e.target.value)
                                if (selectedPlanPool) {
                                  if (ipSearchDebounceRef.current) clearTimeout(ipSearchDebounceRef.current)
                                  ipSearchDebounceRef.current = setTimeout(() => {
                                    loadAvailableIPs(selectedPlanPool, e.target.value || undefined)
                                  }, 400)
                                }
                              }}
                              className="flex-1"
                            />
                          </div>
                          {availableIPsLoading ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Loading IPs...
                            </p>
                          ) : (
                            <div className="space-y-1">
                              <Select
                                value={newCustomerForm.assigned_ip || "none"}
                                onValueChange={(value) =>
                                  setNewCustomerForm({ ...newCustomerForm, assigned_ip: value === "none" ? "" : value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      availableIPs.length === 0
                                        ? "No IPs found — try searching"
                                        : `${availableIPs.length} IPs shown — search to filter`
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No Static IP (auto-assign)</SelectItem>
                                  {availableIPs.map((ip) => (
                                    <SelectItem key={ip.id} value={String(ip.id)}>
                                      <span className="font-mono">{ip.ip_address}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {availableIPs.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Showing {availableIPs.length} of{" "}
                                  {(availableIPs as any).total_available ?? "many"} available —
                                  type above to search
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* PPPoE / RADIUS Credentials Section */}
                    <div className="space-y-4 mt-4">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-b dark:border-slate-700 pb-1 flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        PPPoE / RADIUS Credentials
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Leave blank to auto-generate from phone number. 
                        Username defaults to last 9 digits of phone, password defaults to phone number.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="dark:text-slate-200">PPPoE Username <span className="text-xs text-slate-400">(optional)</span></Label>
                          <div className="flex gap-1">
                            <Input
                              placeholder="Auto from phone"
                              value={newCustomerForm.radius_username}
                              onChange={(e) => setNewCustomerForm({...newCustomerForm, radius_username: e.target.value})}
                              className="font-mono text-sm"
                              autoComplete="off"
                              name="pppoe-username-no-autofill"
                            />
                            {newCustomerForm.phone && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                title="Use phone number"
                                onClick={() => {
                                  const username = generateUsernameFromPhone(newCustomerForm.phone)
                                  setNewCustomerForm({...newCustomerForm, radius_username: username})
                                }}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="dark:text-slate-200">PPPoE Password <span className="text-xs text-slate-400">(optional)</span></Label>
                          <div className="flex gap-1">
                            <Input
                              placeholder="Auto from phone number"
                              type="password"
                              value={newCustomerForm.radius_password}
                              onChange={(e) => setNewCustomerForm({...newCustomerForm, radius_password: e.target.value})}
                              className="font-mono text-sm"
                              autoComplete="new-password"
                              name="pppoe-password-no-autofill"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Generate random password"
                              onClick={() => {
                                const pwd = generateSimplePassword(8)
                                setNewCustomerForm({...newCustomerForm, radius_password: pwd})
                              }}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/20 border dark:border-purple-800 rounded text-xs font-mono space-y-1">
                        <div className="flex gap-2">
                          <span className="text-purple-500 dark:text-purple-400 w-20">Username:</span>
                          <span className="text-purple-900 dark:text-purple-300 font-semibold">
                            {newCustomerForm.radius_username || 
                              (newCustomerForm.phone ? `(auto: ${generateUsernameFromPhone(newCustomerForm.phone)})` : '(waiting for phone)')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-purple-500 dark:text-purple-400 w-20">Password:</span>
                          <span className="text-purple-900 dark:text-purple-300 font-semibold">
                            {newCustomerForm.radius_password ? '(custom)' : '(auto: phone number)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Billing Account Notice */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-200">M-Pesa Paybill Account</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                          The account number is generated from the customer's phone number. 
                          You can edit it after creation.
                        </p>
                      </div>
                    </div>

                    {/* Activation Options */}
                    <div className="space-y-2 mt-4">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-b dark:border-slate-700 pb-1">Activation</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Activate Now", activate: true, delay: 0, desc: "Starts timer immediately" },
                          { label: "1hr Testing", activate: true, delay: 60, desc: "Auto-activates after 1 hour" },
                          { label: "Save Pending", activate: false, delay: 0, desc: "Activate manually later" },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setNewCustomerForm({ ...newCustomerForm, activate_now: opt.activate, activation_delay_minutes: opt.delay })}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              newCustomerForm.activate_now === opt.activate && newCustomerForm.activation_delay_minutes === opt.delay
                                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 ring-1 ring-blue-400"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                          >
                            <p className="text-xs font-medium text-foreground">{opt.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Record Initial Payment */}
                    {newCustomerForm.activate_now && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="record_payment"
                            checked={newCustomerForm.record_initial_payment || false}
                            onCheckedChange={(checked) => setNewCustomerForm({
                              ...newCustomerForm,
                              record_initial_payment: checked as boolean,
                              initial_payment_amount: checked
                                ? (plans.find(p => p.id === parseInt(newCustomerForm.plan_id || '0'))?.base_price || '')
                                : ''
                            })}
                          />
                          <Label htmlFor="record_payment" className="cursor-pointer text-sm dark:text-slate-200">Record initial payment</Label>
                        </div>
                        {newCustomerForm.record_initial_payment && (
                          <div className="grid grid-cols-2 gap-3 pl-6">
                            <div className="space-y-1">
                              <Label className="text-xs dark:text-slate-300">Amount (KES) <span className="text-red-500">*</span></Label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={newCustomerForm.initial_payment_amount || ''}
                                onChange={(e) => setNewCustomerForm({...newCustomerForm, initial_payment_amount: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs dark:text-slate-300">Reference <span className="text-xs text-slate-400">(optional)</span></Label>
                              <Input
                                placeholder="MPESA receipt / auto"
                                value={newCustomerForm.initial_payment_reference || ''}
                                onChange={(e) => setNewCustomerForm({...newCustomerForm, initial_payment_reference: e.target.value})}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={() => setShowAddUserDialog(false)} disabled={creating}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCustomer} disabled={creating}>
                        {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Customer"}
                      </Button>
                    </DialogFooter>
                  </motion.div>
                </DialogContent>
              </Dialog>

              {/* IP Binding Add Button - appears when IP Binding tab is active */}
              {activeTab === "ip-binding" && (
                <Button 
                  onClick={() => {
                    setShowAddIPBindingDialog(true)
                    loadRouters()
                  }}
                  disabled={creatingBinding}
                  className="w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add IP Binding
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto relative">
        {[
          { label: "Total", value: stats.total, key: "all", tab: "all", status: "all", color: "text-slate-800 dark:text-slate-200" },
          { label: "Online", value: stats.online, key: "online", tab: "online-sessions", status: "all", color: "text-emerald-600 dark:text-emerald-400", pulse: true },
          { label: "Active", value: stats.active, key: "active", tab: "all", status: "active", color: "text-green-600 dark:text-green-400" },
          { label: "Pending", value: stats.pending, key: "pending", tab: "all", status: "pending", color: "text-orange-500 dark:text-orange-400" },
          { label: "Suspended", value: stats.suspended, key: "suspended", tab: "all", status: "suspended", color: "text-yellow-600 dark:text-yellow-400" },
          { label: "Expired", value: serverStats.expired, key: "expired", tab: "all", status: "expired", color: "text-red-500 dark:text-red-400" },
        ].map(({ label, value, key, tab, status, color, pulse }) => {
          const isActive = activeStatFilter === key
          return (
            <button
              key={key}
              onClick={() => {
                setActiveStatFilter(key)
                setActiveTab(tab)
                setStatusFilter(status)
                // Reset online sessions when clicking Online stat
                if (tab === "online-sessions") {
                  setOnlinePage(1)
                  setOnlineHasMore(true)
                  loadOnlineSessions(1, false)
                }
                // Load IP bindings when clicking IP Binding stat (if we had one)
              }}
              className={`relative flex flex-col items-center px-4 py-2 rounded-lg transition-all duration-200 shrink-0 ${
                isActive ? "bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-300 dark:ring-slate-600" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
                <span className={`text-2xl font-black tabular-nums ${color}`}>
                  {value.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-slate-800 dark:bg-slate-200 rounded-full" />
              )}
            </button>
          )
        })}
        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />
        {[
          { label: "Hotspot Subs", value: stats.hotspot, key: "hotspot", tab: "hotspot", color: "text-pink-600 dark:text-pink-400" },
        ].map(({ label, value, key, tab, color }) => {
          const isActive = activeStatFilter === key
          return (
            <button
              key={key}
              onClick={() => {
                setActiveStatFilter(key)
                setActiveTab(tab)
                setStatusFilter("all")
                setHotspotSubFilter("active")
                setHotspotPage(1)
                // The new useEffect will load onlineSessions if needed
              }}
              className={`relative flex flex-col items-center px-4 py-2 rounded-lg transition-all duration-200 shrink-0 ${
                isActive ? "bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-300 dark:ring-slate-600" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className={`text-2xl font-black tabular-nums ${color}`}>
                {value.toLocaleString()}
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-pink-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Unified Filter Bar */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row gap-2"
      >
        <div className="relative flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 overflow-x-auto">
          {[
            { value: "all", label: "All PPPoE/Static", icon: Users },
            { value: "online-sessions", label: "Online Now", icon: Wifi },
            { value: "active-subs", label: "Active Subs", icon: CheckCircle2 },
            { value: "hotspot", label: "Hotspot", icon: Smartphone },
            { value: "ip-binding", label: "IP Binding", icon: RouterIcon },
          ].map(({ value, label, icon: Icon }) => (
            <motion.button
              key={value}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveTab(value)
                if (!["all"].includes(value)) setStatusFilter("all")
                // Reset online sessions when clicking Online tab
                if (value === "online-sessions") {
                  setOnlinePage(1)
                  setOnlineHasMore(true)
                  loadOnlineSessions(1, false)
                }
                if (value === "active-subs") loadAllActiveUsers()
                if (value === "hotspot" && activeSubscriptions.hotspot?.length === 0) loadActiveSubscriptions()
                if (value === "hotspot") {
                  setHotspotSubFilter("active")
                  setHotspotPage(1)
                }
                if (value === "ip-binding" && ipBindings.length === 0) {
                  loadIPBindings()
                }
              }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap z-10 ${
                activeTab === value
                  ? "text-white shadow-sm"
                  : "text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
              style={{ transition: "color 0.2s ease" }}
            >
              {activeTab === value && (
                <motion.span
                  layoutId="active-tab-pill"
                  className="absolute inset-0 bg-slate-900 dark:bg-slate-700 rounded-lg"
                  transition={{ type: "spring", duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Status filter for PPPoE/Static */}
        {!["online-sessions", "active-subs", "hotspot", "ip-binding"].includes(activeTab) && (
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 overflow-x-auto">
            {[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "pending", label: "Pending" },
              { value: "suspended", label: "Suspended" },
              { value: "expired", label: "Expired" },
            ].map(({ value, label }) => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setStatusFilter(value)
                  setServerPage(1)
                  setHasMore(true)
                  loadUsers(1, searchQuery, value, false)
                }}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  statusFilter === value
                    ? "text-white shadow-sm"
                    : "text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {statusFilter === value && (
                  <motion.span
                    layoutId="active-status-pill"
                    className="absolute inset-0 bg-slate-900 dark:bg-slate-700 rounded-lg"
                    transition={{ type: "spring", duration: 0.3 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Hotspot sub-filter */}
        {activeTab === "hotspot" && (
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 overflow-x-auto">
            {[
              { value: "active" as const, label: "Active", color: "bg-green-600" },
              { value: "expired" as const, label: "Expired", color: "bg-red-600" },
            ].map(({ value, label, color }) => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setHotspotSubFilter(value)
                  setHotspotPage(1)
                }}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  hotspotSubFilter === value
                    ? "text-white shadow-sm"
                    : "text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {hotspotSubFilter === value && (
                  <motion.span
                    layoutId="active-hotspot-filter-pill"
                    className={`absolute inset-0 ${color} rounded-lg`}
                    transition={{ type: "spring", duration: 0.3 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Search - hide for IP Binding tab */}
      {!["online-sessions", "active-subs", "hotspot", "ip-binding"].includes(activeTab) && (
        <motion.div 
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-2"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search name, phone, username, IP, billing account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900 transition-all duration-300 focus:ring-4 focus:ring-violet-100 dark:focus:ring-violet-900/30 focus:border-violet-500"
              autoComplete="off"
            />
          </div>
          <Button
            variant="outline"
            className="shrink-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleExportUsers}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </motion.div>
      )}

      {selectedUsers.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">{selectedUsers.length} selected</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => { setSmsTarget(null); setSmsMessage(""); setShowSmsDialog(true) }} className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <Send className="w-4 h-4 mr-2" />Send SMS
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" onClick={handleBulkDelete} disabled={deleting}>
            {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedUsers([])}><X className="w-4 h-4" /></Button>
        </motion.div>
      )}

      {/* -- Online Sessions Tab -- */}
      {activeTab === "online-sessions" && (
        <motion.div
          key="online-sessions"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Online Users ({filteredOnlineSessions.length})
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">Users currently connected via RADIUS - real-time session data</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <Input
                      placeholder="Search name, IP, MAC..."
                      value={onlineSearchQuery}
                      onChange={(e) => { setOnlineSearchQuery(e.target.value); setOnlinePage(1) }}
                      className="pl-9 bg-white dark:bg-slate-900 transition-all duration-300 focus:ring-4 focus:ring-violet-100 dark:focus:ring-violet-900/30 focus:border-violet-500"
                    />
                  </div>
                  <Select value={onlineServiceFilter} onValueChange={(val) => { setOnlineServiceFilter(val); setOnlinePage(1) }}>
                    <SelectTrigger className="w-36 dark:bg-slate-900 dark:border-slate-700">
                      <SelectValue placeholder="Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="PPPOE">PPPoE</SelectItem>
                      <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                      <SelectItem value="STATIC">Static</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => loadOnlineSessions(1, false)} disabled={onlineSessionsLoading}>
                    <RefreshCw className={`w-4 h-4 ${onlineSessionsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {onlineSessionsLoading && onlineSessions.length === 0 ? (
                <div className="space-y-px">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-1 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0" style={{ opacity: 1 - i * 0.12 }}>
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-3.5 w-24 hidden md:block" />
                      <Skeleton className="h-3.5 w-20 hidden lg:block" />
                      <Skeleton className="h-3.5 w-16 hidden lg:block" />
                      <Skeleton className="h-3.5 w-12" />
                    </div>
                  ))}
                </div>
              ) : filteredOnlineSessions.length === 0 ? (
                <div className="text-center py-12">
                  <WifiOff className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">No online users</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {onlineSearchQuery || onlineServiceFilter !== "all"
                      ? "Try adjusting your search or filter"
                      : "No users are currently connected via RADIUS"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border dark:border-slate-700 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="dark:border-slate-700">
                          <TableHead className="dark:text-slate-300">User</TableHead>
                          <TableHead className="dark:text-slate-300">Service</TableHead>
                          <TableHead className="dark:text-slate-300">IP Address</TableHead>
                          <TableHead className="dark:text-slate-300">MAC Address</TableHead>
                          <TableHead className="dark:text-slate-300">Router</TableHead>
                          <TableHead className="dark:text-slate-300">Uptime</TableHead>
                          <TableHead className="dark:text-slate-300">Usage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {onlineSessions.map((session) => (
                          <motion.tr
                            key={session.radacctid}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="transition-colors duration-200 hover:bg-violet-50 dark:hover:bg-violet-950/30 dark:border-slate-700"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative w-9 h-9 shrink-0">
                                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 blur-sm opacity-40" />
                                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 ring-1 ring-white/20 shadow-md shadow-emerald-500/25 flex items-center justify-center text-white font-semibold text-xs">
                                    {((session.full_name || session.username) ?? 'HS')
                                      .toString()
                                      .split(' ')
                                      .map((n: string) => n?.[0] ?? '')
                                      .join('')
                                      .toUpperCase()
                                      .slice(0, 2) || 'HS'}
                                  </div>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {(session as any).canonical_username
                                      ? (session as any).canonical_username
                                      : (session.full_name || session.username)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(session as any).canonical_username
                                      ? <span className="text-pink-600 dark:text-pink-400 font-medium">Hotspot</span>
                                      : (session.phone_number || '')}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                session.service_type === 'PPPOE' ? 'border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' :
                                session.service_type === 'HOTSPOT' ? 'border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20' :
                                'border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                              }>
                                {session.service_type === 'PPPOE' ? 'PPPoE' : session.service_type === 'HOTSPOT' ? 'Hotspot' : session.service_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm dark:text-slate-300">
                                {session.ip_address
                                  ? session.ip_address
                                  : (session as any).accounting_pending && !session.ip_address
                                    ? <span className="text-amber-500 dark:text-amber-400 text-xs italic">router connecting...</span>
                                    : "..."}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-xs text-muted-foreground">{session.mac_address || '...'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm dark:text-slate-300">{session.router || '...'}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {(session as any).accounting_pending && !session.ip_address ? (
                                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    {session.uptime}
                                  </span>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                    <span className="text-sm dark:text-slate-300">{session.uptime}</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium dark:text-slate-300">{session.usage}</span>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div ref={onlineObserverTarget} className="flex items-center justify-center py-6">
                    {onlineLoadingMore && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading more sessions...
                      </div>
                    )}
                    {!onlineHasMore && onlineSessions.length > 0 && (
                      <p className="text-xs text-slate-400">You've reached the end</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* -- Active Subscriptions Tab -- */}
      {activeTab === "active-subs" && (
        <motion.div
          key="active-subs"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Active Subscriptions ({allActiveSubUsers.length})
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">Users with active or pending subscriptions - manage extensions and removals</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <Input
                      placeholder="Search name, plan, phone, username..."
                      value={activeSearchQuery}
                      onChange={(e) => setActiveSearchQuery(e.target.value)}
                      className="pl-9 bg-white dark:bg-slate-900 transition-all duration-300 focus:ring-4 focus:ring-violet-100 dark:focus:ring-violet-900/30 focus:border-violet-500"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={loadAllActiveUsers} disabled={activeSubsPageLoading}>
                    <RefreshCw className={`w-4 h-4 ${activeSubsPageLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeSubsPageLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : allActiveSubUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">No active subscriptions</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {activeSearchQuery ? "Try adjusting your search" : "No users with active subscriptions found"}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border dark:border-slate-700 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-slate-700">
                        <TableHead className="dark:text-slate-300">User</TableHead>
                        <TableHead className="dark:text-slate-300">Plan</TableHead>
                        <TableHead className="dark:text-slate-300">Status</TableHead>
                        <TableHead className="dark:text-slate-300">Connection</TableHead>
                        <TableHead className="dark:text-slate-300">Expiry</TableHead>
                        <TableHead className="dark:text-slate-300">Time Remaining</TableHead>
                        <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allActiveSubUsers
                        .filter(user => {
                          if (!activeSearchQuery) return true;
                          return (
                            (user.name?.toLowerCase() || '').includes(activeSearchQuery.toLowerCase()) ||
                            (user.phone?.includes(activeSearchQuery)) ||
                            (user.plan?.toLowerCase() || '').includes(activeSearchQuery.toLowerCase()) ||
                            (user.radiusCredentials?.username?.toLowerCase() || '').includes(activeSearchQuery.toLowerCase())
                          );
                        })
                        .map((user) => {
                        const expiryDate = new Date(user.expiryDate)
                        const now = new Date()
                        const isExpired = expiryDate <= now
                        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        const hoursLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60))
                        return (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="transition-colors duration-200 hover:bg-violet-50 dark:hover:bg-violet-950/30 dark:border-slate-700"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative w-9 h-9 shrink-0">
                                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 blur-sm opacity-40" />
                                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 ring-1 ring-white/20 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white font-semibold text-xs">
                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                  </div>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{user.name}</p>
                                  <p className="text-xs text-muted-foreground">{user.phone}</p>
                                  {user.location && (
                                    <p className="text-[11px] text-muted-foreground/70 flex items-center gap-0.5 mt-0.5">
                                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                                      <span className="truncate max-w-[140px]">{user.location}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium dark:text-slate-300">{user.plan}</p>
                                <p className="text-xs text-muted-foreground">KES {user.planPrice.toLocaleString()}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.status === "active" ? (
                                <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">Active</Badge>
                              ) : (
                                <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.connectionStatus === "online" ? (
                                <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center gap-1 w-fit">
                                  <Wifi className="w-3 h-3" /> Online
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 flex items-center gap-1 w-fit">
                                  <XCircle className="w-3 h-3" /> Offline
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.plan === "No Plan" ? (
                                <div>
                                  <p className="text-sm dark:text-slate-300">-</p>
                                  <p className="text-xs text-muted-foreground">Voucher</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm dark:text-slate-300">{new Date(user.expiryDate).toLocaleDateString()}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(user.expiryDate) > new Date() 
                                      ? `${Math.ceil((new Date(user.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`
                                      : "Expired"
                                    }
                                  </p>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {isExpired ? (
                                <Badge variant="destructive" className="text-xs">Expired</Badge>
                              ) : daysLeft <= 1 ? (
                                <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs">{hoursLeft}h left</Badge>
                              ) : daysLeft <= 3 ? (
                                <Badge className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 text-xs">{daysLeft}d left</Badge>
                              ) : (
                                <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs">{daysLeft}d left</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-700">
                                  {perms.canViewDetails && (
                                    <DropdownMenuItem onClick={() => handleViewUser(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                  )}
                                  {perms.canEdit && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleExtendSubscription(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Extend Subscription
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleOpenChangePlan(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                                        Change Plan
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditUser(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit User
                                      </DropdownMenuItem>
                                      {(user.type === "pppoe" || user.type === "static") && (
                                        <DropdownMenuItem onClick={() => handleEditIP(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                          <Server className="w-4 h-4 mr-2" />
                                          Edit IP Address
                                        </DropdownMenuItem>
                                      )}
                                    </>
                                  )}
                                  <DropdownMenuItem onClick={() => handleOpenUserSms(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                    <Send className="w-4 h-4 mr-2" />
                                    Send SMS
                                  </DropdownMenuItem>
                                  {user.status === "pending" && (
                                    <DropdownMenuItem 
                                      onClick={() => handleActivateUser(user)}
                                      className="text-green-600 dark:text-green-400 dark:hover:bg-slate-800"
                                    >
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Activate Now
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                                  {/* CLAUDE CHANGE #3a: REPLACED DROPDOWN ITEMS - Active Subs tab */}
                                  {user.radiusCredentials && (
                                    <DropdownMenuItem 
                                      onClick={() => handleOpenSuspendDialog(user)}
                                      className={user.radiusCredentials.is_enabled === false ? "text-green-600 dark:text-green-400 dark:hover:bg-slate-800" : "text-yellow-600 dark:text-yellow-400 dark:hover:bg-slate-800"}
                                    >
                                      <Power className="w-4 h-4 mr-2" />
                                      {user.radiusCredentials.is_enabled === false ? 'Unsuspend User' : 'Suspend User'}
                                    </DropdownMenuItem>
                                  )}
                                  {user.radiusCredentials && (
                                    <DropdownMenuItem
                                      onClick={() => handleRefreshInternet(user)}
                                      className="text-blue-600 dark:text-blue-400 dark:hover:bg-slate-800"
                                    >
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Refresh Internet
                                    </DropdownMenuItem>
                                  )}
                                  {perms.canDelete && (
                                    <>
                                      <DropdownMenuSeparator className="dark:bg-slate-700" />
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteUser(user)}
                                        className="text-red-600 dark:text-red-400 dark:hover:bg-slate-800"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove User
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* -- Hotspot Clients Tab -- */}
      {activeTab === "hotspot" && (
        <motion.div
          key="hotspot"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Smartphone className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    Hotspot Clients ({activeSubscriptions.hotspot?.length || 0})
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">All hotspot clients — active and expired subscriptions</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={loadActiveSubscriptions} disabled={hotspotLoading}>
                  <RefreshCw className={`w-4 h-4 ${hotspotLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hotspotLoading ? (
                <div className="space-y-px">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-1 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0" style={{ opacity: 1 - i * 0.12 }}>
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-3.5 w-24 hidden md:block" />
                      <Skeleton className="h-3.5 w-20 hidden lg:block" />
                      <Skeleton className="h-7 w-16 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : !activeSubscriptions.hotspot?.length ? (
                <div className="text-center py-12">
                  <Smartphone className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">No hotspot clients yet</h3>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border dark:border-slate-700 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                          <TableHead className="dark:text-slate-300">Client</TableHead>
                          <TableHead className="dark:text-slate-300">Plan</TableHead>
                          <TableHead className="dark:text-slate-300">Status</TableHead>
                          <TableHead className="dark:text-slate-300">Connection</TableHead>
                          <TableHead className="dark:text-slate-300">Expiry</TableHead>
                          <TableHead className="dark:text-slate-300">Router</TableHead>
                          <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const filtered = activeSubscriptions.hotspot.filter(item => {
                            const isActive = item.is_active_sub ?? (
                              item.subscription_status === 'active' &&
                              item.expiry_date &&
                              new Date(item.expiry_date) > new Date()
                            )
                            return hotspotSubFilter === "active" ? isActive : !isActive
                          })
                          const paginated = filtered.slice(0, hotspotPage * hotspotPageSize)
                          return paginated.map((item) => {
                            const isActive = item.is_active_sub ?? (item.subscription_status === 'active' && item.expiry_date && new Date(item.expiry_date) > new Date())
                            const liveUsage = item.canonical_username ? hotspotLiveUsageMap.get(item.canonical_username) : undefined
                            const hotspotIdentifier = item.canonical_username || item.username || item.display_name || "Hotspot"
                            const expiryLabel = item.expiry_date
                              ? new Date(item.expiry_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                              : '—'
                            
                            const timeRemaining = item.expiry_date ? formatTimeRemaining(item.expiry_date) : null

                            return (
                              <motion.tr
                                key={`${hotspotIdentifier}-${item.session_id || item.subscribed_at}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.15 }}
                                className="transition-colors duration-200 hover:bg-violet-50 dark:hover:bg-violet-950/30 dark:border-slate-700 cursor-pointer"
                                onClick={() => handleOpenHotspotDetail(item)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-xs ${isActive ? 'bg-gradient-to-br from-pink-500 to-orange-400' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                      HS
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground font-mono text-sm">{hotspotIdentifier}</p>
                                      <p className="text-xs text-muted-foreground">{item.phone || '—'}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {isActive ? (
                                    <Badge variant="outline" className="bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800 text-xs">
                                      {item.plan_name}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isActive ? (
                                    <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 gap-1 text-xs">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs">Expired</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {getConnectionBadge(hotspotOnlineSet.has(hotspotIdentifier) ? "online" : "offline")}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm dark:text-slate-300">{expiryLabel}</p>
                                    {timeRemaining && (
                                      <p className={`text-xs ${timeRemaining.isCritical ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {timeRemaining.label}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">{item.router || '—'}</span>
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1">
                                    {isActive && item.session_id && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                        onClick={(e) => { e.stopPropagation(); handleExtendHotspot(item) }}
                                      >
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Extend
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs text-muted-foreground"
                                      onClick={(e) => { e.stopPropagation(); handleOpenHotspotDetail(item) }}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            )
                          })
                        })()}
                      </TableBody>
                    </Table>
                  </div>

                  <div ref={hotspotObserverTarget} className="flex items-center justify-center py-6">
                    {(() => {
                      const filtered = activeSubscriptions.hotspot.filter(item => {
                        const isActive = item.is_active_sub ?? (item.subscription_status === 'active' && item.expiry_date && new Date(item.expiry_date) > new Date())
                        return hotspotSubFilter === "active" ? isActive : !isActive
                      })
                      const shown = Math.min(hotspotPage * hotspotPageSize, filtered.length)
                      return shown < filtered.length ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading more clients...
                        </div>
                      ) : filtered.length > 0 ? (
                        <p className="text-xs text-slate-400">You've reached the end</p>
                      ) : null
                    })()}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* -- IP Binding Tab -- */}
      {activeTab === "ip-binding" && (
        <motion.div
          key="ip-binding"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <RouterIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    IP Bindings ({ipBindings.length})
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">
                    Devices that bypass the captive portal (Smart TVs, consoles, IP cameras)
                  </CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={loadIPBindings} disabled={ipBindingLoading}>
                  <RefreshCw className={`w-4 h-4 ${ipBindingLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ipBindingLoading ? (
                <div className="space-y-px">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-1 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0" style={{ opacity: 1 - i * 0.12 }}>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : ipBindings.length === 0 ? (
                <div className="text-center py-12">
                  <RouterIcon className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">No IP bindings yet</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Devices with IP bindings bypass the hotspot login page.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setShowAddIPBindingDialog(true)
                      loadRouters()
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add IP Binding
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border dark:border-slate-700 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-slate-700">
                        <TableHead className="dark:text-slate-300">Name</TableHead>
                        <TableHead className="dark:text-slate-300">MAC / IP</TableHead>
                        <TableHead className="dark:text-slate-300">Plan</TableHead>
                        <TableHead className="dark:text-slate-300">Status</TableHead>
                        <TableHead className="dark:text-slate-300">Expires</TableHead>
                        <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ipBindings.map((b) => (
                        <TableRow key={b.id} className="dark:border-slate-700">
                          <TableCell className="font-medium text-foreground">{b.name}</TableCell>
                          <TableCell className="font-mono text-xs dark:text-slate-300">
                            {b.mac_address}
                            <br />
                            {b.ip_address || '—'}
                          </TableCell>
                          <TableCell>{b.plan_name || '—'}</TableCell>
                          <TableCell>
                            <Badge className={
                              b.is_active ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                              : b.status === 'expired' ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }>
                              {b.is_active ? 'Active' : b.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs dark:text-slate-300">
                            {b.expires_at ? new Date(b.expires_at).toLocaleString() : '—'}
                            {b.is_active && b.time_remaining_minutes > 0 && (
                              <div className="text-slate-400 dark:text-slate-500">
                                {b.time_remaining_minutes}m left
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleExtendIPBinding(b.id)}
                              disabled={extendingBindingId === b.id}
                              className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {extendingBindingId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "+1h"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" 
                              onClick={() => handleDeleteIPBinding(b.id)}
                              disabled={deletingBindingId === b.id}
                            >
                              {deletingBindingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
      )}

      {/* Users Table (for All/PPPoE/Static tabs) */}
      {!["online-sessions", "active-subs", "hotspot", "ip-binding"].includes(activeTab) && (
        <motion.div
          key="users-table"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-foreground">
                    {activeTab === "all" && "Users"}
                    {activeTab === "pppoe" && "PPPoE Users"}
                    {activeTab === "static" && "Static IP Users"}
                    {statusFilter !== "all" && <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">· {statusFilter}</span>}
                    <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">({filteredUsers.length})</span>
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">{totalCount} total</p>
              </div>
            </CardHeader>
            <CardContent>
              {(loading || (statusFilter === "expired" && expiredUsersLoading)) ? (
                <div className="space-y-px">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                      style={{ opacity: 1 - i * 0.1 }}
                    >
                      <Skeleton className="w-4 h-4 shrink-0" />
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <div className="flex-1 space-y-1.5 hidden md:block">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-3.5 w-20 hidden lg:block" />
                      <Skeleton className="w-8 h-8 rounded shrink-0" />
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">No users found</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border dark:border-slate-700 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="dark:border-slate-700">
                          <TableHead className="w-12 dark:text-slate-300">
                            <Checkbox
                              checked={
                                filteredUsers.length > 0 &&
                                selectedUsers.length === filteredUsers.length
                              }
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="dark:text-slate-300">User</TableHead>
                          <TableHead className="dark:text-slate-300">Type</TableHead>
                          <TableHead className="dark:text-slate-300">Status</TableHead>
                          <TableHead className="dark:text-slate-300">Connection</TableHead>
                          <TableHead className="dark:text-slate-300">Plan</TableHead>
                          <TableHead className="dark:text-slate-300">Data Usage</TableHead>
                          <TableHead className="dark:text-slate-300">Expiry</TableHead>
                          <TableHead className="w-12 dark:text-slate-300"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => {
                          return (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.15 }}
                              className="transition-all duration-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:shadow-sm group dark:border-slate-700 cursor-pointer"
                              onClick={() => router.push(`/admin/users/${user.customerId}`)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedUsers.includes(user.id)}
                                  onCheckedChange={(checked) =>
                                    handleSelectUser(user.id, checked as boolean)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative w-10 h-10 shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 blur-sm opacity-40" />
                                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 ring-1 ring-white/20 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white font-semibold text-sm">
                                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.phone}</p>
                                    {user.location && (
                                      <p className="text-[11px] text-muted-foreground/70 flex items-center gap-0.5 mt-0.5">
                                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                                        <span className="truncate max-w-[140px]">{user.location}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getTypeBadge(user.type)}</TableCell>
                              <TableCell>{getStatusBadge(user.status)}</TableCell>
                              <TableCell>{getConnectionBadge(user.connectionStatus)}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm font-medium dark:text-slate-300">{user.plan}</p>
                                  <p className="text-xs text-muted-foreground">KES {user.planPrice.toLocaleString()}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium dark:text-slate-300">
                                    {user.liveUsageString || `${Number(user.dataUsed || 0).toFixed(1)} GB`}
                                  </p>
                                  {user.dataLimit && (
                                    <Progress value={(Number(user.dataUsed || 0) / user.dataLimit) * 100} className="h-1.5 w-16" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {user.plan === "No Plan" ? (
                                  <div>
                                    <p className="text-sm dark:text-slate-300">-</p>
                                    <p className="text-xs text-muted-foreground">Voucher</p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm dark:text-slate-300">{new Date(user.expiryDate).toLocaleDateString()}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(user.expiryDate) > new Date() 
                                        ? `${Math.ceil((new Date(user.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`
                                        : "Expired"
                                      }
                                    </p>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-700">
                                    <DropdownMenuItem onClick={() => handleViewUser(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditUser(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExtendSubscription(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      Extend Subscription
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenChangePlan(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                                      Change Plan
                                    </DropdownMenuItem>
                                    {(user.type === "pppoe" || user.type === "static") && (
                                      <DropdownMenuItem onClick={() => handleEditIP(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                        <Server className="w-4 h-4 mr-2" />
                                        Edit IP Address
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleOpenUserSms(user)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                      <Send className="w-4 h-4 mr-2" />
                                      Send SMS
                                    </DropdownMenuItem>
                                    {user.status === "pending" && (
                                      <DropdownMenuItem 
                                        onClick={() => handleActivateUser(user)}
                                        className="text-green-600 dark:text-green-400 dark:hover:bg-slate-800"
                                      >
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        Activate Now
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator className="dark:bg-slate-700" />
                                    {/* CLAUDE CHANGE #3b: REPLACED DROPDOWN ITEMS - Main Users table */}
                                    {user.radiusCredentials && (
                                      <DropdownMenuItem 
                                        onClick={() => handleOpenSuspendDialog(user)}
                                        className={user.radiusCredentials.is_enabled === false ? "text-green-600 dark:text-green-400 dark:hover:bg-slate-800" : "text-yellow-600 dark:text-yellow-400 dark:hover:bg-slate-800"}
                                      >
                                        <Power className="w-4 h-4 mr-2" />
                                        {user.radiusCredentials.is_enabled === false ? 'Unsuspend User' : 'Suspend User'}
                                      </DropdownMenuItem>
                                    )}
                                    {user.radiusCredentials && (
                                      <DropdownMenuItem
                                        onClick={() => handleRefreshInternet(user)}
                                        className="text-blue-600 dark:text-blue-400 dark:hover:bg-slate-800"
                                      >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh Internet
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator className="dark:bg-slate-700" />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteUser(user)}
                                      className="text-red-600 dark:text-red-400 dark:hover:bg-slate-800"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </motion.tr>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div ref={observerTarget} className="flex items-center justify-center py-6">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading more users...
                      </div>
                    )}
                    {!hasMore && users.length > 0 && (
                      <p className="text-xs text-slate-400">You've reached the end</p>
                    )}
                    {!loadingMore && !hasMore && users.length === 0 && (
                      <p className="text-xs text-slate-400">No users to display</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="admin-theme-dialog sm:max-w-md p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className="dark:text-white">Edit User</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Update user details and network credentials
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit_first_name" className="dark:text-slate-200">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name" className="dark:text-slate-200">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_email" className="dark:text-slate-200">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_phone" className="dark:text-slate-200">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_location" className="dark:text-slate-200">Location / Area</Label>
                <Input
                  id="edit_location"
                  placeholder="e.g. Westlands, Nairobi"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
              
              <div className="border-t dark:border-slate-700 pt-4">
                <h4 className="font-medium text-sm mb-3 dark:text-slate-200 flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Network Login Credentials
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit_radius_username" className="dark:text-slate-200">RADIUS Username</Label>
                    <div className="flex gap-2">
                      <Input
                        id="edit_radius_username"
                        value={editForm.radius_username}
                        onChange={(e) => setEditForm({ ...editForm, radius_username: e.target.value })}
                        placeholder="e.g., 712345678"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleRegenerateUsername}
                        disabled={updating}
                        title="Regenerate from phone number"
                      >
                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Click refresh to use phone number (last 9 digits)</p>
                  </div>
                  <div>
                    <Label htmlFor="edit_radius_password" className="dark:text-slate-200">RADIUS Password</Label>
                    <div className="flex gap-2">
                      <Input
                        id="edit_radius_password"
                        value={editForm.radius_password}
                        onChange={(e) => setEditForm({ ...editForm, radius_password: e.target.value })}
                        placeholder="Enter new password or generate"
                        autoComplete="new-password"
                        name="edit-radius-password-no-autofill"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleGeneratePassword}
                        title="Generate simple password"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current password</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={updating} className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="admin-theme-dialog sm:max-w-md p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className="text-red-600 dark:text-red-400">Delete User</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                This action cannot be undone. This will permanently delete the customer account,
                all service connections, RADIUS credentials, and the associated login user.
              </DialogDescription>
            </DialogHeader>
            {userToDelete && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="font-medium text-foreground">{userToDelete.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{userToDelete.email} • {userToDelete.phone}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Plan: {userToDelete.plan}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirmDialog(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteUser} disabled={deleting} className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
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
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="admin-theme-dialog sm:max-w-md p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className="dark:text-white">Extend Subscription</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                {userToExtend?.expiryDate && new Date(userToExtend.expiryDate) < new Date()
                  ? "The subscription has expired - new time will start from now."
                  : "Choose duration or set a specific expiry date."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex rounded-lg border dark:border-slate-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExtendMode("duration")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    extendMode === "duration"
                      ? "bg-blue-600 dark:bg-blue-700 text-white"
                      : "bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  Add Duration
                </button>
                <button
                  type="button"
                  onClick={() => setExtendMode("date")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    extendMode === "date"
                      ? "bg-blue-600 dark:bg-blue-700 text-white"
                      : "bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  Set Expiry Date & Time
                </button>
              </div>

              {extendMode === "duration" ? (
                <>
                  <div className="space-y-2">
                    <Label className="dark:text-slate-200">Duration Amount</Label>
                    <Input
                      type="number"
                      min={1}
                      value={extendForm.duration_amount}
                      onChange={(e) => setExtendForm({ ...extendForm, duration_amount: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-slate-200">Duration Unit</Label>
                    <Select
                      value={extendForm.duration_unit}
                      onValueChange={(value: 'MINUTES' | 'HOURS' | 'DAYS') => setExtendForm({ ...extendForm, duration_unit: value })}
                    >
                      <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MINUTES">Minutes</SelectItem>
                        <SelectItem value="HOURS">Hours</SelectItem>
                        <SelectItem value="DAYS">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setExtendForm({ ...extendForm, duration_amount: 1, duration_unit: 'HOURS' })}>+1 Hour</Button>
                    <Button size="sm" variant="outline" onClick={() => setExtendForm({ ...extendForm, duration_amount: 1, duration_unit: 'DAYS' })}>+1 Day</Button>
                    <Button size="sm" variant="outline" onClick={() => setExtendForm({ ...extendForm, duration_amount: 7, duration_unit: 'DAYS' })}>+7 Days</Button>
                    <Button size="sm" variant="outline" onClick={() => setExtendForm({ ...extendForm, duration_amount: 30, duration_unit: 'DAYS' })}>+30 Days</Button>
                  </div>
                  <div className="pt-4 border-t dark:border-slate-700">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
                      onClick={async () => {
                        if (!userToExtend?.serviceId) {
                          toast.error("No active service to expire")
                          return
                        }
                        try {
                          setExtending(true)
                          const expireAt = new Date(Date.now() + 60 * 1000)
                          await adminApi.extendService(
                            userToExtend.customerId,
                            userToExtend.serviceId,
                            1,
                            'DAYS',
                            undefined,
                            expireAt.toISOString()
                          )
                          toast.success(`${userToExtend.name} will expire in 1 minute`)
                          setShowExtendDialog(false)
                          setUserToExtend(null)
                          await loadUsers(serverPage, searchQuery, statusFilter, false)
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to expire user')
                        } finally {
                          setExtending(false)
                        }
                      }}
                      disabled={extending}
                    >
                      {extending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><XCircle className="w-4 h-4 mr-2" />Expire Now (1 min)</>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <Label className="dark:text-slate-200">New Expiry Date & Time</Label>
                  {userToExtend?.expiryDate && userToExtend.plan !== "No Plan" && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-amber-800 dark:text-amber-200">
                        Current expiry: <strong>{new Date(userToExtend.expiryDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <input
                        type="date"
                        value={extendManualDate.split('T')[0] || extendManualDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setExtendManualDate(e.target.value)
                        }}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Time (HH:MM)</Label>
                      <input
                        type="time"
                        value={extendManualTime}
                        onChange={(e) => setExtendManualTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>
                  </div>
                  {extendManualDate && (
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-800 dark:text-green-200">
                      <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-600 dark:text-green-400" />
                      Will expire on:{" "}
                      <strong>
                        {new Date(`${extendManualDate}T${extendManualTime || "23:59"}:00`).toLocaleString('en-GB', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>
                      {(() => {
                        const now = new Date()
                        const target = new Date(`${extendManualDate}T${extendManualTime || "23:59"}:00`)
                        const diffMs = target.getTime() - now.getTime()
                        if (diffMs <= 0) return <span className="text-red-600 dark:text-red-400 ml-1"> (in the past — please select future date/time)</span>
                        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                        if (days > 0) return <span className="text-green-700 dark:text-green-300 ml-1"> ({days}d {hours}h from now)</span>
                        if (hours > 0) return <span className="text-green-700 dark:text-green-300 ml-1"> ({hours}h {minutes}m from now)</span>
                        if (minutes > 0) return <span className="text-green-700 dark:text-green-300 ml-1"> ({minutes}m from now)</span>
                        return null
                      })()}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                    <span className="text-xs text-slate-400 dark:text-slate-500">or</span>
                    <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
                    onClick={async () => {
                      if (!userToExtend?.serviceId) {
                        toast.error("No active service to expire")
                        return
                      }
                      try {
                        setExtending(true)
                        const expireAt = new Date(Date.now() + 60 * 1000)
                        await adminApi.extendService(
                          userToExtend.customerId,
                          userToExtend.serviceId,
                          1,
                          'DAYS',
                          undefined,
                          expireAt.toISOString()
                        )
                        toast.success(`${userToExtend.name} will expire in 1 minute`)
                        setShowExtendDialog(false)
                        setUserToExtend(null)
                        await loadUsers(serverPage, searchQuery, statusFilter, false)
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to expire user')
                      } finally {
                        setExtending(false)
                      }
                    }}
                    disabled={extending}
                  >
                    {extending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                    ) : (
                      <><XCircle className="w-4 h-4 mr-2" />Expire Now</>
                    )}
                  </Button>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t dark:border-slate-700">
                <Label className="dark:text-slate-200">Change Plan <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">(Optional)</span></Label>
                <Select
                  value={extendForm.plan_id || "keep"}
                  onValueChange={(value) => setExtendForm({ ...extendForm, plan_id: value === "keep" ? "" : value })}
                >
                  <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700">
                    <SelectValue placeholder="Keep current plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep current plan</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={String(plan.id)}>
                        {plan.name} — KES {parseFloat(plan.base_price || plan.price || "0").toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExtendDialog(false)} disabled={extending}>
                Cancel
              </Button>
              <Button onClick={confirmExtendSubscription} disabled={extending} className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                {extending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extending...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Extend Subscription
                  </>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Extend Hotspot Session Dialog */}
      <Dialog open={showExtendHotspotDialog} onOpenChange={setShowExtendHotspotDialog}>
        <DialogContent className="admin-theme-dialog sm:max-w-md p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className="dark:text-white">Extend Hotspot Session</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                {hotspotSessionToExtend?.canonical_username || hotspotSessionToExtend?.username} — {hotspotSessionToExtend?.plan_name}
                {hotspotSessionToExtend?.expiry_date && (
                  <span className="block text-amber-600 dark:text-amber-400 mt-1">
                    Current expiry: {new Date(hotspotSessionToExtend.expiry_date).toLocaleString()}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex rounded-lg border dark:border-slate-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setHotspotExtendMode("duration")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    hotspotExtendMode === "duration" ? "bg-blue-600 dark:bg-blue-700 text-white" : "bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  Add Duration
                </button>
                <button
                  type="button"
                  onClick={() => setHotspotExtendMode("date")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    hotspotExtendMode === "date" ? "bg-blue-600 dark:bg-blue-700 text-white" : "bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  Set Expiry
                </button>
              </div>

              {hotspotExtendMode === "duration" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="dark:text-slate-200">Amount</Label>
                      <Input
                        type="number"
                        min={1}
                        value={hotspotExtendForm.duration_amount}
                        onChange={e => setHotspotExtendForm(f => ({ ...f, duration_amount: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="dark:text-slate-200">Unit</Label>
                      <Select
                        value={hotspotExtendForm.duration_unit}
                        onValueChange={(v: 'MINUTES' | 'HOURS' | 'DAYS') => setHotspotExtendForm(f => ({ ...f, duration_unit: v }))}
                      >
                        <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700">
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
                  <div className="flex flex-wrap gap-2">
                    {[['30m', 30, 'MINUTES'], ['1h', 1, 'HOURS'], ['3h', 3, 'HOURS'], ['1d', 1, 'DAYS']].map(([label, amt, unit]) => (
                      <Button
                        key={label as string}
                        size="sm"
                        variant="outline"
                        onClick={() => setHotspotExtendForm({ duration_amount: amt as number, duration_unit: unit as 'MINUTES'|'HOURS'|'DAYS' })}
                      >
                        +{label}
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <input
                        type="date"
                        value={hotspotExtendManualDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setHotspotExtendManualDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Time</Label>
                      <input
                        type="time"
                        value={hotspotExtendManualTime}
                        onChange={e => setHotspotExtendManualTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>
                  </div>
                  {hotspotExtendManualDate && (
                    <p className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2">
                      New expiry: <strong>{new Date(`${hotspotExtendManualDate}T${hotspotExtendManualTime}:00`).toLocaleString()}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExtendHotspotDialog(false)} disabled={extendingHotspot}>
                Cancel
              </Button>
              <Button onClick={confirmExtendHotspot} disabled={extendingHotspot} className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                {extendingHotspot ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extending...</>
                ) : (
                  <><Calendar className="w-4 h-4 mr-2" />Extend Session</>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog
        open={showChangePlanDialog}
        onOpenChange={(open) => {
          setShowChangePlanDialog(open)
          if (!open) {
            setUserToChangePlan(null)
            setChangePlanOptions([])
            setChangePlanServiceId(null)
            setCurrentPlanId(null)
            setCurrentPlanName(null)
            setSelectedChangePlanId("")
          }
        }}
      >
        <DialogContent className="admin-theme-dialog max-w-lg p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className="dark:text-white">Change Plan</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                {userToChangePlan
                  ? `Choose a new plan for ${userToChangePlan.name}.`
                  : "Choose a new plan for this user."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm">
                <p className="font-medium text-foreground">Current plan</p>
                <p className="mt-1 text-muted-foreground">{currentPlanName || "No active plan"}</p>
              </div>

              {changePlanLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : changePlanOptions.length === 0 ? (
                <Alert>
                  <AlertDescription className="dark:text-slate-300">No compatible plans are available for this user.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="change-plan-select" className="dark:text-slate-200">Available plans</Label>
                  <Select value={selectedChangePlanId || "none"} onValueChange={(value) => setSelectedChangePlanId(value === "none" ? "" : value)}>
                    <SelectTrigger id="change-plan-select" className="dark:bg-slate-900 dark:border-slate-700">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Select a plan</SelectItem>
                      {changePlanOptions.map((plan) => (
                        <SelectItem key={plan.id} value={String(plan.id)}>
                          {plan.name} - KES {parseFloat(plan.price || "0").toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedChangePlanId && (
                    <div className="rounded-lg border dark:border-slate-700 p-3 text-sm">
                      {(() => {
                        const selectedPlan = changePlanOptions.find((plan) => plan.id === parseInt(selectedChangePlanId, 10))
                        if (!selectedPlan) return null
                        return (
                          <div className="space-y-1 text-muted-foreground">
                            <p><span className="font-medium text-foreground">Type:</span> {selectedPlan.plan_type}</p>
                            <p><span className="font-medium text-foreground">Speed:</span> {selectedPlan.download_speed || 0} / {selectedPlan.upload_speed || 0} Mbps</p>
                            <p><span className="font-medium text-foreground">Data limit:</span> {selectedPlan.data_limit ? `${selectedPlan.data_limit} GB` : "Unlimited"}</p>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChangePlanDialog(false)} disabled={changePlanSaving}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmChangePlan}
                disabled={
                  changePlanLoading ||
                  changePlanSaving ||
                  !selectedChangePlanId ||
                  selectedChangePlanId === String(currentPlanId || "")
                }
                className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {changePlanSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Plan"
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Edit IP Dialog */}
      <Dialog open={showEditIPDialog} onOpenChange={(open) => {
        setShowEditIPDialog(open)
        if (!open) {
          setUserToEditIP(null)
          setEditIPPoolId(null)
          setEditIPAvailableIPs([])
          setEditIPSearchQuery("")
          setSelectedNewIPId("")
          if (editIPSearchDebounceRef.current) clearTimeout(editIPSearchDebounceRef.current)
        }
      }}>
        <DialogContent className="admin-theme-dialog sm:max-w-md p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className="dark:text-white">Change IP Address</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Select a new IP from the pool attached to this user's plan.
                The current IP will be released back to the pool.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {userToEditIP?.ipAddress && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                  <Server className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-amber-800 dark:text-amber-200">
                    Current IP: <code className="font-mono font-bold">{userToEditIP.ipAddress}</code>
                  </span>
                </div>
              )}

              {editIPLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading available IPs...
                </div>
              ) : editIPAvailableIPs.length === 0 && !editIPLoading ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No available IPs in this plan's pool.<br />
                  <span className="text-xs">Ensure the plan has an IP pool assigned.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="dark:text-slate-200">Available IPs ({editIPAvailableIPs.length})</Label>
                  <Input
                    placeholder="Search IP (e.g. 10.50.3)"
                    value={editIPSearchQuery}
                    onChange={async (e) => {
                      const searchVal = e.target.value
                      setEditIPSearchQuery(searchVal)
                      
                      if (editIPSearchDebounceRef.current) clearTimeout(editIPSearchDebounceRef.current)
                      editIPSearchDebounceRef.current = setTimeout(async () => {
                        if (!editIPPoolId) return
                        try {
                          setEditIPLoading(true)
                          const resp = await adminApi.getIPPoolAvailableIPs(
                            editIPPoolId,
                            searchVal || undefined
                          )
                          setEditIPAvailableIPs(resp.results || [])
                        } catch (err) {
                          console.error('IP search error:', err)
                        } finally {
                          setEditIPLoading(false)
                        }
                      }, 400)
                    }}
                  />
                  <Select
                    value={selectedNewIPId || "none"}
                    onValueChange={(val) => setSelectedNewIPId(val === "none" ? "" : val)}
                  >
                    <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700">
                      <SelectValue placeholder={editIPLoading ? "Loading..." : "Select an IP address"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Select IP —</SelectItem>
                      {editIPAvailableIPs.map(ip => (
                        <SelectItem key={ip.id} value={String(ip.id)}>
                          <span className="font-mono">{ip.ip_address}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editIPAvailableIPs.length > 0 && !editIPLoading && (
                    <p className="text-xs text-muted-foreground">
                      Showing {editIPAvailableIPs.length} available — type above to search
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditIPDialog(false)} disabled={savingIP}>
                Cancel
              </Button>
              <Button
                onClick={confirmEditIP}
                disabled={savingIP || !selectedNewIPId || editIPAvailableIPs.length === 0}
                className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {savingIP ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Changing...</>
                ) : (
                  <><Server className="w-4 h-4 mr-2" />Change IP</>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Bulk SMS Dialog */}
      <Dialog open={showSmsDialog} onOpenChange={(open) => {
        setShowSmsDialog(open)
        if (!open) {
          setSmsTarget(null)
          setSmsMessage("")
        }
      }}>
        <DialogContent className="admin-theme-dialog p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className="dark:text-white">Send SMS</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                {smsTarget
                  ? `Send a message to ${smsTarget.name} (${smsTarget.phone})`
                  : selectedUsers.length > 0
                  ? `Send SMS to ${selectedUsers.length} selected user(s)`
                  : "Send SMS"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {smsTarget && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Quick Templates</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const paybill = mpesaConfig?.business_shortcode || "N/A"
                        const billingAcc = smsTarget.billingAccountNumber || "N/A"
                        setSmsMessage(
                          `Hello ${smsTarget.name}, make payments via M-Pesa Paybill: ${paybill}, Account No: ${billingAcc}. Thank you!`
                        )
                      }}
                      className="text-left px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-xs"
                    >
                      <p className="font-medium text-blue-800 dark:text-blue-300">💳 Payment Details</p>
                      <p className="text-blue-600 dark:text-blue-400 mt-0.5 line-clamp-2">
                        Paybill + billing account number template
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const rawPhone = smsTarget?.phone || ""
                        const normalizedPhone = rawPhone.replace(/^254/, "0").replace(/^\+254/, "0")
                        const email = smsTarget?.email && smsTarget.email !== "No email" ? smsTarget.email : "your email"
                        const portalUrl = `${tenantSubdomain}.netily.co.ke/customer/login`
                        setSmsMessage(
                          `Hello ${smsTarget?.name}, login to your customer portal at ${portalUrl} using: Username: ${normalizedPhone} | Password: ${normalizedPhone}`
                        )
                      }}
                      className="text-left px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-xs"
                    >
                      <p className="font-medium text-purple-800 dark:text-purple-300">🔑 Portal Credentials</p>
                      <p className="text-purple-600 dark:text-purple-400 mt-0.5 line-clamp-2">
                        Customer portal login URL + credentials
                      </p>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="dark:text-slate-200">Message</Label>
                <Textarea
                  placeholder="Enter your message or pick a template above..."
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={4}
                  className="dark:bg-slate-900 dark:border-slate-700"
                />
                <p className="text-xs text-muted-foreground">{smsMessage.length}/160 characters</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSmsDialog(false)} disabled={sendingSms}>
                Cancel
              </Button>
              <Button
                onClick={smsTarget ? handleSendSingleSms : handleSendBulkSms}
                disabled={sendingSms || !smsMessage.trim() || (!smsTarget && selectedUsers.length === 0)}
                className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {sendingSms ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />Send SMS</>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Per-user SMS Dialog */}
      <Dialog open={showUserSmsDialog} onOpenChange={setShowUserSmsDialog}>
        <DialogContent className="admin-theme-dialog sm:max-w-lg p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 dark:text-white">
                <Send className="w-4 h-4" />
                Send SMS to {userSmsTarget?.name}
              </DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Use the quick templates below or click a variable to insert it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {userSmsTarget && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Quick Templates</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const paybill = mpesaConfig?.business_shortcode || "N/A"
                        const billingAcc = userSmsTarget.billingAccountNumber || "N/A"
                        setUserSmsMessage(
                          `Hello ${userSmsTarget.name}, make payments via M-Pesa Paybill: ${paybill}, Account No: ${billingAcc}. Thank you!`
                        )
                      }}
                      className="text-left px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-xs"
                    >
                      <p className="font-medium text-blue-800 dark:text-blue-300">💳 Payment Details</p>
                      <p className="text-blue-600 dark:text-blue-400 mt-0.5 line-clamp-2">
                        Paybill + billing account number template
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const rawPhone = userSmsTarget?.phone || ""
                        const normalizedPhone = rawPhone.replace(/^254/, "0").replace(/^\+254/, "0")
                        const email = userSmsTarget?.email && userSmsTarget.email !== "No email" ? userSmsTarget.email : "your email"
                        const portalUrl = `${tenantSubdomain}.netily.co.ke/customer/login`
                        setUserSmsMessage(
                          `Hello ${userSmsTarget?.name}, login to your customer portal at ${portalUrl} using: Username: ${normalizedPhone} | Password: ${normalizedPhone}`
                        )
                      }}
                      className="text-left px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-xs"
                    >
                      <p className="font-medium text-purple-800 dark:text-purple-300">🔑 Portal Credentials</p>
                      <p className="text-purple-600 dark:text-purple-400 mt-0.5 line-clamp-2">
                        Customer portal login URL + credentials
                      </p>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Insert variable</p>
                <div className="flex flex-wrap gap-1.5">
                  {SMS_VARIABLES.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setUserSmsMessage(prev => prev + key)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="dark:text-slate-200">Message</Label>
                <Textarea
                  placeholder="Type your message, use templates above, or click variables to insert them…"
                  value={userSmsMessage}
                  onChange={e => setUserSmsMessage(e.target.value)}
                  rows={4}
                  className="font-mono text-sm dark:bg-slate-900 dark:border-slate-700"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">{userSmsMessage.length} / 160 characters</p>
              </div>

              {userSmsTarget && userSmsMessage && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border dark:border-slate-700 text-sm space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Preview (resolved)</p>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                    {resolveMessageVariables(userSmsMessage, userSmsTarget)}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserSmsDialog(false)} disabled={sendingUserSms}>
                Cancel
              </Button>
              <Button onClick={handleSendUserSms} disabled={sendingUserSms || !userSmsMessage.trim()} className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                {sendingUserSms
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                  : <><Send className="w-4 h-4 mr-2" />Send SMS</>
                }
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Hotspot Delete Confirmation */}
      <Dialog open={showHotspotDeleteDialog} onOpenChange={(open) => {
        if (!open) { setShowHotspotDeleteDialog(false); setHotspotDeleteTarget(null) }
      }}>
        <DialogContent className="admin-theme-dialog max-w-sm w-[90vw] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center pt-8 pb-2 px-6 bg-white dark:bg-slate-900">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-500 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-foreground text-center">Delete Client?</h2>
              <p className="text-sm text-muted-foreground text-center mt-2 mb-6">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{hotspotDeleteTarget?.username}</span> will be permanently removed along with their RADIUS credentials. This cannot be undone.
              </p>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={confirmDeleteHotspotClient}
                disabled={deletingHotspot}
                className="w-full py-4 text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 active:bg-red-100 dark:active:bg-red-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deletingHotspot ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting...</> : 'Delete'}
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800" />
              <button
                onClick={() => { setShowHotspotDeleteDialog(false); setHotspotDeleteTarget(null) }}
                disabled={deletingHotspot}
                className="w-full py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Add IP Binding Dialog */}
      <Dialog open={showAddIPBindingDialog} onOpenChange={(open) => {
        setShowAddIPBindingDialog(open)
        if (!open) {
          setIpBindingForm({ router_id: "", plan_id: "", name: "", mac_address: "", ip_address: "", notes: "" })
          setKnownHosts([])
          setHotspotPlansForBinding([])
        }
      }}>
        <DialogContent className="admin-theme-dialog max-w-lg p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle>Add IP Binding</DialogTitle>
              <DialogDescription>
                For devices that can't use the captive portal (Smart TVs, consoles). Bypasses login entirely.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label className="dark:text-slate-200">Router <span className="text-red-500">*</span></Label>
                <Select
                  value={ipBindingForm.router_id}
                  onValueChange={(v) => {
                    setIpBindingForm(f => ({ ...f, router_id: v, mac_address: "", ip_address: "" }))
                    loadKnownHosts(v)
                    loadHotspotPlansForRouter(v)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select router" />
                  </SelectTrigger>
                  <SelectContent>
                    {routersList.map(r => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="dark:text-slate-200">Plan <span className="text-red-500">*</span> (sets speed & duration)</Label>
                <Select
                  value={ipBindingForm.plan_id}
                  onValueChange={(v) => setIpBindingForm(f => ({ ...f, plan_id: v }))}
                  disabled={!ipBindingForm.router_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!ipBindingForm.router_id ? "Select router first" : "Select plan"} />
                  </SelectTrigger>
                  <SelectContent>
                    {hotspotPlansForBinding.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.duration_display || `${p.validity_value} ${p.validity_type?.toLowerCase()}`} @ {p.speed_display || `${p.download_speed} Mbps`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="dark:text-slate-200">Name <span className="text-xs text-slate-400">(for identification)</span></Label>
                <Input
                  placeholder="e.g. Living Room TV"
                  value={ipBindingForm.name}
                  onChange={(e) => setIpBindingForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label className="dark:text-slate-200">Device (pick detected host, or type manually)</Label>
                <Select
                  value=""
                  onValueChange={(v) => {
                    const host = knownHosts.find(h => h.mac === v)
                    if (host) setIpBindingForm(f => ({ ...f, mac_address: host.mac, ip_address: host.ip }))
                  }}
                  disabled={!ipBindingForm.router_id || knownHostsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={knownHostsLoading ? "Scanning network..." : "Select detected device (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {knownHosts.map(h => (
                      <SelectItem key={h.mac} value={h.mac}>
                        {h.ip} — {h.mac} {h.hostname ? `(${h.hostname})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="dark:text-slate-200">MAC Address <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="AA:BB:CC:DD:EE:FF"
                    value={ipBindingForm.mac_address}
                    onChange={(e) => setIpBindingForm(f => ({ ...f, mac_address: e.target.value.toUpperCase() }))}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="dark:text-slate-200">IP Address <span className="text-xs text-slate-400">(optional)</span></Label>
                  <Input
                    placeholder="192.168.x.x"
                    value={ipBindingForm.ip_address}
                    onChange={(e) => setIpBindingForm(f => ({ ...f, ip_address: e.target.value }))}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowAddIPBindingDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleCreateIPBinding} 
                disabled={creatingBinding}
              >
                {creatingBinding ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  "Create Binding"
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* ============================================================
          CLAUDE CHANGE #4: SUSPEND CONFIRMATION DIALOG
          ============================================================ */}
      <Dialog open={showSuspendDialog} onOpenChange={(open) => { setShowSuspendDialog(open); if (!open) setSuspendTarget(null) }}>
        <DialogContent className="admin-theme-dialog sm:max-w-md p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className={suspendTarget && isSuspended(suspendTarget) ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                {suspendTarget && isSuspended(suspendTarget) ? "Unsuspend User?" : "Suspend User?"}
              </DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                {suspendTarget && isSuspended(suspendTarget) ? (
                  <>Internet access for <strong>{suspendTarget.name}</strong> will be restored immediately. Their subscription and expiry date are unchanged — they simply resume where they left off.</>
                ) : (
                  <>Internet access for <strong>{suspendTarget?.name}</strong> will be paused immediately and they'll be disconnected. Their subscription, expiry date, and data are kept safe and will resume exactly where they left off once you unsuspend them.</>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSuspendDialog(false)} disabled={suspending}>
                Cancel
              </Button>
              <Button
                onClick={confirmToggleSuspend}
                disabled={suspending}
                className={suspendTarget && isSuspended(suspendTarget) ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700"}
              >
                {suspending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : suspendTarget && isSuspended(suspendTarget) ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Unsuspend</>
                ) : (
                  <><Power className="w-4 h-4 mr-2" />Suspend</>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

    </PageWrapper>
  )
}