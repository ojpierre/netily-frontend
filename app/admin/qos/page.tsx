"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowUpDown,
  Plus,
  Search,
  Filter,
  Gauge,
  Layers,
  Globe,
  Download,
  Upload,
  Settings,
  Activity,
  BarChart3,
  Zap,
  Shield,
  Clock,
  Users,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Network,
  Timer,
  Target,
  TrendingUp,
  Ban,
  Server,
  Smartphone,
  Video,
  Gamepad2,
  MessageSquare,
  Music,
  FileDown,
} from "lucide-react"

// Types
interface QoSPolicy {
  id: string
  name: string
  description: string
  priority: number
  status: "active" | "disabled" | "scheduled"
  type: "plan" | "custom" | "global"
  appliedTo: string[]
  rules: QoSRule[]
  createdAt: string
  updatedAt: string
  usageCount: number
}

interface QoSRule {
  id: string
  name: string
  category: "bandwidth" | "priority" | "limit" | "block" | "shape"
  direction: "download" | "upload" | "both"
  condition: RuleCondition
  action: RuleAction
  enabled: boolean
}

interface RuleCondition {
  type: "application" | "protocol" | "port" | "domain" | "time" | "usage"
  value: string
  operator?: "equals" | "contains" | "greater" | "less"
}

interface RuleAction {
  type: "limit" | "prioritize" | "block" | "shape" | "burst"
  value?: number
  unit?: "Mbps" | "Kbps" | "%" | "priority"
  burstSize?: number
  burstTime?: number
}

interface TrafficClass {
  id: string
  name: string
  description: string
  priority: 1 | 2 | 3 | 4 | 5
  dscp: number
  guaranteedBandwidth: number
  maxBandwidth: number
  borrowEnabled: boolean
  applications: string[]
  color: string
}

interface ApplicationProfile {
  id: string
  name: string
  category: "streaming" | "gaming" | "social" | "voip" | "download" | "business" | "other"
  icon: string
  defaultPriority: number
  ports: string[]
  protocols: string[]
  domains: string[]
  detected: number
  blocked: boolean
}

interface BandwidthSchedule {
  id: string
  name: string
  policyId: string
  dayOfWeek: number[]
  startTime: string
  endTime: string
  downloadLimit: number
  uploadLimit: number
  active: boolean
}

// TODO: Connect to QoS API when available

function getAppIcon(category: string) {
  switch (category) {
    case "streaming":
      return <Video className="h-4 w-4" />
    case "gaming":
      return <Gamepad2 className="h-4 w-4" />
    case "voip":
      return <MessageSquare className="h-4 w-4" />
    case "social":
      return <Smartphone className="h-4 w-4" />
    case "download":
      return <FileDown className="h-4 w-4" />
    default:
      return <Globe className="h-4 w-4" />
  }
}

function getDayName(day: number): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return days[day]
}

export default function QoSPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("policies")
  const [selectedPolicy, setSelectedPolicy] = useState<QoSPolicy | null>(null)
  const [selectedClass, setSelectedClass] = useState<TrafficClass | null>(null)
  const [showPolicySheet, setShowPolicySheet] = useState(false)
  const [showClassSheet, setShowClassSheet] = useState(false)
  const [showCreatePolicy, setShowCreatePolicy] = useState(false)
  const [showCreateRule, setShowCreateRule] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  // TODO: Fetch from QoS API when available
  const [policies] = useState<QoSPolicy[]>([])
  const [trafficClasses] = useState<TrafficClass[]>([])
  const [applications] = useState<ApplicationProfile[]>([])
  const [schedules] = useState<BandwidthSchedule[]>([])

  // Stats calculations
  const stats = useMemo(() => {
    const activePolicies = policies.filter((p) => p.status === "active").length
    const totalRules = policies.reduce((sum, p) => sum + p.rules.length, 0)
    const blockedApps = applications.filter((a) => a.blocked).length
    const activeSchedules = schedules.filter((s) => s.active).length

    return { activePolicies, totalRules, blockedApps, activeSchedules }
  }, [policies, applications, schedules])

  // Filtered policies
  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const matchesSearch =
        policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || policy.status === statusFilter
      const matchesType = typeFilter === "all" || policy.type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [policies, searchQuery, statusFilter, typeFilter])

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === "all" || app.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [applications, searchQuery, categoryFilter])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">QoS & Traffic Shaping</h2>
          <p className="text-muted-foreground">
            Manage quality of service policies, traffic prioritization, and bandwidth control
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Policies
          </Button>
          <Dialog open={showCreatePolicy} onOpenChange={setShowCreatePolicy}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create QoS Policy</DialogTitle>
                <DialogDescription>
                  Define a new quality of service policy with rules and conditions
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="policy-name">Policy Name</Label>
                    <Input id="policy-name" placeholder="e.g., Gaming Priority" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policy-type">Policy Type</Label>
                    <Select defaultValue="plan">
                      <SelectTrigger id="policy-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plan">Plan-Based</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="global">Global</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policy-desc">Description</Label>
                  <Textarea
                    id="policy-desc"
                    placeholder="Describe what this policy does..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="policy-priority">Priority (1-5)</Label>
                    <Select defaultValue="3">
                      <SelectTrigger id="policy-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Highest</SelectItem>
                        <SelectItem value="2">2 - High</SelectItem>
                        <SelectItem value="3">3 - Normal</SelectItem>
                        <SelectItem value="4">4 - Low</SelectItem>
                        <SelectItem value="5">5 - Lowest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apply-to">Apply To</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="apply-to">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="premium">Premium Plans</SelectItem>
                        <SelectItem value="standard">Standard Plans</SelectItem>
                        <SelectItem value="business">Business Plans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Rules</Label>
                    <Button size="sm" variant="outline">
                      <Plus className="mr-1 h-3 w-3" />
                      Add Rule
                    </Button>
                  </div>
                  <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
                    No rules added yet. Click "Add Rule" to create traffic rules.
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreatePolicy(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreatePolicy(false)}>Create Policy</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePolicies}</div>
            <p className="text-xs text-muted-foreground">
              {policies.length} total policies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traffic Rules</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRules}</div>
            <p className="text-xs text-muted-foreground">
              Active filtering rules
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.blockedApps} blocked
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schedules</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSchedules}</div>
            <p className="text-xs text-muted-foreground">
              Active time-based rules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">
            <Shield className="mr-2 h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="classes">
            <Layers className="mr-2 h-4 w-4" />
            Traffic Classes
          </TabsTrigger>
          <TabsTrigger value="applications">
            <Globe className="mr-2 h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Clock className="mr-2 h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="mr-2 h-4 w-4" />
            Live Monitoring
          </TabsTrigger>
        </TabsList>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="plan">Plan-Based</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredPolicies.map((policy) => (
              <Card
                key={policy.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedPolicy(policy)
                  setShowPolicySheet(true)
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{policy.name}</CardTitle>
                    <Badge
                      variant={
                        policy.status === "active"
                          ? "default"
                          : policy.status === "disabled"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {policy.status}
                    </Badge>
                  </div>
                  <CardDescription>{policy.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Priority</span>
                    <Badge variant="outline">Level {policy.priority}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize">{policy.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rules</span>
                    <span>{policy.rules.length} rules</span>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-1">
                    {policy.appliedTo.map((plan, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {plan}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <span>Applied to {policy.usageCount} customers</span>
                    <span>Updated {policy.updatedAt}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Traffic Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Traffic Classes</CardTitle>
                  <CardDescription>
                    Configure priority queues and bandwidth allocation per traffic class
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Class
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trafficClasses.map((tc) => (
                  <Card
                    key={tc.id}
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => {
                      setSelectedClass(tc)
                      setShowClassSheet(true)
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-3 h-16 rounded ${tc.color}`} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{tc.name}</h4>
                              <Badge variant="outline">Priority {tc.priority}</Badge>
                              <Badge variant="secondary">DSCP {tc.dscp}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={tc.borrowEnabled} />
                              <span className="text-sm text-muted-foreground">
                                Borrow
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {tc.description}
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Guaranteed</span>
                                <span className="font-medium">
                                  {tc.guaranteedBandwidth}%
                                </span>
                              </div>
                              <Progress value={tc.guaranteedBandwidth} className="h-2" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Maximum</span>
                                <span className="font-medium">{tc.maxBandwidth}%</span>
                              </div>
                              <Progress value={tc.maxBandwidth} className="h-2" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {tc.applications.map((app, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {app}
                              </Badge>
                            ))}
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

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="streaming">Streaming</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="voip">VoIP</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="download">Downloads</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Application Profiles</CardTitle>
              <CardDescription>
                Manage application detection and traffic classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Ports/Protocols</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAppIcon(app.category)}
                          <span className="font-medium">{app.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {app.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            app.defaultPriority === 1
                              ? "default"
                              : app.defaultPriority === 2
                              ? "secondary"
                              : "outline"
                          }
                        >
                          P{app.defaultPriority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1">
                          <div>{app.ports.slice(0, 2).join(", ")}</div>
                          <div className="text-muted-foreground text-xs">
                            {app.protocols.join(", ")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{app.detected.toLocaleString()}</TableCell>
                      <TableCell>
                        {app.blocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Badge variant="secondary">Allowed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            {app.blocked ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <Ban className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bandwidth Schedules</CardTitle>
                  <CardDescription>
                    Time-based bandwidth adjustments and traffic shaping rules
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schedule Name</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Time Range</TableHead>
                    <TableHead>Download</TableHead>
                    <TableHead>Upload</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => {
                    const policy = policies.find(
                      (p) => p.id === schedule.policyId
                    )
                    return (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">
                          {schedule.name}
                        </TableCell>
                        <TableCell>{policy?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {schedule.dayOfWeek.map((day) => (
                              <Badge key={day} variant="outline" className="text-xs">
                                {getDayName(day)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ArrowDownToLine className="h-3 w-3 text-primary" />
                            {schedule.downloadLimit}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ArrowUpFromLine className="h-3 w-3 text-success" />
                            {schedule.uploadLimit}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch checked={schedule.active} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Throughput
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine className="h-4 w-4 text-primary" />
                      <span>Download</span>
                    </div>
                    <span className="font-bold">2.4 Gbps</span>
                  </div>
                  <Progress value={48} className="h-2" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowUpFromLine className="h-4 w-4 text-success" />
                      <span>Upload</span>
                    </div>
                    <span className="font-bold">890 Mbps</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12,456</div>
                <p className="text-xs text-muted-foreground">
                  +234 in last 5 minutes
                </p>
                <Separator className="my-3" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>TCP</span>
                    <span>10,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UDP</span>
                    <span>2,122</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ICMP</span>
                    <span>100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">QoS Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Shaped</span>
                    <Badge variant="secondary">1,234</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Prioritized</span>
                    <Badge variant="default">3,567</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Limited</span>
                    <Badge variant="outline">892</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Blocked</span>
                    <Badge variant="destructive">45</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Traffic Distribution by Class</CardTitle>
              <CardDescription>
                Real-time bandwidth usage per traffic class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trafficClasses.map((tc) => {
                  const usage = Math.floor(Math.random() * 60) + 20
                  return (
                    <div key={tc.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${tc.color}`} />
                          <span className="font-medium">{tc.name}</span>
                          <Badge variant="outline" className="text-xs">
                            P{tc.priority}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <span className="font-bold">
                            {(usage * 25).toLocaleString()} Mbps
                          </span>
                          <span className="text-muted-foreground ml-2">
                            ({usage}% of allocated)
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={usage} className="h-3" />
                        <div
                          className="absolute top-0 h-3 border-r-2 border-dashed border-gray-400"
                          style={{ left: `${tc.guaranteedBandwidth}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Applications</CardTitle>
                <CardDescription>By bandwidth consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app, idx) => {
                    const usage = 100 - idx * 18
                    return (
                      <div key={app.id} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                          {getAppIcon(app.category)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{app.name}</span>
                            <span className="text-sm">
                              {Math.floor(usage * 5)} Mbps
                            </span>
                          </div>
                          <Progress value={usage} className="h-1.5" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent QoS Events</CardTitle>
                <CardDescription>Policy enforcement activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3">
                    {[
                      {
                        time: "12:34:56",
                        action: "Throttled",
                        target: "192.168.1.45",
                        reason: "P2P limit exceeded",
                      },
                      {
                        time: "12:34:12",
                        action: "Prioritized",
                        target: "192.168.1.23",
                        reason: "VoIP call detected",
                      },
                      {
                        time: "12:33:45",
                        action: "Shaped",
                        target: "192.168.1.67",
                        reason: "Peak hours policy",
                      },
                      {
                        time: "12:33:21",
                        action: "Blocked",
                        target: "192.168.1.89",
                        reason: "Blocked application",
                      },
                      {
                        time: "12:32:56",
                        action: "Burst",
                        target: "192.168.1.12",
                        reason: "Burst allowance used",
                      },
                    ].map((event, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              event.action === "Blocked"
                                ? "destructive"
                                : event.action === "Prioritized"
                                ? "default"
                                : "secondary"
                            }
                            className="w-20 justify-center"
                          >
                            {event.action}
                          </Badge>
                          <div>
                            <div className="font-mono text-sm">{event.target}</div>
                            <div className="text-xs text-muted-foreground">
                              {event.reason}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {event.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Policy Detail Sheet */}
      <Sheet open={showPolicySheet} onOpenChange={setShowPolicySheet}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedPolicy?.name}
              <Badge
                variant={
                  selectedPolicy?.status === "active"
                    ? "default"
                    : selectedPolicy?.status === "disabled"
                    ? "secondary"
                    : "outline"
                }
              >
                {selectedPolicy?.status}
              </Badge>
            </SheetTitle>
            <SheetDescription>{selectedPolicy?.description}</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-180px)] mt-4">
            <div className="space-y-6 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Priority</Label>
                  <div className="font-medium">Level {selectedPolicy?.priority}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="font-medium capitalize">
                    {selectedPolicy?.type}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Created</Label>
                  <div className="font-medium">{selectedPolicy?.createdAt}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Usage</Label>
                  <div className="font-medium">
                    {selectedPolicy?.usageCount} customers
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Applied To</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedPolicy?.appliedTo.map((plan, idx) => (
                    <Badge key={idx} variant="secondary">
                      {plan}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Rules ({selectedPolicy?.rules.length})</Label>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Rule
                  </Button>
                </div>
                {selectedPolicy?.rules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{rule.name}</h4>
                            <Badge variant="outline" className="capitalize">
                              {rule.category}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {rule.condition.type}: {rule.condition.value}
                          </div>
                          <div className="text-sm">
                            Action:{" "}
                            <span className="font-medium capitalize">
                              {rule.action.type}
                            </span>
                            {rule.action.value && (
                              <span>
                                {" "}
                                - {rule.action.value}
                                {rule.action.unit}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={rule.enabled} />
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button className="flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Policy
                </Button>
                <Button variant="outline">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Traffic Class Detail Sheet */}
      <Sheet open={showClassSheet} onOpenChange={setShowClassSheet}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${selectedClass?.color}`} />
              {selectedClass?.name}
            </SheetTitle>
            <SheetDescription>{selectedClass?.description}</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-180px)] mt-4">
            <div className="space-y-6 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Priority</Label>
                  <div className="font-medium">Level {selectedClass?.priority}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">DSCP Value</Label>
                  <div className="font-medium">{selectedClass?.dscp}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Guaranteed Bandwidth</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[selectedClass?.guaranteedBandwidth || 0]}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="font-medium w-12 text-right">
                      {selectedClass?.guaranteedBandwidth}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Maximum Bandwidth</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[selectedClass?.maxBandwidth || 0]}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="font-medium w-12 text-right">
                      {selectedClass?.maxBandwidth}%
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bandwidth Borrowing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow borrowing unused bandwidth from other classes
                  </p>
                </div>
                <Switch checked={selectedClass?.borrowEnabled} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Applications</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedClass?.applications.map((app, idx) => (
                    <Badge key={idx} variant="secondary">
                      {app}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button className="flex-1">Save Changes</Button>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
