"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  MapPin,
  Phone,
  Mail,
  Send,
  Save,
  Eye,
  Play,
  Pause,
  Navigation,
  ClipboardList,
  Wrench,
  Users,
  Timer,
  Target,
  Flag,
  MessageSquare,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import { usePagePermissions } from "@/hooks/use-page-permissions"
import type { Technician, DispatchJob, Customer, SupportTicket, JobType } from "@/lib/types"

type JobStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
type JobPriority = 'low' | 'medium' | 'high' | 'urgent'



const getStatusBadge = (status: JobStatus) => {
  const config: Record<JobStatus, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending: { variant: "outline", icon: <Clock className="h-3 w-3" /> },
    assigned: { variant: "secondary", icon: <User className="h-3 w-3" /> },
    in_progress: { variant: "default", icon: <Play className="h-3 w-3" /> },
    completed: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
    cancelled: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  }
  const c = config[status]
  return (
    <Badge variant={c.variant} className={`capitalize gap-1 ${status === 'completed' ? 'bg-success' : status === 'in_progress' ? 'bg-primary' : ''}`}>
      {c.icon}
      {status.replace('_', ' ')}
    </Badge>
  )
}

const getPriorityBadge = (priority: JobPriority) => {
  const config: Record<JobPriority, { variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
    low: { variant: "outline", color: "" },
    medium: { variant: "secondary", color: "" },
    high: { variant: "default", color: "bg-warning" },
    urgent: { variant: "destructive", color: "" },
  }
  const c = config[priority]
  return (
    <Badge variant={c.variant} className={`capitalize ${c.color}`}>
      {priority}
    </Badge>
  )
}

const getTypeBadge = (type: JobType) => {
  const config: Record<JobType, { icon: React.ReactNode; color: string }> = {
    installation: { icon: <Plus className="h-3 w-3" />, color: "bg-success/15 text-success" },
    repair: { icon: <Wrench className="h-3 w-3" />, color: "bg-destructive/15 text-destructive" },
    maintenance: { icon: <ClipboardList className="h-3 w-3" />, color: "bg-primary/15 text-primary" },
    relocation: { icon: <Navigation className="h-3 w-3" />, color: "bg-purple-100 text-purple-700" },
    disconnection: { icon: <Pause className="h-3 w-3" />, color: "bg-slate-100 text-slate-700" },
    survey: { icon: <MapPin className="h-3 w-3" />, color: "bg-warning/15 text-warning" },
  }
  const c = config[type]
  return (
    <Badge variant="outline" className={`capitalize gap-1 ${c.color}`}>
      {c.icon}
      {type}
    </Badge>
  )
}

export default function DispatchPage() {
  const perms = usePagePermissions("/admin/dispatch")
  const [loading, setLoading] = useState(true)
  const [technicians, setTechnicians] = useState<(Technician & { active_jobs: number; completed_today: number })[]>([])
  const [jobs, setJobs] = useState<DispatchJob[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [openTickets, setOpenTickets] = useState<SupportTicket[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("jobs")
  const [selectedJob, setSelectedJob] = useState<DispatchJob | null>(null)
  const [editingJob, setEditingJob] = useState<DispatchJob | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false)
  const [isCreateTechnicianOpen, setIsCreateTechnicianOpen] = useState(false)
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [jobToAssign, setJobToAssign] = useState<DispatchJob | null>(null)
  const [jobToNotify, setJobToNotify] = useState<DispatchJob | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmittingTechnician, setIsSubmittingTechnician] = useState(false)
  const [isSendingNotification, setIsSendingNotification] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [jobsRes, techsRes, customersRes, ticketsRes] = await Promise.allSettled([
        adminApi.getDispatchJobs({ page_size: "100" }),
        adminApi.getTechnicians({ page_size: "50" }),
        adminApi.getCustomers({ page_size: "100" }),
        adminApi.getTickets({ page_size: "100" }),
      ])
      if (jobsRes.status === "fulfilled") {
        setJobs(jobsRes.value.results || [])
      } else {
        console.error("Failed to load dispatch jobs:", jobsRes.reason)
        toast.error("Dispatch jobs endpoint is unavailable")
      }
      if (techsRes.status === "fulfilled") {
        setTechnicians(
          (techsRes.value.results || []).map(t => ({
            ...t,
            active_jobs: (t as any).active_jobs || 0,
            completed_today: (t as any).completed_today || 0,
          }))
        )
      } else {
        console.error("Failed to load technicians:", techsRes.reason)
        toast.error("Technicians endpoint is unavailable")
      }
      if (customersRes.status === "fulfilled") {
        setCustomers(customersRes.value.results || [])
      } else {
        console.error("Failed to load customers:", customersRes.reason)
      }
      if (ticketsRes.status === "fulfilled") {
        setOpenTickets(
          (ticketsRes.value.results || []).filter(
            (ticket) => ticket.status !== "resolved" && ticket.status !== "closed"
          )
        )
      } else {
        console.error("Failed to load support tickets:", ticketsRes.reason)
      }
    } catch (err) {
      console.error("Failed to load dispatch data:", err)
      toast.error("Failed to load dispatch data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Create job form state
  const [jobForm, setJobForm] = useState({
    customer: "",
    ticket: "",
    job_type: "installation" as JobType,
    priority: "medium" as JobPriority,
    scheduled_date: "",
    scheduled_time: "09:00",
    description: "",
    notes: "",
  })

  const [technicianForm, setTechnicianForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    skills: "",
    current_location: "",
  })

  // Stats
  const stats = useMemo(() => {
    const pending = jobs.filter(j => j.status === 'pending').length
    const inProgress = jobs.filter(j => j.status === 'in_progress').length
    const completedToday = jobs.filter(j => 
      j.status === 'completed' && 
      j.completed_at && 
      new Date(j.completed_at).toDateString() === new Date().toDateString()
    ).length
    const availableTechs = technicians.filter(t => t.status === 'available').length
    
    return {
      pending,
      inProgress,
      completedToday,
      availableTechs,
      totalTechs: technicians.length,
      avgCompletionTime: "1.5 hrs",
    }
  }, [jobs, technicians])

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs

    if (searchQuery) {
      filtered = filtered.filter(j =>
        j.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.customer_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.technician_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(j => j.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(j => j.job_type === typeFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(j => j.priority === priorityFilter)
    }

    return filtered
  }, [jobs, searchQuery, statusFilter, typeFilter, priorityFilter])

  const scheduleGroups = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return {
      today: jobs.filter(j => j.scheduled_date === today && j.status !== "completed" && j.status !== "cancelled"),
      upcoming: jobs.filter(j => j.scheduled_date > today && j.status !== "completed" && j.status !== "cancelled"),
      unassigned: jobs.filter(j => !j.technician && !j.assigned_to && j.status !== "completed" && j.status !== "cancelled"),
    }
  }, [jobs])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  const handleViewDetails = (job: DispatchJob) => {
    setSelectedJob(job)
    setIsDetailOpen(true)
  }

  const handleAssignJob = async () => {
    if (jobToAssign && selectedTechnician) {
      try {
        await adminApi.assignDispatchJob(jobToAssign.id, Number(selectedTechnician))
        toast.success("Technician assigned successfully")
        await fetchData()
      } catch (err: any) {
        toast.error(err.message || "Failed to assign job")
      }
      setIsAssignDialogOpen(false)
      setJobToAssign(null)
      setSelectedTechnician("")
    }
  }

  const handleStartJob = async (job: DispatchJob) => {
    try {
      const updatedJob = await adminApi.updateJobStatus(job.id, 'in_progress')
      toast.success("Job started")
      await fetchData()
      if (selectedJob?.id === job.id) {
        setSelectedJob(updatedJob)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start job")
    }
  }

  const handleCompleteJob = async (job: DispatchJob) => {
    try {
      const updatedJob = await adminApi.updateJobStatus(job.id, 'completed')
      toast.success("Job completed")
      await fetchData()
      if (selectedJob?.id === job.id) {
        setSelectedJob(updatedJob)
      }
      setIsDetailOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to complete job")
    }
  }

  const handleCancelJob = async (job: DispatchJob) => {
    try {
      const updatedJob = await adminApi.updateJobStatus(job.id, 'cancelled')
      toast.success("Job cancelled")
      await fetchData()
      if (selectedJob?.id === job.id) {
        setSelectedJob(updatedJob)
      }
      setIsDetailOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel job")
    }
  }

  const resetJobForm = () => {
    setEditingJob(null)
    setJobForm({
      customer: "",
      ticket: "",
      job_type: "installation",
      priority: "medium",
      scheduled_date: "",
      scheduled_time: "09:00",
      description: "",
      notes: "",
    })
  }

  const handleEditJob = (job: DispatchJob) => {
    setEditingJob(job)
    setJobForm({
      customer: String(job.customer || ""),
      ticket: job.ticket ? String(job.ticket) : "",
      job_type: job.job_type,
      priority: job.priority,
      scheduled_date: job.scheduled_date || "",
      scheduled_time: job.scheduled_time || "09:00",
      description: job.description || "",
      notes: job.notes || "",
    })
    setIsCreateJobOpen(true)
  }

  const handleCreateJob = async () => {
    if (!jobForm.customer || !jobForm.scheduled_date) {
      toast.error("Please fill in all required fields")
      return
    }
    try {
      const payload = {
        customer: Number(jobForm.customer) || 0,
        job_type: jobForm.job_type,
        priority: jobForm.priority,
        scheduled_date: jobForm.scheduled_date,
        scheduled_time: jobForm.scheduled_time,
        description: jobForm.description,
        notes: jobForm.notes,
        ticket: jobForm.ticket ? Number(jobForm.ticket) : undefined,
      } as any
      if (editingJob) {
        await adminApi.updateDispatchJob(editingJob.id, payload)
        toast.success("Job updated successfully")
      } else {
        await adminApi.createDispatchJob(payload)
        toast.success("Job created successfully")
      }
      await fetchData()
    } catch (err: any) {
      toast.error(err.message || `Failed to ${editingJob ? "update" : "create"} job`)
    }
    setIsCreateJobOpen(false)
    resetJobForm()
  }

  const handleUpdateTechnicianStatus = async (tech: Technician, available: boolean) => {
    try {
      await adminApi.updateTechnician(tech.id, { status: available ? "available" : "offline" } as any)
      toast.success(`${tech.name} marked ${available ? "available" : "unavailable"}`)
      await fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to update technician status")
    }
  }

  const handleDeleteTechnician = async (tech: Technician) => {
    if (!window.confirm(`Delete technician "${tech.name}"? Existing job history will remain.`)) return
    try {
      await adminApi.deleteTechnician(tech.id)
      toast.success("Technician deleted")
      await fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete technician")
    }
  }

  const handleCreateTechnician = async () => {
    if (!technicianForm.first_name.trim() || !technicianForm.phone.trim() || !technicianForm.email.trim()) {
      toast.error("Technician name, phone, and email are required")
      return
    }

    setIsSubmittingTechnician(true)
    try {
      await adminApi.createTechnician({
        first_name: technicianForm.first_name.trim(),
        last_name: technicianForm.last_name.trim(),
        email: technicianForm.email.trim(),
        phone: technicianForm.phone.trim(),
        password: technicianForm.password || undefined,
        skills: technicianForm.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        current_location: technicianForm.current_location.trim() || undefined,
        status: "available",
      })
      toast.success("Technician created")
      setTechnicianForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        skills: "",
        current_location: "",
      })
      setIsCreateTechnicianOpen(false)
      await fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to create technician")
    } finally {
      setIsSubmittingTechnician(false)
    }
  }

  const notificationTemplate = (job: DispatchJob | null) => {
    if (!job) return ""
    return `Hi ${job.technician_name || "Technician"}, you have been assigned ${job.job_number || `JOB-${job.id}`}: ${job.job_type.replace("_", " ")} for ${job.customer_name} on ${job.scheduled_date} at ${job.scheduled_time || "TBA"}. Customer phone: ${job.customer_phone || "N/A"}.`
  }

  const handleNotifyTechnician = async (channels: Array<"sms" | "email">) => {
    if (!jobToNotify) return
    setIsSendingNotification(true)
    try {
      const message = notificationTemplate(jobToNotify)
      await adminApi.notifyDispatchTechnician(jobToNotify.id, {
        channels,
        sms_message: message,
        email_subject: `Dispatch assignment ${jobToNotify.job_number || jobToNotify.id}`,
        email_body: `${message}\n\nAddress: ${jobToNotify.customer_address || "N/A"}\nDescription: ${jobToNotify.description || "No description provided."}`,
      })
      toast.success(`Technician notification sent via ${channels.join(" and ")}`)
      setIsNotifyDialogOpen(false)
      setJobToNotify(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to send notification")
    } finally {
      setIsSendingNotification(false)
    }
  }

  const handleTicketChange = (ticketId: string) => {
    const ticket = openTickets.find((item) => String(item.id) === ticketId)
    setJobForm((prev) => ({
      ...prev,
      ticket: ticketId,
      customer: ticket ? String(ticket.customer_id) : prev.customer,
      description: ticket ? `${ticket.subject}\n\n${ticket.description}` : prev.description,
      priority: ticket ? ticket.priority : prev.priority,
    }))
  }

  const renderScheduleJobs = (items: DispatchJob[]) => (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          No jobs in this schedule bucket.
        </div>
      ) : items.map((job) => (
        <div key={job.id} className="flex items-center gap-4 p-4 rounded-lg border">
          <div className="text-center min-w-[72px]">
            <p className="text-lg font-bold">{job.scheduled_time || "TBA"}</p>
            <p className="text-xs text-muted-foreground">{job.scheduled_date}</p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {getTypeBadge(job.job_type)}
              {getPriorityBadge(job.priority)}
            </div>
            <p className="font-medium mt-1">{job.customer_name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.customer_address || "No address captured"}
            </p>
          </div>
          <div className="min-w-[150px] text-right space-y-2">
            {job.technician_name ? (
              <div className="flex items-center justify-end gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {job.technician_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{job.technician_name}</span>
              </div>
            ) : (
              <Badge variant="outline" className="text-warning">Unassigned</Badge>
            )}
            <div>{getStatusBadge(job.status)}</div>
            <div className="flex justify-end gap-2">
              {!job.technician_name && perms.canEdit && (
                <Button
                  size="sm"
                  onClick={() => {
                    setJobToAssign(job)
                    setIsAssignDialogOpen(true)
                  }}
                >
                  Assign
                </Button>
              )}
              {perms.canEdit && (
                <Button size="sm" variant="ghost" onClick={() => handleEditJob(job)}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispatch Management</h1>
          <p className="text-muted-foreground">
            Manage technician assignments and job scheduling
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {perms.canAdd && (
            <>
              <Button variant="outline" onClick={() => setIsCreateTechnicianOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Add Technician
              </Button>
              <Button onClick={() => { resetJobForm(); setIsCreateJobOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently being worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">Jobs finished today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Technicians</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableTechs} / {stats.totalTechs}</div>
            <p className="text-xs text-muted-foreground">Ready for dispatch</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobs" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="technicians" className="gap-2">
            <Users className="h-4 w-4" />
            Technicians
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Dispatch Jobs</CardTitle>
                  <CardDescription>
                    {filteredJobs.length} jobs found
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="relocation">Relocation</SelectItem>
                      <SelectItem value="disconnection">Disconnection</SelectItem>
                      <SelectItem value="survey">Survey</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[120px]">
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono">JOB-{String(job.id).padStart(4, '0')}</TableCell>
                      <TableCell>
                        <div>
                          <Link href={`/admin/users/${job.customer}`} className="font-medium hover:underline">
                            {job.customer_name}
                          </Link>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.customer_address.slice(0, 30)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(job.job_type)}</TableCell>
                      <TableCell>{getPriorityBadge(job.priority)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{new Date(job.scheduled_date).toLocaleDateString()}</span>
                          <span className="text-xs text-muted-foreground">{job.scheduled_time}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.technician_name ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {job.technician_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{job.technician_name}</span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setJobToAssign(job)
                              setIsAssignDialogOpen(true)
                            }}
                          >
                            Assign
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(job)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditJob(job)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Job
                            </DropdownMenuItem>
                            {job.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setJobToAssign(job)
                                  setIsAssignDialogOpen(true)
                                }}
                              >
                                <User className="mr-2 h-4 w-4" />
                                Assign Technician
                              </DropdownMenuItem>
                            )}
                            {job.status === 'assigned' && (
                              <DropdownMenuItem onClick={() => handleStartJob(job)}>
                                <Play className="mr-2 h-4 w-4" />
                                Start Job
                              </DropdownMenuItem>
                            )}
                            {job.status === 'in_progress' && (
                              <DropdownMenuItem onClick={() => handleCompleteJob(job)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Complete Job
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleCancelJob(job)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technicians" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Technicians</CardTitle>
                  <CardDescription>Field technician roster and availability</CardDescription>
                </div>
                <Button onClick={() => setIsCreateTechnicianOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Technician
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {technicians.length === 0 ? (
                <div className="rounded-xl border border-dashed py-12 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No technicians yet</p>
                  <p className="text-sm text-muted-foreground">Create your first technician so jobs can be assigned.</p>
                </div>
              ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {technicians.map((tech) => (
                  <Card key={tech.id} className="relative">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${tech.name}`} />
                          <AvatarFallback>{tech.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold">{tech.name}</h3>
                              <Badge
                                variant={tech.status === 'available' ? 'default' : tech.status === 'busy' ? 'secondary' : 'outline'}
                                className={`mt-1 ${tech.status === 'available' ? 'bg-success' : ''}`}
                              >
                                {tech.status === "offline" ? "unavailable" : tech.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUpdateTechnicianStatus(tech, true)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Available
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateTechnicianStatus(tech, false)}>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Mark Unavailable
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTechnician(tech)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Technician
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {tech.phone}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tech.skills.slice(0, 2).map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {tech.skills.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{tech.skills.length - 2}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4 text-primary" />
                              {tech.active_jobs} active
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-success" />
                              {tech.completed_today} today
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>Plan today's work, future appointments, and unassigned jobs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="today">
                <TabsList>
                  <TabsTrigger value="today">Today ({scheduleGroups.today.length})</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming ({scheduleGroups.upcoming.length})</TabsTrigger>
                  <TabsTrigger value="unassigned">Unassigned ({scheduleGroups.unassigned.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="today" className="mt-4">
                  {renderScheduleJobs(scheduleGroups.today)}
                </TabsContent>
                <TabsContent value="upcoming" className="mt-4">
                  {renderScheduleJobs(scheduleGroups.upcoming)}
                </TabsContent>
                <TabsContent value="unassigned" className="mt-4">
                  {renderScheduleJobs(scheduleGroups.unassigned)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedJob && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  JOB-{String(selectedJob.id).padStart(4, '0')}
                  {getStatusBadge(selectedJob.status)}
                </SheetTitle>
                <SheetDescription>
                  {getTypeBadge(selectedJob.job_type)} {getPriorityBadge(selectedJob.priority)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <Link href={`/admin/users/${selectedJob.customer}`} className="font-medium hover:underline">
                        {selectedJob.customer_name}
                      </Link>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span>{selectedJob.customer_phone}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Address</span>
                      <span className="text-right max-w-[60%]">{selectedJob.customer_address}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Job Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Job Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scheduled</span>
                      <span>{new Date(selectedJob.scheduled_date).toLocaleDateString()} at {selectedJob.scheduled_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span>~{selectedJob.estimated_duration} minutes</span>
                    </div>
                    {selectedJob.ticket_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Linked Ticket</span>
                        <span className="font-medium">{selectedJob.ticket_number}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div>
                      <span className="text-muted-foreground">Description</span>
                      <p className="mt-1">{selectedJob.description}</p>
                    </div>
                    {selectedJob.notes && (
                      <div>
                        <span className="text-muted-foreground">Notes</span>
                        <p className="mt-1">{selectedJob.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Assigned Technician */}
                {selectedJob.technician_name && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Assigned Technician
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {selectedJob.technician_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedJob.technician_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {technicians.find(t => t.id === selectedJob.technician)?.phone}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {selectedJob.status === 'pending' && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setJobToAssign(selectedJob)
                        setIsAssignDialogOpen(true)
                        setIsDetailOpen(false)
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Assign Technician
                    </Button>
                  )}
                  {selectedJob.status === 'assigned' && (
                    <Button className="flex-1" onClick={() => handleStartJob(selectedJob)}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Job
                    </Button>
                  )}
                  {selectedJob.status === 'in_progress' && (
                    <Button className="flex-1" variant="default" onClick={() => handleCompleteJob(selectedJob)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Job
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    disabled={!selectedJob.technician_name}
                    onClick={() => {
                      setJobToNotify(selectedJob)
                      setIsNotifyDialogOpen(true)
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Notify Tech
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Assign Technician Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
            <DialogDescription>
              Select a technician for JOB-{String(jobToAssign?.id || 0).padStart(4, '0')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Technician</Label>
            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians
                  .filter(t => t.status === 'available' || t.status === 'busy')
                  .map((tech) => (
                    <SelectItem key={tech.id} value={String(tech.id)}>
                      <div className="flex items-center gap-2">
                        <span>{tech.name}</span>
                        <Badge variant={tech.status === 'available' ? 'default' : 'secondary'} className="text-xs">
                          {tech.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignJob} disabled={!selectedTechnician}>
              <User className="mr-2 h-4 w-4" />
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Technician Dialog */}
      <Dialog open={isCreateTechnicianOpen} onOpenChange={setIsCreateTechnicianOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Technician</DialogTitle>
            <DialogDescription>
              Create a technician login and make them available for dispatch jobs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>First Name *</Label>
                <Input value={technicianForm.first_name} onChange={(e) => setTechnicianForm({ ...technicianForm, first_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Last Name</Label>
                <Input value={technicianForm.last_name} onChange={(e) => setTechnicianForm({ ...technicianForm, last_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Phone *</Label>
                <Input placeholder="+254..." value={technicianForm.phone} onChange={(e) => setTechnicianForm({ ...technicianForm, phone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input type="email" value={technicianForm.email} onChange={(e) => setTechnicianForm({ ...technicianForm, email: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Temporary Password</Label>
              <Input type="password" placeholder="Leave blank to auto-generate" value={technicianForm.password} onChange={(e) => setTechnicianForm({ ...technicianForm, password: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Skills</Label>
              <Input placeholder="Fiber splicing, MikroTik, installs" value={technicianForm.skills} onChange={(e) => setTechnicianForm({ ...technicianForm, skills: e.target.value })} />
              <p className="text-xs text-muted-foreground">Separate skills with commas.</p>
            </div>
            <div className="grid gap-2">
              <Label>Base Location</Label>
              <Input placeholder="e.g. Kiambu, Westlands" value={technicianForm.current_location} onChange={(e) => setTechnicianForm({ ...technicianForm, current_location: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTechnicianOpen(false)} disabled={isSubmittingTechnician}>Cancel</Button>
            <Button onClick={handleCreateTechnician} disabled={isSubmittingTechnician}>
              {isSubmittingTechnician && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Technician
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Technician Notification Dialog */}
      <Dialog open={isNotifyDialogOpen} onOpenChange={setIsNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify Technician</DialogTitle>
            <DialogDescription>
              Send this assignment template to {jobToNotify?.technician_name || "the technician"}.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
            {notificationTemplate(jobToNotify)}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsNotifyDialogOpen(false)} disabled={isSendingNotification}>Cancel</Button>
            <Button variant="outline" onClick={() => handleNotifyTechnician(["email"])} disabled={isSendingNotification}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" onClick={() => handleNotifyTechnician(["sms"])} disabled={isSendingNotification}>
              <Send className="mr-2 h-4 w-4" />
              SMS
            </Button>
            <Button onClick={() => handleNotifyTechnician(["sms", "email"])} disabled={isSendingNotification}>
              {isSendingNotification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Both
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Job Dialog */}
      <Dialog
        open={isCreateJobOpen}
        onOpenChange={(open) => {
          setIsCreateJobOpen(open)
          if (!open) resetJobForm()
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Dispatch Job" : "Create Dispatch Job"}</DialogTitle>
            <DialogDescription>
              {editingJob ? "Update this job's schedule, priority, and work notes." : "Create a new job for technician dispatch"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer</Label>
              <Select value={jobForm.customer} onValueChange={(v) => setJobForm({ ...jobForm, customer: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.full_name} - {customer.primary_address?.street_address || customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ticket">Create from Ticket (Optional)</Label>
              <Select value={jobForm.ticket} onValueChange={handleTicketChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Link an open support ticket" />
                </SelectTrigger>
                <SelectContent>
                  {openTickets.length === 0 ? (
                    <SelectItem value="none" disabled>No open tickets</SelectItem>
                  ) : (
                    openTickets.map((ticket) => (
                      <SelectItem key={ticket.id} value={String(ticket.id)}>
                        {ticket.ticket_number} - {ticket.customer_name} - {ticket.subject}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="job_type">Job Type</Label>
                <Select value={jobForm.job_type} onValueChange={(v) => setJobForm({ ...jobForm, job_type: v as JobType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="relocation">Relocation</SelectItem>
                    <SelectItem value="disconnection">Disconnection</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={jobForm.priority} onValueChange={(v) => setJobForm({ ...jobForm, priority: v as JobPriority })}>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="scheduled_date">Date</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={jobForm.scheduled_date}
                  onChange={(e) => setJobForm({ ...jobForm, scheduled_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="scheduled_time">Time</Label>
                <Select value={jobForm.scheduled_time} onValueChange={(v) => setJobForm({ ...jobForm, scheduled_time: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 8).map((hour) => (
                      <SelectItem key={hour} value={`${String(hour).padStart(2, '0')}:00`}>
                        {`${String(hour).padStart(2, '0')}:00`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Job description..."
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={jobForm.notes}
                onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateJobOpen(false); resetJobForm() }}>
              Cancel
            </Button>
            <Button onClick={handleCreateJob}>
              {editingJob ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {editingJob ? "Save Job" : "Create Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
