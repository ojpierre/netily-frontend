"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import CountUp from "react-countup"
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
} from "lucide-react"
import { adminApi } from "@/lib/admin-api"
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

// Animation variants
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

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" },
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

export default function UsersPage() {
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState("general")
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState("all")
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showSmsDialog, setShowSmsDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
  const [editingBilling, setEditingBilling] = useState(false)
  const [billingNumberEdit, setBillingNumberEdit] = useState("")
  const [savingBilling, setSavingBilling] = useState(false)
  const itemsPerPage = 10

  const [showEditIPDialog, setShowEditIPDialog] = useState(false)
  const [userToEditIP, setUserToEditIP] = useState<User | null>(null)
  const [editIPAvailableIPs, setEditIPAvailableIPs] = useState<AvailableIP[]>([])
  const [editIPLoading, setEditIPLoading] = useState(false)
  const [selectedNewIPId, setSelectedNewIPId] = useState<string>("")
  const [editIPSearchQuery, setEditIPSearchQuery] = useState("")
  const [savingIP, setSavingIP] = useState(false)
  const [editIPPoolId, setEditIPPoolId] = useState<number | null>(null)

  const [hotspotDetailOpen, setHotspotDetailOpen] = useState(false)
  const [hotspotDetailClient, setHotspotDetailClient] = useState<ActiveSubscription | null>(null)
  const [hotspotDetailTab, setHotspotDetailTab] = useState('overview')
  const [hotspotClientSessions, setHotspotClientSessions] = useState<any[]>([])
  const [hotspotClientSessionsLoading, setHotspotClientSessionsLoading] = useState(false)
  const [hotspotClientSessionsPage, setHotspotClientSessionsPage] = useState(1)
  const [hotspotClientSessionsTotal, setHotspotClientSessionsTotal] = useState(0)
  const [hotspotClientSessionsTotalPages, setHotspotClientSessionsTotalPages] = useState(1)
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

  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
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

  const [activeStatFilter, setActiveStatFilter] = useState<string>("all")
  const [hotspotSubFilter, setHotspotSubFilter] = useState<"active" | "expired">("active")

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

  const loadExpiredUsersFromRADIUS = async () => {
    if (expiredUsersLoading) return
    try {
      setExpiredUsersLoading(true)
      console.log('🔄 Loading expired users...')
      
      const res = await adminApi.getRADIUSCredentials({
        page_size: "200",
        page: "1",
        expired_only: "true",
      })
      
      console.log('📊 Expired API response:', res)
      console.log('📊 Count:', res.count)
      console.log('📊 Results length:', res.results?.length)
      
      if (!res.results || res.results.length === 0) {
        console.warn('⚠️ No expired credentials found in API response')
        setExpiredUsers([])
        return
      }
      
      const mapped = res.results.map((cred: any) => {
        console.log('📝 Mapping credential:', cred.id, cred.username, cred.expiration_date)
        
        return {
          id: cred.customer_code || `CRED-${cred.id}`,
          customerId: parseInt(String(cred.customer)),
          serviceId: null,
          billingAccountNumber: undefined,
          name: cred.customer_name || "Unknown",
          email: "",
          phone: "",
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
        }
      })
      
      console.log('✅ Mapped expired users:', mapped.length)
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
    adminApi.getMpesaConfigurations({ is_active: "true", page_size: "1" }).then(res => {
      if (res.results?.[0]) setMpesaConfig(res.results[0])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    
    loadUsers(1).then(() => {
      loadServerStats()
      loadStatusCounts()
    })
    
    const timer = setTimeout(() => {
      loadOnlineSessions()
      loadActiveSubscriptions()
    }, 200)
    
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

  const loadOnlineSessions = async () => {
    try {
      setOnlineSessionsLoading(true)
      
      const response = await adminApi.getOnlineSessions()
      let allSessions = response.sessions || []
      const total = allSessions.length

      if (total > 0 && allSessions.length > 0) {
        // Use existing sessions
      }

      setOnlineSessions(allSessions)
      setOnlineTotal(total)
    } catch (err) {
      console.error('Failed to load online sessions:', err)
      setOnlineSessions([])
    } finally {
      setOnlineSessionsLoading(false)
    }
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

  const loadUsers = async (page = 1, search?: string, status?: string) => {
    try {
      setLoading(true)
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
        return
      }

      if (effectiveStatus !== "all") {
        params.status = statusMap[effectiveStatus] || effectiveStatus.toUpperCase()
      }

      const response = await adminApi.getCustomers(params)
      const mappedUsers = response.results.map(mapCustomerToUser)
      setUsers(mappedUsers)
      setTotalCount(response.count)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError("Failed to load users. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async (customerId: number) => {
    try {
      const response = await adminApi.getPayments({ customer: String(customerId) })
      setPayments(response.results || [])
    } catch (err) {
      console.error('Failed to load payments:', err)
      setPayments([])
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadUsers(serverPage, searchQuery, statusFilter)
    await loadOnlineSessions()
    await loadServerStats()
    await loadStatusCounts()
    setRefreshing(false)
  }

  const handleSaveBillingNumber = async () => {
    if (!selectedUser || !billingNumberEdit.trim()) return
    try {
      setSavingBilling(true)
      const services = await adminApi.getCustomerServices(selectedUser.customerId)
      if (!services || services.length === 0) {
        toast.error('No service found for this customer')
        return
      }
      const primaryService = services[0]
      await adminApi.updateCustomerService(
        selectedUser.customerId,
        primaryService.id,
        { billing_account_number: billingNumberEdit.trim().toUpperCase() }
      )
      toast.success('Billing account number updated')
      setEditingBilling(false)
      setSelectedUser(prev => prev ? { ...prev, billingAccountNumber: billingNumberEdit.trim().toUpperCase() } : prev)
      await loadUsers(serverPage, searchQuery, statusFilter)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update billing number')
    } finally {
      setSavingBilling(false)
    }
  }

  const handleCreateCustomer = async () => {
    if (!newCustomerForm.first_name || !newCustomerForm.last_name) {
      toast.error("First name and last name are required")
      return
    }
    if (!newCustomerForm.phone) {
      toast.error("Phone number is required")
      return
    }
    if (!newCustomerForm.password) {
      toast.error("Password is required")
      return
    }

    try {
      setCreating(true)
      const customerData = {
        first_name: newCustomerForm.first_name,
        last_name: newCustomerForm.last_name,
        email: newCustomerForm.email || undefined,
        phone: newCustomerForm.phone, 
        password: newCustomerForm.password,
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
            radius_password: newCustomerForm.radius_password || newCustomerForm.password,
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
      
      setNewCustomerForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
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
      
      await loadUsers(serverPage, searchQuery, statusFilter)
      await loadServerStats()
      await loadStatusCounts()
      
    } catch (err: any) {
      console.error('Failed to create customer:', err)
      toast.error(err.message || "Failed to create customer. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const loadHotspotClientSessions = async (clientId: number, page = 1) => {
    try {
      setHotspotClientSessionsLoading(true)
      const res = await adminApi.getHotspotClientSessions(clientId, { page, page_size: 15 })
      setHotspotClientSessions(res.sessions)
      setHotspotClientSessionsTotal(res.count)
      setHotspotClientSessionsTotalPages(res.total_pages)
      setHotspotClientSessionsPage(page)
    } catch (err) {
      console.error('Failed to load client sessions:', err)
    } finally {
      setHotspotClientSessionsLoading(false)
    }
  }

  // FIX 1: Open hotspot detail only ONCE - no useEffect duplication
  const handleOpenHotspotDetail = (item: ActiveSubscription) => {
    setHotspotDetailClient(item)
    setHotspotDetailTab('overview')
    setHotspotClientSessions([])
    setHotspotDetailOpen(true) // Only set open here
    if ((item as any).client_id) {
      loadHotspotClientSessions((item as any).client_id)
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
      setHotspotDetailOpen(false)
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
      const session = user.radiusCredentials?.username
        ? onlineSessionsByUsername.get(user.radiusCredentials.username)
        : undefined

      const isOnline = !!session

      let currentUsage = user.dataUsed
      if (session?.usage) {
        const valMatch = session.usage.match(/([\d.]+)/)
        const unitMatch = session.usage.match(/(GB|MB|KB|B)/i)
        
        if (valMatch) {
          let val = parseFloat(valMatch[1])
          const unit = unitMatch ? unitMatch[1].toUpperCase() : 'GB'
          
          if (unit === 'MB') val = val / 1024
          else if (unit === 'KB') val = val / (1024 * 1024)
          
          currentUsage = val
        }
      }

      return {
        ...user,
        connectionStatus: (isOnline ? "online" : "offline") as "online" | "offline",
        dataUsed: isOnline ? currentUsage : (user.dataUsed || 0),
        liveUsageString: session?.usage,
        lastOnline: isOnline ? "Now" : user.lastOnline,
        ipAddress: session?.ip_address || user.ipAddress,
        macAddress: session?.mac_address || user.macAddress,
        router: session?.router || user.router,
      }
    })
  }, [users, onlineSessionsByUsername])

  const activeHotspotClients = useMemo(() => {
    return hotspotClients.filter(client => {
      if (!client.current_session) return false;
      return client.current_session.status === 'active' || 
             client.current_session.status === 'paid';
    });
  }, [hotspotClients]);

  const stats: UserStats = useMemo(() => {
    const onlineCount = onlineTotal || onlineSessions.length;
    
    const activeHotspotCount = (activeSubscriptions.hotspot?.filter(h => 
      h.is_active_sub ?? (h.subscription_status === 'active' && h.expiry_date && new Date(h.expiry_date) > new Date())
    ).length || 0);
    
    const activePPPoECount = activeSubscriptions.pppoe?.length || 0;
    const totalActiveSubs = activeHotspotCount + activePPPoECount;

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
  }, [totalCount, serverStatusCounts, serverStats.expired, onlineTotal, onlineSessions, activeSubscriptions])

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

  const paginatedOnlineSessions = useMemo(() => {
    const start = (onlinePage - 1) * onlinePageSize
    return filteredOnlineSessions.slice(start, start + onlinePageSize)
  }, [filteredOnlineSessions, onlinePage, onlinePageSize])

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

  useEffect(() => {
    setServerPage(1)
    loadUsers(1, searchQuery, statusFilter)
  }, [searchQuery, statusFilter])

  const handlePageChange = (newPage: number) => {
    setServerPage(newPage)
    loadUsers(newPage, searchQuery, statusFilter)
  }

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
      active: "bg-green-100 text-green-700 border-green-200",
      inactive: "bg-gray-100 text-gray-700 border-gray-200",
      expired: "bg-red-100 text-red-700 border-red-200",
      suspended: "bg-yellow-100 text-yellow-700 border-yellow-200",
      pending: "bg-orange-100 text-orange-700 border-orange-200",
      online: "bg-blue-100 text-blue-700 border-blue-200",
      offline: "bg-slate-100 text-slate-700 border-slate-200",
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
          <span className="text-sm font-medium text-emerald-600">Online</span>
        </div>
      )
    }
    return (
      <span className="text-sm text-slate-400">Offline</span>
    )
  }

  const getTypeBadge = (type: UserType) => {
    const config: Record<UserType, { icon: typeof Wifi; class: string; label: string }> = {
      pppoe: { icon: Globe, class: "bg-purple-100 text-purple-700 border-purple-200", label: "PPPoE" },
      static: { icon: Server, class: "bg-orange-100 text-orange-700 border-orange-200", label: "Static IP" },
      fiber: { icon: Signal, class: "bg-teal-100 text-teal-700 border-teal-200", label: "Fiber" },
      wireless: { icon: Wifi, class: "bg-cyan-100 text-cyan-700 border-cyan-200", label: "Wireless" },
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
    setSelectedUser(user)
    setDrawerTab("general")
    setDrawerOpen(true)
    loadPayments(user.customerId)
  }

  const handleDisconnectUser = async (user: User) => {
    if (!user.serviceId) {
      toast.error("No active service to disconnect")
      return
    }
    try {
      await adminApi.suspendService(user.customerId, user.serviceId, 'Manual disconnect')
      toast.success(`${user.name} disconnected`)
      await Promise.all([loadUsers(serverPage, searchQuery, statusFilter), loadOnlineSessions()])
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect user')
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
      await loadUsers(serverPage, searchQuery, statusFilter)
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
      await loadUsers(serverPage, searchQuery, statusFilter)
      await loadOnlineSessions()
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
      await loadUsers(serverPage, searchQuery, statusFilter)
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
      setDrawerOpen(false)
      await Promise.all([loadUsers(serverPage, searchQuery, statusFilter), loadOnlineSessions(), loadServerStats(), loadStatusCounts()])
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
      await Promise.all([loadUsers(serverPage, searchQuery, statusFilter), loadOnlineSessions(), loadServerStats(), loadStatusCounts()])
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete some users')
      await Promise.all([loadUsers(serverPage, searchQuery, statusFilter), loadOnlineSessions(), loadServerStats(), loadStatusCounts()])
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
      await loadUsers(serverPage, searchQuery, statusFilter)
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
      await loadUsers(serverPage, searchQuery, statusFilter)
    } catch (err: any) {
      toast.error(err.message || `Failed to ${enable ? 'enable' : 'disable'} RADIUS`)
    } finally {
      setTogglingRadius(false)
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
      
      // Fixed: use 'phone' instead of 'phone_number'
      await adminApi.updateCustomer(selectedUser.customerId, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        ...(editForm.email.trim() ? { email: editForm.email.trim() } : {}),
        phone: editForm.phone, // Changed from phone_number to phone
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
      await loadUsers(serverPage, searchQuery, statusFilter)
      
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

  const handleSendUserSms = async () => {
    if (!userSmsTarget || !userSmsMessage.trim()) return
    try {
      setSendingUserSms(true)
      const resolved = resolveMessageVariables(userSmsMessage, userSmsTarget)
      await adminApi.sendSMS({ recipient: userSmsTarget.phone, message: resolved })
      toast.success(`SMS sent to ${userSmsTarget.name}`)
      setShowUserSmsDialog(false)
      setUserSmsMessage("")
    } catch (err: any) {
      toast.error(err.message || 'Failed to send SMS')
    } finally {
      setSendingUserSms(false)
    }
  }

  const handleSendSingleSms = async () => {
    if (!smsTarget || !smsMessage.trim()) return
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

  // Page animation wrapper
  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  )

  if (error) {
    return (
      <PageWrapper>
        <h1 className="text-3xl font-bold">Users Management</h1>
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Users Management</h1>
          <p className="text-slate-500 mt-1">Manage Hotspot, PPPoE, and Static IP users</p>
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
          <Dialog open={showAddUserDialog} onOpenChange={(open) => {
            setShowAddUserDialog(open)
            if (open) {
              loadPlans()
              loadRouters()
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-0">
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
                  <h4 className="text-sm font-semibold text-slate-700 border-b pb-1">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>First Name <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="John"
                        value={newCustomerForm.first_name}
                        onChange={(e) => setNewCustomerForm({...newCustomerForm, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Last Name <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Doe"
                        value={newCustomerForm.last_name}
                        onChange={(e) => setNewCustomerForm({...newCustomerForm, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Phone <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="07XXXXXXXX"
                        value={newCustomerForm.phone}
                        onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email <span className="text-xs text-slate-400">(optional)</span></Label>
                      <Input
                        placeholder="john@example.com"
                        value={newCustomerForm.email}
                        onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Location <span className="text-xs text-slate-400">(optional)</span></Label>
                    <Input
                      placeholder="e.g. Westlands, Nairobi"
                      value={newCustomerForm.location}
                      onChange={(e) => setNewCustomerForm({...newCustomerForm, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Portal Password <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      placeholder="Enter password for customer portal"
                      value={newCustomerForm.password}
                      onChange={(e) => setNewCustomerForm({...newCustomerForm, password: e.target.value})}
                    />
                    <p className="text-xs text-slate-500">Used for customer portal login. Also used as RADIUS password if not specified below.</p>
                  </div>
                </div>

                {/* Connection Details */}
                <div className="space-y-4 mt-4">
                  <h4 className="text-sm font-semibold text-slate-700 border-b pb-1">Connection Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Connection Type</Label>
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
                      <Label>Plan <span className="text-red-500 text-xs">*</span></Label>
                      <Select
                        value={newCustomerForm.plan_id || "none"}
                        onValueChange={(value) => setNewCustomerForm({...newCustomerForm, plan_id: value === "none" ? "" : value})}
                        disabled={plansLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={plansLoading ? "Loading..." : "Select plan"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Plan</SelectItem>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={String(plan.id)}>
                              {plan.name} - KES {parseFloat(plan.base_price || plan.price || "0").toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedPlanPool && (
                    <div className="space-y-1">
                      <Label>Assign Static IP <span className="text-xs text-slate-400">(optional)</span></Label>
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
                        <p className="text-xs text-slate-500 flex items-center gap-1">
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
                            <p className="text-xs text-slate-500">
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
                  <h4 className="text-sm font-semibold text-slate-700 border-b pb-1 flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    PPPoE / RADIUS Credentials
                  </h4>
                  <p className="text-xs text-slate-500">
                    Leave blank to auto-generate from phone number. 
                    Username defaults to last 9 digits of phone, password defaults to portal password.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>PPPoE Username <span className="text-xs text-slate-400">(optional)</span></Label>
                      <div className="flex gap-1">
                        <Input
                          placeholder="Auto from phone"
                          value={newCustomerForm.radius_username}
                          onChange={(e) => setNewCustomerForm({...newCustomerForm, radius_username: e.target.value})}
                          className="font-mono text-sm"
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
                      <Label>PPPoE Password <span className="text-xs text-slate-400">(optional)</span></Label>
                      <div className="flex gap-1">
                        <Input
                          placeholder="Auto from portal password"
                          type="password"
                          value={newCustomerForm.radius_password}
                          onChange={(e) => setNewCustomerForm({...newCustomerForm, radius_password: e.target.value})}
                          className="font-mono text-sm"
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
                  <div className="p-2 bg-purple-50 border border-purple-200 rounded text-xs font-mono space-y-1">
                    <div className="flex gap-2">
                      <span className="text-purple-500 w-20">Username:</span>
                      <span className="text-purple-900 font-semibold">
                        {newCustomerForm.radius_username || 
                          (newCustomerForm.phone ? `(auto: ${generateUsernameFromPhone(newCustomerForm.phone)})` : '(waiting for phone)')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-purple-500 w-20">Password:</span>
                      <span className="text-purple-900 font-semibold">
                        {newCustomerForm.radius_password ? '(custom)' : '(auto: same as portal password)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Billing Account Notice */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-900">M-Pesa Paybill Account</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      The account number is generated from the customer's phone number. 
                      You can edit it after creation.
                    </p>
                  </div>
                </div>

                {/* Activation Options */}
                <div className="space-y-2 mt-4">
                  <h4 className="text-sm font-semibold text-slate-700 border-b pb-1">Activation</h4>
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
                            ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <p className="text-xs font-medium text-slate-900 dark:text-white">{opt.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
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
                      <Label htmlFor="record_payment" className="cursor-pointer text-sm">Record initial payment</Label>
                    </div>
                    {newCustomerForm.record_initial_payment && (
                      <div className="grid grid-cols-2 gap-3 pl-6">
                        <div className="space-y-1">
                          <Label className="text-xs">Amount (KES) <span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={newCustomerForm.initial_payment_amount || ''}
                            onChange={(e) => setNewCustomerForm({...newCustomerForm, initial_payment_amount: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Reference <span className="text-xs text-slate-400">(optional)</span></Label>
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
        </div>
      </div>

      {/* Stats Bar - With animated indicator and Hotspot filter tabs */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto relative"
      >
        {[
          { label: "Total", value: stats.total, key: "all", tab: "all", status: "all", color: "text-slate-800" },
          { label: "Online", value: stats.online, key: "online", tab: "online-sessions", status: "all", color: "text-emerald-600", pulse: true },
          { label: "Active", value: stats.active, key: "active", tab: "all", status: "active", color: "text-green-600" },
          { label: "Pending", value: stats.pending, key: "pending", tab: "all", status: "pending", color: "text-orange-500" },
          { label: "Suspended", value: stats.suspended, key: "suspended", tab: "all", status: "suspended", color: "text-yellow-600" },
          { label: "Expired", value: serverStats.expired, key: "expired", tab: "all", status: "expired", color: "text-red-500" },
        ].map(({ label, value, key, tab, status, color, pulse }) => {
          const isActive = activeStatFilter === key
          return (
            <motion.button
              key={key}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveStatFilter(key)
                setActiveTab(tab)
                setStatusFilter(status)
                if (tab === "online-sessions") loadOnlineSessions()
              }}
              className={`relative flex flex-col items-center px-4 py-2 rounded-lg transition-all duration-200 shrink-0 ${
                isActive ? "bg-slate-100 ring-1 ring-slate-300" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
                <span className={`text-2xl font-black tabular-nums transition-all duration-200 ${color}`}>
                  <CountUp end={value} duration={1.2} separator="," />
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{label}</span>
              {isActive && (
                <motion.span 
                  layoutId="active-stat-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-slate-800 rounded-full"
                />
              )}
            </motion.button>
          )
        })}
        <div className="w-px h-10 bg-slate-200 mx-1 shrink-0" />
        {[
          { label: "Hotspot Subs", value: stats.hotspot, key: "hotspot", tab: "hotspot", color: "text-pink-600" },
        ].map(({ label, value, key, tab, color }) => {
          const isActive = activeStatFilter === key
          return (
            <motion.button
              key={key}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveStatFilter(key)
                setActiveTab(tab)
                setStatusFilter("all")
                setHotspotSubFilter("active")
              }}
              className={`relative flex flex-col items-center px-4 py-2 rounded-lg transition-all duration-200 shrink-0 ${
                isActive ? "bg-slate-100 ring-1 ring-slate-300" : "hover:bg-slate-50"
              }`}
            >
              <span className={`text-2xl font-black tabular-nums ${color}`}>
                <CountUp end={value} duration={1.2} separator="," />
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{label}</span>
              {isActive && (
                <motion.span 
                  layoutId="active-stat-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-pink-500 rounded-full"
                />
              )}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Unified Filter Bar - With sliding pill */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row gap-2"
      >
        <div className="relative flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
          {[
            { value: "all", label: "All PPPoE/Static", icon: Users },
            { value: "online-sessions", label: "Online Now", icon: Wifi },
            { value: "active-subs", label: "Active Subs", icon: CheckCircle2 },
            { value: "hotspot", label: "Hotspot", icon: Smartphone },
          ].map(({ value, label, icon: Icon }) => (
            <motion.button
              key={value}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveTab(value)
                if (!["all"].includes(value)) setStatusFilter("all")
                if (value === "online-sessions") loadOnlineSessions()
                if (value === "active-subs") loadAllActiveUsers()
                if (value === "hotspot" && activeSubscriptions.hotspot?.length === 0) loadActiveSubscriptions()
                if (value === "hotspot") setHotspotSubFilter("active")
              }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap z-10 ${
                activeTab === value
                  ? "text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
              style={{ transition: "color 0.2s ease" }}
            >
              {activeTab === value && (
                <motion.span
                  layoutId="active-tab-pill"
                  className="absolute inset-0 bg-slate-900 rounded-lg"
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
        {!["online-sessions", "active-subs", "hotspot"].includes(activeTab) && (
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
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
                onClick={() => setStatusFilter(value)}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  statusFilter === value
                    ? "text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {statusFilter === value && (
                  <motion.span
                    layoutId="active-status-pill"
                    className="absolute inset-0 bg-slate-900 rounded-lg"
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
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
            {[
              { value: "active" as const, label: "Active", color: "bg-green-600" },
              { value: "expired" as const, label: "Expired", color: "bg-red-600" },
            ].map(({ value, label, color }) => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setHotspotSubFilter(value)}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  hotspotSubFilter === value
                    ? "text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
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

      {/* Search - inline without card wrapper */}
      {!["online-sessions", "active-subs", "hotspot"].includes(activeTab) && (
        <motion.div 
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-2"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search name, phone, username, IP, billing account..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value
                setSearchQuery(val)
                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
                searchDebounceRef.current = setTimeout(() => {
                  setServerPage(1)
                  loadUsers(1, val, statusFilter)
                }, 400)
              }}
              className="pl-9 bg-white transition-all duration-300 focus:ring-4 focus:ring-violet-100 focus:border-violet-500"
              autoComplete="off"
            />
          </div>
          <Button variant="outline" className="shrink-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </motion.div>
      )}

      {selectedUsers.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200"
        >
          <span className="text-sm font-medium text-blue-900">{selectedUsers.length} selected</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => { setSmsTarget(null); setSmsMessage(""); setShowSmsDialog(true) }} className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <Send className="w-4 h-4 mr-2" />Send SMS
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" onClick={handleBulkDelete} disabled={deleting}>
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
          <Card className="border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-emerald-600" />
                    Online Users ({filteredOnlineSessions.length})
                  </CardTitle>
                  <CardDescription>Users currently connected via RADIUS - real-time session data</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search name, IP, MAC..."
                      value={onlineSearchQuery}
                      onChange={(e) => { setOnlineSearchQuery(e.target.value); setOnlinePage(1) }}
                      className="pl-9 transition-all duration-300 focus:ring-4 focus:ring-violet-100 focus:border-violet-500"
                    />
                  </div>
                  <Select value={onlineServiceFilter} onValueChange={(val) => { setOnlineServiceFilter(val); setOnlinePage(1) }}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="PPPOE">PPPoE</SelectItem>
                      <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                      <SelectItem value="STATIC">Static</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={loadOnlineSessions} disabled={onlineSessionsLoading}>
                    <RefreshCw className={`w-4 h-4 ${onlineSessionsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {onlineSessionsLoading && onlineSessions.length === 0 ? (
                <div className="space-y-px">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-1 py-3 border-b border-slate-100 last:border-0" style={{ opacity: 1 - i * 0.12 }}>
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
                  <WifiOff className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="font-semibold text-slate-700">No online users</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {onlineSearchQuery || onlineServiceFilter !== "all"
                      ? "Try adjusting your search or filter"
                      : "No users are currently connected via RADIUS"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>MAC Address</TableHead>
                          <TableHead>Router</TableHead>
                          <TableHead>Uptime</TableHead>
                          <TableHead>Usage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOnlineSessions.map((session) => (
                          <motion.tr
                            key={session.radacctid}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            whileHover={{ backgroundColor: "#faf5ff" }}
                            className="transition-colors duration-200 hover:bg-violet-50"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-medium text-xs">
                                  {((session.full_name || session.username) ?? 'HS')
                                    .split(' ')
                                    .map((n: string) => n?.[0] ?? '')
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2) || 'HS'}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">
                                    {(session as any).canonical_username
                                      ? (session as any).canonical_username
                                      : (session.full_name || session.username)}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {(session as any).canonical_username
                                      ? <span className="text-pink-600 font-medium">Hotspot</span>
                                      : (session.phone_number || '')}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                session.service_type === 'PPPOE' ? 'border-purple-300 text-purple-700 bg-purple-50' :
                                session.service_type === 'HOTSPOT' ? 'border-orange-300 text-orange-700 bg-orange-50' :
                                'border-blue-300 text-blue-700 bg-blue-50'
                              }>
                                {session.service_type === 'PPPOE' ? 'PPPoE' : session.service_type === 'HOTSPOT' ? 'Hotspot' : session.service_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {session.ip_address
                                  ? session.ip_address
                                  : (session as any).accounting_pending && !session.ip_address
                                    ? <span className="text-amber-500 text-xs italic">router connecting...</span>
                                    : "..."}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-xs text-slate-600">{session.mac_address || '...'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{session.router || '...'}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {(session as any).accounting_pending && !session.ip_address ? (
                                  <span className="flex items-center gap-1 text-amber-600 text-xs">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    {session.uptime}
                                  </span>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-sm">{session.uptime}</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">{session.usage}</span>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {onlineTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-slate-500">
                        Showing {((onlinePage - 1) * onlinePageSize) + 1}–{Math.min(onlinePage * onlinePageSize, filteredOnlineSessions.length)} of {filteredOnlineSessions.length} sessions
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={onlinePage === 1}
                          onClick={() => setOnlinePage(p => p - 1)}
                          className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={onlinePage === onlineTotalPages}
                          onClick={() => setOnlinePage(p => p + 1)}
                          className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
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
          <Card className="border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Active Subscriptions ({allActiveSubUsers.length})
                  </CardTitle>
                  <CardDescription>Users with active or pending subscriptions - manage extensions and removals</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search name, plan, phone, username..."
                      value={activeSearchQuery}
                      onChange={(e) => setActiveSearchQuery(e.target.value)}
                      className="pl-9 transition-all duration-300 focus:ring-4 focus:ring-violet-100 focus:border-violet-500"
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
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="font-semibold text-slate-700">No active subscriptions</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {activeSearchQuery ? "Try adjusting your search" : "No users with active subscriptions found"}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Connection</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Time Remaining</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                            whileHover={{ backgroundColor: "#faf5ff" }}
                            className="transition-colors duration-200 hover:bg-violet-50"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-xs">
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                                  <p className="text-xs text-slate-500">{user.phone}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{user.plan}</p>
                                <p className="text-xs text-slate-500">KES {user.planPrice.toLocaleString()}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.status === "active" ? (
                                <Badge className="bg-green-100 text-green-700">Active</Badge>
                              ) : (
                                <Badge className="bg-orange-100 text-orange-700">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.connectionStatus === "online" ? (
                                <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                                  <Wifi className="w-3 h-3" /> Online
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                  <XCircle className="w-3 h-3" /> Offline
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.plan === "No Plan" ? (
                                <div>
                                  <p className="text-sm">-</p>
                                  <p className="text-xs text-slate-500">Voucher</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm">{new Date(user.expiryDate).toLocaleDateString()}</p>
                                  <p className="text-xs text-slate-500">
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
                                <Badge className="bg-red-100 text-red-700 text-xs">{hoursLeft}h left</Badge>
                              ) : daysLeft <= 3 ? (
                                <Badge className="bg-yellow-100 text-yellow-700 text-xs">{daysLeft}d left</Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-700 text-xs">{daysLeft}d left</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExtendSubscription(user)}>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Extend Subscription
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenChangePlan(user)}>
                                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                                    Change Plan
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  {(user.type === "pppoe" || user.type === "static") && (
                                    <DropdownMenuItem onClick={() => handleEditIP(user)}>
                                      <Server className="w-4 h-4 mr-2" />
                                      Edit IP Address
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleOpenUserSms(user)}>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send SMS
                                  </DropdownMenuItem>
                                  {user.status === "pending" && (
                                    <DropdownMenuItem 
                                      onClick={() => handleActivateUser(user)}
                                      className="text-green-600"
                                    >
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Activate Now
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {user.radiusCredentials && (
                                    <DropdownMenuItem 
                                      onClick={() => handleToggleRadius(user, !user.radiusCredentials!.is_enabled)}
                                      className={user.radiusCredentials.is_enabled ? "text-yellow-600" : "text-green-600"}
                                    >
                                      <Power className="w-4 h-4 mr-2" />
                                      {user.radiusCredentials.is_enabled ? 'Disable RADIUS' : 'Enable RADIUS'}
                                    </DropdownMenuItem>
                                  )}
                                  {user.connectionStatus === "online" && (
                                    <DropdownMenuItem 
                                      onClick={() => handleDisconnectUser(user)}
                                      className="text-yellow-600"
                                    >
                                      <Power className="w-4 h-4 mr-2" />
                                      Disconnect
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteUser(user)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove User
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
          <Card className="border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-pink-600" />
                    Hotspot Clients ({activeSubscriptions.hotspot?.length || 0})
                  </CardTitle>
                  <CardDescription>All hotspot clients — active and expired subscriptions</CardDescription>
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
                    <div key={i} className="flex items-center gap-4 px-1 py-3 border-b border-slate-100 last:border-0" style={{ opacity: 1 - i * 0.12 }}>
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
                  <Smartphone className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="font-semibold text-slate-700">No hotspot clients yet</h3>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Client</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead>Router</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
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
                          const paginated = filtered.slice(
                            (hotspotPage - 1) * hotspotPageSize,
                            hotspotPage * hotspotPageSize
                          )
                          return paginated.map((item) => {
                            const isActive = item.is_active_sub ?? (item.subscription_status === 'active' && item.expiry_date && new Date(item.expiry_date) > new Date())
                            const liveUsage = item.canonical_username ? hotspotLiveUsageMap.get(item.canonical_username) : undefined
                            const hotspotIdentifier = item.canonical_username || item.username || item.display_name || "Hotspot"
                            const expiryLabel = item.expiry_date
                              ? new Date(item.expiry_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                              : '—'
                            const daysLeft = item.expiry_date
                              ? Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / 86400000)
                              : null

                            return (
                              <motion.tr
                                key={`${hotspotIdentifier}-${item.session_id || item.subscribed_at}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.15 }}
                                whileHover={{ backgroundColor: "#faf5ff", cursor: "pointer" }}
                                className="transition-colors duration-200 hover:bg-violet-50"
                                onClick={() => handleOpenHotspotDetail(item)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-xs ${isActive ? 'bg-gradient-to-br from-pink-500 to-orange-400' : 'bg-slate-300'}`}>
                                      HS
                                    </div>
                                    <div>
                                      <p className="font-medium text-slate-900 font-mono text-sm">{hotspotIdentifier}</p>
                                      <p className="text-xs text-slate-500">{item.phone || '—'}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {isActive ? (
                                    <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 text-xs">
                                      {item.plan_name}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-slate-300">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isActive ? (
                                    <Badge className="bg-green-100 text-green-700 gap-1 text-xs">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-700 text-xs">Expired</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm">{expiryLabel}</p>
                                    {daysLeft !== null && (
                                      <p className={`text-xs ${daysLeft > 0 ? 'text-slate-400' : 'text-red-500'}`}>
                                        {daysLeft > 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d ago`}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-slate-600">{item.router || '—'}</span>
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
                                      className="h-7 text-xs text-slate-500"
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

                  {activeSubscriptions.hotspot.length > hotspotPageSize && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-slate-500">
                        {(() => {
                          const filtered = activeSubscriptions.hotspot.filter(item => {
                            const isActive = item.is_active_sub ?? (item.subscription_status === 'active' && item.expiry_date && new Date(item.expiry_date) > new Date())
                            return hotspotSubFilter === "active" ? isActive : !isActive
                          })
                          const count = filtered.length
                          const start = ((hotspotPage - 1) * hotspotPageSize) + 1
                          const end = Math.min(hotspotPage * hotspotPageSize, count)
                          return `Showing ${start}–${end} of ${count}`
                        })()}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={hotspotPage === 1} onClick={() => setHotspotPage(p => p - 1)} className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">Previous</Button>
                        <Button variant="outline" size="sm" disabled={hotspotPage * hotspotPageSize >= activeSubscriptions.hotspot.filter(item => {
                          const isActive = item.is_active_sub ?? (item.subscription_status === 'active' && item.expiry_date && new Date(item.expiry_date) > new Date())
                          return hotspotSubFilter === "active" ? isActive : !isActive
                        }).length} onClick={() => setHotspotPage(p => p + 1)} className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">Next</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Users Table (for All/PPPoE/Static tabs) */}
      {!["online-sessions", "active-subs", "hotspot"].includes(activeTab) && (
        <motion.div
          key="users-table"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {activeTab === "all" && "Users"}
                    {activeTab === "pppoe" && "PPPoE Users"}
                    {activeTab === "static" && "Static IP Users"}
                    {statusFilter !== "all" && <span className="text-slate-400 font-normal ml-1">· {statusFilter}</span>}
                    <span className="text-slate-400 font-normal ml-1">({filteredUsers.length})</span>
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-400">{totalCount} total</p>
              </div>
            </CardHeader>
            <CardContent>
              {(loading || (statusFilter === "expired" && expiredUsersLoading)) ? (
                <div className="space-y-px">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-0"
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
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="font-semibold text-slate-700">No users found</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                filteredUsers.length > 0 &&
                                selectedUsers.length === filteredUsers.length
                              }
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Connection</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Data Usage</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            whileHover={{ backgroundColor: "#faf5ff" }}
                            className="transition-all duration-200 hover:bg-violet-50 hover:shadow-sm group"
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectUser(user.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                                  <p className="text-xs text-slate-500">{user.phone}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(user.type)}</TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell>{getConnectionBadge(user.connectionStatus)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{user.plan}</p>
                                <p className="text-xs text-slate-500">KES {user.planPrice.toLocaleString()}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
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
                                  <p className="text-sm">-</p>
                                  <p className="text-xs text-slate-500">Voucher</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm">{new Date(user.expiryDate).toLocaleDateString()}</p>
                                  <p className="text-xs text-slate-500">
                                    {new Date(user.expiryDate) > new Date() 
                                      ? `${Math.ceil((new Date(user.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`
                                      : "Expired"
                                    }
                                  </p>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExtendSubscription(user)}>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Extend Subscription
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenChangePlan(user)}>
                                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                                    Change Plan
                                  </DropdownMenuItem>
                                  {(user.type === "pppoe" || user.type === "static") && (
                                    <DropdownMenuItem onClick={() => handleEditIP(user)}>
                                      <Server className="w-4 h-4 mr-2" />
                                      Edit IP Address
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleOpenUserSms(user)}>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send SMS
                                  </DropdownMenuItem>
                                  {user.status === "pending" && (
                                    <DropdownMenuItem 
                                      onClick={() => handleActivateUser(user)}
                                      className="text-green-600"
                                    >
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Activate Now
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {user.radiusCredentials && (
                                    <DropdownMenuItem 
                                      onClick={() => handleToggleRadius(user, !user.radiusCredentials!.is_enabled)}
                                      className={user.radiusCredentials.is_enabled ? "text-yellow-600" : "text-green-600"}
                                    >
                                      <Power className="w-4 h-4 mr-2" />
                                      {user.radiusCredentials.is_enabled ? 'Disable RADIUS' : 'Enable RADIUS'}
                                    </DropdownMenuItem>
                                  )}
                                  {user.connectionStatus === "online" && (
                                    <DropdownMenuItem 
                                      onClick={() => handleDisconnectUser(user)}
                                      className="text-yellow-600"
                                    >
                                      <Power className="w-4 h-4 mr-2" />
                                      Disconnect
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteUser(user)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && statusFilter !== "expired" && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-slate-600">
                        Page {serverPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={serverPage === 1}
                          onClick={() => handlePageChange(serverPage - 1)}
                          className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={serverPage === totalPages}
                          onClick={() => handlePageChange(serverPage + 1)}
                          className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* All dialogs continue here... */}
      {/* User Detail Dialog */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Complete information about this user</DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="mt-2">
                <div className="flex border-b mb-4">
                  <button
                    onClick={() => setDrawerTab("general")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      drawerTab === "general"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    General Information
                  </button>
                  <button
                    onClick={() => setDrawerTab("payments")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      drawerTab === "payments"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Payments
                    {payments.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {payments.length}
                      </span>
                    )}
                  </button>
                </div>

                {drawerTab === "general" && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {getTypeBadge(selectedUser.type)}
                      {getStatusBadge(selectedUser.status)}
                      {getConnectionBadge(selectedUser.connectionStatus)}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                          {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-slate-900 dark:text-white">{selectedUser.name}</p>
                          <p className="text-sm text-slate-500">{selectedUser.id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-500">Email</label>
                          <p className="text-sm text-slate-900 dark:text-white">
                            {selectedUser.email || <span className="text-slate-400 italic">No email</span>}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500">Phone</label>
                          <p className="text-sm text-slate-900 dark:text-white">{selectedUser.phone}</p>
                        </div>
                        {selectedUser.location && (
                          <div className="col-span-2">
                            <label className="text-xs font-medium text-slate-500">Location</label>
                            <p className="text-sm text-slate-900 dark:text-white flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {selectedUser.location}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Signal className="w-4 h-4" />
                        Connection Details
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500">Router:</span>
                          <p className="font-medium">{selectedUser.router}</p>
                        </div>
                        {selectedUser.ipAddress && (
                          <div>
                            <span className="text-slate-500">IP Address:</span>
                            <p className="font-medium">{selectedUser.ipAddress}</p>
                          </div>
                        )}
                        {selectedUser.macAddress && (
                          <div>
                            <span className="text-slate-500">MAC Address:</span>
                            <p className="font-medium font-mono text-xs">{selectedUser.macAddress}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500">Last Online:</span>
                          <p className="font-medium">{selectedUser.lastOnline}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Download:</span>
                          <p className="font-medium">{selectedUser.downloadSpeed} Mbps</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Upload:</span>
                          <p className="font-medium">{selectedUser.uploadSpeed} Mbps</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Subscription</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Current Plan</span>
                          <span className="font-medium">{selectedUser.plan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Price</span>
                          <span className="font-medium">KES {selectedUser.planPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Joined Date</span>
                          <span className="font-medium">
                            {new Date(selectedUser.joinedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Expiry Date</span>
                          <span className="font-medium">
                            {selectedUser.plan === "No Plan" ? "Managed by Voucher" : new Date(selectedUser.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-2 pt-1 border-t border-blue-200">
                          <span className="text-slate-600 text-sm shrink-0">Billing Account No.</span>
                          <div className="flex items-center gap-1.5 flex-1 justify-end">
                            {editingBilling ? (
                              <>
                                <Input
                                  className="h-7 w-28 text-sm font-mono font-bold"
                                  value={billingNumberEdit}
                                  onChange={(e) => setBillingNumberEdit(e.target.value.toUpperCase())}
                                  maxLength={20}
                                  autoFocus
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-green-600"
                                  onClick={handleSaveBillingNumber}
                                  disabled={savingBilling}
                                >
                                  {savingBilling ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => setEditingBilling(false)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                {selectedUser.billingAccountNumber ? (
                                  <>
                                    <code className="text-sm font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                      {selectedUser.billingAccountNumber}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => copyToClipboard(selectedUser.billingAccountNumber!, 'Billing account number')}
                                      title="Copy"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Not assigned</span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setBillingNumberEdit(selectedUser.billingAccountNumber || '')
                                    setEditingBilling(true)
                                  }}
                                  title="Edit"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {selectedUser.billingAccountNumber && !editingBilling && (
                          <div className="mt-1 p-2 bg-blue-100 rounded text-xs text-blue-800">
                            💡 Pay via Paybill ➜ Account Ref: <strong>{selectedUser.billingAccountNumber}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RADIUS Network Credentials */}
                    {selectedUser.serviceStatus === 'PENDING' && !selectedUser.radiusCredentials && (
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-orange-600" />
                          Network Login (PPPoE/Hotspot)
                        </h3>
                        <p className="text-sm text-orange-700">
                          RADIUS credentials will be created when the service is activated.
                          Click <strong>"Activate Now"</strong> below to start the connection.
                        </p>
                      </div>
                    )}
                    {selectedUser.radiusCredentials && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-purple-600" />
                          Network Login (PPPoE/Hotspot)
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-slate-500">Username</label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-sm font-mono bg-white px-2 py-1 rounded border">
                                {selectedUser.radiusCredentials.username}
                              </code>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(selectedUser.radiusCredentials!.username, 'Username')}
                              >
                                Copy
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500">Password</label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-sm font-mono bg-white px-2 py-1 rounded border">
                                {showPassword ? selectedUser.radiusCredentials.password : '••••••••'}
                              </code>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <XCircle className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(selectedUser.radiusCredentials!.password, 'Password')}
                              >
                                Copy
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500">Subscription Status</label>
                            <div className="flex items-center gap-2 mt-1">
                              {selectedUser.radiusCredentials.expiration_date ? (
                                (() => {
                                  const now = new Date()
                                  const expiry = new Date(selectedUser.radiusCredentials.expiration_date!)
                                  const isExpired = expiry <= now
                                  const diffMs = expiry.getTime() - now.getTime()
                                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                                  
                                  if (isExpired) {
                                    return (
                                      <Badge variant="destructive" className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Expired
                                      </Badge>
                                    )
                                  } else if (diffHours < 24) {
                                    return (
                                      <Badge className="bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {diffHours}h remaining
                                      </Badge>
                                    )
                                  } else {
                                    return (
                                      <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {diffDays}d remaining
                                      </Badge>
                                    )
                                  }
                                })()
                              ) : (
                                <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Unlimited
                                </Badge>
                              )}
                              {selectedUser.radiusCredentials.expiration_date && (
                                <span className="text-xs text-slate-500">
                                  Expires: {new Date(selectedUser.radiusCredentials.expiration_date).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant={selectedUser.radiusCredentials.is_enabled ? "default" : "secondary"}>
                              {selectedUser.radiusCredentials.is_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            <span className="text-slate-500">
                              {selectedUser.radiusCredentials.connection_type}
                            </span>
                            {selectedUser.radiusCredentials.synced_to_radius && (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                ✅ Synced
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-slate-50 rounded-lg border">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Usage & Balance</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Data Used</span>
                            <span className="font-medium">
                              {selectedUser.liveUsageString || `${Number(selectedUser.dataUsed || 0).toFixed(1)} GB`} 
                              {selectedUser.dataLimit && ` / ${selectedUser.dataLimit} GB`}
                            </span>
                          </div>
                          {selectedUser.dataLimit && (
                            <Progress value={(Number(selectedUser.dataUsed || 0) / selectedUser.dataLimit) * 100} className="h-2" />
                          )}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Account Balance</span>
                          <span className={`font-medium ${selectedUser.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedUser.balance >= 0 
                              ? `+KES ${selectedUser.balance.toLocaleString()} credit`
                              : `-KES ${Math.abs(selectedUser.balance).toLocaleString()} owed`
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Loyalty Points</span>
                          <span className="font-medium text-amber-600">{selectedUser.loyaltyPoints.toLocaleString()} pts</span>
                        </div>
                      </div>
                    </div>

                    {selectedUser && selectedUser.connectionStatus === "online" && 
                    selectedUser.type === "pppoe" && 
                    selectedUser.radiusCredentials?.username && (
                      <div className="pt-2">
                        <BandwidthGraph
                          username={selectedUser.radiusCredentials.username}
                          isOnline={true}
                          baseUrl={typeof window !== "undefined" ? window.location.origin : ""}
                          authToken={
                            (typeof window !== "undefined"
                              ? localStorage.getItem(`adminToken:${window.location.hostname}`) ||
                                localStorage.getItem("adminToken") ||
                                sessionStorage.getItem(`adminToken:${window.location.hostname}`) ||
                                sessionStorage.getItem("adminToken")
                              : "") || ""
                          }
                          maxPoints={20}
                        />
                      </div>
                    )}

                    <div className="space-y-2 pt-4">
                      <div className="flex gap-2">
                        <Button className="flex-1 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" onClick={() => handleEditUser(selectedUser)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit User
                        </Button>
                        <Button variant="outline" className="flex-1 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" onClick={() => handleExtendSubscription(selectedUser)}>
                          <Calendar className="w-4 h-4 mr-2" />
                          Extend
                        </Button>
                      </div>
                      {(selectedUser.type === "pppoe" || selectedUser.type === "static") ? (
                        <Button variant="outline" className="flex-1 w-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" onClick={() => handleEditIP(selectedUser)}>
                          <Server className="w-4 h-4 mr-2" />
                          Edit IP
                        </Button>
                      ) : null}
                      {selectedUser.status === "pending" && (
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" 
                          onClick={() => handleActivateUser(selectedUser)}
                          disabled={activating}
                        >
                          {activating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
                          Activate Now
                        </Button>
                      )}
                      {selectedUser.radiusCredentials && (
                        <Button 
                          variant="outline" 
                          className={`w-full ${selectedUser.radiusCredentials.is_enabled ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'} transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
                          onClick={() => handleToggleRadius(selectedUser, !selectedUser.radiusCredentials!.is_enabled)}
                          disabled={togglingRadius}
                        >
                          {togglingRadius ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Power className="w-4 h-4 mr-2" />}
                          {selectedUser.radiusCredentials.is_enabled ? 'Disable RADIUS Access' : 'Enable RADIUS Access'}
                        </Button>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" onClick={() => {
                          setDrawerOpen(false)
                          handleOpenUserSms(selectedUser)
                        }}>
                          <Send className="w-4 h-4 mr-2" />
                          Send SMS
                        </Button>
                        <Button variant="outline" className="flex-1 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Button>
                      </div>
                      {selectedUser.connectionStatus === "online" && (
                        <Button 
                          variant="outline" 
                          className="w-full text-yellow-600 hover:text-yellow-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={() => handleDisconnectUser(selectedUser)}
                        >
                          <Power className="w-4 h-4 mr-2" />
                          Disconnect User
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 hover:text-red-700 border-red-200 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => handleDeleteUser(selectedUser)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </Button>
                    </div>
                  </div>
                )}

                {drawerTab === "payments" && (
                  <div className="space-y-4">
                    {payments.length === 0 ? (
                      <div className="text-center py-10">
                        <CreditCard className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500 font-medium">No payments found</p>
                        <p className="text-slate-400 text-sm mt-1">This customer has no payment history yet.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs text-slate-500">Total Paid</p>
                            <p className="text-lg font-bold text-green-700">
                              KES {payments.filter(p => p.status === 'COMPLETED' || p.status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-slate-500">Transactions</p>
                            <p className="text-lg font-bold text-blue-700">{payments.length}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {payments.map((payment) => {
                            const isCompleted = ['completed', 'COMPLETED'].includes(payment.status)
                            const isFailed = ['failed', 'FAILED'].includes(payment.status)
                            const isPending = ['pending', 'PENDING', 'processing', 'PROCESSING'].includes(payment.status)
                            return (
                              <div
                                key={payment.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isCompleted ? 'bg-green-100' : isFailed ? 'bg-red-100' : 'bg-yellow-100'
                                  }`}>
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : isFailed ? (
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-yellow-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">
                                      KES {Number(payment.amount).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {payment.method || payment.payment_method || 'M-Pesa'}
                                      {(payment.reference || payment.mpesa_receipt) && (
                                        <span className="ml-1 font-mono">
                                          · {payment.reference || payment.mpesa_receipt}
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {payment.date
                                        ? new Date(payment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : payment.created_at
                                        ? new Date(payment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : '—'}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  className={
                                    isCompleted ? 'bg-green-100 text-green-700' :
                                    isFailed ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }
                                >
                                  {isCompleted ? 'Paid' : isFailed ? 'Failed' : 'Pending'}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="sm:max-w-md p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details and network credentials
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_location">Location / Area</Label>
                <Input
                  id="edit_location"
                  placeholder="e.g. Westlands, Nairobi"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Network Login Credentials
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit_radius_username">RADIUS Username</Label>
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
                    <p className="text-xs text-slate-500 mt-1">Click refresh to use phone number (last 9 digits)</p>
                  </div>
                  <div>
                    <Label htmlFor="edit_radius_password">RADIUS Password</Label>
                    <div className="flex gap-2">
                      <Input
                        id="edit_radius_password"
                        value={editForm.radius_password}
                        onChange={(e) => setEditForm({ ...editForm, radius_password: e.target.value })}
                        placeholder="Enter new password or generate"
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
                    <p className="text-xs text-slate-500 mt-1">Leave empty to keep current password</p>
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
        <DialogContent className="sm:max-w-md p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete User</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the customer account,
                all service connections, RADIUS credentials, and the associated login user.
              </DialogDescription>
            </DialogHeader>
            {userToDelete && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="font-medium text-slate-900 dark:text-white">{userToDelete.name}</p>
                <p className="text-sm text-slate-600">{userToDelete.email} • {userToDelete.phone}</p>
                <p className="text-sm text-slate-600">Plan: {userToDelete.plan}</p>
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
        <DialogContent className="sm:max-w-md p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle>Extend Subscription</DialogTitle>
              <DialogDescription>
                {userToExtend?.expiryDate && new Date(userToExtend.expiryDate) < new Date()
                  ? "The subscription has expired - new time will start from now."
                  : "Choose duration or set a specific expiry date."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExtendMode("duration")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    extendMode === "duration"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Add Duration
                </button>
                <button
                  type="button"
                  onClick={() => setExtendMode("date")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    extendMode === "date"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Set Expiry Date & Time
                </button>
              </div>

              {extendMode === "duration" ? (
                <>
                  <div className="space-y-2">
                    <Label>Duration Amount</Label>
                    <Input
                      type="number"
                      min={1}
                      value={extendForm.duration_amount}
                      onChange={(e) => setExtendForm({ ...extendForm, duration_amount: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration Unit</Label>
                    <Select
                      value={extendForm.duration_unit}
                      onValueChange={(value: 'MINUTES' | 'HOURS' | 'DAYS') => setExtendForm({ ...extendForm, duration_unit: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <div className="pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
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
                          await loadUsers(serverPage, searchQuery, statusFilter)
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
                  <Label>New Expiry Date & Time</Label>
                  {userToExtend?.expiryDate && userToExtend.plan !== "No Plan" && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-amber-800">
                        Current expiry: <strong>{new Date(userToExtend.expiryDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Date</Label>
                      <input
                        type="date"
                        value={extendManualDate.split('T')[0] || extendManualDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setExtendManualDate(e.target.value)
                        }}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Time (HH:MM)</Label>
                      <input
                        type="time"
                        value={extendManualTime}
                        onChange={(e) => setExtendManualTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>
                  </div>
                  {extendManualDate && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                      <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-600" />
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
                        if (diffMs <= 0) return <span className="text-red-600 ml-1"> (in the past — please select future date/time)</span>
                        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                        if (days > 0) return <span className="text-green-700 ml-1"> ({days}d {hours}h from now)</span>
                        if (hours > 0) return <span className="text-green-700 ml-1"> ({hours}h {minutes}m from now)</span>
                        if (minutes > 0) return <span className="text-green-700 ml-1"> ({minutes}m from now)</span>
                        return null
                      })()}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 border-t border-slate-200" />
                    <span className="text-xs text-slate-400">or</span>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
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
                        await loadUsers(serverPage, searchQuery, statusFilter)
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

              <div className="space-y-2 pt-2 border-t">
                <Label>Change Plan <span className="text-xs text-slate-400 font-normal">(Optional)</span></Label>
                <Select
                  value={extendForm.plan_id || "keep"}
                  onValueChange={(value) => setExtendForm({ ...extendForm, plan_id: value === "keep" ? "" : value })}
                >
                  <SelectTrigger><SelectValue placeholder="Keep current plan" /></SelectTrigger>
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
        <DialogContent className="sm:max-w-md p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle>Extend Hotspot Session</DialogTitle>
              <DialogDescription>
                {hotspotSessionToExtend?.canonical_username || hotspotSessionToExtend?.username} — {hotspotSessionToExtend?.plan_name}
                {hotspotSessionToExtend?.expiry_date && (
                  <span className="block text-amber-600 mt-1">
                    Current expiry: {new Date(hotspotSessionToExtend.expiry_date).toLocaleString()}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setHotspotExtendMode("duration")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    hotspotExtendMode === "duration" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Add Duration
                </button>
                <button
                  type="button"
                  onClick={() => setHotspotExtendMode("date")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    hotspotExtendMode === "date" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Set Expiry
                </button>
              </div>

              {hotspotExtendMode === "duration" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        min={1}
                        value={hotspotExtendForm.duration_amount}
                        onChange={e => setHotspotExtendForm(f => ({ ...f, duration_amount: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Unit</Label>
                      <Select
                        value={hotspotExtendForm.duration_unit}
                        onValueChange={(v: 'MINUTES' | 'HOURS' | 'DAYS') => setHotspotExtendForm(f => ({ ...f, duration_unit: v }))}
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
                      <Label className="text-xs text-slate-500">Date</Label>
                      <input
                        type="date"
                        value={hotspotExtendManualDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setHotspotExtendManualDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Time</Label>
                      <input
                        type="time"
                        value={hotspotExtendManualTime}
                        onChange={e => setHotspotExtendManualTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>
                  </div>
                  {hotspotExtendManualDate && (
                    <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
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

      {/* FIX 2 & 3: Hotspot Client Detail Dialog - Removed key, added initial={false} on AnimatePresence wrapper, fixed animation */}
      <Dialog open={hotspotDetailOpen} onOpenChange={setHotspotDetailOpen}>
        <DialogContent className="max-w-xl w-[95vw] h-[92vh] overflow-hidden p-0 gap-0 rounded-2xl border-0 shadow-2xl bg-white" showCloseButton={false}>
          {hotspotDetailClient && (() => {
            const isActive = hotspotDetailClient.is_active_sub ??
              (hotspotDetailClient.subscription_status === 'active' &&
               hotspotDetailClient.expiry_date &&
               new Date(hotspotDetailClient.expiry_date) > new Date())
            const username = hotspotDetailClient.canonical_username || hotspotDetailClient.username || hotspotDetailClient.display_name || 'HS'
            const isOnline = hotspotOnlineSet.has(username)
            const liveUsage = hotspotLiveUsageMap.get(username)
            const clientId = (hotspotDetailClient as any).client_id
            const daysLeft = hotspotDetailClient.expiry_date
              ? Math.ceil((new Date(hotspotDetailClient.expiry_date).getTime() - Date.now()) / 86400000)
              : null
            const hoursLeft = hotspotDetailClient.expiry_date
              ? Math.ceil((new Date(hotspotDetailClient.expiry_date).getTime() - Date.now()) / 3600000)
              : null
            const totalSessions = (hotspotDetailClient as any).client_total_sessions ?? 0
            const totalSpend = (hotspotDetailClient as any).client_total_spend ?? 0

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex flex-col h-full"
              >
                {/* Hero Header - Premium gradient with decorative orbs */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-6 pb-5">
                  <div className="absolute -top-20 -right-20 w-72 h-72 bg-fuchsia-500/20 blur-3xl rounded-full pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shadow-xl ${
                          isActive
                            ? 'bg-gradient-to-br from-pink-500 to-orange-400'
                            : 'bg-gradient-to-br from-slate-600 to-slate-700'
                        }`}>
                          {username.slice(0, 2).toUpperCase()}
                        </div>
                        {isOnline && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-black text-white font-mono tracking-wide truncate">{username}</h2>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                            isActive
                              ? 'bg-emerald-400/10 border border-emerald-400/30 text-emerald-400'
                              : 'bg-red-400/10 border border-red-400/30 text-red-400'
                          }`}>
                            {isActive ? (isOnline ? '● Live' : 'Active') : 'Expired'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {hotspotDetailClient.phone && (
                            <span className="text-sm text-slate-400">{hotspotDetailClient.phone}</span>
                          )}
                          {hotspotDetailClient.router && (
                            <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                              {hotspotDetailClient.router}
                            </span>
                          )}
                          {(hotspotDetailClient as any).connection_type && (
                            <span className="text-xs text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded-full border border-pink-400/20">
                              Hotspot
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setHotspotDetailOpen(false)}
                      className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-white/70" />
                    </button>
                  </div>

                  <div className="relative mt-5 grid grid-cols-4 gap-2">
                    {[
                      {
                        label: 'Subscription',
                        value: !hotspotDetailClient.expiry_date ? '—'
                          : isActive
                            ? (daysLeft! > 1 ? `${daysLeft}d left` : hoursLeft! > 0 ? `${hoursLeft}h left` : 'Today')
                            : 'Expired',
                        sub: hotspotDetailClient.expiry_date
                          ? new Date(hotspotDetailClient.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                          : 'No expiry',
                        highlight: isActive,
                        warn: !isActive && !!hotspotDetailClient.expiry_date,
                      },
                      {
                        label: 'Plan',
                        value: hotspotDetailClient.plan_name || '—',
                        sub: (hotspotDetailClient as any).plan_price ? `KES ${(hotspotDetailClient as any).plan_price}` : 'n/a',
                        highlight: false,
                      },
                      {
                        label: 'Sessions',
                        value: totalSessions,
                        sub: 'all time',
                        highlight: false,
                      },
                      {
                        label: 'Lifetime Value',
                        value: `KES ${totalSpend}`,
                        sub: 'total spend',
                        highlight: false,
                      },
                    ].map(({ label, value, sub, highlight, warn }) => (
                      <div key={label} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mb-1">{label}</p>
                        <p className={`text-sm font-black leading-tight ${
                          highlight ? 'text-emerald-400' : warn ? 'text-red-400' : 'text-white'
                        }`}>{value}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex border-b border-slate-100 bg-white/90 backdrop-blur-xl sticky top-0 z-10">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'sessions', label: `Sessions${totalSessions > 0 ? ` ${totalSessions}` : ''}` },
                    { id: 'actions', label: 'Actions' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setHotspotDetailTab(tab.id)
                        if (tab.id === 'sessions' && clientId && hotspotClientSessions.length === 0) {
                          loadHotspotClientSessions(clientId)
                        }
                      }}
                      className={`flex-1 py-3 text-xs font-semibold transition-all duration-200 relative ${
                        hotspotDetailTab === tab.id
                          ? 'text-slate-900'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab.label}
                      <motion.span
                        layoutId="hotspot-detail-tab"
                        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full ${
                          hotspotDetailTab === tab.id ? 'opacity-100' : 'opacity-0'
                        }`}
                        transition={{ duration: 0.2 }}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  {hotspotDetailTab === 'overview' && (
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Subscription lifecycle</h3>
                        <div className="relative">
                          <div className="absolute left-[15px] top-3 bottom-3 w-px bg-slate-100" />
                          <div className="space-y-0">
                            {[
                              hotspotDetailClient.subscribed_at && {
                                icon: '🔗',
                                label: 'First connection',
                                sub: hotspotDetailClient.router ? `via ${hotspotDetailClient.router}` : 'Connected to network',
                                date: hotspotDetailClient.subscribed_at,
                              },
                              (hotspotDetailClient as any).plan_price && {
                                icon: '💳',
                                label: 'Payment received',
                                sub: `KES ${(hotspotDetailClient as any).plan_price} · ${hotspotDetailClient.plan_name || 'Plan'}`,
                                date: hotspotDetailClient.subscribed_at,
                              },
                              hotspotDetailClient.expiry_date && !isActive && {
                                icon: '⏰',
                                label: 'Subscription expired',
                                sub: 'No renewal recorded',
                                date: hotspotDetailClient.expiry_date,
                              },
                              {
                                icon: '📍',
                                label: isActive ? 'Active now' : 'Last seen',
                                sub: isOnline ? 'Currently online' : (hotspotDetailClient.expiry_date ? new Date(hotspotDetailClient.expiry_date).toLocaleDateString() : 'Unknown'),
                                date: null,
                                isNow: true,
                              },
                            ].filter(Boolean).map((event: any, idx) => (
                              <div key={idx} className="relative flex items-start gap-3 pb-4 last:pb-0">
                                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border-2 border-white shadow-sm ${
                                  event.isNow ? 'bg-slate-900' : 'bg-white border-slate-200'
                                }`}>
                                  <span className={event.isNow ? 'text-white text-xs' : ''}>{event.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className={`text-sm font-semibold ${event.isNow ? 'text-slate-900' : 'text-slate-700'}`}>{event.label}</p>
                                      <p className="text-xs text-slate-400 mt-0.5">{event.sub}</p>
                                    </div>
                                    {event.date && (
                                      <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                                        {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                                        {' '}
                                        {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100" />

                      <div>
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Device & network</h3>
                        <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100">
                          {[
                            { label: 'Username', value: username, mono: true, copy: true },
                            { label: 'Router', value: hotspotDetailClient.router || '—' },
                            { label: 'Type', value: 'Hotspot' },
                            ...((hotspotDetailClient as any).mac_address ? [{ label: 'MAC address', value: (hotspotDetailClient as any).mac_address, mono: true, copy: true }] : []),
                            ...(liveUsage ? [{ label: 'Live usage', value: liveUsage, highlight: true }] : []),
                            ...(hotspotDetailClient.session_id ? [{ label: 'Session ID', value: `…${hotspotDetailClient.session_id.slice(-12)}`, mono: true }] : []),
                          ].map(({ label, value, mono, copy, highlight }: any) => (
                            <div key={label} className="flex items-center justify-between px-4 py-3">
                              <span className="text-xs text-slate-500 font-medium w-28 shrink-0">{label}</span>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-xs font-semibold truncate ${
                                  mono ? 'font-mono text-slate-800' :
                                  highlight ? 'text-emerald-600 font-bold' :
                                  'text-slate-800'
                                }`}>{value}</span>
                                {copy && value !== '—' && (
                                  <button
                                    onClick={() => copyToClipboard(String(value), label)}
                                    className="text-slate-300 hover:text-slate-600 transition-colors flex-shrink-0"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {hotspotDetailTab === 'sessions' && (
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">{hotspotClientSessionsTotal} RADIUS sessions total</span>
                        <button
                          onClick={() => clientId && loadHotspotClientSessions(clientId, hotspotClientSessionsPage)}
                          disabled={hotspotClientSessionsLoading}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                        >
                          <RefreshCw className={`w-3 h-3 text-slate-400 ${hotspotClientSessionsLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>

                      {hotspotClientSessionsLoading ? (
                        <div className="space-y-2">
                          {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-xl" style={{ opacity: 1 - i * 0.2 }} />
                          ))}
                        </div>
                      ) : hotspotClientSessions.length === 0 ? (
                        <div className="py-12 text-center">
                          <Signal className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                          <p className="text-sm text-slate-400 font-medium">No sessions recorded yet</p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {hotspotClientSessions.map((s: any) => (
                              <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`rounded-xl border px-4 py-3 transition-colors ${
                                  s.is_active
                                    ? 'bg-emerald-50/50 border-emerald-200'
                                    : 'bg-white border-slate-100'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-slate-700">{s.mac_address || s.ip_address || '—'}</span>
                                    {s.is_active && (
                                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">LIVE</span>
                                    )}
                                  </div>
                                  <span className="text-sm font-black text-slate-800">{s.data_total}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                                  {[
                                    { label: 'Started', value: s.start_time ? new Date(s.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—' },
                                    { label: 'Duration', value: s.duration, mono: true },
                                    { label: 'Router', value: s.router || '—' },
                                  ].map(({ label, value, mono }: any) => (
                                    <div key={label}>
                                      <p className="text-[9px] text-slate-400 uppercase tracking-wide font-semibold">{label}</p>
                                      <p className={`text-xs text-slate-700 font-semibold mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          {hotspotClientSessionsTotalPages > 1 && (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-slate-400">{hotspotClientSessionsPage} / {hotspotClientSessionsTotalPages}</span>
                              <div className="flex gap-1.5">
                                <button
                                  disabled={hotspotClientSessionsPage === 1}
                                  onClick={() => clientId && loadHotspotClientSessions(clientId, hotspotClientSessionsPage - 1)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
                                >← Prev</button>
                                <button
                                  disabled={hotspotClientSessionsPage >= hotspotClientSessionsTotalPages}
                                  onClick={() => clientId && loadHotspotClientSessions(clientId, hotspotClientSessionsPage + 1)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
                                >Next →</button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {hotspotDetailTab === 'actions' && (
                    <div className="p-5 space-y-2">
                      {isActive && hotspotDetailClient.session_id && (
                        <motion.button
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => { setHotspotDetailOpen(false); handleExtendHotspot(hotspotDetailClient) }}
                          className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all duration-300 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-slate-800">Extend session</p>
                            <p className="text-xs text-slate-400 mt-0.5">Add time to current subscription</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                        </motion.button>
                      )}

                      {hotspotDetailClient.phone && (
                        <motion.button
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={async () => {
                            try {
                              await adminApi.sendSMS({ recipient: hotspotDetailClient.phone!, message: `Your hotspot access: ${username}` })
                              toast.success('SMS sent')
                            } catch (err: any) { toast.error(err.message || 'Failed') }
                          }}
                          className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all duration-300 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors flex-shrink-0">
                            <Send className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-slate-800">Send access code via SMS</p>
                            <p className="text-xs text-slate-400 mt-0.5">{hotspotDetailClient.phone}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                        </motion.button>
                      )}

                      <motion.button
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => { copyToClipboard(username, 'Access code'); }}
                        className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors flex-shrink-0">
                          <Copy className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold text-slate-800">Copy credentials</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{username}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                      </motion.button>

                      <motion.button
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setHotspotDetailTab('sessions')}
                        className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors flex-shrink-0">
                          <History className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold text-slate-800">View session history</p>
                          <p className="text-xs text-slate-400 mt-0.5">{totalSessions} recorded session{totalSessions !== 1 ? 's' : ''}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                      </motion.button>

                      {clientId && (
                        <motion.button
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleDeleteHotspotClient(clientId, username)}
                          className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-xl border border-red-100 hover:border-red-200 hover:shadow-lg hover:bg-red-50/30 transition-all duration-300 group mt-3"
                        >
                          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors flex-shrink-0">
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-red-600">Delete client</p>
                            <p className="text-xs text-slate-400 mt-0.5">Permanently removes RADIUS credentials</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-red-200 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })()}
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
        <DialogContent className="max-w-lg p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle>Change Plan</DialogTitle>
              <DialogDescription>
                {userToChangePlan
                  ? `Choose a new plan for ${userToChangePlan.name}.`
                  : "Choose a new plan for this user."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-900">Current plan</p>
                <p className="mt-1 text-slate-600">{currentPlanName || "No active plan"}</p>
              </div>

              {changePlanLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : changePlanOptions.length === 0 ? (
                <Alert>
                  <AlertDescription>No compatible plans are available for this user.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="change-plan-select">Available plans</Label>
                  <Select value={selectedChangePlanId || "none"} onValueChange={(value) => setSelectedChangePlanId(value === "none" ? "" : value)}>
                    <SelectTrigger id="change-plan-select">
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
                    <div className="rounded-lg border p-3 text-sm">
                      {(() => {
                        const selectedPlan = changePlanOptions.find((plan) => plan.id === parseInt(selectedChangePlanId, 10))
                        if (!selectedPlan) return null
                        return (
                          <div className="space-y-1 text-slate-600">
                            <p><span className="font-medium text-slate-900">Type:</span> {selectedPlan.plan_type}</p>
                            <p><span className="font-medium text-slate-900">Speed:</span> {selectedPlan.download_speed || 0} / {selectedPlan.upload_speed || 0} Mbps</p>
                            <p><span className="font-medium text-slate-900">Data limit:</span> {selectedPlan.data_limit ? `${selectedPlan.data_limit} GB` : "Unlimited"}</p>
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
        <DialogContent className="sm:max-w-md p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle>Change IP Address</DialogTitle>
              <DialogDescription>
                Select a new IP from the pool attached to this user's plan.
                The current IP will be released back to the pool.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {userToEditIP?.ipAddress && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                  <Server className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-amber-800">
                    Current IP: <code className="font-mono font-bold">{userToEditIP.ipAddress}</code>
                  </span>
                </div>
              )}

              {editIPLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading available IPs...
                </div>
              ) : editIPAvailableIPs.length === 0 && !editIPLoading ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No available IPs in this plan's pool.<br />
                  <span className="text-xs">Ensure the plan has an IP pool assigned.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Available IPs ({editIPAvailableIPs.length})</Label>
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
                    <SelectTrigger>
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
                    <p className="text-xs text-slate-500">
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
        <DialogContent className="p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle>Send SMS</DialogTitle>
              <DialogDescription>
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
                  <Label className="text-xs font-medium text-slate-500">Quick Templates</Label>
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
                      className="text-left px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-xs"
                    >
                      <p className="font-medium text-blue-800">💳 Payment Details</p>
                      <p className="text-blue-600 mt-0.5 line-clamp-2">
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
                      className="text-left px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors text-xs"
                    >
                      <p className="font-medium text-purple-800">🔑 Portal Credentials</p>
                      <p className="text-purple-600 mt-0.5 line-clamp-2">
                        Customer portal login URL + credentials
                      </p>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Enter your message or pick a template above..."
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-slate-500">{smsMessage.length}/160 characters</p>
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
        <DialogContent className="sm:max-w-lg p-0 border-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send SMS to {userSmsTarget?.name}
              </DialogTitle>
              <DialogDescription>
                Use the quick templates below or click a variable to insert it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {userSmsTarget && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500">Quick Templates</p>
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
                      className="text-left px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-xs"
                    >
                      <p className="font-medium text-blue-800">💳 Payment Details</p>
                      <p className="text-blue-600 mt-0.5 line-clamp-2">
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
                      className="text-left px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors text-xs"
                    >
                      <p className="font-medium text-purple-800">🔑 Portal Credentials</p>
                      <p className="text-purple-600 mt-0.5 line-clamp-2">
                        Customer portal login URL + credentials
                      </p>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Insert variable</p>
                <div className="flex flex-wrap gap-1.5">
                  {SMS_VARIABLES.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setUserSmsMessage(prev => prev + key)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message, use templates above, or click variables to insert them…"
                  value={userSmsMessage}
                  onChange={e => setUserSmsMessage(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-400">{userSmsMessage.length} / 160 characters</p>
              </div>

              {userSmsTarget && userSmsMessage && (
                <div className="p-3 bg-slate-50 rounded-lg border text-sm space-y-1">
                  <p className="text-xs font-medium text-slate-500">Preview (resolved)</p>
                  <p className="text-slate-800 whitespace-pre-wrap break-words">
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
        <DialogContent className="max-w-sm w-[90vw] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center pt-8 pb-2 px-6 bg-white">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 text-center">Delete Client?</h2>
              <p className="text-sm text-slate-500 text-center mt-2 mb-6">
                <span className="font-mono font-bold text-slate-700">{hotspotDeleteTarget?.username}</span> will be permanently removed along with their RADIUS credentials. This cannot be undone.
              </p>
            </div>
            <div className="border-t border-slate-100">
              <button
                onClick={confirmDeleteHotspotClient}
                disabled={deletingHotspot}
                className="w-full py-4 text-sm font-semibold text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deletingHotspot ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting...</> : 'Delete'}
              </button>
              <div className="border-t border-slate-100" />
              <button
                onClick={() => { setShowHotspotDeleteDialog(false); setHotspotDeleteTarget(null) }}
                disabled={deletingHotspot}
                className="w-full py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}