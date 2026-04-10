"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import {
  MessageSquare,
  Plus,
  Send,
  Search,
  Filter,
  RefreshCw,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Download,
  Upload,
  Trash2,
  Eye,
  Phone,
  Zap,
  TrendingUp,
  Calendar,
  AlertCircle,
  ChevronRight,
  Copy,
  FileText,
  Settings,
  History,
  Inbox,
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type {
  SMSMessage,
  SMSTemplate,
  SMSCampaign,
  SMSStats,
  SMSBalance,
  SMSGatewayConfig,
  SMSGatewayConfigWrite,
  SMSProvider,
} from "@/lib/types"

type SMSStatus = "pending" | "sent" | "delivered" | "failed"
type MessageType = "single" | "bulk" | "automated" | "campaign"

const emptyStats: SMSStats = {
  total_sent: 0,
  delivered: 0,
  pending: 0,
  failed: 0,
  delivery_rate: 0,
  total_cost: 0,
  messages_today: 0,
  messages_this_week: 0,
}

const getStatusBadge = (status: SMSStatus) => {
  switch (status) {
    case "delivered":
      return <Badge className="bg-green-100 text-green-700">Delivered</Badge>
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
    case "failed":
      return <Badge className="bg-red-100 text-red-700">Failed</Badge>
    case "sent":
      return <Badge className="bg-blue-100 text-blue-700">Sent</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getCampaignStatusBadge = (status: SMSCampaign["status"]) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-700">Completed</Badge>
    case "running":
      return <Badge className="bg-blue-100 text-blue-700">Running</Badge>
    case "scheduled":
      return <Badge className="bg-purple-100 text-purple-700">Scheduled</Badge>
    case "draft":
      return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>
    case "cancelled":
      return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function SMSPage() {
  const [activeTab, setActiveTab] = useState("history")
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [templates, setTemplates] = useState<SMSTemplate[]>([])
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([])
  const [stats, setStats] = useState<SMSStats>(emptyStats)
  const [balance, setBalance] = useState<SMSBalance | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Gateway config state
  const [gatewayConfigs, setGatewayConfigs] = useState<SMSGatewayConfig[]>([])
  const [providerFields, setProviderFields] = useState<Record<string, Record<string, string>>>({})
  const [gwForm, setGwForm] = useState<SMSGatewayConfigWrite>({
    provider: 'africastalking', is_active: true,
    api_key: '', api_secret: '', username: '', sender_id: '',
    extra_config: {},
    auto_payment_confirmation: true, auto_expiry_reminder: true,
    auto_welcome_message: true, auto_service_suspension: false,
  })
  const [gwEditing, setGwEditing] = useState<number | null>(null)
  const [gwSaving, setGwSaving] = useState(false)
  const [gwTesting, setGwTesting] = useState(false)

  // Compose form state
  const [composeForm, setComposeForm] = useState({
    recipients: "",
    message: "",
    template: "",
    scheduleFor: "",
  })

  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
  })

  // Fetch all SMS data
  const fetchSMSData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const [messagesData, templatesData, campaignsData, statsData, balanceData, gatewayData, providerData] = await Promise.all([
        adminApi.getSMSMessages().catch(() => null),
        adminApi.getSMSTemplates().catch(() => null),
        adminApi.getSMSCampaigns().catch(() => null),
        adminApi.getSMSStats().catch(() => null),
        adminApi.getSMSBalance().catch(() => null),
        adminApi.getSMSGatewayConfigs().catch(() => null),
        adminApi.getSMSProviderFields().catch(() => null),
      ])
      
      if (messagesData) {
        const messagesList = Array.isArray(messagesData) ? messagesData : (messagesData.results || [])
        setMessages(messagesList)
      }
      
      if (templatesData) {
        const templatesList = Array.isArray(templatesData) ? templatesData : (templatesData.results || [])
        setTemplates(templatesList)
      }
      
      if (campaignsData) {
        const campaignsList = Array.isArray(campaignsData) ? campaignsData : (campaignsData.results || [])
        setCampaigns(campaignsList)
      }
      
      if (statsData) {
        setStats(statsData)
      }
      
      if (balanceData) {
        setBalance(balanceData)
      }
      
      if (gatewayData) {
        const list = Array.isArray(gatewayData) ? gatewayData : []
        setGatewayConfigs(list)
        // Pre-fill form with active config
        const active = list.find((g: SMSGatewayConfig) => g.is_active)
        if (active) {
          setGwEditing(active.id)
          setGwForm({
            provider: active.provider,
            is_active: active.is_active,
            api_key: '', api_secret: '', // don't fill masked values
            username: active.username,
            sender_id: active.sender_id,
            extra_config: active.extra_config || {},
            auto_payment_confirmation: active.auto_payment_confirmation,
            auto_expiry_reminder: active.auto_expiry_reminder,
            auto_welcome_message: active.auto_welcome_message,
            auto_service_suspension: active.auto_service_suspension,
          })
        }
      }
      
      if (providerData) {
        setProviderFields(providerData)
      }
    } catch (err) {
      console.error("Error fetching SMS data:", err)
      toast.error("Failed to load SMS data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSMSData()
  }, [fetchSMSData])

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const matchesSearch = 
        message.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (message.recipient_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.message.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || message.status === statusFilter
      const matchesType = typeFilter === "all" || message.type === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })
  }, [messages, searchQuery, statusFilter, typeFilter])

  const handleRefresh = useCallback(async () => {
    await fetchSMSData()
    toast.success("SMS data refreshed")
  }, [fetchSMSData])

  const handleSendMessage = async () => {
    if (!composeForm.recipients || !composeForm.message) {
      toast.error("Please fill in recipient and message")
      return
    }
    
    try {
      setIsSending(true)
      
      // Try API first
      const result = await adminApi.sendSMS({
        recipient: composeForm.recipients,
        message: composeForm.message,
        template_id: composeForm.template ? parseInt(composeForm.template) : undefined,
      }).catch(() => null)
      
      if (result) {
        setMessages(prev => [result, ...prev])
        toast.success("SMS sent successfully")
      } else {
        toast.error("Failed to send SMS")
      }
      
      setIsComposeOpen(false)
      setComposeForm({ recipients: "", message: "", template: "", scheduleFor: "" })
    } catch (err) {
      console.error("Error sending SMS:", err)
      toast.error("Failed to send SMS")
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast.error("Please fill in template name and content")
      return
    }
    
    try {
      const result = await adminApi.createSMSTemplate({
        name: newTemplate.name,
        content: newTemplate.content,
        variables: newTemplate.content.match(/\{(\w+)\}/g)?.map(v => v.slice(1, -1)) || [],
        is_active: true,
      }).catch(() => null)
      
      if (result) {
        setTemplates(prev => [...prev, result])
        toast.success("Template created successfully")
      } else {
        toast.error("Failed to create template")
      }
      
      setNewTemplate({ name: "", content: "" })
      setIsTemplateDialogOpen(false)
    } catch (err) {
      console.error("Error creating template:", err)
      toast.error("Failed to create template")
    }
  }
  
  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await adminApi.deleteSMSTemplate(templateId).catch(() => null)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      toast.success("Template deleted")
    } catch (err) {
      console.error("Error deleting template:", err)
      toast.error("Failed to delete template")
    }
  }
  
  const handleRetrySMS = async (messageId: number) => {
    try {
      const result = await adminApi.retrySMS(messageId).catch(() => null)
      if (result) {
        setMessages(prev => prev.map(m => m.id === messageId ? result : m))
        toast.success("SMS retry initiated")
      } else {
        toast.error("Failed to retry SMS")
      }
    } catch (err) {
      console.error("Error retrying SMS:", err)
      toast.error("Failed to retry SMS")
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMessages(filteredMessages.map(m => m.id))
    } else {
      setSelectedMessages([])
    }
  }

  const handleSelectMessage = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedMessages([...selectedMessages, id])
    } else {
      setSelectedMessages(selectedMessages.filter(m => m !== id))
    }
  }

  const useTemplate = (template: SMSTemplate) => {
    setComposeForm({
      ...composeForm,
      message: template.content,
      template: template.id.toString(),
    })
  }

  // ── Gateway config handlers ────────────────────────────
  const handleGatewaySave = async () => {
    if (!gwForm.api_key && !gwEditing) {
      toast.error("API Key is required")
      return
    }
    setGwSaving(true)
    try {
      const payload: Partial<SMSGatewayConfigWrite> = { ...gwForm }
      // Don't send empty credential fields during update (preserve existing)
      if (gwEditing) {
        if (!payload.api_key) delete payload.api_key
        if (!payload.api_secret) delete payload.api_secret
      }
      let result: SMSGatewayConfig
      if (gwEditing) {
        result = await adminApi.updateSMSGatewayConfig(gwEditing, payload)
      } else {
        result = await adminApi.createSMSGatewayConfig(gwForm)
      }
      // Refresh
      const configs = await adminApi.getSMSGatewayConfigs().catch(() => [])
      setGatewayConfigs(configs)
      setGwEditing(result.id)
      toast.success("Gateway configuration saved")
    } catch (err: any) {
      toast.error(err?.message || "Failed to save gateway config")
    } finally {
      setGwSaving(false)
    }
  }

  const handleGatewayTest = async () => {
    if (!gwEditing) {
      toast.error("Save the configuration first before testing")
      return
    }
    setGwTesting(true)
    try {
      const res = await adminApi.testSMSGateway(gwEditing)
      if (res.success) {
        toast.success(`Connection successful! Balance: ${JSON.stringify(res.balance)}`)
      } else {
        toast.error(`Test failed: ${res.error}`)
      }
    } catch (err: any) {
      toast.error(err?.message || "Connection test failed")
    } finally {
      setGwTesting(false)
    }
  }

  const handleGatewayActivate = async (id: number) => {
    try {
      await adminApi.activateSMSGateway(id)
      const configs = await adminApi.getSMSGatewayConfigs().catch(() => [])
      setGatewayConfigs(configs)
      toast.success("Gateway activated")
    } catch (err: any) {
      toast.error(err?.message || "Failed to activate gateway")
    }
  }

  const handleGatewayDelete = async (id: number) => {
    try {
      await adminApi.deleteSMSGatewayConfig(id)
      setGatewayConfigs(prev => prev.filter(g => g.id !== id))
      if (gwEditing === id) {
        setGwEditing(null)
        setGwForm({ provider: 'africastalking', is_active: true, api_key: '', api_secret: '', username: '', sender_id: '', extra_config: {}, auto_payment_confirmation: true, auto_expiry_reminder: true, auto_welcome_message: true, auto_service_suspension: false })
      }
      toast.success("Gateway deleted")
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete gateway")
    }
  }

  const activeGw = gatewayConfigs.find(g => g.is_active)

  // Provider display labels
  const PROVIDER_OPTIONS: { value: SMSProvider; label: string }[] = [
    { value: 'africastalking', label: "Africa's Talking" },
    { value: 'twilio', label: 'Twilio' },
    { value: 'vonage', label: 'Vonage (Nexmo)' },
    { value: 'infobip', label: 'Infobip' },
    { value: 'beem', label: 'Beem Africa' },
    { value: 'advanta', label: 'Advanta SMS' },
    { value: 'hubtel', label: 'Hubtel' },
  ]

  // Fields that each provider needs
  const PROVIDER_FIELD_MAP: Record<SMSProvider, { key: string; label: string; type?: string }[]> = {
    africastalking: [
      { key: 'username', label: 'Username' },
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'sender_id', label: 'Sender ID' },
    ],
    twilio: [
      { key: 'api_key', label: 'Account SID', type: 'password' },
      { key: 'api_secret', label: 'Auth Token', type: 'password' },
      { key: 'sender_id', label: 'From Number' },
    ],
    vonage: [
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'api_secret', label: 'API Secret', type: 'password' },
      { key: 'sender_id', label: 'Sender ID' },
    ],
    infobip: [
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'sender_id', label: 'Sender ID' },
    ],
    beem: [
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'api_secret', label: 'Secret Key', type: 'password' },
      { key: 'sender_id', label: 'Sender Name' },
    ],
    advanta: [
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'sender_id', label: 'Short Code' },
    ],
    hubtel: [
      { key: 'api_key', label: 'Client ID', type: 'password' },
      { key: 'api_secret', label: 'Client Secret', type: 'password' },
      { key: 'sender_id', label: 'Sender ID' },
    ],
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SMS Management</h1>
          <p className="text-slate-600 mt-1">Send messages, manage templates, and track delivery</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsComposeOpen(true)}>
            <Send className="w-4 h-4 mr-2" />
            Send SMS
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Sent</p>
                <p className="text-2xl font-bold">{stats.total_sent}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Delivery Rate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.delivery_rate?.toFixed(1) || 0}%</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Message History</CardTitle>
                  <CardDescription>View all sent and received messages</CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedMessages.length > 0 && (
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete ({selectedMessages.length})
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search messages..."
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
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="bulk">Bulk</SelectItem>
                    <SelectItem value="automated">Automated</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedMessages.length === filteredMessages.length && filteredMessages.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead className="hidden md:table-cell">Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead className="hidden lg:table-cell">Sent At</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedMessages.includes(message.id)}
                            onCheckedChange={(checked) => handleSelectMessage(message.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{message.recipient_name || "Unknown"}</div>
                            <div className="text-sm text-slate-500">{message.recipient}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">
                          {message.message}
                        </TableCell>
                        <TableCell>{getStatusBadge(message.status)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="capitalize">{message.type}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                          {message.sent_at ? new Date(message.sent_at).toLocaleString() : "-"}
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
                                View Details
                              </DropdownMenuItem>
                              {message.status === "failed" && (
                                <DropdownMenuItem onClick={() => handleRetrySMS(message.id)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Retry
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Send className="w-4 h-4 mr-2" />
                                Resend
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
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

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Message Templates</CardTitle>
                  <CardDescription>Create reusable message templates with variables</CardDescription>
                </div>
                <Button onClick={() => setIsTemplateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{template.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              Used {template.usage_count || 0} times
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{template.content}</p>
                          {template.variables && template.variables.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Variables:</span>
                              {template.variables.map((v) => (
                                <Badge key={v} variant="secondary" className="text-xs">
                                  {"{" + v + "}"}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              useTemplate(template)
                              setIsComposeOpen(true)
                            }}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Use
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
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

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Bulk Campaigns</CardTitle>
                  <CardDescription>Manage bulk SMS campaigns to multiple recipients</CardDescription>
                </div>
                <Button onClick={() => setIsBulkOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-slate-500 truncate max-w-xs">
                              {campaign.message}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-slate-400" />
                            {(campaign.recipient_count || 0).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={campaign.recipient_count ? ((campaign.delivered_count || 0) / campaign.recipient_count) * 100 : 0} 
                                className="w-20 h-2"
                              />
                              <span className="text-sm">
                                {campaign.delivered_count || 0}/{campaign.recipient_count || 0}
                              </span>
                            </div>
                            {(campaign.failed_count || 0) > 0 && (
                              <span className="text-xs text-red-500">
                                {campaign.failed_count} failed
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getCampaignStatusBadge(campaign.status)}</TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : "-"}
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
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              {campaign.status === "scheduled" && (
                                <DropdownMenuItem className="text-red-600">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
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

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">

            {/* ── Gateway Provider Config ── */}
            <Card>
              <CardHeader>
                <CardTitle>SMS Gateway Configuration</CardTitle>
                <CardDescription>
                  {gwEditing ? 'Update your SMS provider credentials' : 'Configure your SMS provider'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={gwForm.provider} onValueChange={(v) => setGwForm({ ...gwForm, provider: v as SMSProvider })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_OPTIONS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dynamic fields per provider */}
                {PROVIDER_FIELD_MAP[gwForm.provider]?.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      type={field.type || 'text'}
                      placeholder={gwEditing ? '(leave blank to keep current)' : `Enter ${field.label.toLowerCase()}`}
                      value={(gwForm as any)[field.key] || ''}
                      onChange={(e) => setGwForm({ ...gwForm, [field.key]: e.target.value })}
                    />
                  </div>
                ))}

                {/* Advanta extra: partner_id */}
                {gwForm.provider === 'advanta' && (
                  <div className="space-y-2">
                    <Label>Partner ID</Label>
                    <Input
                      placeholder="Enter Partner ID"
                      value={gwForm.extra_config?.partner_id || ''}
                      onChange={(e) => setGwForm({ ...gwForm, extra_config: { ...gwForm.extra_config, partner_id: e.target.value } })}
                    />
                  </div>
                )}

                {/* Infobip extra: base_url */}
                {gwForm.provider === 'infobip' && (
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input
                      placeholder="https://xxxxx.api.infobip.com"
                      value={gwForm.extra_config?.base_url || ''}
                      onChange={(e) => setGwForm({ ...gwForm, extra_config: { ...gwForm.extra_config, base_url: e.target.value } })}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleGatewaySave} disabled={gwSaving}>
                    {gwSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {gwEditing ? 'Update Gateway' : 'Save Gateway'}
                  </Button>
                  {gwEditing && (
                    <Button variant="outline" onClick={handleGatewayTest} disabled={gwTesting}>
                      {gwTesting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                      Test
                    </Button>
                  )}
                </div>

                {/* Existing configs list */}
                {gatewayConfigs.length > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <Label className="text-xs text-slate-500 uppercase tracking-wide">Saved Gateways</Label>
                    {gatewayConfigs.map(gw => (
                      <div key={gw.id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${gw.is_active ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                        <div>
                          <span className="font-medium">{gw.provider_display}</span>
                          {gw.is_active && <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Active</Badge>}
                          {gw.sender_id && <span className="ml-2 text-slate-400 text-xs">{gw.sender_id}</span>}
                        </div>
                        <div className="flex gap-1">
                          {!gw.is_active && (
                            <Button size="sm" variant="ghost" onClick={() => handleGatewayActivate(gw.id)}>Activate</Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => {
                            setGwEditing(gw.id)
                            setGwForm({
                              provider: gw.provider, is_active: gw.is_active,
                              api_key: '', api_secret: '', username: gw.username, sender_id: gw.sender_id,
                              extra_config: gw.extra_config || {},
                              auto_payment_confirmation: gw.auto_payment_confirmation,
                              auto_expiry_reminder: gw.auto_expiry_reminder,
                              auto_welcome_message: gw.auto_welcome_message,
                              auto_service_suspension: gw.auto_service_suspension,
                            })
                          }}>Edit</Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleGatewayDelete(gw.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => {
                      setGwEditing(null)
                      setGwForm({ provider: 'africastalking', is_active: true, api_key: '', api_secret: '', username: '', sender_id: '', extra_config: {}, auto_payment_confirmation: true, auto_expiry_reminder: true, auto_welcome_message: true, auto_service_suspension: false })
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> Add Another Gateway
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Automated Triggers ── */}
            <Card>
              <CardHeader>
                <CardTitle>Automated Messages</CardTitle>
                <CardDescription>Configure automatic SMS triggers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Confirmation</Label>
                    <p className="text-sm text-slate-500">Send SMS after successful payment</p>
                  </div>
                  <Switch checked={gwForm.auto_payment_confirmation} onCheckedChange={(v) => setGwForm({ ...gwForm, auto_payment_confirmation: v })} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Expiry Reminder</Label>
                    <p className="text-sm text-slate-500">Notify users before subscription expires</p>
                  </div>
                  <Switch checked={gwForm.auto_expiry_reminder} onCheckedChange={(v) => setGwForm({ ...gwForm, auto_expiry_reminder: v })} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Welcome Message</Label>
                    <p className="text-sm text-slate-500">Send welcome SMS to new users</p>
                  </div>
                  <Switch checked={gwForm.auto_welcome_message} onCheckedChange={(v) => setGwForm({ ...gwForm, auto_welcome_message: v })} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Service Disconnection</Label>
                    <p className="text-sm text-slate-500">Notify when service is suspended</p>
                  </div>
                  <Switch checked={gwForm.auto_service_suspension} onCheckedChange={(v) => setGwForm({ ...gwForm, auto_service_suspension: v })} />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Trigger settings are saved per gateway config. Click &quot;Update Gateway&quot; to persist changes.
                </p>
              </CardContent>
            </Card>

            {/* ── Live Balance & Usage ── */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>SMS Balance & Usage</CardTitle>
                    <CardDescription>
                      {activeGw ? `Provider: ${activeGw.provider_display}` : 'No active gateway configured'}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchSMSData}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Balance</p>
                    <p className="text-2xl font-bold">
                      {balance ? `${balance.currency || 'KES'} ${Number(balance.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Sent This Month</p>
                    <p className="text-2xl font-bold">{stats.messages_this_week?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Delivery Rate</p>
                    <p className="text-2xl font-bold">{stats.delivery_rate || 0}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Total Spent</p>
                    <p className="text-2xl font-bold">KSh {Number(stats.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Compose SMS Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send SMS</DialogTitle>
            <DialogDescription>
              Send a message to one or multiple recipients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Textarea
                placeholder="Enter phone numbers separated by commas, e.g., +254712345678, +254723456789"
                value={composeForm.recipients}
                onChange={(e) => setComposeForm({ ...composeForm, recipients: e.target.value })}
                rows={2}
              />
              <p className="text-xs text-slate-500">
                Or upload a CSV file with phone numbers
              </p>
            </div>
            <div className="space-y-2">
              <Label>Use Template</Label>
              <Select 
                value={composeForm.template}
                onValueChange={(value) => {
                  const template = templates.find(t => t.id === value)
                  if (template) {
                    setComposeForm({ 
                      ...composeForm, 
                      template: value,
                      message: template.content 
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Message</Label>
                <span className="text-xs text-slate-500">
                  {composeForm.message.length}/160 characters
                </span>
              </div>
              <Textarea
                placeholder="Type your message here..."
                value={composeForm.message}
                onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Schedule (Optional)</Label>
              <Input 
                type="datetime-local"
                value={composeForm.scheduleFor}
                onChange={(e) => setComposeForm({ ...composeForm, scheduleFor: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={isSending || !composeForm.recipients || !composeForm.message}>
              {isSending ? (
                <>Sending...</>
              ) : composeForm.scheduleFor ? (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Create a reusable message template with variables
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g., Payment Confirmation"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Message Content</Label>
              <Textarea
                placeholder="Use {variable_name} for dynamic content"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-slate-500">
                Use curly braces for variables, e.g., {"{username}"}, {"{amount}"}, {"{expiry_date}"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Campaign Sheet */}
      <Sheet open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Create Bulk Campaign</SheetTitle>
            <SheetDescription>
              Send SMS to multiple recipients at once
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-200px)] mt-6">
            <div className="space-y-6 pr-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input placeholder="e.g., January Promo 2024" />
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active Subscribers</SelectItem>
                    <SelectItem value="expired">Expired Subscriptions</SelectItem>
                    <SelectItem value="hotspot">Hotspot Users</SelectItem>
                    <SelectItem value="pppoe">PPPoE Users</SelectItem>
                    <SelectItem value="custom">Custom List (CSV)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Upload Recipients (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">
                    Drag and drop a CSV file, or click to browse
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    CSV should have a 'phone' column
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your bulk message here..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="When to send" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Send Immediately</SelectItem>
                    <SelectItem value="schedule">Schedule for Later</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium mb-2">Campaign Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Recipients:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Estimated Cost:</span>
                    <span className="font-medium">KSh 0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Available Credits:</span>
                    <span className="font-medium text-green-600">10,450</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsBulkOpen(false)}>
                  Save as Draft
                </Button>
                <Button className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Send Campaign
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
