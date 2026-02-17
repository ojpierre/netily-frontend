"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  UserPlus,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Download,
  Target,
  Zap,
  DollarSign,
  Building,
  Globe,
  Star,
  StarOff,
  FileText,
  Send,
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
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

// Types
type LeadStatus = "new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost"
type LeadSource = "website" | "referral" | "walk-in" | "social-media" | "advertisement" | "hotspot"
type LeadPriority = "low" | "medium" | "high"

interface LeadActivity {
  id: string
  type: "call" | "email" | "sms" | "meeting" | "note"
  description: string
  timestamp: string
  by: string
}

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  location: string
  source: LeadSource
  status: LeadStatus
  priority: LeadPriority
  interestedPlan: string
  estimatedValue: number
  notes: string
  isStarred: boolean
  assignedTo: string
  createdAt: string
  lastContact: string
  nextFollowUp?: string
  activities: LeadActivity[]
  conversionProbability: number
}

interface LeadStats {
  total: number
  new: number
  contacted: number
  qualified: number
  negotiating: number
  converted: number
  lost: number
  conversionRate: number
  totalValue: number
}

// TODO: Add leads API endpoint when backend supports it
// import { adminApi } from "@/lib/admin-api"

export default function LeadsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false)
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      // TODO: Replace with adminApi.getLeads() when backend endpoint is available
      // For now, show empty state — no mock data
      setLeads([])
    } catch (err) {
      setError("Failed to load leads. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadLeads()
    setRefreshing(false)
  }

  // Calculate stats
  const stats: LeadStats = useMemo(() => {
    const converted = leads.filter(l => l.status === "converted").length
    const total = leads.length
    return {
      total,
      new: leads.filter(l => l.status === "new").length,
      contacted: leads.filter(l => l.status === "contacted").length,
      qualified: leads.filter(l => l.status === "qualified").length,
      negotiating: leads.filter(l => l.status === "negotiating").length,
      converted,
      lost: leads.filter(l => l.status === "lost").length,
      conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      totalValue: leads.reduce((acc, l) => acc + l.estimatedValue, 0),
    }
  }, [leads])

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesTab = 
        activeTab === "all" ||
        (activeTab === "starred" && lead.isStarred) ||
        (activeTab === "followup" && lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date(Date.now() + 24 * 60 * 60 * 1000)) ||
        lead.status === activeTab

      const matchesSearch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter

      return matchesTab && matchesSearch && matchesSource && matchesPriority
    })
  }, [leads, activeTab, searchQuery, sourceFilter, priorityFilter])

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)

  const getStatusBadge = (status: LeadStatus) => {
    const config = {
      new: { class: "bg-blue-100 text-blue-700 border-blue-200", label: "New" },
      contacted: { class: "bg-purple-100 text-purple-700 border-purple-200", label: "Contacted" },
      qualified: { class: "bg-amber-100 text-amber-700 border-amber-200", label: "Qualified" },
      negotiating: { class: "bg-orange-100 text-orange-700 border-orange-200", label: "Negotiating" },
      converted: { class: "bg-green-100 text-green-700 border-green-200", label: "Converted" },
      lost: { class: "bg-red-100 text-red-700 border-red-200", label: "Lost" },
    }
    return (
      <Badge variant="outline" className={config[status].class}>
        {config[status].label}
      </Badge>
    )
  }

  const getSourceBadge = (source: LeadSource) => {
    const config = {
      website: { icon: Globe, label: "Website" },
      referral: { icon: Users, label: "Referral" },
      "walk-in": { icon: Building, label: "Walk-in" },
      "social-media": { icon: MessageSquare, label: "Social" },
      advertisement: { icon: Target, label: "Ads" },
      hotspot: { icon: Zap, label: "Hotspot" },
    }
    const Icon = config[source].icon
    return (
      <Badge variant="secondary" className="bg-slate-100">
        <Icon className="w-3 h-3 mr-1" />
        {config[source].label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: LeadPriority) => {
    const config = {
      low: "bg-slate-100 text-slate-600",
      medium: "bg-blue-100 text-blue-600",
      high: "bg-red-100 text-red-600",
    }
    return (
      <Badge variant="outline" className={config[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead)
    setDrawerOpen(true)
  }

  const handleToggleStar = (leadId: string) => {
    setLeads(leads.map(l => 
      l.id === leadId ? { ...l, isStarred: !l.isStarred } : l
    ))
  }

  const handleUpdateStatus = (leadId: string, newStatus: LeadStatus) => {
    setLeads(leads.map(l => 
      l.id === leadId ? { ...l, status: newStatus } : l
    ))
    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus })
    }
  }

  const handleConvertLead = (lead: Lead) => {
    setSelectedLead(lead)
    setShowConvertDialog(true)
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Leads Management</h1>
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
          <h1 className="text-3xl font-bold text-slate-900">Leads Management</h1>
          <p className="text-slate-500 mt-1">Track and convert potential customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddLeadDialog} onOpenChange={setShowAddLeadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>Capture a new potential customer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input placeholder="+254 7XX XXX XXX" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="john@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input placeholder="e.g., Westlands" />
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                        <SelectItem value="social-media">Social Media</SelectItem>
                        <SelectItem value="advertisement">Advertisement</SelectItem>
                        <SelectItem value="hotspot">Hotspot Portal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Interested Plan</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home-basic">Home Basic</SelectItem>
                        <SelectItem value="home-premium">Home Premium</SelectItem>
                        <SelectItem value="business">Business Pro</SelectItem>
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Additional details about the lead..." rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddLeadDialog(false)}>Cancel</Button>
                <Button>Add Lead</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("all")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("new")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
                <p className="text-xs text-slate-500">New</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("contacted")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.contacted}</p>
                <p className="text-xs text-slate-500">Contacted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("qualified")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.qualified}</p>
                <p className="text-xs text-slate-500">Qualified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("negotiating")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.negotiating}</p>
                <p className="text-xs text-slate-500">Negotiating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("converted")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
                <p className="text-xs text-slate-500">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.conversionRate}%</p>
                <p className="text-xs text-slate-500">Conv. Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-indigo-600">KES {(stats.totalValue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-500">Pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All Leads</TabsTrigger>
          <TabsTrigger value="starred" className="flex items-center gap-1">
            <Star className="w-3 h-3" /> Starred
          </TabsTrigger>
          <TabsTrigger value="followup" className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Follow-up
          </TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="contacted">Contacted</TabsTrigger>
          <TabsTrigger value="qualified">Qualified</TabsTrigger>
          <TabsTrigger value="negotiating">Negotiating</TabsTrigger>
          <TabsTrigger value="converted">Converted</TabsTrigger>
          <TabsTrigger value="lost">Lost</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search leads by name, email, phone, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                <SelectItem value="social-media">Social Media</SelectItem>
                <SelectItem value="advertisement">Advertisement</SelectItem>
                <SelectItem value="hotspot">Hotspot</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>
            Showing {paginatedLeads.length} of {filteredLeads.length} leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">No leads found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Lead</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Interested In</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLeads.map(lead => (
                      <TableRow 
                        key={lead.id} 
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleViewLead(lead)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleStar(lead.id)}
                          >
                            {lead.isStarred ? (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <StarOff className="w-4 h-4 text-slate-300" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                {lead.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{lead.name}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {lead.location}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {lead.phone}
                            </p>
                            <p className="text-xs text-slate-500">{lead.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getSourceBadge(lead.source)}</TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{lead.interestedPlan}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-green-600">
                            KES {lead.estimatedValue.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={lead.conversionProbability} className="h-2 w-16" />
                            <span className="text-xs text-slate-500">{lead.conversionProbability}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{lead.assignedTo}</span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Lead
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Phone className="w-4 h-4 mr-2" />
                                Log Call
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="w-4 h-4 mr-2" />
                                Send SMS
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {lead.status !== "converted" && lead.status !== "lost" && (
                                <DropdownMenuItem onClick={() => handleConvertLead(lead)} className="text-green-600">
                                  <ArrowRight className="w-4 h-4 mr-2" />
                                  Convert to Customer
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Lead
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

      {/* Lead Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span className="font-mono text-sm text-slate-500">{selectedLead?.id}</span>
            </SheetTitle>
            <SheetDescription className="flex items-center gap-2">
              {selectedLead && (
                <>
                  {getStatusBadge(selectedLead.status)}
                  {getPriorityBadge(selectedLead.priority)}
                  {getSourceBadge(selectedLead.source)}
                </>
              )}
            </SheetDescription>
          </SheetHeader>

          {selectedLead && (
            <div className="mt-6 space-y-6">
              {/* Lead Info */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg">
                    {selectedLead.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedLead.name}</h3>
                  <p className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedLead.location}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {selectedLead.phone}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <p className="font-medium flex items-center gap-2 text-sm truncate">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {selectedLead.email}
                  </p>
                </div>
              </div>

              {/* Conversion Probability */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Conversion Probability</span>
                  <span className="text-lg font-bold text-blue-600">{selectedLead.conversionProbability}%</span>
                </div>
                <Progress value={selectedLead.conversionProbability} className="h-3" />
              </div>

              {/* Interested Plan */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold mb-3">Interested In</h4>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{selectedLead.interestedPlan}</span>
                  <span className="text-lg font-bold text-green-600">
                    KES {selectedLead.estimatedValue.toLocaleString()}/mo
                  </span>
                </div>
              </div>

              {/* Follow-up */}
              {selectedLead.nextFollowUp && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Next Follow-up</p>
                      <p className="text-amber-700">
                        {new Date(selectedLead.nextFollowUp).toLocaleDateString()} at{" "}
                        {new Date(selectedLead.nextFollowUp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-slate-600 text-sm">{selectedLead.notes}</p>
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="font-semibold mb-3">Activity Timeline</h4>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {selectedLead.activities.map(activity => (
                      <div key={activity.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          {activity.type === "call" && <Phone className="w-4 h-4 text-blue-600" />}
                          {activity.type === "email" && <Mail className="w-4 h-4 text-blue-600" />}
                          {activity.type === "sms" && <MessageSquare className="w-4 h-4 text-blue-600" />}
                          {activity.type === "note" && <FileText className="w-4 h-4 text-blue-600" />}
                          {activity.type === "meeting" && <Calendar className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {activity.by} • {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
                {selectedLead.status !== "converted" && selectedLead.status !== "lost" && (
                  <Button className="w-full" onClick={() => handleConvertLead(selectedLead)}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Convert to Customer
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Convert Lead Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Lead to Customer</DialogTitle>
            <DialogDescription>
              Create a customer account for {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                This will create a new customer account with the lead's information and assign them to the selected plan.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select defaultValue={selectedLead?.interestedPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home Basic">Home Basic - KES 1,500/mo</SelectItem>
                  <SelectItem value="Home Premium">Home Premium - KES 2,500/mo</SelectItem>
                  <SelectItem value="Business Pro">Business Pro - KES 5,000/mo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Router Assignment</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select router" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="r1">Router-Westlands-01</SelectItem>
                  <SelectItem value="r2">Router-Kilimani-02</SelectItem>
                  <SelectItem value="r3">Router-CBD-03</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (selectedLead) {
                handleUpdateStatus(selectedLead.id, "converted")
                setShowConvertDialog(false)
                setDrawerOpen(false)
              }
            }}>
              Convert to Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
