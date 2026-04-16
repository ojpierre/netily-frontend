"use client"

import React, { useState, useMemo } from "react"
import {
  Image,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Play,
  Pause,
  Copy,
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  Users,
  Monitor,
  Smartphone,
  Upload,
  Link2,
  ExternalLink,
  Zap,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Layout,
  MousePointer,
  Percent,
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

type AdStatus = "active" | "inactive" | "scheduled" | "expired"
type AdType = "banner" | "popup" | "video" | "interstitial"
type AdPlacement = "login" | "welcome" | "voucher" | "disconnect"

interface Ad {
  id: string
  name: string
  type: AdType
  placement: AdPlacement[]
  status: AdStatus
  imageUrl: string
  targetUrl: string
  impressions: number
  clicks: number
  ctr: number
  startDate: string
  endDate: string
  createdAt: string
  priority: number
  routers: string[]
}

interface AdStats {
  totalImpressions: number
  totalClicks: number
  avgCtr: number
  activeAds: number
  scheduledAds: number
}

// TODO: Wire to backend ads/captive-portal API when available

const getStatusBadge = (status: AdStatus) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-700">Active</Badge>
    case "inactive":
      return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
    case "scheduled":
      return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>
    case "expired":
      return <Badge className="bg-red-100 text-red-700">Expired</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getTypeBadge = (type: AdType) => {
  switch (type) {
    case "banner":
      return <Badge variant="outline" className="border-blue-200 text-blue-700">Banner</Badge>
    case "popup":
      return <Badge variant="outline" className="border-purple-200 text-purple-700">Popup</Badge>
    case "video":
      return <Badge variant="outline" className="border-red-200 text-red-700">Video</Badge>
    case "interstitial":
      return <Badge variant="outline" className="border-orange-200 text-orange-700">Interstitial</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

const getPlacementLabel = (placement: AdPlacement) => {
  switch (placement) {
    case "login":
      return "Login Page"
    case "welcome":
      return "Welcome Page"
    case "voucher":
      return "Voucher Page"
    case "disconnect":
      return "Disconnect Page"
    default:
      return placement
  }
}

export default function AdsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [ads, setAds] = useState<Ad[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAds, setSelectedAds] = useState<string[]>([])

  // Form state for creating/editing ads
  const [adForm, setAdForm] = useState({
    name: "",
    type: "banner" as AdType,
    placement: [] as AdPlacement[],
    targetUrl: "",
    startDate: "",
    endDate: "",
    priority: 1,
    routers: [] as string[],
  })

  // Stats calculations
  const stats: AdStats = useMemo(() => {
    const activeAds = ads.filter(ad => ad.status === "active")
    const scheduledAds = ads.filter(ad => ad.status === "scheduled")
    const totalImpressions = ads.reduce((acc, ad) => acc + ad.impressions, 0)
    const totalClicks = ads.reduce((acc, ad) => acc + ad.clicks, 0)
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    return {
      totalImpressions,
      totalClicks,
      avgCtr: parseFloat(avgCtr.toFixed(2)),
      activeAds: activeAds.length,
      scheduledAds: scheduledAds.length,
    }
  }, [ads])

  // Filtered ads
  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchesSearch = ad.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || ad.status === statusFilter
      const matchesType = typeFilter === "all" || ad.type === typeFilter
      
      // Tab filter
      const matchesTab = 
        activeTab === "all" ||
        (activeTab === "active" && ad.status === "active") ||
        (activeTab === "inactive" && ad.status === "inactive") ||
        (activeTab === "scheduled" && ad.status === "scheduled")
      
      return matchesSearch && matchesStatus && matchesType && matchesTab
    })
  }, [ads, searchQuery, statusFilter, typeFilter, activeTab])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleToggleStatus = (ad: Ad) => {
    const newStatus = ad.status === "active" ? "inactive" : "active"
    setAds(ads.map(a => 
      a.id === ad.id ? { ...a, status: newStatus } : a
    ))
  }

  const handleDuplicate = (ad: Ad) => {
    const newAd: Ad = {
      ...ad,
      id: Date.now().toString(),
      name: `${ad.name} (Copy)`,
      status: "inactive",
      impressions: 0,
      clicks: 0,
      ctr: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }
    setAds([newAd, ...ads])
  }

  const handleDelete = (adId: string) => {
    setAds(ads.filter(a => a.id !== adId))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAds(filteredAds.map(a => a.id))
    } else {
      setSelectedAds([])
    }
  }

  const handleSelectAd = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAds([...selectedAds, id])
    } else {
      setSelectedAds(selectedAds.filter(a => a !== id))
    }
  }

  const handlePlacementChange = (placement: AdPlacement, checked: boolean) => {
    if (checked) {
      setAdForm({ ...adForm, placement: [...adForm.placement, placement] })
    } else {
      setAdForm({ ...adForm, placement: adForm.placement.filter(p => p !== placement) })
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Captive Portal Ads</h1>
          <p className="text-slate-600 mt-1">Manage advertisements shown on hotspot login pages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Ad
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Impressions</p>
                <p className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Clicks</p>
                <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg CTR</p>
                <p className="text-2xl font-bold">{stats.avgCtr}%</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Ads</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeAds}</p>
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
                <p className="text-sm text-slate-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduledAds}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all">
              All Ads
              <Badge variant="secondary" className="ml-2">{ads.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              <Badge variant="secondary" className="ml-2">{ads.filter(a => a.status === "active").length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {selectedAds.length > 0 && (
              <>
                <Button variant="outline" size="sm">
                  <Play className="w-4 h-4 mr-1" />
                  Activate ({selectedAds.length})
                </Button>
                <Button variant="outline" size="sm" className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete ({selectedAds.length})
                </Button>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search ads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ad Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="popup">Popup</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="interstitial">Interstitial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAds.length === filteredAds.length && filteredAds.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Ad</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Placement</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Schedule</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAds.includes(ad.id)}
                          onCheckedChange={(checked) => handleSelectAd(ad.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 bg-slate-100 rounded border flex items-center justify-center">
                            <Image className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <div className="font-medium">{ad.name}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-1">
                              <Link2 className="w-3 h-3" />
                              {ad.targetUrl.substring(0, 30)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(ad.type)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {ad.placement.map((p) => (
                            <Badge key={p} variant="secondary" className="text-xs">
                              {getPlacementLabel(p)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>{ad.impressions.toLocaleString()}</span>
                            <MousePointer className="w-3 h-3 text-slate-400 ml-2" />
                            <span>{ad.clicks.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={ad.ctr * 10} className="w-16 h-1.5" />
                            <span className="text-xs text-slate-500">{ad.ctr}% CTR</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(ad.status)}
                          {ad.status === "active" || ad.status === "inactive" ? (
                            <Switch
                              checked={ad.status === "active"}
                              onCheckedChange={() => handleToggleStatus(ad)}
                              className="data-[state=checked]:bg-green-600"
                            />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {ad.startDate}
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" />
                            {ad.endDate}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedAd(ad)
                              setIsPreviewOpen(true)
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(ad)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              View Stats
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(ad.id)}
                            >
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

            {filteredAds.length === 0 && (
              <div className="text-center py-12">
                <Image className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No ads found</h3>
                <p className="text-slate-500 mb-4">Get started by creating your first ad</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Ad
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Create/Edit Ad Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Create New Ad</SheetTitle>
            <SheetDescription>
              Configure a new advertisement for the captive portal
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-200px)] mt-6">
            <div className="space-y-6 pr-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-500 uppercase">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label>Ad Name</Label>
                  <Input
                    placeholder="e.g., January Promo Banner"
                    value={adForm.name}
                    onChange={(e) => setAdForm({ ...adForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ad Type</Label>
                  <Select 
                    value={adForm.type}
                    onValueChange={(value: AdType) => setAdForm({ ...adForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">
                        <div className="flex items-center gap-2">
                          <Layout className="w-4 h-4" />
                          Banner - Static image ad
                        </div>
                      </SelectItem>
                      <SelectItem value="popup">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          Popup - Modal overlay ad
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Video - Auto-play video ad
                        </div>
                      </SelectItem>
                      <SelectItem value="interstitial">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Interstitial - Full screen ad
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target URL</Label>
                  <Input
                    placeholder="https://example.com/promo"
                    value={adForm.targetUrl}
                    onChange={(e) => setAdForm({ ...adForm, targetUrl: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              {/* Creative Upload */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-500 uppercase">Creative</h3>
                
                <div className="space-y-2">
                  <Label>Upload Image/Video</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                    <p className="text-sm text-slate-600 mb-1">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-slate-500">
                      Recommended: 1200x628px for banners, 1080x1920px for interstitials
                    </p>
                    <Button variant="outline" className="mt-4">
                      Choose File
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Placement */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-500 uppercase">Placement</h3>
                
                <div className="space-y-3">
                  <Label>Show on pages</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(["login", "welcome", "voucher", "disconnect"] as AdPlacement[]).map((placement) => (
                      <div key={placement} className="flex items-center space-x-2">
                        <Checkbox
                          id={placement}
                          checked={adForm.placement.includes(placement)}
                          onCheckedChange={(checked) => handlePlacementChange(placement, checked as boolean)}
                        />
                        <label htmlFor={placement} className="text-sm cursor-pointer">
                          {getPlacementLabel(placement)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Routers</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select routers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Routers</SelectItem>
                      <SelectItem value="router-001">Router-001 (Main Office)</SelectItem>
                      <SelectItem value="router-002">Router-002 (Branch 1)</SelectItem>
                      <SelectItem value="router-003">Router-003 (Branch 2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority (1 = Highest)</Label>
                  <Select 
                    value={adForm.priority.toString()}
                    onValueChange={(value) => setAdForm({ ...adForm, priority: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((p) => (
                        <SelectItem key={p} value={p.toString()}>
                          Priority {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Schedule */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-500 uppercase">Schedule</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={adForm.startDate}
                      onChange={(e) => setAdForm({ ...adForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={adForm.endDate}
                      onChange={(e) => setAdForm({ ...adForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Ad
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Ad Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ad Preview</DialogTitle>
            <DialogDescription>
              Preview how your ad will appear on the captive portal
            </DialogDescription>
          </DialogHeader>
          {selectedAd && (
            <div className="space-y-4">
              {/* Ad Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-slate-100 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-500">Mobile Preview</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-500">Desktop Preview</span>
                    </div>
                  </div>
                  
                  {/* Simulated portal screen */}
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                    <div className="text-center mb-4">
                      <h3 className="font-bold text-lg">Welcome to WiFi</h3>
                      <p className="text-sm text-slate-500">Enter your credentials to connect</p>
                    </div>
                    
                    {/* Ad placeholder */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4 mb-4 text-white text-center">
                      <div className="text-xs opacity-75 mb-1">SPONSORED</div>
                      <div className="font-bold">{selectedAd.name}</div>
                      <div className="text-sm opacity-90 mt-1">Click to learn more</div>
                    </div>
                    
                    <div className="space-y-3">
                      <Input placeholder="Username" className="text-center" />
                      <Input type="password" placeholder="Password" className="text-center" />
                      <Button className="w-full">Connect</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ad Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Type:</span>
                  <span className="ml-2 font-medium">{selectedAd.type}</span>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <span className="ml-2">{getStatusBadge(selectedAd.status)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Impressions:</span>
                  <span className="ml-2 font-medium">{selectedAd.impressions.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500">CTR:</span>
                  <span className="ml-2 font-medium">{selectedAd.ctr}%</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
