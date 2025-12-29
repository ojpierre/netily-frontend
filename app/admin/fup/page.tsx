"use client"

import React, { useState, useMemo } from "react"
import {
  Gauge,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Shield,
  Activity,
  Zap,
  Timer,
  ArrowDown,
  ArrowUp,
  Eye,
  Settings,
  BarChart3,
  Calendar,
  Download,
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
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"

type FUPStatus = "active" | "inactive" | "draft"
type ThrottleAction = "reduce_speed" | "disconnect" | "notify" | "upgrade_prompt"

interface FUPPolicy {
  id: string
  name: string
  description: string
  status: FUPStatus
  dataLimit: number // in GB
  dataLimitType: "daily" | "weekly" | "monthly"
  thresholdPercentage: number
  throttleSpeed: number // in Mbps
  throttleAction: ThrottleAction
  appliedPlans: string[]
  usersAffected: number
  createdAt: string
  updatedAt: string
}

interface FUPViolation {
  id: string
  userId: string
  username: string
  policyId: string
  policyName: string
  dataUsed: number // in GB
  dataLimit: number // in GB
  usagePercentage: number
  action: ThrottleAction
  status: "throttled" | "warned" | "resolved" | "pending"
  occurredAt: string
  resolvedAt: string | null
}

// Mock data
const mockPolicies: FUPPolicy[] = [
  {
    id: "1",
    name: "Basic FUP",
    description: "Standard fair usage policy for basic plans",
    status: "active",
    dataLimit: 100,
    dataLimitType: "monthly",
    thresholdPercentage: 80,
    throttleSpeed: 2,
    throttleAction: "reduce_speed",
    appliedPlans: ["Basic 10Mbps", "Basic 20Mbps"],
    usersAffected: 450,
    createdAt: "2023-06-01",
    updatedAt: "2024-01-10",
  },
  {
    id: "2",
    name: "Premium FUP",
    description: "Higher limits for premium subscribers",
    status: "active",
    dataLimit: 500,
    dataLimitType: "monthly",
    thresholdPercentage: 90,
    throttleSpeed: 10,
    throttleAction: "notify",
    appliedPlans: ["Premium 50Mbps", "Premium 100Mbps"],
    usersAffected: 280,
    createdAt: "2023-06-01",
    updatedAt: "2024-01-08",
  },
  {
    id: "3",
    name: "Daily Limit Policy",
    description: "Daily usage limits for hotspot users",
    status: "active",
    dataLimit: 5,
    dataLimitType: "daily",
    thresholdPercentage: 100,
    throttleSpeed: 0,
    throttleAction: "disconnect",
    appliedPlans: ["Hotspot Daily", "Hotspot Weekly"],
    usersAffected: 1200,
    createdAt: "2023-08-15",
    updatedAt: "2024-01-12",
  },
  {
    id: "4",
    name: "Business Unlimited",
    description: "No throttling for business customers",
    status: "active",
    dataLimit: 0, // unlimited
    dataLimitType: "monthly",
    thresholdPercentage: 0,
    throttleSpeed: 0,
    throttleAction: "notify",
    appliedPlans: ["Business 100Mbps", "Business Fiber"],
    usersAffected: 85,
    createdAt: "2023-09-01",
    updatedAt: "2023-12-20",
  },
  {
    id: "5",
    name: "Night Owl Special",
    description: "Reduced limits during peak hours only",
    status: "inactive",
    dataLimit: 50,
    dataLimitType: "daily",
    thresholdPercentage: 70,
    throttleSpeed: 5,
    throttleAction: "reduce_speed",
    appliedPlans: [],
    usersAffected: 0,
    createdAt: "2023-11-01",
    updatedAt: "2023-11-01",
  },
]

const mockViolations: FUPViolation[] = [
  {
    id: "1",
    userId: "user-001",
    username: "john.doe",
    policyId: "1",
    policyName: "Basic FUP",
    dataUsed: 95,
    dataLimit: 100,
    usagePercentage: 95,
    action: "reduce_speed",
    status: "throttled",
    occurredAt: "2024-01-15 08:30:00",
    resolvedAt: null,
  },
  {
    id: "2",
    userId: "user-002",
    username: "jane.smith",
    policyId: "3",
    policyName: "Daily Limit Policy",
    dataUsed: 5.2,
    dataLimit: 5,
    usagePercentage: 104,
    action: "disconnect",
    status: "throttled",
    occurredAt: "2024-01-15 14:22:00",
    resolvedAt: null,
  },
  {
    id: "3",
    userId: "user-003",
    username: "mike.johnson",
    policyId: "2",
    policyName: "Premium FUP",
    dataUsed: 480,
    dataLimit: 500,
    usagePercentage: 96,
    action: "notify",
    status: "warned",
    occurredAt: "2024-01-14 16:45:00",
    resolvedAt: null,
  },
  {
    id: "4",
    userId: "user-004",
    username: "sarah.williams",
    policyId: "1",
    policyName: "Basic FUP",
    dataUsed: 100,
    dataLimit: 100,
    usagePercentage: 100,
    action: "reduce_speed",
    status: "resolved",
    occurredAt: "2024-01-10 09:15:00",
    resolvedAt: "2024-01-11 00:00:00",
  },
]

const getStatusBadge = (status: FUPStatus) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-700">Active</Badge>
    case "inactive":
      return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
    case "draft":
      return <Badge className="bg-yellow-100 text-yellow-700">Draft</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getViolationStatusBadge = (status: FUPViolation["status"]) => {
  switch (status) {
    case "throttled":
      return <Badge className="bg-red-100 text-red-700">Throttled</Badge>
    case "warned":
      return <Badge className="bg-yellow-100 text-yellow-700">Warned</Badge>
    case "resolved":
      return <Badge className="bg-green-100 text-green-700">Resolved</Badge>
    case "pending":
      return <Badge className="bg-blue-100 text-blue-700">Pending</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getActionBadge = (action: ThrottleAction) => {
  switch (action) {
    case "reduce_speed":
      return <Badge variant="outline" className="border-orange-200 text-orange-700">Speed Reduced</Badge>
    case "disconnect":
      return <Badge variant="outline" className="border-red-200 text-red-700">Disconnected</Badge>
    case "notify":
      return <Badge variant="outline" className="border-blue-200 text-blue-700">Notified</Badge>
    case "upgrade_prompt":
      return <Badge variant="outline" className="border-purple-200 text-purple-700">Upgrade Prompt</Badge>
    default:
      return <Badge variant="outline">{action}</Badge>
  }
}

export default function FUPPage() {
  const [activeTab, setActiveTab] = useState("policies")
  const [policies, setPolicies] = useState<FUPPolicy[]>(mockPolicies)
  const [violations, setViolations] = useState<FUPViolation[]>(mockViolations)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<FUPPolicy | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Policy form state
  const [policyForm, setPolicyForm] = useState({
    name: "",
    description: "",
    dataLimit: 100,
    dataLimitType: "monthly" as "daily" | "weekly" | "monthly",
    thresholdPercentage: 80,
    throttleSpeed: 2,
    throttleAction: "reduce_speed" as ThrottleAction,
  })

  // Stats
  const stats = useMemo(() => {
    const activePolicies = policies.filter(p => p.status === "active").length
    const activeViolations = violations.filter(v => v.status === "throttled" || v.status === "warned").length
    const totalUsersAffected = policies.reduce((acc, p) => acc + p.usersAffected, 0)
    const throttledUsers = violations.filter(v => v.status === "throttled").length
    
    return {
      activePolicies,
      activeViolations,
      totalUsersAffected,
      throttledUsers,
    }
  }, [policies, violations])

  // Filtered policies
  const filteredPolicies = useMemo(() => {
    return policies.filter(policy => {
      const matchesSearch = policy.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || policy.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [policies, searchQuery, statusFilter])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleToggleStatus = (policy: FUPPolicy) => {
    const newStatus = policy.status === "active" ? "inactive" : "active"
    setPolicies(policies.map(p => 
      p.id === policy.id ? { ...p, status: newStatus } : p
    ))
  }

  const handleResolveViolation = (violationId: string) => {
    setViolations(violations.map(v => 
      v.id === violationId ? { ...v, status: "resolved", resolvedAt: new Date().toISOString() } : v
    ))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fair Usage Policy</h1>
          <p className="text-slate-600 mt-1">Manage bandwidth limits and throttling rules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Policy
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Policies</p>
                <p className="text-2xl font-bold text-green-600">{stats.activePolicies}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Users Under FUP</p>
                <p className="text-2xl font-bold">{stats.totalUsersAffected.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Violations</p>
                <p className="text-2xl font-bold text-orange-600">{stats.activeViolations}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Currently Throttled</p>
                <p className="text-2xl font-bold text-red-600">{stats.throttledUsers}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="violations" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Violations
            {stats.activeViolations > 0 && (
              <Badge variant="destructive" className="ml-1">{stats.activeViolations}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search policies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {filteredPolicies.map((policy) => (
                  <Card key={policy.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Gauge className="w-6 h-6 text-slate-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{policy.name}</h3>
                              {getStatusBadge(policy.status)}
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{policy.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-slate-500">Data Limit:</span>
                                <span className="ml-1 font-medium">
                                  {policy.dataLimit === 0 ? "Unlimited" : `${policy.dataLimit} GB/${policy.dataLimitType}`}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500">Threshold:</span>
                                <span className="ml-1 font-medium">{policy.thresholdPercentage}%</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Throttle Speed:</span>
                                <span className="ml-1 font-medium">
                                  {policy.throttleSpeed === 0 ? "Disconnect" : `${policy.throttleSpeed} Mbps`}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500">Users:</span>
                                <span className="ml-1 font-medium">{policy.usersAffected.toLocaleString()}</span>
                              </div>
                            </div>

                            {policy.appliedPlans.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {policy.appliedPlans.map((plan) => (
                                  <Badge key={plan} variant="secondary" className="text-xs">
                                    {plan}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={policy.status === "active"}
                            onCheckedChange={() => handleToggleStatus(policy)}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Policy
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="w-4 h-4 mr-2" />
                                View Users
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Policy Violations</CardTitle>
                  <CardDescription>Users who have exceeded their FUP limits</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Policy</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Occurred</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violations.map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell>
                          <div className="font-medium">{violation.username}</div>
                        </TableCell>
                        <TableCell>{violation.policyName}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={Math.min(violation.usagePercentage, 100)} 
                                className="w-20 h-2"
                              />
                              <span className="text-sm font-medium">
                                {violation.usagePercentage}%
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {violation.dataUsed.toFixed(1)} / {violation.dataLimit} GB
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(violation.action)}</TableCell>
                        <TableCell>{getViolationStatusBadge(violation.status)}</TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {violation.occurredAt}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View User
                              </DropdownMenuItem>
                              {violation.status !== "resolved" && (
                                <DropdownMenuItem onClick={() => handleResolveViolation(violation.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Resolve
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Zap className="w-4 h-4 mr-2" />
                                Remove Throttle
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Violation Trends</CardTitle>
                <CardDescription>FUP violations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Chart will render with real data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Distribution</CardTitle>
                <CardDescription>Users per policy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {policies.filter(p => p.status === "active").map((policy) => (
                    <div key={policy.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{policy.name}</span>
                        <span className="font-medium">{policy.usersAffected.toLocaleString()} users</span>
                      </div>
                      <Progress 
                        value={(policy.usersAffected / stats.totalUsersAffected) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Top Violators This Month</CardTitle>
                <CardDescription>Users with most FUP violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Violations</TableHead>
                        <TableHead>Avg Excess</TableHead>
                        <TableHead>Current Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">1</TableCell>
                        <TableCell>heavy.user</TableCell>
                        <TableCell>8</TableCell>
                        <TableCell>15%</TableCell>
                        <TableCell>{getViolationStatusBadge("throttled")}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">2</TableCell>
                        <TableCell>streaming.fan</TableCell>
                        <TableCell>5</TableCell>
                        <TableCell>12%</TableCell>
                        <TableCell>{getViolationStatusBadge("warned")}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">3</TableCell>
                        <TableCell>game.lover</TableCell>
                        <TableCell>4</TableCell>
                        <TableCell>8%</TableCell>
                        <TableCell>{getViolationStatusBadge("resolved")}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Global FUP Settings</CardTitle>
                <CardDescription>Default settings for all policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable FUP System</Label>
                    <p className="text-sm text-slate-500">Enforce fair usage policies</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-reset on Renewal</Label>
                    <p className="text-sm text-slate-500">Reset usage counters when plan renews</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Send Threshold Warnings</Label>
                    <p className="text-sm text-slate-500">Notify users before limit</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Warning Threshold</Label>
                  <Select defaultValue="80">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50% usage</SelectItem>
                      <SelectItem value="70">70% usage</SelectItem>
                      <SelectItem value="80">80% usage</SelectItem>
                      <SelectItem value="90">90% usage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>How to notify users about FUP</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-slate-500">Send SMS when limit reached</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-slate-500">Send email on violation</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Portal Warning</Label>
                    <p className="text-sm text-slate-500">Show banner in user portal</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Captive Portal Message</Label>
                    <p className="text-sm text-slate-500">Show message on hotspot login</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Peak Hours Configuration</CardTitle>
                <CardDescription>Define peak hours for stricter FUP enforcement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable Peak Hour Throttling</Label>
                      <Switch />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Peak Start Time</Label>
                        <Input type="time" defaultValue="18:00" />
                      </div>
                      <div className="space-y-2">
                        <Label>Peak End Time</Label>
                        <Input type="time" defaultValue="23:00" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Peak Hour Throttle Modifier</Label>
                      <Select defaultValue="50">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25% of normal speed</SelectItem>
                          <SelectItem value="50">50% of normal speed</SelectItem>
                          <SelectItem value="75">75% of normal speed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Days Active</Label>
                      <div className="flex gap-2 flex-wrap">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                          <Badge
                            key={day}
                            variant={["Sat", "Sun"].includes(day) ? "outline" : "default"}
                            className="cursor-pointer"
                          >
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Policy Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Create FUP Policy</SheetTitle>
            <SheetDescription>
              Define a new fair usage policy
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-200px)] mt-6">
            <div className="space-y-6 pr-4">
              <div className="space-y-2">
                <Label>Policy Name</Label>
                <Input
                  placeholder="e.g., Basic FUP"
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe this policy..."
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                />
              </div>

              <Separator />

              <h3 className="font-semibold text-sm text-slate-500 uppercase">Data Limits</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Limit (GB)</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={policyForm.dataLimit}
                    onChange={(e) => setPolicyForm({ ...policyForm, dataLimit: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-slate-500">Set 0 for unlimited</p>
                </div>
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select
                    value={policyForm.dataLimitType}
                    onValueChange={(value: "daily" | "weekly" | "monthly") => 
                      setPolicyForm({ ...policyForm, dataLimitType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Warning Threshold (%)</Label>
                <Input
                  type="number"
                  placeholder="80"
                  value={policyForm.thresholdPercentage}
                  onChange={(e) => setPolicyForm({ ...policyForm, thresholdPercentage: parseInt(e.target.value) })}
                />
              </div>

              <Separator />

              <h3 className="font-semibold text-sm text-slate-500 uppercase">Throttle Settings</h3>

              <div className="space-y-2">
                <Label>Action When Limit Reached</Label>
                <Select
                  value={policyForm.throttleAction}
                  onValueChange={(value: ThrottleAction) => 
                    setPolicyForm({ ...policyForm, throttleAction: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reduce_speed">Reduce Speed</SelectItem>
                    <SelectItem value="disconnect">Disconnect</SelectItem>
                    <SelectItem value="notify">Notify Only</SelectItem>
                    <SelectItem value="upgrade_prompt">Show Upgrade Prompt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {policyForm.throttleAction === "reduce_speed" && (
                <div className="space-y-2">
                  <Label>Throttle Speed (Mbps)</Label>
                  <Input
                    type="number"
                    placeholder="2"
                    value={policyForm.throttleSpeed}
                    onChange={(e) => setPolicyForm({ ...policyForm, throttleSpeed: parseInt(e.target.value) })}
                  />
                </div>
              )}

              <Separator />

              <h3 className="font-semibold text-sm text-slate-500 uppercase">Apply To</h3>

              <div className="space-y-2">
                <Label>Select Plans</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose plans to apply this policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic-10">Basic 10Mbps</SelectItem>
                    <SelectItem value="basic-20">Basic 20Mbps</SelectItem>
                    <SelectItem value="premium-50">Premium 50Mbps</SelectItem>
                    <SelectItem value="premium-100">Premium 100Mbps</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Policy
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
