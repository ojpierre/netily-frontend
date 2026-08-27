"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Settings,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  Activity,
  Server,
  Wifi,
  Users,
  CreditCard,
  Zap,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Play,
  Pause,
  Volume2,
  VolumeX,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { adminApi } from "@/lib/admin-api"
import type { Alert as BackendAlert, AlertRule as BackendAlertRule } from "@/lib/types"

// Types — local display models mapped from backend
interface Alert {
  id: string
  title: string
  message: string
  severity: "critical" | "warning" | "info"
  category: string
  source: string
  status: "active" | "acknowledged" | "resolved"
  createdAt: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  resolvedAt?: string
  resolvedBy?: string
}

interface AlertRule {
  id: string
  name: string
  description: string
  category: string
  condition: string
  threshold?: number
  thresholdUnit?: string
  severity: "critical" | "warning" | "info"
  enabled: boolean
  channels: string[]
  recipients: string[]
  cooldownMinutes: number
  lastTriggered?: string
  triggerCount: number
}

/** Map backend Alert to local display model */
const mapAlert = (a: BackendAlert): Alert => ({
  id: String(a.id),
  title: a.title,
  message: a.message,
  severity: a.severity === "error" ? "critical" : a.severity as Alert["severity"],
  category: a.source || "system",
  source: a.related_object_type || a.source || "system",
  status: a.status,
  createdAt: a.created_at,
  acknowledgedAt: a.acknowledged_at,
  acknowledgedBy: a.acknowledged_by?.username,
  resolvedAt: a.resolved_at,
})

/** Map backend AlertRule to local display model */
const mapRule = (r: BackendAlertRule): AlertRule => ({
  id: String(r.id),
  name: r.name,
  description: r.description || "",
  category: r.condition_type,
  condition: JSON.stringify(r.condition_value),
  severity: r.severity === "error" ? "critical" : r.severity as AlertRule["severity"],
  enabled: r.is_active,
  channels: r.notification_channels || [],
  recipients: [],
  cooldownMinutes: 0,
  triggerCount: 0,
})



// Helpers
const formatTimeAgo = (dateString: string): string => {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "Just now"
}

export default function AlertsPage() {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [rules, setRules] = useState<AlertRule[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [alertsRes, rulesRes] = await Promise.allSettled([
        adminApi.getAlerts({ page_size: "100" }),
        adminApi.getAlertRules(),
      ])
      if (alertsRes.status === "fulfilled") {
        setAlerts((alertsRes.value.results || []).map(mapAlert))
      }
      if (rulesRes.status === "fulfilled") {
        setRules((Array.isArray(rulesRes.value) ? rulesRes.value : []).map(mapRule))
      }
    } catch (err) {
      console.error("Failed to load alerts:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [createRuleDialogOpen, setCreateRuleDialogOpen] = useState(false)
  const [editRuleDialogOpen, setEditRuleDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null)

  // Stats
  const stats = useMemo(() => {
    const active = alerts.filter(a => a.status === "active").length
    const critical = alerts.filter(a => a.severity === "critical" && a.status === "active").length
    const warning = alerts.filter(a => a.severity === "warning" && a.status === "active").length
    const acknowledged = alerts.filter(a => a.status === "acknowledged").length
    const enabledRules = rules.filter(r => r.enabled).length
    
    return { active, critical, warning, acknowledged, totalRules: rules.length, enabledRules }
  }, [alerts, rules])

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch = 
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.source.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter
      const matchesCategory = categoryFilter === "all" || alert.category === categoryFilter
      const matchesStatus = statusFilter === "all" || alert.status === statusFilter
      
      return matchesSearch && matchesSeverity && matchesCategory && matchesStatus
    })
  }, [alerts, searchQuery, severityFilter, categoryFilter, statusFilter])

  const getSeverityIcon = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical": return <AlertCircle className="w-4 h-4 text-destructive" />
      case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />
      case "info": return <Info className="w-4 h-4 text-primary" />
    }
  }

  const getSeverityBadge = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive">Critical</Badge>
      case "warning": return <Badge className="bg-warning/10 text-warning border-warning/20">Warning</Badge>
      case "info": return <Badge className="bg-primary/10 text-primary border-primary/20">Info</Badge>
    }
  }

  const getStatusBadge = (status: Alert["status"]) => {
    switch (status) {
      case "active": return <Badge variant="destructive"><Bell className="w-3 h-3 mr-1" /> Active</Badge>
      case "acknowledged": return <Badge className="bg-warning/10 text-warning border-warning/20"><Eye className="w-3 h-3 mr-1" /> Acknowledged</Badge>
      case "resolved": return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>
    }
  }

  const getCategoryIcon = (category: Alert["category"]) => {
    switch (category) {
      case "network": return <Wifi className="w-4 h-4" />
      case "billing": return <CreditCard className="w-4 h-4" />
      case "system": return <Server className="w-4 h-4" />
      case "customer": return <Users className="w-4 h-4" />
      case "security": return <Zap className="w-4 h-4" />
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="w-4 h-4" />
      case "sms": return <MessageSquare className="w-4 h-4" />
      case "push": return <Smartphone className="w-4 h-4" />
      case "inapp": return <Bell className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(a => 
      a.id === alertId 
        ? { ...a, status: "acknowledged", acknowledgedAt: new Date().toISOString(), acknowledgedBy: "Admin" }
        : a
    ))
  }

  const resolveAlert = (alertId: string) => {
    setAlerts(alerts.map(a => 
      a.id === alertId 
        ? { ...a, status: "resolved", resolvedAt: new Date().toISOString(), resolvedBy: "Admin" }
        : a
    ))
  }

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ))
  }

  const openAlertDetail = (alert: Alert) => {
    setSelectedAlert(alert)
    setDetailSheetOpen(true)
  }

  const openEditRule = (rule: AlertRule) => {
    setSelectedRule(rule)
    setEditRuleDialogOpen(true)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
          <p className="text-muted-foreground">Monitor system alerts and configure notification rules</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setCreateRuleDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.warning}</div>
            <p className="text-xs text-muted-foreground">Review recommended</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.acknowledged}</div>
            <p className="text-xs text-muted-foreground">Being investigated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.enabledRules}</div>
            <p className="text-xs text-muted-foreground">of {stats.totalRules} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">
            Alerts
            {stats.active > 0 && (
              <Badge variant="destructive" className="ml-2">{stats.active}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Alerts - Critical First */}
          {filteredAlerts.filter(a => a.status === "active" && a.severity === "critical").length > 0 && (
            <Card className="border-destructive/20 bg-destructive/10/50 dark:bg-red-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredAlerts.filter(a => a.status === "active" && a.severity === "critical").map((alert) => (
                  <div 
                    key={alert.id} 
                    className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:border-destructive/30"
                    onClick={() => openAlertDetail(alert)}
                  >
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(alert.category)}
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-muted-foreground">{alert.message}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{formatTimeAgo(alert.createdAt)}</span>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); acknowledgeAlert(alert.id) }}>
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Alerts Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id} className="cursor-pointer" onClick={() => openAlertDetail(alert)}>
                      <TableCell>{getSeverityIcon(alert.severity)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{alert.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 capitalize">
                          {getCategoryIcon(alert.category)}
                          {alert.category}
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                      <TableCell>{getStatusBadge(alert.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTimeAgo(alert.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openAlertDetail(alert)}>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {alert.status === "active" && (
                              <DropdownMenuItem onClick={() => acknowledgeAlert(alert.id)}>
                                <Eye className="w-4 h-4 mr-2" /> Acknowledge
                              </DropdownMenuItem>
                            )}
                            {alert.status !== "resolved" && (
                              <DropdownMenuItem onClick={() => resolveAlert(alert.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" /> Resolve
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <EyeOff className="w-4 h-4 mr-2" /> Mute Similar
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

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>Configure when and how alerts are triggered</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Triggers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">{rule.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 capitalize">
                          {getCategoryIcon(rule.category)}
                          {rule.category}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {rule.condition}
                          {rule.threshold && ` ${rule.threshold}${rule.thresholdUnit}`}
                        </code>
                      </TableCell>
                      <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {rule.channels.map(channel => (
                            <div key={channel} className="w-6 h-6 rounded bg-muted flex items-center justify-center" title={channel}>
                              {getChannelIcon(channel)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{rule.triggerCount} total</div>
                          {rule.lastTriggered && (
                            <div className="text-muted-foreground">Last: {formatTimeAgo(rule.lastTriggered)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditRule(rule)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Play className="w-4 h-4 mr-2" /> Test Rule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
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

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email
                  </CardTitle>
                  <Switch defaultChecked />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SMTP Server</span>
                  <span>smtp.company.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From Address</span>
                  <span>alerts@netily.com</span>
                </div>
                <Separator className="my-2" />
                <Button variant="outline" size="sm" className="w-full">Configure</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    SMS
                  </CardTitle>
                  <Switch defaultChecked />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span>Africa's Talking</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sender ID</span>
                  <span>NETILY</span>
                </div>
                <Separator className="my-2" />
                <Button variant="outline" size="sm" className="w-full">Configure</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Push Notifications
                  </CardTitle>
                  <Switch defaultChecked />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span>Firebase FCM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-success/10 text-success border-success/20">Connected</Badge>
                </div>
                <Separator className="my-2" />
                <Button variant="outline" size="sm" className="w-full">Configure</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Webhook
                  </CardTitle>
                  <Switch />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endpoint</span>
                  <span className="text-muted-foreground">Not configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline">Disabled</Badge>
                </div>
                <Separator className="my-2" />
                <Button variant="outline" size="sm" className="w-full">Configure</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>Historical log of all alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Acknowledged</TableHead>
                    <TableHead>Resolved</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.filter(a => a.status === "resolved").map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground">{alert.source}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {alert.acknowledgedAt ? (
                          <div>
                            <div>{new Date(alert.acknowledgedAt).toLocaleString()}</div>
                            <div className="text-xs">by {alert.acknowledgedBy}</div>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {alert.resolvedAt ? (
                          <div>
                            <div>{new Date(alert.resolvedAt).toLocaleString()}</div>
                            <div className="text-xs">by {alert.resolvedBy}</div>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {alert.resolvedAt && (
                          <span>
                            {Math.round((new Date(alert.resolvedAt).getTime() - new Date(alert.createdAt).getTime()) / 60000)}m
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Alert Details</SheetTitle>
            <SheetDescription>{selectedAlert?.title}</SheetDescription>
          </SheetHeader>
          {selectedAlert && (
            <ScrollArea className="h-[calc(100vh-120px)] pr-4">
              <div className="space-y-6 py-4">
                {/* Status Card */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(selectedAlert.severity)}
                        <div>
                          <div className="font-semibold">{selectedAlert.title}</div>
                          <div className="text-sm text-muted-foreground">{selectedAlert.source}</div>
                        </div>
                      </div>
                      {getStatusBadge(selectedAlert.status)}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                {selectedAlert.status !== "resolved" && (
                  <div className="flex gap-2">
                    {selectedAlert.status === "active" && (
                      <Button className="flex-1" variant="outline" onClick={() => acknowledgeAlert(selectedAlert.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Acknowledge
                      </Button>
                    )}
                    <Button className="flex-1" onClick={() => resolveAlert(selectedAlert.id)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolve
                    </Button>
                  </div>
                )}

                {/* Message */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Message</h4>
                  <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
                </div>

                <Separator />

                {/* Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Severity</div>
                      <div className="mt-1">{getSeverityBadge(selectedAlert.severity)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Category</div>
                      <div className="font-medium capitalize mt-1">{selectedAlert.category}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Source</div>
                      <div className="font-medium mt-1">{selectedAlert.source}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Created</div>
                      <div className="font-medium mt-1">{new Date(selectedAlert.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {selectedAlert.acknowledgedAt && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-semibold">Acknowledgment</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Acknowledged By</div>
                          <div className="font-medium mt-1">{selectedAlert.acknowledgedBy}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Acknowledged At</div>
                          <div className="font-medium mt-1">{new Date(selectedAlert.acknowledgedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {selectedAlert.resolvedAt && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-semibold">Resolution</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Resolved By</div>
                          <div className="font-medium mt-1">{selectedAlert.resolvedBy}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Resolved At</div>
                          <div className="font-medium mt-1">{new Date(selectedAlert.resolvedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Add Note */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Add Note</h4>
                  <Textarea placeholder="Add a note about this alert..." />
                  <Button size="sm">Save Note</Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Rule Dialog */}
      <Dialog open={createRuleDialogOpen} onOpenChange={setCreateRuleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Alert Rule</DialogTitle>
            <DialogDescription>Configure a new alert rule</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input placeholder="e.g., High CPU Usage" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe when this alert should trigger" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select defaultValue="network">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select defaultValue="warning">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Threshold Value</Label>
                <Input type="number" placeholder="90" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input placeholder="%" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notification Channels</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="email" defaultChecked />
                  <Label htmlFor="email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="sms" />
                  <Label htmlFor="sms">SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="push" />
                  <Label htmlFor="push">Push</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="inapp" defaultChecked />
                  <Label htmlFor="inapp">In-App</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cooldown (minutes)</Label>
              <Input type="number" defaultValue="30" />
              <p className="text-xs text-muted-foreground">Minimum time between repeated alerts</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setCreateRuleDialogOpen(false)}>Create Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={editRuleDialogOpen} onOpenChange={setEditRuleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Alert Rule</DialogTitle>
            <DialogDescription>{selectedRule?.name}</DialogDescription>
          </DialogHeader>
          {selectedRule && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input defaultValue={selectedRule.name} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea defaultValue={selectedRule.description} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select defaultValue={selectedRule.category}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select defaultValue={selectedRule.severity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedRule.threshold && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Threshold Value</Label>
                    <Input type="number" defaultValue={selectedRule.threshold} />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input defaultValue={selectedRule.thresholdUnit} />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Cooldown (minutes)</Label>
                <Input type="number" defaultValue={selectedRule.cooldownMinutes} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="enabled" defaultChecked={selectedRule.enabled} />
                <Label htmlFor="enabled">Rule Enabled</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setEditRuleDialogOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
