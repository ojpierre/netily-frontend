"use client"

import React, { useState, useMemo } from "react"
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
import type { Technician, DispatchJob } from "@/lib/types"

type JobStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
type JobPriority = 'low' | 'medium' | 'high' | 'urgent'
type JobType = 'installation' | 'repair' | 'maintenance' | 'relocation' | 'survey'

// Mock technicians
const generateMockTechnicians = (): (Technician & { active_jobs: number; completed_today: number })[] => [
  {
    id: 1,
    name: "Peter Omondi",
    phone: "+254 722 111 222",
    email: "peter.omondi@netily.co.ke",
    status: "available",
    skills: ["fiber installation", "ONU configuration", "splicing"],
    current_location: { lat: -1.2864, lng: 36.8172 },
    created_at: "2023-01-01T00:00:00Z",
    active_jobs: 0,
    completed_today: 3,
  },
  {
    id: 2,
    name: "James Mwangi",
    phone: "+254 733 222 333",
    email: "james.mwangi@netily.co.ke",
    status: "on_job",
    skills: ["fiber installation", "wireless", "router configuration"],
    current_location: { lat: -1.2921, lng: 36.8219 },
    created_at: "2023-02-15T00:00:00Z",
    active_jobs: 1,
    completed_today: 2,
  },
  {
    id: 3,
    name: "David Kipchoge",
    phone: "+254 744 333 444",
    email: "david.kipchoge@netily.co.ke",
    status: "available",
    skills: ["fiber installation", "troubleshooting", "OTDR testing"],
    current_location: { lat: -1.2800, lng: 36.8100 },
    created_at: "2023-03-10T00:00:00Z",
    active_jobs: 0,
    completed_today: 4,
  },
  {
    id: 4,
    name: "Michael Otieno",
    phone: "+254 755 444 555",
    email: "michael.otieno@netily.co.ke",
    status: "on_job",
    skills: ["wireless installation", "network troubleshooting"],
    current_location: { lat: -1.3000, lng: 36.8300 },
    created_at: "2023-04-20T00:00:00Z",
    active_jobs: 2,
    completed_today: 1,
  },
  {
    id: 5,
    name: "Samuel Wanjiku",
    phone: "+254 766 555 666",
    email: "samuel.wanjiku@netily.co.ke",
    status: "off_duty",
    skills: ["fiber splicing", "ONU provisioning"],
    current_location: { lat: -1.2750, lng: 36.8050 },
    created_at: "2023-05-05T00:00:00Z",
    active_jobs: 0,
    completed_today: 0,
  },
]

// Mock dispatch jobs
const generateMockJobs = (): DispatchJob[] => {
  const statuses: JobStatus[] = ['pending', 'pending', 'assigned', 'in_progress', 'completed', 'completed']
  const priorities: JobPriority[] = ['low', 'medium', 'medium', 'high', 'urgent']
  const types: JobType[] = ['installation', 'installation', 'repair', 'maintenance', 'relocation']
  
  const jobs: DispatchJob[] = []
  for (let i = 1; i <= 25; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const scheduledTime = new Date(Date.now() + (Math.random() - 0.5) * 7 * 24 * 60 * 60 * 1000)
    
    jobs.push({
      id: i,
      customer: 1000 + i,
      customer_name: `Customer ${i}`,
      customer_phone: `+254 7${Math.floor(10000000 + Math.random() * 90000000)}`,
      customer_address: `${100 + i} Street Name, ${['Nairobi', 'Westlands', 'Kilimani', 'Karen'][Math.floor(Math.random() * 4)]}`,
      job_type: type,
      priority,
      status,
      description: type === 'installation' ? 'New fiber installation - Home Fiber 50Mbps' :
                   type === 'repair' ? 'Customer reporting intermittent connection' :
                   type === 'maintenance' ? 'Scheduled maintenance check' :
                   'Equipment relocation to new premises',
      technician: status !== 'pending' ? (Math.floor(Math.random() * 5) + 1) : undefined,
      technician_name: status !== 'pending' ? generateMockTechnicians()[Math.floor(Math.random() * 5)].name : undefined,
      scheduled_date: scheduledTime.toISOString().split('T')[0],
      scheduled_time: `${9 + Math.floor(Math.random() * 8)}:00`,
      estimated_duration: type === 'installation' ? 120 : type === 'repair' ? 60 : 45,
      notes: undefined,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: status === 'completed' ? new Date(scheduledTime.getTime() + 2 * 60 * 60 * 1000).toISOString() : undefined,
    })
  }
  return jobs.sort((a, b) => {
    const statusOrder = { pending: 0, assigned: 1, in_progress: 2, completed: 3, cancelled: 4 }
    return statusOrder[a.status] - statusOrder[b.status]
  })
}

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
    <Badge variant={c.variant} className={`capitalize gap-1 ${status === 'completed' ? 'bg-green-500' : status === 'in_progress' ? 'bg-blue-500' : ''}`}>
      {c.icon}
      {status.replace('_', ' ')}
    </Badge>
  )
}

const getPriorityBadge = (priority: JobPriority) => {
  const config: Record<JobPriority, { variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
    low: { variant: "outline", color: "" },
    medium: { variant: "secondary", color: "" },
    high: { variant: "default", color: "bg-orange-500" },
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
    installation: { icon: <Plus className="h-3 w-3" />, color: "bg-green-100 text-green-700" },
    repair: { icon: <Wrench className="h-3 w-3" />, color: "bg-red-100 text-red-700" },
    maintenance: { icon: <ClipboardList className="h-3 w-3" />, color: "bg-blue-100 text-blue-700" },
    relocation: { icon: <Navigation className="h-3 w-3" />, color: "bg-purple-100 text-purple-700" },
    survey: { icon: <MapPin className="h-3 w-3" />, color: "bg-yellow-100 text-yellow-700" },
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
  const [technicians] = useState(generateMockTechnicians())
  const [jobs, setJobs] = useState<DispatchJob[]>(generateMockJobs())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("jobs")
  const [selectedJob, setSelectedJob] = useState<DispatchJob | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [jobToAssign, setJobToAssign] = useState<DispatchJob | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Create job form state
  const [jobForm, setJobForm] = useState({
    customer: "",
    job_type: "installation" as JobType,
    priority: "medium" as JobPriority,
    scheduled_date: "",
    scheduled_time: "09:00",
    description: "",
    notes: "",
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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleViewDetails = (job: DispatchJob) => {
    setSelectedJob(job)
    setIsDetailOpen(true)
  }

  const handleAssignJob = () => {
    if (jobToAssign && selectedTechnician) {
      console.log("Assigning job:", jobToAssign.id, "to technician:", selectedTechnician)
      setIsAssignDialogOpen(false)
      setJobToAssign(null)
      setSelectedTechnician("")
    }
  }

  const handleCreateJob = () => {
    console.log("Creating job:", jobForm)
    setIsCreateJobOpen(false)
    setJobForm({
      customer: "",
      job_type: "installation",
      priority: "medium",
      scheduled_date: "",
      scheduled_time: "09:00",
      description: "",
      notes: "",
    })
  }

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
          <Button onClick={() => setIsCreateJobOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently being worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
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
                            <DropdownMenuItem>
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
                              <DropdownMenuItem>
                                <Play className="mr-2 h-4 w-4" />
                                Start Job
                              </DropdownMenuItem>
                            )}
                            {job.status === 'in_progress' && (
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Complete Job
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
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
              <CardTitle>Technicians</CardTitle>
              <CardDescription>Field technician roster and availability</CardDescription>
            </CardHeader>
            <CardContent>
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
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{tech.name}</h3>
                            <Badge
                              variant={tech.status === 'available' ? 'default' : tech.status === 'on_job' ? 'secondary' : 'outline'}
                              className={tech.status === 'available' ? 'bg-green-500' : ''}
                            >
                              {tech.status.replace('_', ' ')}
                            </Badge>
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
                              <Target className="h-4 w-4 text-blue-500" />
                              {tech.active_jobs} active
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {tech.completed_today} today
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Scheduled jobs for {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs
                  .filter(j => j.status !== 'completed' && j.status !== 'cancelled')
                  .slice(0, 10)
                  .map((job) => (
                    <div key={job.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold">{job.scheduled_time}</p>
                        <p className="text-xs text-muted-foreground">
                          ~{job.estimated_duration} min
                        </p>
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
                          {job.customer_address}
                        </p>
                      </div>
                      <div className="text-right">
                        {job.technician_name ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {job.technician_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{job.technician_name}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            Unassigned
                          </Badge>
                        )}
                        <div className="mt-2">
                          {getStatusBadge(job.status)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
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
                    <Button className="flex-1">
                      <Play className="mr-2 h-4 w-4" />
                      Start Job
                    </Button>
                  )}
                  {selectedJob.status === 'in_progress' && (
                    <Button className="flex-1" variant="default">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Job
                    </Button>
                  )}
                  <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact
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
                  .filter(t => t.status !== 'off_duty')
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

      {/* Create Job Dialog */}
      <Dialog open={isCreateJobOpen} onOpenChange={setIsCreateJobOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Dispatch Job</DialogTitle>
            <DialogDescription>
              Create a new job for technician dispatch
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
                  <SelectItem value="1001">John Doe - 123 Main St</SelectItem>
                  <SelectItem value="1002">Jane Smith - 456 Oak Ave</SelectItem>
                  <SelectItem value="1003">Bob Wilson - 789 Pine Rd</SelectItem>
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
            <Button variant="outline" onClick={() => setIsCreateJobOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateJob}>
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
