"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  Ticket,
  Search,
  Filter,
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
  ArrowUpDown,
  Send,
  Paperclip,
  ChevronRight,
  Tag,
  Calendar,
  Phone,
  Mail,
  Building,
  BarChart3,
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
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { 
  SupportTicket, 
  SupportTicketMessage, 
  SupportTicketStats,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketCategory,
} from "@/lib/types"

// Local types for compatibility with UI
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

export default function TicketsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<SupportTicketStats>(emptyStats)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sendingReply, setSendingReply] = useState(false)
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [newTicketData, setNewTicketData] = useState({
    customer_id: "",
    subject: "",
    description: "",
    category: "technical" as TicketCategory,
    priority: "medium" as TicketPriority,
  })
  const itemsPerPage = 10

  // Fetch tickets and stats from API
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build filters based on active tab
      const filters: Record<string, string> = {}
      if (activeTab !== "all") {
        filters.status = activeTab
      }
      if (priorityFilter !== "all") {
        filters.priority = priorityFilter
      }
      if (categoryFilter !== "all") {
        filters.category = categoryFilter
      }
      if (searchQuery) {
        filters.search = searchQuery
      }
      
      const [ticketsData, statsData] = await Promise.all([
        adminApi.getTickets(filters).catch(() => null),
        adminApi.getTicketStats().catch(() => null),
      ])
      
      if (ticketsData) {
        const ticketsList = Array.isArray(ticketsData) ? ticketsData : (ticketsData.results || [])
        setTickets(ticketsList)
      }
      
      if (statsData) {
        setStats(statsData)
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

  // Filter tickets (client-side filtering for additional refinement)
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Tab filter
      const matchesTab = 
        activeTab === "all" ||
        (activeTab === "open" && ticket.status === "open") ||
        (activeTab === "in_progress" && ticket.status === "in_progress") ||
        (activeTab === "pending" && ticket.status === "pending") ||
        (activeTab === "resolved" && (ticket.status === "resolved" || ticket.status === "closed"))

      // Search filter - using ticket_number and customer_name
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        !searchQuery ||
        ticket.subject.toLowerCase().includes(searchLower) ||
        (ticket.ticket_number || "").toLowerCase().includes(searchLower) ||
        (ticket.customer_name || "").toLowerCase().includes(searchLower)

      // Priority filter
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter

      // Category filter
      const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter

      return matchesTab && matchesSearch && matchesPriority && matchesCategory
    })
  }, [tickets, activeTab, searchQuery, priorityFilter, categoryFilter])

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)

  const getStatusBadge = (status: TicketStatus) => {
    const config: Record<string, { class: string; icon: any }> = {
      open: { class: "bg-blue-100 text-blue-700 border-blue-200", icon: AlertCircle },
      in_progress: { class: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      pending: { class: "bg-orange-100 text-orange-700 border-orange-200", icon: Clock },
      resolved: { class: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
      closed: { class: "bg-slate-100 text-slate-700 border-slate-200", icon: XCircle },
    }
    const statusConfig = config[status] || config.open
    const Icon = statusConfig.icon
    return (
      <Badge variant="outline" className={statusConfig.class}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: TicketPriority) => {
    const config = {
      low: "bg-slate-100 text-slate-600 border-slate-200",
      medium: "bg-blue-100 text-blue-600 border-blue-200",
      high: "bg-orange-100 text-orange-600 border-orange-200",
      urgent: "bg-red-100 text-red-600 border-red-200",
    }
    return (
      <Badge variant="outline" className={config[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const getCategoryBadge = (category: TicketCategory) => {
    const config = {
      technical: "bg-purple-100 text-purple-700",
      billing: "bg-emerald-100 text-emerald-700",
      account: "bg-blue-100 text-blue-700",
      service: "bg-amber-100 text-amber-700",
      other: "bg-slate-100 text-slate-700",
    }
    return (
      <Badge variant="secondary" className={config[category]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    )
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setDrawerOpen(true)
    
    // Fetch fresh ticket data with messages
    try {
      const freshTicket = await adminApi.getTicket(ticket.id)
      if (freshTicket) {
        setSelectedTicket(freshTicket)
        // Update in list too
        setTickets(prev => prev.map(t => t.id === ticket.id ? freshTicket : t))
      }
    } catch (err) {
      console.error("Error fetching ticket details:", err)
      // Keep showing the cached ticket data
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || sendingReply) return
    
    try {
      setSendingReply(true)
      
      // Try API first
      const message = await adminApi.replyToTicket(selectedTicket.id, {
        message: replyMessage,
        is_internal: false,
      }).catch(() => null)
      
      if (message) {
        setSelectedTicket({
          ...selectedTicket,
          messages: [...(selectedTicket.messages || []), message],
          status: selectedTicket.status === "open" ? "in_progress" : selectedTicket.status,
          updated_at: new Date().toISOString(),
        })
        toast.success("Reply sent successfully")
      } else {
        toast.error("Failed to send reply")
      }
      
      setReplyMessage("")
    } catch (err) {
      console.error("Error sending reply:", err)
      toast.error("Failed to send reply")
    } finally {
      setSendingReply(false)
    }
  }

  const handleUpdateStatus = async (ticketId: number, newStatus: TicketStatus) => {
    try {
      await adminApi.updateTicketStatus(ticketId, newStatus).catch(() => null)
      
      setTickets(tickets.map(t => 
        t.id === ticketId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
      ))
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus })
      }
      toast.success(`Ticket status updated to ${newStatus.replace("_", " ")}`)
    } catch (err) {
      console.error("Error updating status:", err)
      toast.error("Failed to update status")
    }
  }
  
  const handleAssignTicket = async (ticketId: number, agentId: number | null) => {
    try {
      if (agentId) {
        await adminApi.assignTicket(ticketId, agentId).catch(() => null)
        toast.success("Ticket assigned successfully")
      }
      
      // Update local state
      setTickets(tickets.map(t => 
        t.id === ticketId ? { ...t, assigned_to: agentId || undefined, updated_at: new Date().toISOString() } : t
      ))
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, assigned_to: agentId || undefined })
      }
    } catch (err) {
      console.error("Error assigning ticket:", err)
      toast.error("Failed to assign ticket")
    }
  }
  
  const handleCreateTicket = async () => {
    if (!newTicketData.subject || !newTicketData.description) {
      toast.error("Please fill in all required fields")
      return
    }
    
    try {
      setCreatingTicket(true)
      
      const ticket = await adminApi.createTicket({
        customer_id: parseInt(newTicketData.customer_id) || undefined,
        subject: newTicketData.subject,
        description: newTicketData.description,
        category: newTicketData.category,
        priority: newTicketData.priority,
      }).catch(() => null)
      
      if (ticket) {
        setTickets(prev => [ticket, ...prev])
        toast.success("Ticket created successfully")
      } else {
        toast.error("Failed to create ticket")
      }
      
      setShowNewTicketDialog(false)
      setNewTicketData({
        customer_id: "",
        subject: "",
        description: "",
        category: "technical",
        priority: "medium",
      })
    } catch (err) {
      console.error("Error creating ticket:", err)
      toast.error("Failed to create ticket")
    } finally {
      setCreatingTicket(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Support Tickets</h1>
          <p className="text-slate-500 mt-1">Manage customer support requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>Create a ticket on behalf of a customer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="c1">Customer 1</SelectItem>
                      <SelectItem value="c2">Customer 2</SelectItem>
                      <SelectItem value="c3">Customer 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="Brief description of the issue" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Detailed description of the issue..." rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewTicketDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateTicket} disabled={creatingTicket}>
                  {creatingTicket ? "Creating..." : "Create Ticket"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("all")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Ticket className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("open")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                <p className="text-xs text-slate-500">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("in_progress")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.in_progress}</p>
                <p className="text-xs text-slate-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("pending")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("resolved")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.resolved + (stats.closed || 0)}</p>
                <p className="text-xs text-slate-500">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">{stats.avg_response_time}</p>
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
                <p className="text-lg font-bold text-emerald-600">{stats.avg_resolution_time}</p>
                <p className="text-xs text-slate-500">Avg Resolution</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search tickets by ID, subject, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">No tickets found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
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
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTickets.map(ticket => (
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
                              {(ticket.messages || []).length} message(s)
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{ticket.customer_name || "Unknown"}</p>
                            <p className="text-xs text-slate-500">{ticket.customer_email || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryBadge(ticket.category)}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm">{ticket.assigned_to_name || "-"}</span>
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
                              <DropdownMenuItem>
                                <User className="w-4 h-4 mr-2" />
                                Assign To...
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
                              <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "closed")}>
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
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
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

      {/* Ticket Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="flex items-center gap-2">
              <span className="font-mono text-sm text-slate-500">{selectedTicket?.ticket_number || `TKT-${selectedTicket?.id}`}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="truncate">{selectedTicket?.subject}</span>
            </SheetTitle>
            <SheetDescription className="flex items-center gap-2 mt-2">
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
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {(selectedTicket.customer_name || "U").split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{selectedTicket.customer_name || "Unknown Customer"}</p>
                    <p className="text-sm text-slate-500">{selectedTicket.customer_plan || "N/A"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => selectedTicket.customer_email && window.open(`mailto:${selectedTicket.customer_email}`)}>
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => selectedTicket.customer_phone && window.open(`tel:${selectedTicket.customer_phone}`)}>
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {(selectedTicket.messages || []).map(message => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.sender_type === "agent" ? "justify-end" : "justify-start"}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender_type === "agent" 
                            ? "bg-blue-500 text-white" 
                            : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${
                            message.sender_type === "agent" ? "text-blue-100" : "text-slate-500"
                          }`}>
                            {message.sender_name}
                          </span>
                          <span className={`text-xs ${
                            message.sender_type === "agent" ? "text-blue-200" : "text-slate-400"
                          }`}>
                            {formatTimeAgo(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Box */}
              <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex gap-2 mb-3">
                  <Select 
                    value={selectedTicket.status} 
                    onValueChange={(v) => handleUpdateStatus(selectedTicket.id, v as TicketStatus)}
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
                  <Select onValueChange={(v) => handleAssignTicket(selectedTicket.id, parseInt(v) || null)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={selectedTicket.assigned_to_name || "Assign to..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">John Admin</SelectItem>
                      <SelectItem value="2">Sarah Support</SelectItem>
                      <SelectItem value="3">Mike Tech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Type your reply..." 
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="icon">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button size="icon" onClick={handleSendReply} disabled={sendingReply || !replyMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
