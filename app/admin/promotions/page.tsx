"use client"

import React, { useState, useMemo } from "react"
import {
  Percent,
  Gift,
  Tag,
  Calendar,
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Ticket,
  Zap,
  ArrowRight,
  Sparkles,
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
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Types
interface Promotion {
  id: string
  name: string
  code: string
  description: string
  type: "percentage" | "fixed" | "free_days" | "upgrade" | "bonus_data"
  value: number
  valueUnit?: string
  minPurchase?: number
  maxDiscount?: number
  applicablePlans: string[]
  applicableCustomerTypes: ("new" | "existing" | "all")[]
  startDate: string
  endDate: string
  status: "active" | "scheduled" | "expired" | "paused"
  usageLimit?: number
  usageCount: number
  usagePerCustomer: number
  conditions: string[]
  createdAt: string
  createdBy: string
}

interface Voucher {
  id: string
  code: string
  promotionId: string
  promotionName: string
  value: number
  valueType: "percentage" | "fixed"
  status: "unused" | "used" | "expired"
  customerId?: string
  customerName?: string
  usedAt?: string
  expiresAt: string
  createdAt: string
}

interface ReferralProgram {
  id: string
  name: string
  description: string
  referrerReward: number
  referrerRewardType: "cash" | "credit" | "free_days"
  refereeDiscount: number
  refereeDiscountType: "percentage" | "fixed"
  minReferrals?: number
  isActive: boolean
  totalReferrals: number
  totalRewardsGiven: number
}

// Helpers
const formatCurrency = (amount: number): string => {
  return `KES ${amount.toLocaleString()}`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function PromotionsPage() {
  // TODO: Connect to promotions API when available
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [vouchers] = useState<Voucher[]>([])
  const [referralProgram] = useState<ReferralProgram>({
    id: '',
    name: '',
    description: '',
    referrerReward: 0,
    referrerRewardType: 'credit',
    refereeDiscount: 0,
    refereeDiscountType: 'percentage',
    isActive: false,
    totalReferrals: 0,
    totalRewardsGiven: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [generateVouchersDialogOpen, setGenerateVouchersDialogOpen] = useState(false)

  // Stats
  const stats = useMemo(() => {
    const active = promotions.filter(p => p.status === "active").length
    const totalUsage = promotions.reduce((sum, p) => sum + p.usageCount, 0)
    const totalSavings = promotions.reduce((sum, p) => {
      if (p.type === "fixed") return sum + (p.value * p.usageCount)
      // Estimate for percentage discounts (assume avg plan is KES 2000)
      if (p.type === "percentage") return sum + ((2000 * p.value / 100) * p.usageCount)
      return sum
    }, 0)
    const unusedVouchers = vouchers.filter(v => v.status === "unused").length
    
    return { active, totalUsage, totalSavings, unusedVouchers, totalVouchers: vouchers.length }
  }, [promotions, vouchers])

  // Filtered promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter(promo => {
      const matchesSearch = 
        promo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        promo.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || promo.status === statusFilter
      const matchesType = typeFilter === "all" || promo.type === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })
  }, [promotions, searchQuery, statusFilter, typeFilter])

  const getStatusBadge = (status: Promotion["status"]) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>
      case "scheduled": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Clock className="w-3 h-3 mr-1" /> Scheduled</Badge>
      case "expired": return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Expired</Badge>
      case "paused": return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Pause className="w-3 h-3 mr-1" /> Paused</Badge>
    }
  }

  const getTypeBadge = (type: Promotion["type"]) => {
    switch (type) {
      case "percentage": return <Badge variant="outline"><Percent className="w-3 h-3 mr-1" /> Percentage</Badge>
      case "fixed": return <Badge variant="outline"><DollarSign className="w-3 h-3 mr-1" /> Fixed Amount</Badge>
      case "free_days": return <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" /> Free Days</Badge>
      case "upgrade": return <Badge variant="outline"><TrendingUp className="w-3 h-3 mr-1" /> Upgrade</Badge>
      case "bonus_data": return <Badge variant="outline"><Zap className="w-3 h-3 mr-1" /> Bonus Data</Badge>
    }
  }

  const getValueDisplay = (promo: Promotion): string => {
    switch (promo.type) {
      case "percentage": return `${promo.value}% off`
      case "fixed": return `${formatCurrency(promo.value)} off`
      case "free_days": return `${promo.value} free days`
      case "bonus_data": return `${promo.value}${promo.valueUnit} bonus`
      default: return `${promo.value}`
    }
  }

  const togglePromotionStatus = (promoId: string) => {
    setPromotions(promotions.map(p => {
      if (p.id === promoId) {
        return { ...p, status: p.status === "active" ? "paused" : "active" }
      }
      return p
    }))
  }

  const openPromoDetail = (promo: Promotion) => {
    setSelectedPromotion(promo)
    setDetailSheetOpen(true)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promotions & Discounts</h1>
          <p className="text-muted-foreground">Manage promotional offers, vouchers, and referral programs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setGenerateVouchersDialogOpen(true)}>
            <Ticket className="w-4 h-4 mr-2" />
            Generate Vouchers
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Promotion
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">of {promotions.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Redemptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSavings)}</div>
            <p className="text-xs text-muted-foreground">Estimated total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Vouchers</CardTitle>
            <Ticket className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unusedVouchers}</div>
            <p className="text-xs text-muted-foreground">of {stats.totalVouchers} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referrals</CardTitle>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralProgram.totalReferrals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(referralProgram.totalRewardsGiven)} given</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="promotions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
          <TabsTrigger value="referral">Referral Program</TabsTrigger>
        </TabsList>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search promotions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
                <SelectItem value="free_days">Free Days</SelectItem>
                <SelectItem value="bonus_data">Bonus Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Promotions Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPromotions.map(promo => (
              <Card key={promo.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openPromoDetail(promo)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{promo.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">{promo.code}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(promo.code) }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPromoDetail(promo)}>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePromotionStatus(promo.id)}>
                          {promo.status === "active" ? (
                            <><Pause className="w-4 h-4 mr-2" /> Pause</>
                          ) : (
                            <><Play className="w-4 h-4 mr-2" /> Activate</>
                          )}
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
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{promo.description}</p>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(promo.status)}
                    {getTypeBadge(promo.type)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{getValueDisplay(promo)}</span>
                  </div>

                  {promo.usageLimit && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Usage</span>
                        <span>{promo.usageCount}/{promo.usageLimit}</span>
                      </div>
                      <Progress value={(promo.usageCount / promo.usageLimit) * 100} className="h-1.5" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Valid: {formatDate(promo.startDate)}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{formatDate(promo.endDate)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Vouchers Tab */}
        <TabsContent value="vouchers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Vouchers</CardTitle>
                  <CardDescription>Individual voucher codes for promotions</CardDescription>
                </div>
                <Button onClick={() => setGenerateVouchersDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate More
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Promotion</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.slice(0, 15).map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell>
                        <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">{voucher.code}</code>
                      </TableCell>
                      <TableCell>{voucher.promotionName}</TableCell>
                      <TableCell>
                        {voucher.valueType === "percentage" ? `${voucher.value}%` : formatCurrency(voucher.value)}
                      </TableCell>
                      <TableCell>
                        {voucher.status === "unused" && <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Available</Badge>}
                        {voucher.status === "used" && <Badge variant="secondary">Used</Badge>}
                        {voucher.status === "expired" && <Badge variant="outline">Expired</Badge>}
                      </TableCell>
                      <TableCell>
                        {voucher.customerName || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(voucher.expiresAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" /> Copy Code
                            </DropdownMenuItem>
                            {voucher.status === "unused" && (
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="w-4 h-4 mr-2" /> Invalidate
                              </DropdownMenuItem>
                            )}
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

        {/* Referral Program Tab */}
        <TabsContent value="referral" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>{referralProgram.name}</CardTitle>
                    <CardDescription>{referralProgram.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={referralProgram.isActive} />
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Program
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Referrer Reward</CardTitle>
                    <CardDescription>What the referrer gets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {formatCurrency(referralProgram.referrerReward)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Account credit per successful referral
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">New Customer Discount</CardTitle>
                    <CardDescription>What the referee gets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {referralProgram.refereeDiscount}% off
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      First month discount
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Program Statistics</h4>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{referralProgram.totalReferrals.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Referrals</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{formatCurrency(referralProgram.totalRewardsGiven)}</div>
                    <div className="text-sm text-muted-foreground">Rewards Given</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">89%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">4.2</div>
                    <div className="text-sm text-muted-foreground">Avg per Referrer</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Top Referrers</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Referrals</TableHead>
                      <TableHead>Total Earned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No referral data available
                    </TableCell>
                  </TableRow>
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Promotion Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedPromotion?.name}</SheetTitle>
            <SheetDescription>
              <code className="bg-muted px-2 py-0.5 rounded font-mono">{selectedPromotion?.code}</code>
            </SheetDescription>
          </SheetHeader>
          {selectedPromotion && (
            <ScrollArea className="h-[calc(100vh-120px)] pr-4">
              <div className="space-y-6 py-4">
                {/* Status & Type */}
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedPromotion.status)}
                  {getTypeBadge(selectedPromotion.type)}
                </div>

                {/* Value */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">{getValueDisplay(selectedPromotion)}</div>
                      <p className="text-sm text-muted-foreground mt-2">{selectedPromotion.description}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Stats */}
                {selectedPromotion.usageLimit && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usage Progress</span>
                      <span className="font-medium">{selectedPromotion.usageCount} / {selectedPromotion.usageLimit}</span>
                    </div>
                    <Progress value={(selectedPromotion.usageCount / selectedPromotion.usageLimit) * 100} />
                  </div>
                )}

                <Separator />

                {/* Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Start Date</div>
                      <div className="font-medium">{formatDate(selectedPromotion.startDate)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">End Date</div>
                      <div className="font-medium">{formatDate(selectedPromotion.endDate)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Uses Per Customer</div>
                      <div className="font-medium">{selectedPromotion.usagePerCustomer}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Uses</div>
                      <div className="font-medium">{selectedPromotion.usageCount}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Applicable Plans */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Applicable Plans</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedPromotion.applicablePlans.map(plan => (
                      <Badge key={plan} variant="secondary">{plan}</Badge>
                    ))}
                  </div>
                </div>

                {/* Customer Types */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Customer Types</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedPromotion.applicableCustomerTypes.map(type => (
                      <Badge key={type} variant="outline" className="capitalize">{type}</Badge>
                    ))}
                  </div>
                </div>

                {/* Conditions */}
                {selectedPromotion.conditions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Terms & Conditions</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {selectedPromotion.conditions.map((condition, i) => (
                        <li key={i}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline">
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button className="flex-1" variant="outline" onClick={() => togglePromotionStatus(selectedPromotion.id)}>
                    {selectedPromotion.status === "active" ? (
                      <><Pause className="w-4 h-4 mr-2" /> Pause</>
                    ) : (
                      <><Play className="w-4 h-4 mr-2" /> Activate</>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Promotion Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Promotion</DialogTitle>
            <DialogDescription>Set up a new promotional offer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Promotion Name</Label>
              <Input placeholder="e.g., Summer Special" />
            </div>
            <div className="space-y-2">
              <Label>Promo Code</Label>
              <Input placeholder="e.g., SUMMER25" className="font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the promotion..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <RadioGroup defaultValue="percentage" className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage">Percentage Off</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed">Fixed Amount</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="free_days" id="free_days" />
                  <Label htmlFor="free_days">Free Days</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="bonus_data" id="bonus_data" />
                  <Label htmlFor="bonus_data">Bonus Data</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input type="number" placeholder="20" />
              </div>
              <div className="space-y-2">
                <Label>Usage Limit (optional)</Label>
                <Input type="number" placeholder="Unlimited" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Applicable Plans</Label>
              <div className="flex flex-wrap gap-2">
                {["Basic", "Standard", "Premium", "Business"].map(plan => (
                  <div key={plan} className="flex items-center space-x-2">
                    <Checkbox id={plan} defaultChecked />
                    <Label htmlFor={plan}>{plan}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Customer Types</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="new" />
                  <Label htmlFor="new">New Customers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="existing" />
                  <Label htmlFor="existing">Existing Customers</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setCreateDialogOpen(false)}>Create Promotion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Vouchers Dialog */}
      <Dialog open={generateVouchersDialogOpen} onOpenChange={setGenerateVouchersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Vouchers</DialogTitle>
            <DialogDescription>Create individual voucher codes for a promotion</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Promotion</Label>
              <Select defaultValue="promo-1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {promotions.filter(p => p.status === "active").map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of Vouchers</Label>
              <Input type="number" defaultValue={10} min={1} max={1000} />
            </div>
            <div className="space-y-2">
              <Label>Prefix (optional)</Label>
              <Input placeholder="e.g., VIP" className="font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateVouchersDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setGenerateVouchersDialogOpen(false)}>Generate Vouchers</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
