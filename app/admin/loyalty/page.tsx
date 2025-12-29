"use client"

import React, { useState, useMemo } from "react"
import {
  Gift,
  Star,
  Award,
  Trophy,
  Crown,
  Gem,
  Users,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Settings,
  Zap,
  Target,
  Percent,
  DollarSign,
  Calendar,
  Clock,
  Eye,
  Send,
  Download,
  ChevronRight,
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
import { Progress } from "@/components/ui/progress"
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
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type TierLevel = "bronze" | "silver" | "gold" | "platinum" | "diamond"
type RewardStatus = "active" | "inactive" | "expired"
type TransactionType = "earned" | "redeemed" | "expired" | "bonus" | "adjusted"

interface LoyaltyTier {
  id: string
  name: string
  level: TierLevel
  minPoints: number
  maxPoints: number | null
  pointsMultiplier: number
  benefits: string[]
  color: string
  icon: React.ReactNode
  membersCount: number
}

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  category: string
  status: RewardStatus
  stockQuantity: number | null
  redemptionCount: number
  validUntil: string | null
  image?: string
}

interface LoyaltyMember {
  id: string
  name: string
  email: string
  phone: string
  tier: TierLevel
  currentPoints: number
  lifetimePoints: number
  joinedDate: string
  lastActivity: string
  redemptions: number
}

interface PointsTransaction {
  id: string
  memberId: string
  memberName: string
  type: TransactionType
  points: number
  description: string
  date: string
}

// Mock data
const tiers: LoyaltyTier[] = [
  {
    id: "t1",
    name: "Bronze",
    level: "bronze",
    minPoints: 0,
    maxPoints: 999,
    pointsMultiplier: 1,
    benefits: ["1 point per KES 100 spent", "Birthday bonus (50 points)", "Monthly newsletter"],
    color: "bg-amber-700",
    icon: <Star className="w-5 h-5" />,
    membersCount: 1250,
  },
  {
    id: "t2",
    name: "Silver",
    level: "silver",
    minPoints: 1000,
    maxPoints: 4999,
    pointsMultiplier: 1.5,
    benefits: ["1.5x points multiplier", "Priority support", "Quarterly bonus (100 points)", "Exclusive offers"],
    color: "bg-slate-400",
    icon: <Award className="w-5 h-5" />,
    membersCount: 680,
  },
  {
    id: "t3",
    name: "Gold",
    level: "gold",
    minPoints: 5000,
    maxPoints: 14999,
    pointsMultiplier: 2,
    benefits: ["2x points multiplier", "Free monthly upgrade", "Priority support", "Birthday bonus (200 points)"],
    color: "bg-yellow-500",
    icon: <Trophy className="w-5 h-5" />,
    membersCount: 320,
  },
  {
    id: "t4",
    name: "Platinum",
    level: "platinum",
    minPoints: 15000,
    maxPoints: 49999,
    pointsMultiplier: 2.5,
    benefits: ["2.5x points multiplier", "Dedicated account manager", "Exclusive events", "Free speed upgrade"],
    color: "bg-slate-600",
    icon: <Crown className="w-5 h-5" />,
    membersCount: 95,
  },
  {
    id: "t5",
    name: "Diamond",
    level: "diamond",
    minPoints: 50000,
    maxPoints: null,
    pointsMultiplier: 3,
    benefits: ["3x points multiplier", "VIP support", "All perks included", "Annual bonus (1000 points)", "Custom plans"],
    color: "bg-cyan-400",
    icon: <Gem className="w-5 h-5" />,
    membersCount: 23,
  },
]

const rewards: Reward[] = [
  {
    id: "r1",
    name: "1 Day Free Internet",
    description: "Get a free day of internet on your current plan",
    pointsCost: 100,
    category: "Internet",
    status: "active",
    stockQuantity: null,
    redemptionCount: 1250,
    validUntil: null,
  },
  {
    id: "r2",
    name: "Speed Boost (24h)",
    description: "Double your speed for 24 hours",
    pointsCost: 150,
    category: "Internet",
    status: "active",
    stockQuantity: null,
    redemptionCount: 890,
    validUntil: null,
  },
  {
    id: "r3",
    name: "KES 500 Credit",
    description: "Add KES 500 to your account balance",
    pointsCost: 500,
    category: "Credit",
    status: "active",
    stockQuantity: null,
    redemptionCount: 456,
    validUntil: null,
  },
  {
    id: "r4",
    name: "Router (TP-Link Archer)",
    description: "Free TP-Link Archer C6 Router",
    pointsCost: 5000,
    category: "Hardware",
    status: "active",
    stockQuantity: 25,
    redemptionCount: 45,
    validUntil: "2024-12-31",
  },
  {
    id: "r5",
    name: "1 Month Free",
    description: "One month free on your current plan",
    pointsCost: 2000,
    category: "Internet",
    status: "active",
    stockQuantity: null,
    redemptionCount: 234,
    validUntil: null,
  },
  {
    id: "r6",
    name: "Streaming Bundle",
    description: "Netflix + Spotify for 1 month",
    pointsCost: 1500,
    category: "Entertainment",
    status: "active",
    stockQuantity: 100,
    redemptionCount: 178,
    validUntil: "2024-06-30",
  },
  {
    id: "r7",
    name: "Movie Tickets (2)",
    description: "Two cinema tickets at any IMAX",
    pointsCost: 800,
    category: "Entertainment",
    status: "inactive",
    stockQuantity: 0,
    redemptionCount: 89,
    validUntil: "2024-03-31",
  },
]

const members: LoyaltyMember[] = [
  {
    id: "m1",
    name: "John Kamau",
    email: "john.kamau@email.com",
    phone: "+254 712 345 678",
    tier: "platinum",
    currentPoints: 18500,
    lifetimePoints: 45000,
    joinedDate: "2022-03-15",
    lastActivity: "2024-01-14",
    redemptions: 12,
  },
  {
    id: "m2",
    name: "Mary Wanjiku",
    email: "mary.w@email.com",
    phone: "+254 722 456 789",
    tier: "gold",
    currentPoints: 8200,
    lifetimePoints: 22000,
    joinedDate: "2022-08-20",
    lastActivity: "2024-01-15",
    redemptions: 8,
  },
  {
    id: "m3",
    name: "Peter Ochieng",
    email: "peter.o@email.com",
    phone: "+254 733 567 890",
    tier: "diamond",
    currentPoints: 52000,
    lifetimePoints: 125000,
    joinedDate: "2021-01-10",
    lastActivity: "2024-01-15",
    redemptions: 28,
  },
  {
    id: "m4",
    name: "Grace Muthoni",
    email: "grace.m@email.com",
    phone: "+254 745 678 901",
    tier: "silver",
    currentPoints: 2800,
    lifetimePoints: 6500,
    joinedDate: "2023-05-01",
    lastActivity: "2024-01-10",
    redemptions: 3,
  },
  {
    id: "m5",
    name: "David Kiprono",
    email: "david.k@email.com",
    phone: "+254 756 789 012",
    tier: "bronze",
    currentPoints: 450,
    lifetimePoints: 1200,
    joinedDate: "2023-10-15",
    lastActivity: "2024-01-08",
    redemptions: 1,
  },
]

const transactions: PointsTransaction[] = [
  { id: "pt1", memberId: "m1", memberName: "John Kamau", type: "earned", points: 250, description: "Monthly subscription payment", date: "2024-01-15 10:30" },
  { id: "pt2", memberId: "m2", memberName: "Mary Wanjiku", type: "redeemed", points: -500, description: "Redeemed: KES 500 Credit", date: "2024-01-15 09:45" },
  { id: "pt3", memberId: "m3", memberName: "Peter Ochieng", type: "bonus", points: 1000, description: "Annual Diamond tier bonus", date: "2024-01-14 16:20" },
  { id: "pt4", memberId: "m4", memberName: "Grace Muthoni", type: "earned", points: 100, description: "Referral bonus", date: "2024-01-14 14:15" },
  { id: "pt5", memberId: "m5", memberName: "David Kiprono", type: "redeemed", points: -100, description: "Redeemed: 1 Day Free Internet", date: "2024-01-13 11:00" },
  { id: "pt6", memberId: "m1", memberName: "John Kamau", type: "earned", points: 500, description: "Plan upgrade bonus", date: "2024-01-12 09:30" },
  { id: "pt7", memberId: "m2", memberName: "Mary Wanjiku", type: "expired", points: -200, description: "Points expired (unused)", date: "2024-01-10 00:00" },
]

export default function LoyaltyPage() {
  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null)
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false)
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false)
  const [isAwardPointsOpen, setIsAwardPointsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [tierFilter, setTierFilter] = useState<string>("all")

  // Calculate stats
  const stats = useMemo(() => {
    const totalMembers = tiers.reduce((acc, t) => acc + t.membersCount, 0)
    const totalPointsIssued = members.reduce((acc, m) => acc + m.lifetimePoints, 0)
    const totalRedemptions = rewards.reduce((acc, r) => acc + r.redemptionCount, 0)
    const avgPointsPerMember = Math.round(members.reduce((acc, m) => acc + m.currentPoints, 0) / members.length)
    const activeRewards = rewards.filter(r => r.status === "active").length

    return { totalMembers, totalPointsIssued, totalRedemptions, avgPointsPerMember, activeRewards }
  }, [])

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery)
      const matchesTier = tierFilter === "all" || member.tier === tierFilter
      return matchesSearch && matchesTier
    })
  }, [searchQuery, tierFilter])

  const getTierBadge = (tier: TierLevel) => {
    const tierData = tiers.find(t => t.level === tier)
    if (!tierData) return null
    
    const colors: Record<TierLevel, string> = {
      bronze: "bg-amber-100 text-amber-800 border-amber-200",
      silver: "bg-slate-100 text-slate-700 border-slate-200",
      gold: "bg-yellow-100 text-yellow-800 border-yellow-200",
      platinum: "bg-slate-200 text-slate-800 border-slate-300",
      diamond: "bg-cyan-100 text-cyan-800 border-cyan-200",
    }
    
    return (
      <Badge variant="outline" className={colors[tier]}>
        {tierData.icon}
        <span className="ml-1">{tierData.name}</span>
      </Badge>
    )
  }

  const getTransactionBadge = (type: TransactionType) => {
    const styles: Record<TransactionType, string> = {
      earned: "bg-green-100 text-green-700",
      redeemed: "bg-blue-100 text-blue-700",
      expired: "bg-red-100 text-red-700",
      bonus: "bg-purple-100 text-purple-700",
      adjusted: "bg-slate-100 text-slate-700",
    }
    return <Badge className={styles[type]}>{type}</Badge>
  }

  const handleViewMember = (member: LoyaltyMember) => {
    setSelectedMember(member)
    setIsMemberDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Loyalty Program</h1>
          <p className="text-slate-500 mt-1">Manage points, rewards, and member tiers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAwardPointsOpen(true)}>
            <Gift className="w-4 h-4 mr-2" />
            Award Points
          </Button>
          <Button onClick={() => setIsAddRewardOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Reward
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats.totalPointsIssued / 1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-500">Points Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRedemptions.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Redemptions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgPointsPerMember.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Avg Points/Member</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeRewards}</p>
                <p className="text-xs text-slate-500">Active Rewards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tiers" className="w-full">
        <TabsList>
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Tiers
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="mt-6">
          <div className="grid md:grid-cols-5 gap-4">
            {tiers.map((tier) => (
              <Card key={tier.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${tier.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tier.color} text-white`}>
                      {tier.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {tier.minPoints.toLocaleString()} - {tier.maxPoints?.toLocaleString() || "∞"} pts
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Members</span>
                    <span className="font-bold">{tier.membersCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Multiplier</span>
                    <Badge variant="secondary">{tier.pointsMultiplier}x</Badge>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Benefits</p>
                    <ul className="space-y-1">
                      {tier.benefits.slice(0, 3).map((benefit, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                          <ChevronRight className="w-3 h-3 mt-0.5 text-slate-400" />
                          {benefit}
                        </li>
                      ))}
                      {tier.benefits.length > 3 && (
                        <li className="text-xs text-blue-600">+{tier.benefits.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit Tier
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tier Distribution */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Member Distribution</CardTitle>
              <CardDescription>Members across loyalty tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tiers.map((tier) => {
                  const percentage = (tier.membersCount / stats.totalMembers) * 100
                  return (
                    <div key={tier.id} className="flex items-center gap-4">
                      <div className="w-24 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                        <span className="text-sm font-medium">{tier.name}</span>
                      </div>
                      <div className="flex-1">
                        <Progress value={percentage} className="h-3" />
                      </div>
                      <div className="w-32 flex justify-between">
                        <span className="text-sm">{tier.membersCount.toLocaleString()}</span>
                        <span className="text-sm text-slate-500">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-6">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id} className={reward.status !== "active" ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                      <Gift className="w-5 h-5 text-purple-600" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Redemptions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-base mt-2">{reward.name}</CardTitle>
                  <CardDescription className="text-xs">{reward.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      <Star className="w-3 h-3 mr-1" />
                      {reward.pointsCost.toLocaleString()} pts
                    </Badge>
                    <Badge variant="outline" className={
                      reward.status === "active" ? "bg-green-50 text-green-700" :
                      reward.status === "inactive" ? "bg-slate-50 text-slate-700" :
                      "bg-red-50 text-red-700"
                    }>
                      {reward.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-slate-500">Category</p>
                      <p className="font-medium">{reward.category}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-slate-500">Redeemed</p>
                      <p className="font-medium">{reward.redemptionCount.toLocaleString()}</p>
                    </div>
                  </div>

                  {reward.stockQuantity !== null && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Stock</span>
                      <span className={reward.stockQuantity < 10 ? "text-red-600 font-medium" : ""}>
                        {reward.stockQuantity} left
                      </span>
                    </div>
                  )}

                  {reward.validUntil && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      Valid until {reward.validUntil}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Add New Reward Card */}
            <Card className="border-dashed cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors" onClick={() => setIsAddRewardOpen(true)}>
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
                <Plus className="w-8 h-8 mb-2" />
                <p className="font-medium">Add New Reward</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Current Points</TableHead>
                    <TableHead>Lifetime Points</TableHead>
                    <TableHead>Redemptions</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} className="cursor-pointer" onClick={() => handleViewMember(member)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {member.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(member.tier)}</TableCell>
                      <TableCell>
                        <span className="font-medium text-purple-600">{member.currentPoints.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>{member.lifetimePoints.toLocaleString()}</TableCell>
                      <TableCell>{member.redemptions}</TableCell>
                      <TableCell className="text-sm text-slate-500">{member.lastActivity}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewMember(member)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Gift className="w-4 h-4 mr-2" />
                              Award Points
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="w-4 h-4 mr-2" />
                              Send Notification
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

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Points earned, redeemed, and adjusted</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-sm text-slate-500">{txn.date}</TableCell>
                      <TableCell className="font-medium">{txn.memberName}</TableCell>
                      <TableCell>{getTransactionBadge(txn.type)}</TableCell>
                      <TableCell className="text-sm">{txn.description}</TableCell>
                      <TableCell className={`text-right font-medium ${txn.points > 0 ? "text-green-600" : "text-red-600"}`}>
                        {txn.points > 0 ? "+" : ""}{txn.points.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Settings</CardTitle>
              <CardDescription>Configure loyalty program parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Points Earning</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Points per KES 100</Label>
                        <p className="text-xs text-slate-500">Base earning rate</p>
                      </div>
                      <Input type="number" defaultValue="1" className="w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Signup Bonus</Label>
                        <p className="text-xs text-slate-500">Points for new members</p>
                      </div>
                      <Input type="number" defaultValue="50" className="w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Referral Bonus</Label>
                        <p className="text-xs text-slate-500">Points for referrals</p>
                      </div>
                      <Input type="number" defaultValue="100" className="w-20" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Points Expiry</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Expiry</Label>
                        <p className="text-xs text-slate-500">Points expire after period</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Expiry Period (months)</Label>
                        <p className="text-xs text-slate-500">Time until expiry</p>
                      </div>
                      <Input type="number" defaultValue="12" className="w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Expiry Warning (days)</Label>
                        <p className="text-xs text-slate-500">Send reminder before expiry</p>
                      </div>
                      <Input type="number" defaultValue="30" className="w-20" />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notifications</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <Label>Points Earned Notification</Label>
                      <p className="text-xs text-slate-500">Notify on earning points</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <Label>Redemption Confirmation</Label>
                      <p className="text-xs text-slate-500">Confirm reward redemption</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <Label>Tier Upgrade Alert</Label>
                      <p className="text-xs text-slate-500">Notify on tier change</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <Label>Monthly Summary</Label>
                      <p className="text-xs text-slate-500">Send monthly points summary</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Member Detail Sheet */}
      <Sheet open={isMemberDetailOpen} onOpenChange={setIsMemberDetailOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          {selectedMember && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {selectedMember.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{selectedMember.name}</SheetTitle>
                    <SheetDescription>{selectedMember.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-180px)] mt-6">
                <div className="space-y-6">
                  {/* Tier & Points */}
                  <div className="flex items-center gap-4">
                    {getTierBadge(selectedMember.tier)}
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <Star className="w-3 h-3 mr-1" />
                      {selectedMember.currentPoints.toLocaleString()} points
                    </Badge>
                  </div>

                  {/* Progress to Next Tier */}
                  {selectedMember.tier !== "diamond" && (
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium mb-2">Progress to Next Tier</p>
                        {(() => {
                          const currentTier = tiers.find(t => t.level === selectedMember.tier)!
                          const nextTierIndex = tiers.findIndex(t => t.level === selectedMember.tier) + 1
                          const nextTier = tiers[nextTierIndex]
                          const progress = ((selectedMember.lifetimePoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
                          const pointsNeeded = nextTier.minPoints - selectedMember.lifetimePoints

                          return (
                            <>
                              <div className="flex justify-between text-xs mb-2">
                                <span>{currentTier.name}</span>
                                <span>{nextTier.name}</span>
                              </div>
                              <Progress value={Math.min(progress, 100)} className="h-2" />
                              <p className="text-xs text-slate-500 mt-2">
                                {pointsNeeded > 0 ? `${pointsNeeded.toLocaleString()} points needed` : "Ready for upgrade!"}
                              </p>
                            </>
                          )
                        })()}
                      </CardContent>
                    </Card>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Lifetime Points</p>
                      <p className="text-xl font-bold">{selectedMember.lifetimePoints.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Redemptions</p>
                      <p className="text-xl font-bold">{selectedMember.redemptions}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Member Since</p>
                      <p className="text-sm font-medium">{selectedMember.joinedDate}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Last Activity</p>
                      <p className="text-sm font-medium">{selectedMember.lastActivity}</p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Contact</h4>
                    <p className="text-sm text-slate-600">{selectedMember.phone}</p>
                    <p className="text-sm text-slate-600">{selectedMember.email}</p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="justify-start">
                        <Gift className="w-4 h-4 mr-2" />
                        Award Points
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <History className="w-4 h-4 mr-2" />
                        View History
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Member
                      </Button>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Transactions</h4>
                    {transactions.filter(t => t.memberId === selectedMember.id).slice(0, 5).map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm">{txn.description}</p>
                          <p className="text-xs text-slate-500">{txn.date}</p>
                        </div>
                        <span className={`font-medium ${txn.points > 0 ? "text-green-600" : "text-red-600"}`}>
                          {txn.points > 0 ? "+" : ""}{txn.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Reward Dialog */}
      <Dialog open={isAddRewardOpen} onOpenChange={setIsAddRewardOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Reward</DialogTitle>
            <DialogDescription>Create a new reward for members to redeem</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Reward Name</Label>
              <Input placeholder="e.g., 1 Day Free Internet" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe what the member gets..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points Cost</Label>
                <Input type="number" placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internet">Internet</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock Quantity (optional)</Label>
                <Input type="number" placeholder="Leave empty for unlimited" />
              </div>
              <div className="space-y-2">
                <Label>Valid Until (optional)</Label>
                <Input type="date" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRewardOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsAddRewardOpen(false)}>Add Reward</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Points Dialog */}
      <Dialog open={isAwardPointsOpen} onOpenChange={setIsAwardPointsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Award Points</DialogTitle>
            <DialogDescription>Manually award points to members</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Member</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Search and select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Points to Award</Label>
              <Input type="number" placeholder="100" />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bonus">Loyalty Bonus</SelectItem>
                  <SelectItem value="referral">Referral Reward</SelectItem>
                  <SelectItem value="compensation">Customer Compensation</SelectItem>
                  <SelectItem value="promotion">Promotional Campaign</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Additional details about this award..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAwardPointsOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsAwardPointsOpen(false)}>
              <Gift className="w-4 h-4 mr-2" />
              Award Points
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
