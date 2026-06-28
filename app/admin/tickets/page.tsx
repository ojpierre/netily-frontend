"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  Ticket,
  Search,
  Plus,
  MoreVertical,
  Eye,
  MessageSquare,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Paperclip,
  ChevronRight,
  Phone,
  Mail,
  BarChart3,
  Loader2,
  X,
} from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type {
  SupportTicket,
  SupportTicketMessage,
  SupportTicketStats,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketCategory,
  Customer,
} from "@/lib/types"

type TicketStatus = SupportTicketStatus
type TicketPriority = SupportTicketPriority
type TicketCategory = SupportTicketCategory

const emptyStats: SupportTicketStats = {
  total: 0,
  open: 0,
  in_progress: 0,
  pending: 0,
  resolved: 0,
  closed: 0,
  avg_response_time: "—",
  avg_resolution_time: "—",
  sla_compliance_rate: 0,
  tickets_today: 0,
  tickets_this_week: 0,
}

// ─── Customer search result shape ────────────────────────────────────────────
interface CustomerSearchResult {
  id: number
  full_name: string
  phone_number: string
  customer_code: string
  email: string
}

export default function TicketsPage() {
  // ── Data state ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<SupportTicketStats>(emptyStats)
  const [refreshing, setRefreshing] = useState(false)

  // ── Filter state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // ── Ticket detail drawer ─────────────────────────────────────────────────
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  // ── Create ticket dialog ─────────────────────────────────────────────────
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false)
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [newTicketData, setNewTicketData] = useState({
    subject: "",
    description: "",
    category: "technical" as TicketCategory,
    priority: "medium" as TicketPriority,
  })

  // ── Customer search ──────────────────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([])
  const [searchingCustomers, setSearchingCustomers] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null)
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const searchDebounceRef = useRef<NodeJS.Timeout>()

  // ─── Fetch tickets + stats ───────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: Record<string, string> = {}
      if (activeTab !== "all") filters.status = activeTab
      if (priorityFilter !== "all") filters.priority = priorityFilter
      if (categoryFilter !== "all") filters.category = categoryFilter
      if (searchQuery) filters.search = searchQuery

      const [ticketsData, statsData] = await Promise.allSettled([
        adminApi.getTickets(filters),
        adminApi.getTicketStats(),
      ])

      if (ticketsData.status === "fulfilled" && ticketsData.value) {
        const list = Array.isArray(ticketsData.value)
          ? ticketsData.value
          : ticketsData.value.results ?? []
        setTickets(list)
      }
      if (statsData.status === "fulfilled" && statsData.value) {
        setStats(statsData.value)
      }
    } catch (err) {
      console.error("Error loading tickets:", err)
      setError("Failed to load tickets. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [activeTab, priorityFilter, categoryFilter, searchQuery])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchTickets()
    setRefreshing(false)
    toast.success("Tickets refreshed")
  }, [fetchTickets])

  // ─── Customer search (debounced) ─────────────────────────────────────────
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([])
      return
    }
    clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(async () => {
      setSearchingCustomers(true)
      try {
        const data = await adminApi.getCustomers({ search: customerSearch, page_size: "10" })
        const results: CustomerSearchResult[] = (data.results ?? []).map((c: any) => ({
          id: c.id,
          full_name: c.full_name ?? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
          phone_number: c.phone_number ?? c.phone ?? "",
          customer_code: c.customer_code ?? c.customer_number ?? "",
          email: c.email ?? "",
        }))
        setCustomerResults(results)
      } catch {
        setCustomerResults([])
      } finally {
        setSearchingCustomers(false)
      }
    }, 350)
    return () => clearTimeout(searchDebounceRef.current)
  }, [customerSearch])

  // ─── Filtered + paginated tickets ────────────────────────────────────────
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesTab =
        activeTab === "all" ||
        ticket.status === activeTab ||
        (activeTab === "resolved" && (ticket.status === "resolved" || ticket.status === "closed"))

      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        ticket.subject.toLowerCase().includes(searchLower) ||
        (ticket.ticket_number ?? "").toLowerCase().includes(searchLower) ||
        (ticket.customer_name ?? "").toLowerCase().includes(searchLower)

      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
      const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter

      return matchesTab && matchesSearch && matchesPriority && matchesCategory
    })
  }, [tickets, activeTab, searchQuery, priorityFilter, categoryFilter])

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)

  // ─── View ticket ─────────────────────────────────────────────────────────
  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setDrawerOpen(true)
    try {
      const fresh = await adminApi.getTicket(ticket.id)
      if (fresh) {
        setSelectedTicket(fresh)
        setTickets((prev) => prev.map((t) => (t.id === ticket.id ? fresh : t)))
      }
    } catch {
      // keep cached data
    }
  }

  // ─── Send reply ───────────────────────────────────────────────────────────
  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || sendingReply) return
    setSendingReply(true)
    try {
      const message = await adminApi.replyToTicket(selectedTicket.id, {
        message: replyMessage,
        is_internal: false,
      })
      if (message) {
        const updatedTicket: SupportTicket = {
          ...selectedTicket,
          messages: [...(selectedTicket.messages ?? []), message],
          status:
            selectedTicket.status === "open" ? "in_progress" : selectedTicket.status,
          updated_at: new Date().toISOString(),
        }
        setSelectedTicket(updatedTicket)
        setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updatedTicket : t)))
        toast.success("Reply sent")
        setReplyMessage("")
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send reply")
    } finally {
      setSendingReply(false)
    }
  }

  // ─── Update status ────────────────────────────────────────────────────────
  const handleUpdateStatus = async (ticketId: number, newStatus: TicketStatus) => {
    try {
      await adminApi.updateTicketStatus(ticketId, newStatus)
      const updater = (t: SupportTicket) =>
        t.id === ticketId
          ? { ...t, status: newStatus, updated_at: new Date().toISOString() }
          : t
      setTickets((prev) => prev.map(updater))
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => prev && { ...prev, status: newStatus })
      }
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`)
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update status")
    }
  }

  // ─── Assign ticket ────────────────────────────────────────────────────────
  const handleAssignTicket = async (ticketId: number, agentId: number) => {
    try {
      await adminApi.assignTicket(ticketId, agentId)
      toast.success("Ticket assigned")
    } catch (err: any) {
      toast.error(err.message ?? "Failed to assign ticket")
    }
  }

  // ─── Escalate ticket ──────────────────────────────────────────────────────
  const handleEscalate = async (ticketId: number) => {
    try {
      await adminApi.escalateTicket(ticketId)
      const updater = (t: SupportTicket) =>
        t.id === ticketId ? { ...t, priority: "urgent" as TicketPriority } : t
      setTickets((prev) => prev.map(updater))
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => prev && { ...prev, priority: "urgent" as TicketPriority })
      }
      toast.success("Ticket escalated to urgent")
    } catch (err: any) {
      toast.error(err.message ?? "Failed to escalate ticket")
    }
  }

  // ─── Create ticket ────────────────────────────────────────────────────────
  const handleCreateTicket = async () => {
    if (!newTicketData.subject.trim()) {
      toast.error("Subject is required")
      return
    }
    if (!newTicketData.description.trim()) {
      toast.error("Description is required")
      return
    }
    if (!selectedCustomer) {
      toast.error("Please select a customer")
      return
    }

    setCreatingTicket(true)
    try {
      const ticket = await adminApi.createTicket({
        customer_id: selectedCustomer.id,
        subject: newTicketData.subject,
        description: newTicketData.description,
        category: newTicketData.category,
        priority: newTicketData.priority,
      })
      setTickets((prev) => [ticket, ...prev])
      setStats((prev) => ({ ...prev, total: prev.total + 1, open: prev.open + 1 }))
      toast.success("Ticket created successfully")
      // Reset form
      setShowNewTicketDialog(false)
      setNewTicketData({ subject: "", description: "", category: "technical", priority: "medium" })
      setSelectedCustomer(null)
      setCustomerSearch("")
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create ticket")
    } finally {
      setCreatingTicket(false)
    }
  }

  const resetCreateDialog = () => {
    setNewTicketData({ subject: "", description: "", category: "technical", priority: "medium" })
    setSelectedCustomer(null)
    setCustomerSearch("")
    setCustomerResults([])
  }

  // ─── Badge helpers ────────────────────────────────────────────────────────
  const getStatusBadge = (status: TicketStatus) => {
    const cfg: Record<string, { cls: string; Icon: React.ElementType }> = {
      open: { cls: "bg-primary/15 text-primary border-primary/20", Icon: AlertCircle },
      in_progress: { cls: "bg-warning/15 text-warning border-warning/20", Icon: Clock },
      pending: { cls: "bg-warning/15 text-warning border-warning/20", Icon: Clock },
      resolved: { cls: "bg-success/15 text-success border-success/20", Icon: CheckCircle2 },
      closed: { cls: "bg-slate-100 text-slate-700 border-slate-200", Icon: XCircle },
    }
    const c = cfg[status] ?? cfg.open
    return (
      <Badge variant="outline" className={c.cls}>
        <c.Icon className="w-3 h-3 mr-1" />
        {status.replace("_", " ").replace(/\b\w/g, (s) => s.toUpperCase())}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: TicketPriority) => {
    const cfg: Record<string, string> = {
      low: "bg-slate-100 text-slate-600 border-slate-200",
      medium: "bg-primary/15 text-primary border-primary/20",
      high: "bg-warning/15 text-warning border-warning/20",
      urgent: "bg-destructive/15 text-destructive border-destructive/20",
    }
    return (
      <Badge variant="outline" className={cfg[priority] ?? cfg.medium}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const getCategoryBadge = (category: TicketCategory) => {
    const cfg: Record<string, string> = {
      technical: "bg-purple-100 text-purple-700",
      billing: "bg-emerald-100 text-emerald-700",
      account: "bg-primary/15 text-primary",
      service: "bg-warning/15 text-warning",
      other: "bg-slate-100 text-slate-700",
    }
    return (
      <Badge variant="secondary" className={cfg[category] ?? cfg.other}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    )
  }

  const formatTimeAgo = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime()
    const mins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMs / 3600000)
    const days = Math.floor(diffMs / 86400000)
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // ─── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => { setError(null); fetchTickets() }}>Retry</Button>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-slate-500 mt-1">Manage customer support requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* ── Create Ticket Dialog ── */}
          <Dialog
            open={showNewTicketDialog}
            onOpenChange={(open) => {
              setShowNewTicketDialog(open)
              if (!open) resetCreateDialog()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>Create a support ticket on behalf of a customer</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Customer Search */}
                <div className="space-y-2">
                  <Label>
                    Customer <span className="text-destructive">*</span>
                  </Label>

                  {selectedCustomer ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50 dark:bg-slate-800">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/15 text-primary text-xs">
                          {selectedCustomer.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{selectedCustomer.full_name}</p>
                        <p className="text-xs text-slate-500">
                          {selectedCustomer.customer_code} · {selectedCustomer.phone_number}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => {
                          setSelectedCustomer(null)
                          setCustomerSearch("")
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search by name, phone or customer code..."
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value)
                            setCustomerDropdownOpen(true)
                          }}
                          onFocus={() => setCustomerDropdownOpen(true)}
                          className="pl-9"
                        />
                        {searchingCustomers && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                        )}
                      </div>

                      {/* Results dropdown */}
                      {customerDropdownOpen && customerSearch.trim() && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                          {searchingCustomers ? (
                            <div className="p-3 text-sm text-slate-500 text-center">Searching...</div>
                          ) : customerResults.length === 0 ? (
                            <div className="p-3 text-sm text-slate-500 text-center">No customers found</div>
                          ) : (
                            customerResults.map((c) => (
                              <button
                                key={c.id}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                                onClick={() => {
                                  setSelectedCustomer(c)
                                  setCustomerDropdownOpen(false)
                                  setCustomerSearch("")
                                }}
                              >
                                <Avatar className="w-7 h-7 shrink-0">
                                  <AvatarFallback className="bg-primary/15 text-primary text-xs">
                                    {c.full_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{c.full_name}</p>
                                  <p className="text-xs text-slate-500">
                                    {c.customer_code} · {c.phone_number}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label>
                    Subject <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Brief description of the issue"
                    value={newTicketData.subject}
                    onChange={(e) =>
                      setNewTicketData((prev) => ({ ...prev, subject: e.target.value }))
                    }
                  />
                </div>

                {/* Category + Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newTicketData.category}
                      onValueChange={(v) =>
                        setNewTicketData((prev) => ({ ...prev, category: v as TicketCategory }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTicketData.priority}
                      onValueChange={(v) =>
                        setNewTicketData((prev) => ({ ...prev, priority: v as TicketPriority }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    value={newTicketData.description}
                    onChange={(e) =>
                      setNewTicketData((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewTicketDialog(false)
                    resetCreateDialog()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTicket}
                  disabled={
                    creatingTicket ||
                    !newTicketData.subject.trim() ||
                    !newTicketData.description.trim() ||
                    !selectedCustomer
                  }
                >
                  {creatingTicket ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Ticket"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: "Total", value: stats.total, color: "slate", Icon: Ticket, tab: "all" },
          { label: "Open", value: stats.open, color: "blue", Icon: AlertCircle, tab: "open" },
          { label: "In Progress", value: stats.in_progress, color: "yellow", Icon: Clock, tab: "in_progress" },
          { label: "Pending", value: stats.pending, color: "orange", Icon: Clock, tab: "pending" },
          { label: "Resolved", value: stats.resolved + (stats.closed ?? 0), color: "green", Icon: CheckCircle2, tab: "resolved" },
        ].map(({ label, value, color, Icon, tab }) => (
          <Card
            key={tab}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab(tab)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${color}-100 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${color !== "slate" ? `text-${color}-600` : ""}`}>
                    {value}
                  </p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-purple-600 leading-tight">
                  {stats.avg_response_time}
                </p>
                <p className="text-xs text-slate-500">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-600 leading-tight">
                  {stats.sla_compliance_rate}%
                </p>
                <p className="text-xs text-slate-500">SLA Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col gap-4">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1) }}>
          <TabsList>
            <TabsTrigger value="all">All Tickets</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by ticket ID, subject, or customer..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                  className="pl-9"
                />
              </div>
              <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            Showing {paginatedTickets.length} of {filteredTickets.length} tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">No tickets found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or create a new ticket</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Ticket ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          {ticket.ticket_number || `TKT-${ticket.id}`}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-medium truncate">{ticket.subject}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {(ticket.messages ?? []).length} message(s)
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{ticket.customer_name ?? "Unknown"}</p>
                            <p className="text-xs text-slate-500">{ticket.customer_phone ?? ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryBadge(ticket.category)}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm">{ticket.assigned_to_name ?? "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-500">{formatTimeAgo(ticket.created_at)}</span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "in_progress")}>
                                <Clock className="w-4 h-4 mr-2" />
                                Mark In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "resolved")}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark Resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEscalate(ticket.id)}>
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Escalate to Urgent
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleUpdateStatus(ticket.id, "closed")}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Close Ticket
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
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

      {/* ── Ticket Detail Drawer ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="flex items-center gap-2 text-base">
              <span className="font-mono text-sm text-slate-500">
                {selectedTicket?.ticket_number || `TKT-${selectedTicket?.id}`}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="truncate">{selectedTicket?.subject}</span>
            </SheetTitle>
            <SheetDescription className="flex items-center gap-2 mt-2 flex-wrap">
              {selectedTicket && (
                <>
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                  {getCategoryBadge(selectedTicket.category)}
                </>
              )}
            </SheetDescription>
          </SheetHeader>

          {selectedTicket && (
            <>
              {/* Customer Info */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {(selectedTicket.customer_name ?? "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {selectedTicket.customer_name ?? "Unknown Customer"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedTicket.customer_plan ?? "No plan"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {selectedTicket.customer_email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`mailto:${selectedTicket.customer_email}`)}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    {selectedTicket.customer_phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${selectedTicket.customer_phone}`)}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {(selectedTicket.messages ?? []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(selectedTicket.messages ?? []).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_type === "agent" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.sender_type === "agent"
                              ? "bg-primary text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-medium ${
                                message.sender_type === "agent"
                                  ? "text-blue-100"
                                  : "text-slate-500"
                              }`}
                            >
                              {message.sender_name}
                            </span>
                            <span
                              className={`text-xs ${
                                message.sender_type === "agent"
                                  ? "text-primary/40"
                                  : "text-slate-400"
                              }`}
                            >
                              {formatTimeAgo(message.created_at)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Reply + Status controls */}
              <div className="p-4 border-t bg-white dark:bg-slate-900">
                <div className="flex gap-2 mb-3">
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(v) =>
                      handleUpdateStatus(selectedTicket.id, v as TicketStatus)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-warning border-warning/20 hover:bg-warning/10"
                    onClick={() => handleEscalate(selectedTicket.id)}
                    disabled={selectedTicket.priority === "urgent"}
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Escalate
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) handleSendReply()
                    }}
                    rows={2}
                    className="flex-1 resize-none"
                  />
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="icon" disabled>
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyMessage.trim()}
                    >
                      {sendingReply ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">Ctrl+Enter to send</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
