"use client"

import React, { useState, useMemo } from "react"
import {
  Book,
  FileText,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Clock,
  User,
  Tag,
  Folder,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Copy,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Settings,
  Calendar,
  Link,
  Wifi,
  CreditCard,
  Users,
  Router,
  Zap,
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

// Types
interface KBArticle {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  category: string
  tags: string[]
  status: "published" | "draft" | "archived"
  visibility: "public" | "internal" | "agents"
  views: number
  helpfulVotes: number
  notHelpfulVotes: number
  createdAt: string
  updatedAt: string
  author: string
  relatedArticles: string[]
}

interface KBCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  articleCount: number
  order: number
}

interface MaintenanceSchedule {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  affectedAreas: string[]
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  createdBy: string
}

interface NetworkStatus {
  id: string
  area: string
  status: "operational" | "degraded" | "outage" | "maintenance"
  message: string
  lastUpdated: string
}

// Mock data
const categories: KBCategory[] = [
  { id: "1", name: "Getting Started", slug: "getting-started", description: "New customer guides", icon: "book", articleCount: 8, order: 1 },
  { id: "2", name: "Billing & Payments", slug: "billing", description: "Payment methods and invoices", icon: "credit-card", articleCount: 12, order: 2 },
  { id: "3", name: "Connectivity Issues", slug: "connectivity", description: "Troubleshooting connection problems", icon: "wifi", articleCount: 15, order: 3 },
  { id: "4", name: "Router & Equipment", slug: "equipment", description: "Device setup and configuration", icon: "router", articleCount: 10, order: 4 },
  { id: "5", name: "Account Management", slug: "account", description: "Profile and settings", icon: "users", articleCount: 6, order: 5 },
  { id: "6", name: "Speed & Performance", slug: "performance", description: "Optimizing your connection", icon: "zap", articleCount: 9, order: 6 },
]

const generateMockArticles = (): KBArticle[] => {
  const articles: Partial<KBArticle>[] = [
    { title: "How to pay your bill via M-Pesa", summary: "Step-by-step guide for M-Pesa payments", category: "Billing & Payments", tags: ["mpesa", "payment", "billing"], visibility: "public" },
    { title: "Router not connecting to internet", summary: "Common solutions for internet connectivity issues", category: "Connectivity Issues", tags: ["router", "internet", "troubleshooting"], visibility: "public" },
    { title: "How to check your data usage", summary: "View your bandwidth consumption in the customer portal", category: "Account Management", tags: ["usage", "data", "bandwidth"], visibility: "public" },
    { title: "Setting up WiFi on your router", summary: "Configure wireless network settings", category: "Router & Equipment", tags: ["wifi", "wireless", "setup"], visibility: "public" },
    { title: "Understanding your invoice", summary: "Breakdown of invoice charges and fees", category: "Billing & Payments", tags: ["invoice", "billing", "charges"], visibility: "public" },
    { title: "Slow internet speed troubleshooting", summary: "Steps to diagnose and fix slow speeds", category: "Speed & Performance", tags: ["speed", "slow", "performance"], visibility: "public" },
    { title: "How to upgrade your plan", summary: "Request a plan upgrade through the portal", category: "Account Management", tags: ["upgrade", "plan", "change"], visibility: "public" },
    { title: "ONU/ONT light indicators meaning", summary: "Understanding the lights on your fiber device", category: "Router & Equipment", tags: ["onu", "ont", "fiber", "lights"], visibility: "public" },
    { title: "Payment failed - what to do", summary: "Troubleshooting failed M-Pesa transactions", category: "Billing & Payments", tags: ["payment", "failed", "mpesa"], visibility: "public" },
    { title: "How to reset your router", summary: "Factory reset and soft reset procedures", category: "Router & Equipment", tags: ["reset", "router", "factory"], visibility: "public" },
    { title: "FUP (Fair Usage Policy) explained", summary: "Understanding bandwidth throttling policies", category: "Speed & Performance", tags: ["fup", "throttling", "policy"], visibility: "public" },
    { title: "Changing your WiFi password", summary: "How to update your wireless network password", category: "Router & Equipment", tags: ["wifi", "password", "security"], visibility: "public" },
    { title: "Internal: Escalation procedures", summary: "How to escalate customer issues", category: "Internal Docs", tags: ["internal", "escalation", "support"], visibility: "internal" },
    { title: "Agent: Commission structure", summary: "Agent commission rates and calculations", category: "Internal Docs", tags: ["agent", "commission", "sales"], visibility: "agents" },
  ]

  return articles.map((article, i) => ({
    ...article,
    id: `article-${i + 1}`,
    slug: article.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") || "",
    content: `# ${article.title}\n\n${article.summary}\n\n## Overview\n\nThis article provides detailed information about ${article.title?.toLowerCase()}.\n\n## Steps\n\n1. First step...\n2. Second step...\n3. Third step...\n\n## Related Information\n\nFor more help, contact support.`,
    status: Math.random() > 0.1 ? "published" : "draft",
    views: Math.floor(Math.random() * 5000) + 100,
    helpfulVotes: Math.floor(Math.random() * 200) + 10,
    notHelpfulVotes: Math.floor(Math.random() * 20),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 90)).toISOString(),
    updatedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 30)).toISOString(),
    author: ["Admin", "Support Team", "Technical Team"][Math.floor(Math.random() * 3)],
    relatedArticles: [],
  })) as KBArticle[]
}

const mockMaintenanceSchedules: MaintenanceSchedule[] = [
  {
    id: "1",
    title: "Scheduled Network Upgrade - Nairobi West",
    description: "Upgrading network infrastructure to improve speeds and reliability",
    startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 2 + 14400000).toISOString(),
    affectedAreas: ["Nairobi West", "Lavington", "Kilimani"],
    status: "scheduled",
    createdBy: "Network Team",
  },
  {
    id: "2",
    title: "OLT Firmware Update - Mombasa",
    description: "Critical firmware update for improved stability",
    startTime: new Date(Date.now() + 86400000 * 5).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 5 + 7200000).toISOString(),
    affectedAreas: ["Mombasa CBD", "Nyali"],
    status: "scheduled",
    createdBy: "Network Team",
  },
]

const mockNetworkStatus: NetworkStatus[] = [
  { id: "1", area: "Nairobi CBD", status: "operational", message: "All systems operational", lastUpdated: new Date(Date.now() - 3600000).toISOString() },
  { id: "2", area: "Westlands", status: "operational", message: "All systems operational", lastUpdated: new Date(Date.now() - 3600000).toISOString() },
  { id: "3", area: "Mombasa", status: "degraded", message: "Some customers experiencing slow speeds", lastUpdated: new Date(Date.now() - 1800000).toISOString() },
  { id: "4", area: "Kisumu", status: "operational", message: "All systems operational", lastUpdated: new Date(Date.now() - 7200000).toISOString() },
  { id: "5", area: "Nakuru", status: "maintenance", message: "Planned maintenance in progress", lastUpdated: new Date(Date.now() - 600000).toISOString() },
]

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

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case "book": return <Book className="w-5 h-5" />
    case "credit-card": return <CreditCard className="w-5 h-5" />
    case "wifi": return <Wifi className="w-5 h-5" />
    case "router": return <Router className="w-5 h-5" />
    case "users": return <Users className="w-5 h-5" />
    case "zap": return <Zap className="w-5 h-5" />
    default: return <FileText className="w-5 h-5" />
  }
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KBArticle[]>(generateMockArticles())
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null)
  const [articleSheetOpen, setArticleSheetOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories.map(c => c.id))

  // Stats
  const stats = useMemo(() => {
    const published = articles.filter(a => a.status === "published").length
    const draft = articles.filter(a => a.status === "draft").length
    const totalViews = articles.reduce((sum, a) => sum + a.views, 0)
    const avgHelpful = articles.length > 0 
      ? Math.round(articles.reduce((sum, a) => sum + (a.helpfulVotes / (a.helpfulVotes + a.notHelpfulVotes) * 100), 0) / articles.length)
      : 0
    
    return { total: articles.length, published, draft, totalViews, avgHelpful }
  }, [articles])

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = categoryFilter === "all" || article.category === categoryFilter
      const matchesStatus = statusFilter === "all" || article.status === statusFilter
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [articles, searchQuery, categoryFilter, statusFilter])

  // Group articles by category
  const articlesByCategory = useMemo(() => {
    const grouped: Record<string, KBArticle[]> = {}
    categories.forEach(cat => {
      grouped[cat.name] = filteredArticles.filter(a => a.category === cat.name)
    })
    // Add uncategorized
    const categorizedNames = categories.map(c => c.name)
    grouped["Other"] = filteredArticles.filter(a => !categorizedNames.includes(a.category))
    return grouped
  }, [filteredArticles])

  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId))
    } else {
      setExpandedCategories([...expandedCategories, categoryId])
    }
  }

  const openArticle = (article: KBArticle) => {
    setSelectedArticle(article)
    setArticleSheetOpen(true)
  }

  const getStatusBadge = (status: KBArticle["status"]) => {
    switch (status) {
      case "published": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Published</Badge>
      case "draft": return <Badge variant="outline">Draft</Badge>
      case "archived": return <Badge variant="secondary">Archived</Badge>
    }
  }

  const getVisibilityBadge = (visibility: KBArticle["visibility"]) => {
    switch (visibility) {
      case "public": return <Badge variant="outline"><Eye className="w-3 h-3 mr-1" /> Public</Badge>
      case "internal": return <Badge variant="secondary">Internal Only</Badge>
      case "agents": return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Agents</Badge>
    }
  }

  const getNetworkStatusBadge = (status: NetworkStatus["status"]) => {
    switch (status) {
      case "operational": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Operational</Badge>
      case "degraded": return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><AlertCircle className="w-3 h-3 mr-1" /> Degraded</Badge>
      case "outage": return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Outage</Badge>
      case "maintenance": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Settings className="w-3 h-3 mr-1" /> Maintenance</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">Help articles, FAQs, and network status</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMaintenanceDialogOpen(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Maintenance
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{categories.length} categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <p className="text-xs text-muted-foreground">{stats.draft} drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Helpful Rate</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgHelpful}%</div>
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Status</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockNetworkStatus.filter(s => s.status === "operational").length}/{mockNetworkStatus.length}
            </div>
            <p className="text-xs text-muted-foreground">Areas operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="status">Network Status</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Articles by Category */}
          <div className="space-y-4">
            {categories.map(category => {
              const categoryArticles = articlesByCategory[category.name] || []
              if (categoryArticles.length === 0 && categoryFilter !== "all" && categoryFilter !== category.name) return null
              
              return (
                <Card key={category.id}>
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedCategories.includes(category.id) 
                          ? <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          : <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        }
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {getCategoryIcon(category.icon)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{category.name}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">{categoryArticles.length} articles</Badge>
                    </div>
                  </CardHeader>
                  {expandedCategories.includes(category.id) && categoryArticles.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {categoryArticles.map(article => (
                          <div 
                            key={article.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => openArticle(article)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{article.title}</span>
                                {getStatusBadge(article.status)}
                                {getVisibilityBadge(article.visibility)}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">{article.summary}</div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> {article.views.toLocaleString()} views
                                </span>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" /> {article.helpfulVotes}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Updated {formatTimeAgo(article.updatedAt)}
                                </span>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openArticle(article)}>
                                  <Eye className="w-4 h-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedArticle(article); setEditDialogOpen(true) }}>
                                  <Edit className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="w-4 h-4 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Categories</h3>
              <p className="text-sm text-muted-foreground">Organize your knowledge base articles</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map(category => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {getCategoryIcon(category.icon)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-base">{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{category.articleCount} articles</span>
                    <Button variant="link" size="sm" className="px-0">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Network Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Network Status</h3>
              <p className="text-sm text-muted-foreground">Current status of network infrastructure</p>
            </div>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Update Status
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {mockNetworkStatus.map(status => (
                  <div key={status.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        status.status === "operational" ? "bg-green-500" :
                        status.status === "degraded" ? "bg-yellow-500" :
                        status.status === "outage" ? "bg-red-500" : "bg-blue-500"
                      }`} />
                      <div>
                        <div className="font-medium">{status.area}</div>
                        <div className="text-sm text-muted-foreground">{status.message}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getNetworkStatusBadge(status.status)}
                      <span className="text-sm text-muted-foreground">
                        Updated {formatTimeAgo(status.lastUpdated)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Scheduled Maintenance</h3>
              <p className="text-sm text-muted-foreground">Upcoming and past maintenance windows</p>
            </div>
            <Button onClick={() => setMaintenanceDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>
          <div className="space-y-4">
            {mockMaintenanceSchedules.map(maintenance => (
              <Card key={maintenance.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{maintenance.title}</CardTitle>
                        <CardDescription>{maintenance.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                      {maintenance.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Start Time</div>
                      <div className="font-medium">{new Date(maintenance.startTime).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">End Time</div>
                      <div className="font-medium">{new Date(maintenance.endTime).toLocaleString()}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-muted-foreground mb-1">Affected Areas</div>
                      <div className="flex flex-wrap gap-1">
                        {maintenance.affectedAreas.map(area => (
                          <Badge key={area} variant="outline">{area}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Created by {maintenance.createdBy}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm" className="text-destructive">Cancel</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Article Detail Sheet */}
      <Sheet open={articleSheetOpen} onOpenChange={setArticleSheetOpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{selectedArticle?.title}</SheetTitle>
            <SheetDescription>{selectedArticle?.summary}</SheetDescription>
          </SheetHeader>
          {selectedArticle && (
            <ScrollArea className="h-[calc(100vh-120px)] pr-4">
              <div className="space-y-6 py-4">
                {/* Meta */}
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedArticle.status)}
                  {getVisibilityBadge(selectedArticle.visibility)}
                  <Badge variant="outline">{selectedArticle.category}</Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> {selectedArticle.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" /> {selectedArticle.helpfulVotes} helpful
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" /> {selectedArticle.author}
                  </span>
                </div>

                <Separator />

                {/* Content */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {selectedArticle.content}
                  </pre>
                </div>

                <Separator />

                {/* Tags */}
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedArticle.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="w-3 h-3 mr-1" /> {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Created</div>
                    <div className="font-medium">{new Date(selectedArticle.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Updated</div>
                    <div className="font-medium">{new Date(selectedArticle.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline" onClick={() => { setEditDialogOpen(true); setArticleSheetOpen(false) }}>
                    <Edit className="w-4 h-4 mr-2" /> Edit Article
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" /> Preview
                  </Button>
                  <Button variant="outline">
                    <Copy className="w-4 h-4 mr-2" /> Copy Link
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Article Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Article</DialogTitle>
            <DialogDescription>Add a new help article to the knowledge base</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="Article title..." />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea placeholder="Brief summary of the article..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select defaultValue="getting-started">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select defaultValue="public">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal Only</SelectItem>
                    <SelectItem value="agents">Agents Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea placeholder="Article content (Markdown supported)..." rows={10} />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input placeholder="e.g., billing, payment, mpesa" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="publish" />
              <Label htmlFor="publish">Publish immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setCreateDialogOpen(false)}>Create Article</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>Create a maintenance window notification</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g., Network Upgrade - Nairobi West" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the maintenance work..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="datetime-local" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Affected Areas</Label>
              <Input placeholder="e.g., Nairobi West, Lavington, Kilimani" />
              <p className="text-xs text-muted-foreground">Comma-separated list of areas</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="notify" defaultChecked />
              <Label htmlFor="notify">Notify affected customers via SMS</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setMaintenanceDialogOpen(false)}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
